from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline

def merge_adjacent_entities(entities):
    """
    Merges adjacent entities of the same type based on start (B-*), continuation (I-*), and end (E-*) labels.
    """
    merged_entities = []
    current_entity = None

    for entity in entities:
        entity_type = entity["entity"].split("-")[-1]  # Entity type (e.g., PER, ORG, etc.)
        tag = entity["entity"].split("-")[0]  # Tag (B, I, E, S)

        if tag == "B":  # Beginning of a new entity
            if current_entity:
                merged_entities.append(current_entity)
            current_entity = {
                "word": entity["word"],
                "entity_type": entity_type,
                "start": entity["start"],
                "end": entity["end"],
                "score": entity["score"]
            }
        elif tag in ["I", "E"] and current_entity and current_entity["entity_type"] == entity_type:
            # Continuation or end of the same entity
            current_entity["word"] += f" {entity['word']}"
            current_entity["end"] = entity["end"]
            current_entity["score"] = max(current_entity["score"], entity["score"])
            if tag == "E":
                merged_entities.append(current_entity)
                current_entity = None
        elif tag == "S":  # Singleton entity
            if current_entity:
                merged_entities.append(current_entity)
            current_entity = {
                "word": entity["word"],
                "entity_type": entity_type,
                "start": entity["start"],
                "end": entity["end"],
                "score": entity["score"]
            }
            merged_entities.append(current_entity)
            current_entity = None

    if current_entity:
        merged_entities.append(current_entity)

    return merged_entities

def extract_person_names(conversation):
    """
    Extracts and prints names of entities of type PER from the conversation.
    """

    extract_person_names(conversation)
    model_name = "msperka/aleph_bert_gimmel-finetuned-ner"

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForTokenClassification.from_pretrained(model_name)
    nlp = pipeline("ner", model=model, tokenizer=tokenizer, grouped_entities=False)

    sentences = conversation.split(". ")
    person_names = []

    for sentence in sentences:
        entities = nlp(sentence)
        merged_entities = merge_adjacent_entities(entities)

        # Extract names of entities of type PER
        person_names.extend(entity["word"] for entity in merged_entities if entity["entity_type"] == "PER")
    person_names = list(set(person_names))  # Remove duplicates
    return person_names


