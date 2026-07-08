from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api import deps
import openai
from app.core.config import settings

router = APIRouter()

class AIQueryRequest(BaseModel):
    query: str

class AIQueryResponse(BaseModel):
    response: str

@router.post("/query", response_model=AIQueryResponse)
def ask_ai(
    request: AIQueryRequest,
    db: Session = Depends(deps.get_db)
) -> Any:
    if not settings.OPENAI_API_KEY:
        # Mock response if no key is provided
        return {"response": f"Mock AI Response: I understand you are asking about '{request.query}'. Please configure the OPENAI_API_KEY environment variable to enable live AI responses."}
        
    try:
        # Determine if it's an OpenAI or GROQ API Key
        if settings.OPENAI_API_KEY.startswith("gsk_"):
            client = openai.OpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url="https://api.groq.com/openai/v1"
            )
            model_name = "llama-3.1-8b-instant"
        else:
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            model_name = "gpt-4o"
        
        prompt = f"""
        You are an enterprise workspace management assistant named SeatFlow AI. 
        A user asked: '{request.query}'
        
        Provide a helpful and concise text response answering their query about seat allocation, projects, or employees.
        """
        
        completion = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200
        )
        
        return {"response": completion.choices[0].message.content}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")
