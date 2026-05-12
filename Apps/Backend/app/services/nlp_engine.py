from transformers import pipeline

# Load model into memory at startup
print("Loading BART Transformer Model...")
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

DEPARTMENTS = ["Water Supply", "Electricity", "Roads", "Sanitation", "Safety"]

def classify_grievance(text: str):
    # Perform Zero-Shot Classification
    output = classifier(text, candidate_labels=DEPARTMENTS)
    
    return {
        "category": output['labels'][0],
        "confidence": round(output['scores'][0], 3),
        "priority": "High" if output['scores'][0] > 0.8 else "Medium"
    }