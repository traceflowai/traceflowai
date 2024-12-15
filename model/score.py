import stanza
import csv

# Load the Stanza pipeline for Hebrew
stanza.download('he')
nlp = stanza.Pipeline(lang='he', processors='tokenize,mwt,pos,lemma')


def preprocess_csv(file_path):
    """
    Preprocess the suspicious words CSV: convert all words in each row to their lemma form.
    Returns a list of tuples where each tuple contains (list of lemmatized words, score).
    """
    processed_entries = []

    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # Skip the header
        for row in reader:
            phrase, score = row[0], int(row[1])
            # Process the phrase with Stanza
            doc = nlp(phrase)
            lemmatized_words = [word.lemma for sentence in doc.sentences for word in sentence.words]
            processed_entries.append((lemmatized_words, score))

    return processed_entries


def analyze_text(text, suspicious_entries):
    """
    Analyze the text, checking if all words in a suspicious entry exist in the same sentence.
    Arguments:
        - text: The input text to analyze.
        - suspicious_entries: A list of tuples (lemmatized words, score).
    Returns:
        - total_score: The total suspicious score for the text.
        - matched_phrases: A list of suspicious phrases that were found in the text.
    """
    doc = nlp(text)
    total_score = 0
    matched_phrases = {}

    # Iterate over sentences in the text
    for sentence in doc.sentences:
        sentence_words = [word.lemma for word in sentence.words]

        # Check each suspicious entry
        for lemmatized_words, score in suspicious_entries:
            if all(word in sentence_words for word in lemmatized_words):
                # find the words of the lemmatized_words in the suspicious_entries but in the original form
                matched_words = [sentence.words[sentence_words.index(word)].text for word in lemmatized_words]
                total_score += score
                sent = ""
                for word in matched_words:
                    sent += word
                    if len(word) > 1:
                        sent += " "
                sent = sent[:-1]

                matched_phrases[sent] = score  # Add the matched phrase

    return total_score, matched_phrases


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
    suspicious_words_file = "model\suspicious_words.csv"
    suspicious_entries = preprocess_csv(suspicious_words_file)
    total_score, matched_phrases = analyze_text(text, suspicious_entries)

    for phrase in matched_phrases:
        matched_phrases[phrase] = normalize_score(matched_phrases[phrase])

    normalized_score = normalize_score(total_score)
    list_matched_phrases = list(matched_phrases.keys())
    return normalized_score, list_matched_phrases


if __name__ == "__main__":
    text = "הכנס טקסט כאן לדוגמה. לדוגמה, העברת כספים במזומן דרך מדינה מאוד זרה עם חשבונות ממש פקטיביות. אני העברתי לו את כל הכסף מתחת לשולחן!"
    print(sentence_score(text))
    # Output:
    # (84, ['כספים', 'מזומן', 'חשבונות', 'מדינה זרה', 'חשבונות פקטיביות', 'כסף', 'העברתי מתחת לשולחן'])
