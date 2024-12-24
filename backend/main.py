from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException , UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from mutagen.mp3 import MP3
import random
import os
from math import floor
from dotenv import load_dotenv
from bson import ObjectId
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from model.extract_entities import extract_person_names
from model.score import sentence_score


# Pydantic models
class CaseBase(BaseModel):
    source: str
    severity: Optional[str] = "medium"  # Default severity
    status: str
    type: str
    timestamp: datetime
    riskScore: Optional[float] = 50.0  # Default riskScore
    flaggedKeywords: List[str] = []
    script: str 
    summary: str
    duration: float
    related_entities: List[str]

class Case(CaseBase):
    id: str  # Include MongoDB ObjectId as a string


class UserBase(BaseModel):
    user_id: str
    name: str
    phoneNumber: str
    riskLevel: Optional[str] = "medium"  # Default riskLevel
    lastMentioned: datetime  # Default lastMentioned

class User(UserBase):
    id: str  # Include MongoDB ObjectId as a string

# FastAPI application
app = FastAPI()

# MongoDB Configuration
load_dotenv()
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = "data"
COLLECTION_NAME_CASES = "cases"
COLLECTION_NAME_USERS = "users"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
collection_cases = db[COLLECTION_NAME_CASES]
collection_users = db[COLLECTION_NAME_USERS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React development server
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

############################################################################################################
#cases

@app.get("/cases", response_model=List[Case])
async def get_cases():
    cases = []
    try:
        async for case in collection_cases.find():
            case["id"] = str(case["_id"])  # Convert ObjectId to string
            case.pop("_id", None)         # Remove MongoDB's ObjectId field
            cases.append(case)
    except Exception as e:
        print(f"Error retrieving cases: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving cases: {str(e)}")
    return cases

@app.post("/cases")
async def create_case(
    source: str = Form(...),
    type: str = Form(...),
    severity: str = Form(...),
    status: str = Form(...),
    mp3file: UploadFile = File(...),
    ):

    # Save the file temporarily for processing
    file_path = f"./tmp_mp3"
    with open(file_path, "wb") as temp_file:
        temp_file.write(await mp3file.read())

    # Use mutagen to calculate the duration
    audio = MP3(file_path)
    duration = audio.info.length  # Duration in seconds
    conversation = """
    מיה: היי אדם, מה קורה?
    אדם: היי מיה, הכול טוב. מה איתך?
    מיה: סבבה, תודה. תגיד, ראית את יונתן היום?
    אדם: לא, אבל דיברתי איתו. הוא אמר שהוא יושב עכשיו עם דניאל.
    מיה: אה, איפה?
    אדם: בקפה "תמר", אני חושב. למה? רצית להצטרף?
    מיה: אולי. חשבתי גם להתקשר ללירון, לשאול אם היא רוצה לבוא.
    אדם: לירון? האמת, היא סיפרה לי אתמול שהיא ממש עמוסה עם העבודה.
    מיה: כן, אני יודעת... אבל לא ראיתי אותה מלא זמן.
    אדם: אז אולי תדברי גם עם רוני? היא אמרה לי שהיא מחפשת זמן לשבת איתך.
    מיה: רעיון טוב! אני אתקשר אליה אחרי זה. תודה, אדם!
    אדם: בכיף. תגידי לי אם אתן מגיעות, אולי אני גם אקפוץ.
    מיה: סגור! נדבר.
    אדם: סתום תפה אני מעביר לך מלא מלא כסף מתחת לשלוחן
    שלמה: לא חשוד בכל, דבר עם החבר מהבנק שלנו שעובד בחו"ל
    """
    related_entities = extract_person_names(conversation)
    score, flagged_Keywords = sentence_score(conversation)
    case_data = {
        "source": source,
        "severity": severity,
        "status": status,
        "type": type,
        "timestamp": datetime.now(),
        "riskScore": score,
        "flaggedKeywords": flagged_Keywords,
        "script": "Generated script placeholder",
        "summary": "Generated summary placeholder",
        "duration": duration, # Calculate duration based on file size
        "related_entities": related_entities
    }

    os.remove(file_path)


    # Insert case data into MongoDB
    result = await collection_cases.insert_one(case_data)
    case_data["id"] = str(result.inserted_id)  # Convert ObjectId to string
    case_data.pop("_id", None)  # Remove MongoDB's _id field if present

    # Ensure all fields are JSON-serializable
    case_data["timestamp"] = case_data["timestamp"].isoformat()  # Convert datetime to ISO 8601 string

    print(case_data)  # For debugging
    return case_data

@app.delete("/cases/{case_id}")
async def delete_case(case_id: str):
    try:
        # Ensure case_id is a valid ObjectId
        if not ObjectId.is_valid(case_id):
            raise HTTPException(status_code=400, detail="Invalid case ID format")
        
        result = await collection_cases.delete_one({"_id": ObjectId(case_id)})
        if result.deleted_count == 1:
            return {"message": "Case deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Case not found")
    except Exception as e:
        # Use logging instead of print for better error handling in production
        import logging
        logging.error(f"Error deleting case: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

############################################################################################################
#users

@app.get("/watchlist")
async def get_users():
    users = []
    try:
        async for user in collection_users.find():
            user["id"] = str(user["_id"])  # Convert ObjectId to string
            user.pop("_id", None)         # Remove MongoDB's ObjectId field
            users.append(user)
    except Exception as e:
        print(f"Error retrieving users: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving users: {str(e)}")
    return users

@app.post("/watchlist")
async def create_user(
    id: str = Form(...),
    name: str = Form(...),
    phoneNumber: str = Form(...),
    riskLevel: str = Form("medium"),
    ):
    # Prepare user data
    user_data = {
        "user_id": id,
        "name": name,
        "phoneNumber": phoneNumber,
        "riskLevel": riskLevel,
        "lastMentioned": datetime(1, 1, 1)  # Default value
    }

    # Insert user data into MongoDB
    try:
        result = await collection_users.insert_one(user_data)
        user_data["id"] = str(result.inserted_id)  # Convert ObjectId to string
        user_data.pop("_id", None)  # Remove MongoDB-specific "_id" field
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return user_data

@app.delete("/watchlist/{user_id}")
async def delete_user(user_id: str):
    try:
        # Ensure user_id is a valid ObjectId
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        result = await collection_users.delete_one({"_id": ObjectId(user_id)})
        if result.deleted_count == 1:
            return {"message": "User deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        # Use logging instead of print for better error handling in production
        import logging
        logging.error(f"Error deleting user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")