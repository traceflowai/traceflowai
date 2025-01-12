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
    categories = set()  # To store unique categories

    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # Skip the header
        for row in reader:
            score, phrase, category = int(row[0]), row[1], row[2]
            # Process the phrase with Stanza
            doc = nlp(phrase)
            lemmatized_words = [word.lemma for sentence in doc.sentences for word in sentence.words]
            processed_entries.append((lemmatized_words, score, category))
            categories.add(category)  # Add the category to the set
    
    return processed_entries, list(categories)

def analyze_text(text, suspicious_entries):
    """
    Analyze the text, checking if all words in a suspicious entry exist in the same sentence.
    Arguments:
        - text: The input text to analyze.
        - suspicious_entries: A list of tuples (lemmatized words, score, category).
    Returns:
        - total_score: The total suspicious score for the text.
        - matched_phrases: A list of suspicious phrases that were found in the text.
        - categories: A list of categories associated with the matched phrases.
    """
    doc = nlp(text)
    total_score = 0
    matched_phrases = {}
    categories_matched = set()

    # Iterate over sentences in the text
    for sentence in doc.sentences:
        sentence_words = [word.lemma for word in sentence.words]

        # Check each suspicious entry
        for lemmatized_words, score, category in suspicious_entries:
            if all(word in sentence_words for word in lemmatized_words):
                # Find the words of the lemmatized_words in the suspicious_entries but in the original form
                matched_words = [sentence.words[sentence_words.index(word)].text for word in lemmatized_words]
                total_score += score
                sent = " ".join(matched_words)

                matched_phrases[sent] = score  # Add the matched phrase
                categories_matched.add(category)  # Add the category of the matched phrase

    return total_score, matched_phrases, list(categories_matched)

def normalize_score(score, max_score=500):
    """
    Normalize the score to be between 0 and 1.
    Arguments:
        - score: The input score.
        - max_score: The maximum score possible.
    Returns:
        - The normalized score.
    """
    if int(score) <= 5:
        return 0
    return int(min(98, (score / max_score) * 100))

def sentence_score(text):
    project_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    suspicious_words_file = f"{project_path}\model\suspicious_words.csv"
    suspicious_entries, all_categories = preprocess_csv(suspicious_words_file)
    total_score, matched_phrases, matched_categories = analyze_text(text, suspicious_entries)

    for phrase in matched_phrases:
        matched_phrases[phrase] = normalize_score(matched_phrases[phrase])

    normalized_score = normalize_score(total_score)
    list_matched_phrases = list(matched_phrases.keys())
    return normalized_score, list_matched_phrases, matched_categories


if __name__ == "__main__":
    text = "הכנס טקסט כאן לדוגמה. לדוגמה, העברת כספים במזומן דרך מדינה מאוד זרה עם חשבונות ממש פקטיביות. אני העברתי לו את כל הכסף מתחת לשולחן!"
    normalized_score, matched_phrases, categories = sentence_score(text)
    print(f"Normalized Score: {normalized_score}")
    print(f"Matched Phrases: {matched_phrases}")
    print(f"Categories: {categories}")
