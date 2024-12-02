import re
import torch
import json
from sklearn.model_selection import train_test_split
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from datasets import Dataset
from sklearn.metrics import accuracy_score


def main():
    global model, tokenizer

    # load the data from the file
    texts = [preprocess_text(entry["text"]) for entry in data]
    labels = [entry["label"] for entry in data]

    # split the data into training and testing sets
    train_texts, test_texts, train_labels, test_labels = train_test_split(texts, labels, test_size=0.2, random_state=42)

    # create the datasets
    train_data = Dataset.from_dict({"text": train_texts, "label": train_labels})
    test_data = Dataset.from_dict({"text": test_texts, "label": test_labels})

    # select only the first 200 samples for training and 40 samples for testing!!!!!!!!!!!!!!!!!!!!!!
    train_data = train_data.select(range(200))
    test_data = test_data.select(range(40))

    # load the model and tokenizer
    model_name = "onlplab/alephbert-base"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=2)

    train_data = train_data.map(tokenize_function, batched=True)
    test_data = test_data.map(tokenize_function, batched=True)

    # remove the text column and set the format to pytorch
    train_data = train_data.remove_columns(["text"])
    test_data = test_data.remove_columns(["text"])
    train_data = train_data.with_format("torch")
    test_data = test_data.with_format("torch")

    # define the training arguments
    training_args = TrainingArguments(
        output_dir="./results",
        evaluation_strategy="epoch",
        logging_dir="./logs",
        logging_steps=10,
        per_device_train_batch_size=16,
        per_device_eval_batch_size=16,
        num_train_epochs=3,
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="accuracy",
    )

    # define the trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_data,
        eval_dataset=test_data,
        tokenizer=tokenizer,
        compute_metrics=compute_metrics,
    )

    # save the model and tokenizer
    trainer.save_model("./alephbert_fine_tuned")
    tokenizer.save_pretrained("./alephbert_fine_tuned")


# normalize the text
def preprocess_text(text):
    # change the money amounts to <AMOUNT>
    text = re.sub(r'\d+[,.]?\d*\s?[ש״ח|₪|dollars|USD]', '<AMOUNT>', text)
    # normalize regular expressions
    text = re.sub(r'העברתי', '<TRANSFER>', text)
    text = re.sub(r'מזומן', '<CASH>', text)
    return text


# load the data from the file
with open("hebrew_money_laundering_dataset.json", "r", encoding="utf-8") as file:
    data = json.load(file)


# function to tokenize the text
def tokenize_function(examples):
    return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=128)


# function to compute the metrics
def compute_metrics(eval_pared):
    logits, labels = eval_pared
    predictions = torch.argmax(torch.tensor(logits), dim=-1)
    return {"accuracy": accuracy_score(labels, predictions)}


# function to predict the text
def predict_text(text):
    text = preprocess_text(text)
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=128)
    outputs = model(**inputs)
    prediction = torch.argmax(outputs.logits, dim=1).item()
    return "Suspicious" if prediction == 1 else "Normal"


if __name__ == "__main__":
    main()
