import os
import speech_recognition as sr

def add_advanced_punctuation_and_line_breaks(text):
    """
    Adding punctuation to the text for better readability
    """
    question_words = {"מה", "מי", "למה", "איך", "מתי", "איפה", "האם", "נו", "אז", "כמה", "איזה", "מדוע"}
    punctuation_words = {"אבל", "כי", "לכן", "וגם", "או", "שגם", "בנוסף", "אולם"}

    words = text.split()
    punctuated_text = []
    current_sentence = []
    is_question = False

    for i, word in enumerate(words):
        current_sentence.append(word)

        if word in question_words:
            is_question = True

        if word in punctuation_words:
            current_sentence[-1] = word + ","

        is_end_of_sentence = (
            i + 1 == len(words)  # end of the text
            or words[i + 1] in question_words  # start of a new question
            or words[i + 1] in punctuation_words  # start of a new sentence
        )

        if is_end_of_sentence:
            if is_question:
                current_sentence[-1] += "?"
            else:
                current_sentence[-1] += "."
            punctuated_text.append(" ".join(current_sentence))
            current_sentence = []
            is_question = False

    if current_sentence:
        if is_question:
            current_sentence[-1] += "?"
        else:
            current_sentence[-1] += "."
        punctuated_text.append(" ".join(current_sentence))

    return "\n".join(punctuated_text)

def speech_to_text_func(input_file):
    """
    Handles the process of converting speech from an audio file (WAV) to text
    """
    if not os.path.exists(input_file):
        return "File not found. Please ensure the path is correct."

    try:
        recognizer = sr.Recognizer()
        with sr.AudioFile(input_file) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data, language="he-IL")

            punctuated_text = add_advanced_punctuation_and_line_breaks(text)
            return punctuated_text
    except FileNotFoundError:
        return "File not found."
    except sr.UnknownValueError:
        return "No speech detected in the audio file."
    except sr.RequestError as e:
        return f"Error with Google Speech Recognition service: {e}"
    except Exception as e:
        return f"Error: {e}"

def main():
    """
    Main function to handle user input and trigger the speech-to-text process.
    """
    input_file = input("Please enter the path to the WAV audio file: ").strip()
    result = speech_to_text_func(input_file)
    print(result)  # Print the result to the user

if __name__ == "__main__":
    main()
