from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

# Pydantic Models
class CaseBase(BaseModel):
    source: str
    severity: Optional[str] = 'Medium'
    status: Optional[str] = 'New'
    type: str
    timestamp: datetime
    riskScore: Optional[float] = 50.0
    flaggedKeywords: List[str] = []
    reason: List[str] = []
    script: str
    summary: str
    duration: str
    related_entities: List[str]
    wav_file_id: str

class Case(CaseBase):
    id: str  # Include MongoDB ObjectId as a string

class UserBase(BaseModel):
    user_id: str
    name: str
    phoneNumber: str
    riskLevel: Optional[str] = "medium"
    lastMentioned: datetime

class User(UserBase):
    id: str  # Include MongoDB ObjectId as a string

class BadWordsUpdate(BaseModel):
    word: str
    category: str
    score: int
