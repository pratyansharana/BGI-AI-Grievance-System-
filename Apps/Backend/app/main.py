from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline
import uvicorn
from typing import Optional, List, Dict

app = FastAPI(title="LokAwaz AI Engine")

print("Initializing NLP Engine...")
# Model is loaded once at startup to ensure fast request handling
# Replace the old classifier line with this one:
classifier = pipeline(
    "zero-shot-classification", 
    model="valhalla/distilbart-mnli-12-3" # Much smaller/faster model
)
# Labels used for semantic comparison
DEPARTMENTS = {
    "Sanitation": "garbage, trash, waste not collected, open drain, sewage overflow, dirty streets, littering",
    "Water Supply": "no water, pipe leakage, dirty water, water shortage, broken water line",
    "Electricity": "power cut, no electricity, broken streetlight, electric pole fallen, transformer fault",
    "Roads": "pothole, broken road, damaged footpath, road cave-in, traffic signal broken",
    "Public Safety": "crime, harassment, illegal activity, law and order, dangerous situation, fire hazard",
    "Healthcare": "hospital issue, no doctor, medicines unavailable, ambulance delay, public health problem",
    "Education": "school problem, teacher absent, mid-day meal, scholarship issue, anganwadi closed",
    "Housing": "illegal construction, building damage, eviction, public housing, slum issue",
}

LABEL_KEYS = list(DEPARTMENTS.keys())

# Adjusted thresholds for zero-shot performance on short civic inputs
CONFIDENCE_HIGH = 0.55   
CONFIDENCE_MEDIUM = 0.25 

class GrievanceRequest(BaseModel):
    text_content: str
    language_hint: Optional[str] = "en"

class GrievanceResponse(BaseModel):
    primary_category: str
    secondary_category: Optional[str]
    confidence: float
    priority: str
    status: str
    needs_review: bool
    all_scores: Dict[str, float]
    expanded_text: str 

def expand_text(raw: str) -> str:
    """
    Reframes short/informal text into a formal civic complaint structure
    to provide the BERT model with more semantic 'signal'.
    """
    text = raw.strip().rstrip(".")
    
    if len(text.split()) >= 15:
        return text
    
    return (
        f"I am filing a civic grievance. The issue reported is: {text}. "
        f"This problem requires attention from the relevant municipal department."
    )

@app.post("/analyze", response_model=GrievanceResponse)
async def analyze_complaint(request: GrievanceRequest):
    raw_text = request.text_content.strip()

    if not raw_text:
        raise HTTPException(status_code=400, detail="Text content is empty.")
    if len(raw_text) < 5:
        raise HTTPException(status_code=400, detail="Description too short.")

    # Step 1: Expand short/casual text
    expanded = expand_text(raw_text)

    # Step 2: Primary classification
    result = classifier(
        expanded,
        candidate_labels=LABEL_KEYS,
        multi_label=False, # Picks the single best comparative department
        hypothesis_template="This is a civic complaint about {}.", 
    )

    # Step 3: Parse and Sort Scores
    scores: Dict[str, float] = dict(zip(result["labels"], [round(float(s), 3) for s in result["scores"]]))
    sorted_labels = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    top_label, top_score = sorted_labels[0]
    second_label, second_score = sorted_labels[1]

    # Step 4: Logic for Priority and Status
    needs_review = top_score < CONFIDENCE_MEDIUM

    if needs_review:
        priority = "Low"
        top_label = "Unclassified"
        secondary = None
        status = "Pending Review"
    else:
        status = "Routed"
        secondary = second_label if second_score >= CONFIDENCE_MEDIUM else None
        
        if top_score >= CONFIDENCE_HIGH:
            priority = "High"
        else:
            priority = "Medium"

    return GrievanceResponse(
        primary_category=top_label,
        secondary_category=secondary,
        confidence=top_score,
        priority=priority,
        status=status,
        needs_review=needs_review,
        all_scores=scores,
        expanded_text=expanded,
    )

@app.get("/")
def health():
    return {
        "status": "AI Engine Online",
        "model": "facebook/bart-large-mnli",
        "departments": LABEL_KEYS,
        "thresholds": {"high": CONFIDENCE_HIGH, "medium": CONFIDENCE_MEDIUM},
    }

if __name__ == "__main__":
    # Ensure port 8000 is used for React Native connection
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)