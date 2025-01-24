from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from bson import ObjectId
from mutagen.wave import WAVE
from datetime import datetime
from typing import List

import os
import aiofiles
import asyncio
import threading
from functools import partial
from concurrent.futures import ThreadPoolExecutor
from tempfile import NamedTemporaryFile
from math import floor
from dotenv import load_dotenv

from model.extract_entities import extract_person_names
from model.score import SuspiciousWordDetector
from model.speech_to_text import speech_to_text_func
from model.transcript import summarize_text

from .types import *

# Global thread pool for CPU-bound tasks
CPU_BOUND_EXECUTOR = ThreadPoolExecutor(max_workers=os.cpu_count() * 2)

# Database Configuration
load_dotenv()
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = "data"
COLLECTION_NAME_CASES = "cases"
COLLECTION_NAME_USERS = "users"

# Database setup
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
collection_cases = db[COLLECTION_NAME_CASES]
collection_users = db[COLLECTION_NAME_USERS]
fs = AsyncIOMotorGridFSBucket(db)

# Suspicious word detector model
detector = SuspiciousWordDetector(
    vectors_path="model/words_vectors.npy",
    vocab_path="model/words_list.txt"
)

# Helper function for converting MongoDB documents
def mongo_to_dict(doc):
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc

# Helper function to save file to temporary location
async def save_file_to_temp(wavFile: UploadFile)-> str:
    with NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
        async with aiofiles.open(temp_file.name, 'wb') as out_file:
            while chunk := await wavFile.read(8192):
                await out_file.write(chunk)
    return temp_file.name

# Audio processing function
async def process_audio_file(temp_file_name: str):
    loop = asyncio.get_event_loop()
    
    duration_task = loop.run_in_executor(
        CPU_BOUND_EXECUTOR, 
        partial(get_audio_duration, temp_file_name)
    )
    conversation_task = loop.run_in_executor(
        CPU_BOUND_EXECUTOR, 
        speech_to_text_func, 
        temp_file_name
    )
    
    duration, conversation = await asyncio.gather(duration_task, conversation_task)
    return duration, conversation

def get_audio_duration(file_path: str) -> str:
    audio = WAVE(file_path)
    return '{:02d}:{:02d}'.format(*divmod(floor(audio.info.length), 60))

# Metadata extraction function
async def extract_metadata_and_score(conversation: str):
    loop = asyncio.get_event_loop()

    # Run tasks concurrently with CPU_BOUND_EXECUTOR
    related_entities_future = loop.run_in_executor(CPU_BOUND_EXECUTOR, extract_person_names, conversation)
    score_details_future = loop.run_in_executor(CPU_BOUND_EXECUTOR, detector.calculate_score, conversation)
    summary_future = loop.run_in_executor(CPU_BOUND_EXECUTOR, summarize_text, conversation)

    # Wait for all tasks to complete
    related_entities, score_details, summary = await asyncio.gather(
        related_entities_future, 
        score_details_future, 
        summary_future
    )

    # Unpack score details
    score, flagged_keywords, categories = score_details

    # Optional background task for related words
    def background_task():
        try:
            detector.add_related_words(flagged_keywords)
        except Exception as e:
            print(f"Background task error: {e}")

    threading.Thread(target=background_task, daemon=True).start()

    return related_entities, {
        "score": score,
        "flagged_keywords": flagged_keywords,
        "categories": categories
    }, summary

# Save audio to GridFS
async def save_audio_to_gridfs(temp_file_name: str, filename: str):
    async with aiofiles.open(temp_file_name, 'rb') as wav_file:
        file_content = await wav_file.read()
        return await fs.upload_from_stream(filename=filename, source=file_content)

# Severity determination
def determine_severity(score: int) -> str:
    if score < 30:
        return 'low'
    elif score < 70:
        return 'medium'
    return 'high'

# FastAPI application
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cases Endpoints
@app.get("/cases", response_model=List[Case])
async def get_cases():
    cases = []
    try:
        async for case in collection_cases.find():
            cases.append(mongo_to_dict(case))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving cases: {str(e)}")
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
        print(f"Saved file to {temp_file_name}")
        duration, conversation = await process_audio_file(temp_file_name)
        
        related_entities, score_details, summary = await extract_metadata_and_score(conversation)
        file_id = await save_audio_to_gridfs(temp_file_name, wavFile.filename)

        case_data = {
            "source": source,
            "severity": determine_severity(score_details["score"]),
            "status": 'new',
            "type": type,
            "timestamp": datetime.now(),
            "riskScore": score_details["score"],
            "flaggedKeywords": score_details["flagged_keywords"],
            "reason": score_details["categories"],
            "script": conversation,
            "summary": summary,
            "duration": duration,
            "related_entities": related_entities,
            "wav_file_id": str(file_id),
        }

        result = await collection_cases.insert_one(case_data)
        case_data["id"] = str(result.inserted_id)
        case_data.pop("_id", None)
        case_data["timestamp"] = case_data["timestamp"].isoformat()

        return case_data
    
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

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
        raise HTTPException(status_code=500, detail=f"Error deleting case: {str(e)}")

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
        raise HTTPException(status_code=500, detail=f"Error updating case: {str(e)}")

# Users Endpoints
@app.get("/watchlist")
async def get_users():
    users = []
    try:
        async for user in collection_users.find():
            users.append(mongo_to_dict(user))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving users: {str(e)}")
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
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

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
        raise HTTPException(status_code=500, detail=f"Error deleting user: {str(e)}")

@app.get("/badwords")
async def get_badwords():
    try:
        with open('model/suspicious_words.csv', 'r', encoding='utf-8') as file:
            file.readline()  # Skip header
            badwords = ''.join(line.rstrip() + '\n' for line in file if line.strip())
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

        if id < 0 or id >= len(badwords):
            raise HTTPException(status_code=404, detail="Bad word not found")

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

        if id < 0 or id >= len(badwords):
            raise HTTPException(status_code=404, detail="Bad word not found")

        del badwords[id]

        with open('model/suspicious_words.csv', 'w', encoding='utf-8') as file:
            file.writelines(badwords)

        return {"message": "Bad word deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while deleting bad word: {str(e)}")