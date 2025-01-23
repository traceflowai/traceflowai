import os
import csv
import stanza
import numpy as np
from typing import List, Tuple, Dict
from collections import defaultdict
from sklearn.metrics.pairwise import cosine_similarity


class SuspiciousWordDetector:
    def __init__(self, lang='he', vectors_path=None, vocab_path=None):
        """Initialize Stanza pipeline and load required resources."""
        stanza.download(lang)
        self.nlp = stanza.Pipeline(lang=lang, processors='tokenize,mwt,pos,lemma')
        self.project_path = os.path.dirname(os.path.abspath(__file__))
        self.suspicious_words_file = os.path.join(self.project_path, "suspicious_words.csv")
        
        # Load word vectors and vocabulary
        self.word_to_vector = self._load_word_vectors(vectors_path, vocab_path)
        self.suspicious_entries = self._load_suspicious_entries()

    def _load_word_vectors(self, vectors_path, vocab_path) -> Dict[str, np.ndarray]:
        """Load word vectors and map them to vocabulary."""
        if not vectors_path or not vocab_path:
            return {}
        try:
            vectors = np.load(vectors_path)
            with open(vocab_path, encoding="utf-8") as f:
                words = [line.strip() for line in f]
            return {word: vectors[i] for i, word in enumerate(words)}
        except Exception as e:
            print(f"Error loading word vectors: {e}")
            return {}

    def _load_suspicious_entries(self) -> List[Tuple[List[str], int, str]]:
        """Load suspicious words from CSV."""
        if not os.path.exists(self.suspicious_words_file):
            return []
        entries = []
        with open(self.suspicious_words_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader, None)  # Skip header
            for row in reader:
                phrase, category, score = row[0], row[1], int(row[2])
                lemmatized_phrase = [
                    word.lemma for sentence in self.nlp(phrase).sentences for word in sentence.words
                ]
                entries.append((lemmatized_phrase, score, category))
        return entries

    def _find_similar_words(self, word: str, topn=10, similarity_threshold=0.6) -> List[str]:
        """Find words similar to the given word based on cosine similarity."""
        if not self.word_to_vector or word not in self.word_to_vector:
            return []
        word_vec = self.word_to_vector[word].reshape(1, -1)
        similar_words = [
            other_word
            for other_word, vector in self.word_to_vector.items()
            if other_word != word
            and cosine_similarity(word_vec, vector.reshape(1, -1))[0][0] >= similarity_threshold
        ]
        return sorted(similar_words, key=lambda w: cosine_similarity(word_vec, self.word_to_vector[w].reshape(1, -1))[0][0], reverse=True)[:topn]

    def add_related_words(self, new_words: List[str], topn=10, similarity_threshold=0.6):
        """Add new suspicious words and their similar words to the CSV."""
        existing_words = {entry[0][0] for entry in self.suspicious_entries}
        new_entries = []

        for word in new_words:
            similar_words = self._find_similar_words(word, topn, similarity_threshold)
            for similar_word in similar_words:
                similar_word = similar_word.replace('~', ' ')  # Replace '~' with a space
                if similar_word not in existing_words:
                    new_entries.append([similar_word, "לא ידוע", 5])

        # Write new entries to CSV
        if new_entries:
            with open(self.suspicious_words_file, 'a', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                writer.writerows(new_entries)
            # Reload suspicious entries
            self.suspicious_entries = self._load_suspicious_entries()


    def _normalize_score(self, score: int, max_score: int = 600) -> int:
        """Normalize the score to a scale of 0 to 100."""
        return 0 if score <= 5 else min(98, int((score / max_score) * 100))

    def analyze_text(self, text: str) -> Tuple[int, List[str], List[str]]:
        """Analyze text for suspicious content"""
        doc = self.nlp(text)
        total_score = 0
        matched_categories = set()
        matched_phrases = []

        for sentence in doc.sentences:
            sentence_words = [word.lemma for word in sentence.words]

            for lemmatized_words, score, category in self.suspicious_entries:
                if all(word in sentence_words for word in lemmatized_words):
                    matched_indices = [sentence_words.index(word) for word in lemmatized_words]
                    matched_phrase = "".join([sentence.words[i].text + (" " if len(sentence.words[i].text) > 1 else "") for i in matched_indices]).strip()
                    total_score += score
                    matched_categories.add(category)
                    matched_phrases.append(matched_phrase)

        return total_score, list(matched_categories), matched_phrases

    def calculate_score(self, text: str) -> Tuple[int, List[str], List[str]]:
        """Calculate sentence score"""
        total_score, matched_categories, matched_phrases = self.analyze_text(text)
        normalized_score = self._normalize_score(total_score)

        return normalized_score, matched_phrases, matched_categories

# Usage Example
if __name__ == "__main__":
    detector = SuspiciousWordDetector(
        vectors_path="model/words_vectors.npy",
        vocab_path="model/words_list.txt"
    )
    
    # Input text to analyze
    text = "הכנס טקסט כאן לדוגמה. לדוגמה, העברת כספים במזומן דרך מדינה מאוד זרה עם חשבונות ממש פקטיביות. אני העברתי לו את כל הכסף מתחת לשולחן!"
    
    # Calculate score multiple times
    normalized_score, bad_words, categories = detector.calculate_score(text)
    print(f"Normalized Score: {normalized_score}")
    print(f"Bad Words: {bad_words}")
    print(f"Categories: {categories}")
    
    # Add related words occasionally
    detector.add_related_words(bad_words[:2], topn=2)