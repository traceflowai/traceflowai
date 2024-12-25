from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException , UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from mutagen.wave import WAVE
import random
import os
from math import floor
from dotenv import load_dotenv
from bson import ObjectId
import gridfs
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from model.extract_entities import extract_person_names
from model.score import sentence_score
from model.speech_to_text import speech_to_text_func
from model.transcript import summarize_text
from fastapi.responses import StreamingResponse

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
    duration: str
    related_entities: List[str]
    wav_file_id: str

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

fs = AsyncIOMotorGridFSBucket(db)

from tempfile import NamedTemporaryFile
from fastapi import UploadFile, File, Form, HTTPException
from typing import List, Optional
import aiofiles
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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


@app.get("/files/{file_id}")
async def get_audio_file(file_id: str):
    try:
        print(file_id)
        # Retrieve file from GridFS
        grid_out = await fs.open_download_stream(ObjectId(file_id))
        headers = {"Content-Disposition": f"attachment; filename={grid_out.filename}"}
        return StreamingResponse(grid_out, media_type="audio/wav", headers=headers)
    except Exception as e:
        raise HTTPException(status_code=404, detail="File not found")

@app.post("/cases", response_model=Case)
async def create_case(
    source: str = Form(...),
    type: str = Form(...),
    severity: str = Form(...),
    status: str = Form(...),
    wavFile: UploadFile = File(...),
):

    try:
        # Create temporary file
        with NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            try:
                # Read and validate file size
                file_size = 0
                async with aiofiles.open(temp_file.name, 'wb') as out_file:
                    while chunk := await wavFile.read(8192):
                        file_size += len(chunk)
                        await out_file.write(chunk)

                # Process audio file
                audio = WAVE(temp_file.name)
                duration = '{:02d}:{:02d}'.format(*divmod(floor(audio.info.length), 60))

                # Perform speech to text
                conversation = speech_to_text_func(temp_file.name)

                # Extract metadata
                related_entities = extract_person_names(conversation)
                score, flagged_keywords = sentence_score(conversation)
                summary = summarize_text(conversation)

                # Save to GridFS
                async with aiofiles.open(temp_file.name, 'rb') as wav_file:
                    file_content = await wav_file.read()
                    file_id = await fs.upload_from_stream(
                        filename=wavFile.filename,
                        source=file_content
                    )

                # Prepare case data
                case_data = {
                    "source": source,
                    "severity": severity,
                    "status": status,
                    "type": type,
                    "timestamp": datetime.now(),
                    "riskScore": score,
                    "flaggedKeywords": flagged_keywords,
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

            finally:
                # Clean up temporary file
                try:
                    os.unlink(temp_file.name)
                except Exception as e:
                    logger.error(f"Failed to delete temporary file: {str(e)}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing case: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Internal server error while processing case"
        )

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
