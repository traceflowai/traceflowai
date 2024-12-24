import os
import subprocess
import speech_recognition as sr

# The supported formats
SUPPORTED_FORMATS = [".mp3", ".aac", ".ogg", ".flac", ".opus"]

def add_advanced_punctuation_and_line_breaks(text):
    """
    Adding punctuation to the text
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
            or words[i + 1] in punctuation_words  # start of a new senence
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

def convert_to_wav(input_file):
    """
    Convert the file into wav file
    """
    file_extension = os.path.splitext(input_file)[1].lower()
    if file_extension not in SUPPORTED_FORMATS:
        raise ValueError(f"פורמט הקובץ {file_extension} אינו נתמך.")

    output_file = "audio.wav"
    subprocess.run(
        ["ffmpeg", "-y", "-i", input_file, output_file],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return output_file

def speech_to_text_func():
    """
    Handles the process of converting speech from an audio file to text
    """
    input_file = input("Please enter the path to the audio file: ").strip()

    if not os.path.exists(input_file):
        print("File not found. Please ensure the path is correct.")
        return

    try:
        if not input_file.endswith(".wav"):
            print("Converting to WAV format...")
            input_file = convert_to_wav(input_file)
            print("Conversion completed successfully.")

        recognizer = sr.Recognizer()
        with sr.AudioFile(input_file) as source:
            print("Performing speech recognition...")
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data, language="he-IL")
            print("Recognized text before punctuation:")
            print(text)

            punctuated_text = add_advanced_punctuation_and_line_breaks(text)
            print("\nRecognized text with punctuation:")
            print(punctuated_text)
    except FileNotFoundError:
        print("Error: File not found.")
    except sr.UnknownValueError:
        print("Error: No speech detected in the audio file.")
    except sr.RequestError as e:
        print(f"Error with Google Speech Recognition service: {e}")
    except Exception as e:
        print(f"Error: {e}")
