import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def load_word_vectors(vectors_path, vocab_path):
    """Load word vectors and vocabulary from files"""
    try:
        vectors = np.load(vectors_path)
        with open(vocab_path, encoding="utf-8") as f:
            words = [line.strip() for line in f]
        
        word_to_vector = {word: vectors[i] for i, word in enumerate(words)}
        return word_to_vector, words
    
    except FileNotFoundError as e:
        logger.error(f"File not found: {e}")
        raise
    except Exception as e:
        logger.error(f"Initialization error: {e}")
        raise

def find_similar_words(word, word_to_vector, topn=50, similarity_threshold=0.6):
    """Find similar words for a given word"""
    if word not in word_to_vector:
        logger.warning(f"'{word}' not found in vocabulary!")
        return set()

    word_vec = word_to_vector[word].reshape(1, -1)
    similarities = {
        other_word: cosine_similarity(word_vec, vector.reshape(1, -1))[0][0]
        for other_word, vector in word_to_vector.items() 
        if other_word != word and cosine_similarity(word_vec, vector.reshape(1, -1))[0][0] >= similarity_threshold
    }

    return {word for word, _ in sorted(similarities.items(), key=lambda x: x[1], reverse=True)[:topn]}

def find_common_similar_words(word_list, word_to_vector, topn=50, similarity_threshold=0.6):
    """Find common similar words across multiple input words"""
    common_similar_words = None

    for word in word_list:
        similar_words = find_similar_words(word, word_to_vector, topn, similarity_threshold)
        common_similar_words = similar_words if common_similar_words is None else common_similar_words & similar_words

    return common_similar_words or set()

def validate_file_paths(vectors_path, vocab_path):
    """Validate existence of input files"""
    if not os.path.exists(vectors_path):
        raise FileNotFoundError(f"Vectors file not found: {vectors_path}")
    if not os.path.exists(vocab_path):
        raise FileNotFoundError(f"Vocabulary file not found: {vocab_path}")

def main():
    """Main function to demonstrate word similarity functionality"""
    try:
        # Configurable paths
        vectors_path = "model/words_vectors.npy"
        vocab_path = "model/words_list.txt"
        
        # Validate file paths
        validate_file_paths(vectors_path, vocab_path)
        
        # Load word vectors
        word_to_vector, words = load_word_vectors(vectors_path, vocab_path)
        
        # Scenario 1: Similar words for a single word
        test_word = "הרצת~מניות"
        similar_words = find_similar_words(test_word, word_to_vector, topn=10)
        print(f"Similar words to '{test_word}': {similar_words}")
        
        # Scenario 2: Common similar words
        word_list = ["מלך", "מלכה"]
        common_words = find_common_similar_words(word_list, word_to_vector, topn=20)
        print(f"Common similar words for {word_list}: {common_words}")
        
    except Exception as e:
        logger.error(f"Error in main execution: {e}")

if __name__ == "__main__":
    main()