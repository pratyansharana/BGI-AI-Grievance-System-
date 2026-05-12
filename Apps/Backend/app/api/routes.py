from fastapi import APIRouter, HTTPException
from app.models.schemas import GrievanceRequest
from app.services.nlp_engine import classify_grievance

router = APIRouter()

@app.post("/analyze")
async def analyze(request: GrievanceRequest):
    if not request.text_content:
        raise HTTPException(status_code=400, detail="Text content is required")
    
    # Trigger the NLU pipeline
    result = classify_grievance(request.text_content)
    return result