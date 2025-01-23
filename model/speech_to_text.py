import os
import speech_recognition as sr


def speech_to_text_func(input_file):
    """
    Converts speech from an audio file to punctuated Hebrew text
    """
    if not os.path.exists(input_file):
        return "File not found. Please verify the path."

    try:
        recognizer = sr.Recognizer()
        with sr.AudioFile(input_file) as source:
            audio_data = recognizer.record(source)
            return recognizer.recognize_google(audio_data, language="he-IL")
    except Exception as e:
        return f"Transcription error: {e}"

def main():
    input_file = input("Enter WAV audio file path: ").strip()
    result = speech_to_text_func(input_file)
    print(result)

if __name__ == "__main__":
    main()
