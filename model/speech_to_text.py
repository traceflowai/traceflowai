import os
import subprocess
import speech_recognition as sr

# רשימת סוגי הקבצים הנתמכים להמרה
SUPPORTED_FORMATS = [".mp3", ".aac", ".ogg", ".flac", ".opus"]

def add_advanced_punctuation_and_line_breaks(text):
    """
    הוספת פיסוק מתקדם לטקסט עם זיהוי שאלות והוספת ירידות שורה.
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
            i + 1 == len(words)  # סוף הטקסט
            or words[i + 1] in question_words  # התחלה של שאלה חדשה
            or words[i + 1] in punctuation_words  # התחלה של משפט חדש
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
    ממיר קובץ שמע לפורמט WAV באמצעות FFmpeg.
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
    input_file = input("אנא הכנס את נתיב קובץ השמע: ").strip()

    if not os.path.exists(input_file):
        print("הקובץ לא נמצא. ודא שהנתיב נכון.")
        return

    try:
        if not input_file.endswith(".wav"):
            print("מבצע המרה ל-WAV...")
            input_file = convert_to_wav(input_file)
            print("ההמרה הושלמה בהצלחה.")

        recognizer = sr.Recognizer()
        with sr.AudioFile(input_file) as source:
            print("מבצע זיהוי דיבור...")
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data, language="he-IL")
            print("הטקסט המזוהה לפני פיסוק:")
            print(text)

            punctuated_text = add_advanced_punctuation_and_line_breaks(text)
            print("\nהטקסט המזוהה עם פיסוק:")
            print(punctuated_text)
    except FileNotFoundError:
        print("שגיאה: הקובץ לא נמצא.")
    except sr.UnknownValueError:
        print("שגיאה: לא זוהה טקסט בקובץ.")
    except sr.RequestError as e:
        print(f"שגיאה בשירות Google Speech Recognition: {e}")
    except Exception as e:
        print(f"שגיאה: {e}")
