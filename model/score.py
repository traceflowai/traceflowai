import stanza
import csv
import os

# Load the Stanza pipeline for Hebrew
# stanza.download('he') #only needs to be run once
nlp = stanza.Pipeline(lang='he', processors='tokenize,mwt,pos,lemma')

def preprocess_csv(file_path):
    """
    Preprocess the suspicious words CSV: convert all words in each row to their lemma form.
    Returns a list of tuples where each tuple contains (list of lemmatized words, score, category).
    """
    processed_entries = []

    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # Skip the header
        for row in reader:
            phrase, category, score = row[0], row[1], int(row[2])
            # Process the phrase with Stanza
            doc = nlp(phrase)
            lemmatized_words = [word.lemma for sentence in doc.sentences for word in sentence.words]
            processed_entries.append((lemmatized_words, score, category))
    
    return processed_entries

def analyze_text(text, suspicious_entries):
    """
    Analyze the text, checking if all words in a suspicious entry exist in the same sentence.
    Arguments:
        - text: The input text to analyze.
        - suspicious_entries: A list of tuples (lemmatized words, score, category).
    Returns:
        - total_score: The total suspicious score for the text.
        - matched_categories: A set of categories matched in the text.
        - matched_phrases: A list of suspicious phrases found in the text in their original forms.
    """
    doc = nlp(text)
    total_score = 0
    matched_categories = set()
    matched_phrases = []

    # Iterate over sentences in the text
    for sentence in doc.sentences:
        sentence_words = [word.lemma for word in sentence.words]
        sentence_text = "".join([word.text + (" " if len(word.text) > 1 else "") for word in sentence.words]).strip()

        for lemmatized_words, score, category in suspicious_entries:
            if all(word in sentence_words for word in lemmatized_words):
                matched_indices = [sentence_words.index(word) for word in lemmatized_words]
                matched_phrase = "".join([sentence.words[i].text + (" " if len(sentence.words[i].text) > 1 else "") for i in matched_indices]).strip()
                total_score += score
                matched_categories.add(category)
                matched_phrases.append(matched_phrase)

    return total_score, list(matched_categories), matched_phrases

def normalize_score(score, max_score=500):
    """
    Normalize the score to be between 0 and 100.
    Arguments:
        - score: The input score.
        - max_score: The maximum score possible.
    Returns:
        - The normalized score.
    """
    if score <= 5:
        return 0
    return min(98, int((score / max_score) * 100))

def sentence_score(text):
    project_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    suspicious_words_file = f"{project_path}/model/suspicious_words.csv"
    suspicious_entries = preprocess_csv(suspicious_words_file)

    total_score, matched_categories, matched_phrases = analyze_text(text, suspicious_entries)
    normalized_score = normalize_score(total_score)

    return normalized_score, matched_phrases, matched_categories

if __name__ == "__main__":
    text = "הכנס טקסט כאן לדוגמה. לדוגמה, העברת כספים במזומן דרך מדינה מאוד זרה עם חשבונות ממש פקטיביות. אני העברתי לו את כל הכסף מתחת לשולחן!"
    normalized_score, categories, bad_words = sentence_score(text)
    print(f"Normalized Score: {normalized_score}")
    print(f"Categories: {categories}")
    print(f"Bad Words: {bad_words}")
