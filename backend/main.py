from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from bson import ObjectId
from mutagen.wave import WAVE
from datetime import datetime
from typing import List, Optional
import os
import aiofiles
from tempfile import NamedTemporaryFile
from dotenv import load_dotenv
from math import floor

from model.extract_entities import extract_person_names
from model.score import SuspiciousWordDetector
from model.speech_to_text import speech_to_text_func
from model.transcript import summarize_text

# Database Configuration
load_dotenv()
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = "data"
COLLECTION_NAME_CASES = "cases"
COLLECTION_NAME_USERS = "users"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
collection_cases = db[COLLECTION_NAME_CASES]
collection_users = db[COLLECTION_NAME_USERS]
fs = AsyncIOMotorGridFSBucket(db)


detector = SuspiciousWordDetector(
    vectors_path="model/words_vectors.npy",
    vocab_path="model/words_list.txt"
)

# Helper function for database error handling
async def handle_database_error(error_message: str, exc: Exception):
    raise HTTPException(status_code=500, detail=f"Internal server error: {str(exc)}")

# Helper function to convert MongoDB documents to dict
def mongo_to_dict(doc):
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc

# FastAPI application
app = FastAPI()

# Middleware for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React development server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Helper function to save file to a temporary location
async def save_file_to_temp(wavFile: UploadFile):
    with NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
        async with aiofiles.open(temp_file.name, 'wb') as out_file:
            while chunk := await wavFile.read(8192):
                await out_file.write(chunk)
    return temp_file.name

# Cases Endpoints
@app.get("/cases", response_model=List[Case])
async def get_cases():
    cases = []
    try:
        async for case in collection_cases.find():
            cases.append(mongo_to_dict(case))
    except Exception as e:
        await handle_database_error("Error retrieving cases", e)
    return cases

@app.get("/files/{file_id}")
async def get_audio_file(file_id: str):
    try:
        grid_out = await fs.open_download_stream(ObjectId(file_id))
        headers = {"Content-Disposition": f"attachment; filename={grid_out.filename}"}
        return StreamingResponse(grid_out, media_type="audio/wav", headers=headers)
    except Exception as e:
        raise HTTPException(status_code=404, detail="File not found")

@app.post("/cases", response_model=Case)
async def create_case(
    source: str = Form(...),
    type: str = Form(...),
    wavFile: UploadFile = File(...),
):
    try:
        temp_file_name = await save_file_to_temp(wavFile)

        # Process audio file
        audio = WAVE(temp_file_name)
        duration = '{:02d}:{:02d}'.format(*divmod(floor(audio.info.length), 60))

        # Perform speech to text
        conversation = speech_to_text_func(temp_file_name)

        # Extract metadata
        related_entities = extract_person_names(conversation)
        score, flagged_keywords, categories = detector.calculate_score(conversation)
        detector.add_related_words(flagged_keywords if len(flagged_keywords) <3 else flagged_keywords[:3])
        summary = summarize_text(conversation)

        # Save to GridFS
        async with aiofiles.open(temp_file_name, 'rb') as wav_file:
            file_content = await wav_file.read()
            file_id = await fs.upload_from_stream(
                filename=wavFile.filename,
                source=file_content
            )

        # Determine severity based on score
        severity = 'low' if score < 30 else 'medium' if score < 70 else 'high'

        # Prepare case data
        case_data = {
            "source": source,
            "severity": severity,
            "status": 'New',
            "type": type,
            "timestamp": datetime.now(),
            "riskScore": score,
            "flaggedKeywords": flagged_keywords,
            "reason": categories,
            "script": conversation,
            "summary": summary,
            "duration": duration,
            "related_entities": related_entities,
            "wav_file_id": str(file_id)
        }

        # Insert into database
        result = await collection_cases.insert_one(case_data)
        case_data["id"] = str(result.inserted_id)
        case_data.pop("_id", None)

        # Convert datetime for JSON serialization
        case_data["timestamp"] = case_data["timestamp"].isoformat()

        return case_data
    except Exception as e:
        await handle_database_error("Error creating case", e)

@app.delete("/cases/{case_id}")
async def delete_case(case_id: str):
    try:
        if not ObjectId.is_valid(case_id):
            raise HTTPException(status_code=400, detail="Invalid case ID format")

        result = await collection_cases.delete_one({"_id": ObjectId(case_id)})
        if result.deleted_count == 1:
            return {"message": "Case deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Case not found")
    except Exception as e:
        await handle_database_error("Error deleting case", e)

@app.put("/cases/{case_id}")
async def update_case(case_id: str, body: Request):
    try:
        data = await body.json()
        status = data.get("status")
        if not status:
            raise HTTPException(status_code=400, detail="Status is required")

        if not ObjectId.is_valid(case_id):
            raise HTTPException(status_code=400, detail="Invalid case ID format")

        result = await collection_cases.update_one(
            {"_id": ObjectId(case_id)},
            {"$set": {"status": status}}
        )

        if result.modified_count == 1:
            return {"message": "Case updated successfully"}
        raise HTTPException(status_code=404, detail="Case not found")
    except Exception as e:
        await handle_database_error("Error updating case", e)

# Users Endpoints
@app.get("/watchlist")
async def get_users():
    users = []
    try:
        async for user in collection_users.find():
            users.append(mongo_to_dict(user))
    except Exception as e:
        await handle_database_error("Error retrieving users", e)
    return users

@app.post("/watchlist")
async def create_user(
    id: str = Form(...),
    name: str = Form(...),
    phoneNumber: str = Form(...),
    riskLevel: str = Form("medium"),
):
    user_data = {
        "user_id": id,
        "name": name,
        "phoneNumber": phoneNumber,
        "riskLevel": riskLevel,
        "lastMentioned": datetime(1, 1, 1)
    }

    try:
        result = await collection_users.insert_one(user_data)
        user_data["id"] = str(result.inserted_id)
        user_data.pop("_id", None)
    except Exception as e:
        await handle_database_error("Error creating user", e)

    return user_data

@app.delete("/watchlist/{user_id}")
async def delete_user(user_id: str):
    try:
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")

        result = await collection_users.delete_one({"_id": ObjectId(user_id)})
        if result.deleted_count == 1:
            return {"message": "User deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        await handle_database_error("Error deleting user", e)


@app.get("/badwords")
async def get_badwords():
    try:
        with open('model/suspicious_words.csv', 'r', encoding='utf-8') as file:
            file.readline()  # Skip header
            # Read and strip trailing spaces while preserving valid content
            badwords = ''.join(line.rstrip() + '\n' for line in file if line.strip())
            # Remove the last newline if it exists
            badwords = badwords.rstrip()
        return {"badwords": badwords}
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while retrieving bad words")

# Add a new bad word
@app.post("/badwords/add")
async def add_badwords(new_badwords: BadWordsUpdate):
    try:
        with open('model/suspicious_words.csv', 'a', encoding='utf-8') as file:
            file.write(f"{new_badwords.word},{new_badwords.category},{new_badwords.score}\n")
        return {"message": "Bad word added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while adding bad word: {str(e)}")

@app.post("/badwords/update/{id}")
async def update_badwords(id: int, data: BadWordsUpdate):
    try:        
        with open('model/suspicious_words.csv', 'r', encoding='utf-8') as file:
            badwords = file.readlines()

        # Validate the ID
        if id < 0 or id >= len(badwords):
            raise HTTPException(status_code=404, detail="Bad word not found")

        # Update the specific line with new data
        badwords[id] = f"{data.word},{data.category},{data.score}\n"

        with open('model/suspicious_words.csv', 'w', encoding='utf-8') as file:
            file.writelines(badwords)

        return {"message": "Bad word updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while updating bad word: {str(e)}")

# Delete an existing bad word
@app.delete("/badwords/delete/{id}")
async def delete_badwords(id: int):
    try:
        with open('model/suspicious_words.csv', 'r', encoding='utf-8') as file:
            badwords = file.readlines()

        # Validate the ID
        if id < 0 or id >= len(badwords):
            raise HTTPException(status_code=404, detail="Bad word not found")

        # Remove the specific line
        del badwords[id]

        with open('model/suspicious_words.csv', 'w', encoding='utf-8') as file:
            file.writelines(badwords)

        return {"message": "Bad word deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while deleting bad word: {str(e)}")