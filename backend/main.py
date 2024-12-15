from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException , UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from mutagen.mp3 import MP3
import random
import os
from math import floor
from dotenv import load_dotenv

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

class Case(CaseBase):
    id: str  # Include MongoDB ObjectId as a string

# FastAPI application
app = FastAPI()

# MongoDB Configuration
load_dotenv()
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = "data"
COLLECTION_NAME = "cases"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React development server
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/cases", response_model=List[Case])
async def get_cases():
    cases = []
    try:
        async for case in collection.find():
            case["id"] = str(case["_id"])  # Convert ObjectId to string
            case.pop("_id", None)         # Remove MongoDB's ObjectId field
            cases.append(case)
    except Exception as e:
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
    file_path = f"/tmp_mp3"
    with open(file_path, "wb") as temp_file:
        temp_file.write(await mp3file.read())

    # Use mutagen to calculate the duration
    audio = MP3(file_path)
    duration = audio.info.length  # Duration in seconds


    case_data = {
        "source": source,
        "severity": severity,
        "status": status,
        "type": type,
        "timestamp": datetime.now(),
        "riskScore": floor(random.uniform(0, 100)),  # Random riskScore between 0 and 100
        "flaggedKeywords": [],
        "script": "Generated script placeholder",
        "summary": "Generated summary placeholder",
        "duration": duration  # Calculate duration based on file size
    }

    os.remove(file_path)


    # Insert case data into MongoDB
    result = await collection.insert_one(case_data)
    case_data["id"] = str(result.inserted_id)  # Convert ObjectId to string
    case_data.pop("_id", None)  # Remove MongoDB's _id field if present

    # Ensure all fields are JSON-serializable
    case_data["timestamp"] = case_data["timestamp"].isoformat()  # Convert datetime to ISO 8601 string

    print(case_data)  # For debugging
    return case_data