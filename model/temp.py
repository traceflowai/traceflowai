from gensim.models import KeyedVectors
import os
import csv
import stanza
from typing import List, Tuple


class SuspiciousWordDetector:
    def __init__(self, lang='he', binary_file_path=None):
        """Initialize Stanza pipeline and load required resources."""
        stanza.download(lang)
        self.nlp = stanza.Pipeline(lang=lang, processors='tokenize,mwt,pos,lemma')
        self.project_path = os.path.dirname(os.path.abspath(__file__))
        self.suspicious_words_file = os.path.join(self.project_path, "suspicious_words.csv")
        self.suspicious_entries, self.entries = self._load_suspicious_entries()

        self.model = KeyedVectors.load(binary_file_path)

    def _load_suspicious_entries(self) -> List[Tuple[List[str], int, str]]:
        """Load suspicious words from CSV."""
        if not os.path.exists(self.suspicious_words_file):
            return []
        lemma_entries = []
        entries = []
        with open(self.suspicious_words_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader, None)  # Skip header
            for row in reader:
                phrase, category, score = row[0], row[1], int(row[2])
                lemmatized_phrase = [
                    word.lemma for sentence in self.nlp(phrase).sentences for word in sentence.words
                ]
                lemma_entries.append((lemmatized_phrase, score, category))
                entries.append(phrase)
        return lemma_entries, entries

    def _find_similar_words(self, word:str, topn=2) -> List[str]:
        def clean_word(word):
            # Remove prefixes like 'NN_' and replace '~' with space
            if '_' in word:
                word = word.split('_', 1)[1]  # Keep only the part after the first underscore
            return word.replace('~', ' ')
        
        try:
            # Find the most similar words to the current word
            return [clean_word(similar_word) for similar_word, _ in self.model.most_similar(word, topn=topn)]
        except KeyError:
            print(f"'{word}' not found in the vocabulary!")
        return []
    
    def add_related_words(self, new_words: List[str], topn=2):
            """Add new suspicious words and their similar words to the CSV."""
            new_entries = []
            for word in new_words:
                # _find_similar_words expects a list, so pass a single-word list
                similar_words = self._find_similar_words(word, topn)
                for similar_word in similar_words:
                    if similar_word not in self.entries:
                        # Lemmatize the similar word
                        lemmatized_similar_word = [
                            word.lemma for sentence in self.nlp(similar_word).sentences for word in sentence.words
                        ]
                        new_entries.append([similar_word, "לא ידוע", 5])
                        
                        # Update both self.suspicious_entries and self.entries
                        self.suspicious_entries.append((lemmatized_similar_word, 5, "לא ידוע"))
                        self.entries.append((similar_word, 5, "לא ידוע"))

            # Write new entries to CSV
            if new_entries:
                with open(self.suspicious_words_file, 'a', encoding='utf-8', newline='') as f:
                    writer = csv.writer(f)
                    writer.writerows(new_entries)

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
        normalized_score = 0 if total_score <= 5 else min(98, int((total_score / 600) * 100))

        return normalized_score, matched_phrases, matched_categories

# Usage Example
if __name__ == "__main__":
    detector = SuspiciousWordDetector(
        binary_file_path="model/words2vec.bin"
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