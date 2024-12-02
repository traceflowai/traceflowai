from train_model import *

# load the fine-tuned model (alephbert)
model_path = "./alephbert_fine_tuned"
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForSequenceClassification.from_pretrained(model_path)

# if GPU is available, move the model to GPU
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)


# function to predict the text
def predict_text(t):
    # normalize the text
    process_text = preprocess_text(t)

    # change the text so it can be used by the model
    inputs = tokenizer(process_text, return_tensors="pt", padding=True, truncation=True, max_length=128)
    inputs = {key: val.to(device) for key, val in inputs.items()}  # move the inputs to the GPU if available

    # predict the text
    model.eval()  # now we are in evaluation mode
    with torch.no_grad():
        outputs = model(**inputs)
        prediction = torch.argmax(outputs.logits, dim=1).item()

    return "Suspicious" if prediction == 1 else "Normal"


# check the model with some texts
texts_to_test = [
    "העברתי 50,000 ש״ח כדי לקנות רכב חדש לאישתי",
    "שיניתי היסטוריית העסקאות כדי להסתיר העברות קודמות",
    "שילמתי 100,000 ש״ח על דירה",
    "הפקדתי סכום של 5,000 לחשבון פיקטיבי",
    "העברתי 20,000 ש\"ח לחשבון בחו\"ל דרך חברה פיקטיבית.",
    "קניתי רכב חדש ושילמתי עליו 80,000 ש\"ח.",
    "בוא נסגור את העסקה במזומן כדי לא לעורר תשומת לב.",
    "אני מתכנן לקנות דירה חדשה עם הלוואת משכנתא.",
    "אפשר להלבין את הכסף הזה דרך רכישת נדל\"ן.",
    "קניתי דירה חדשה ושילמתי מקדמה במזומן",
    "יש פה משטרה שמחפשת בעיות בכספים בוא נברח מכאן",
    "תעביר את הכסף בלי ששמים לב",
    "מה עם מה שאתה חייב לי?"
]

# print the prediction for each text
for text in texts_to_test:
    print(f"Text: {text}")
    print(f"Prediction: {predict_text(text)}")
    print("-" * 50)
