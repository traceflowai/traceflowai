# AML Dashboard Project

## Overview
The AML (Anti-Money Laundering) Dashboard is an AI-powered application designed to analyze uploaded audio files for potential money laundering activities. The system transcribes the audio, summarizes the content, extracts Named Entities (NER), and calculates a risk score based on contributing factors. This helps analysts efficiently review and prioritize suspicious cases.

---

## Features

### 1. **File Upload**
   - Users can upload audio files to the system for analysis.

### 2. **AI-Powered Transcription**
   - Converts audio to text using advanced transcription algorithms.

### 3. **Call Summary Generation**
   - Provides a brief summary of the conversation extracted from the transcript.
   - Highlights key flagged keywords and phrases.

### 4. **Named Entity Recognition (NER)**
   - Identifies and extracts entities such as names, locations, and financial terms from the conversation.

### 5. **Risk Assessment**
   - Assigns a risk score to the conversation based on:
     - Detection of suspicious keywords.
     - Call patterns and behavior anomalies.
     - Historical data and prior case information.
   - Categorizes the risk as Low, Medium, or High.

### 6. **Dashboard View**
   - Displays:
     - Total cases analyzed.
     - Tracked individuals.
     - High-risk cases.
     - Case resolution trends.

### 7. **Case Details View**
   - Shows a detailed breakdown of a specific case:
     - Risk level and contributing factors.
     - Transcript of the conversation.
     - Sentiment analysis (Positive/Negative).
     - Flagged keywords and entities.

---

## How It Works

1. **Upload**: The user uploads an audio file.
2. **Transcription**: The AI model transcribes the audio to text.
3. **Summarization**: A concise summary of the conversation is generated.
4. **NER Extraction**: Named entities are identified and flagged.
5. **Risk Scoring**: An algorithm calculates a risk score based on:
   - Keyword frequency.
   - Anomalous patterns.
   - Historical activity.
6. **Display Results**: Results are visualized on the dashboard for review.

---

## Installation and Setup

### Prerequisites
- Node.js (v14 or later)
- Python (v3.8 or later)
- MongoDB (local or cloud instance)

### Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/traceflowai/traceflowai
   cd traceflowai
   ```

2. **Install dependencies**:
   ```bash
   # Frontend
   cd src
   npm install

   # Backend and model
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   Create `.env` files for the frontend and backend with necessary variables (e.g., API keys, database URL).

4. **Run the application**:
   ```bash
   # Frontend
   npm run dev

   # Backend
   uvicorn main:app --reload
   ```
---

## Future Enhancements
- Add support for multiple languages in transcription and NER.
- Implement real-time audio analysis.
- Introduce role-based access control (RBAC).
- Add a feedback loop to improve AI scoring accuracy.

---

## Contributing
If you'd like to contribute, please fork the repository and create a pull request with your proposed changes. Ensure all tests pass before submitting.

---

## Contact
For questions or support, please contact [traceflowai@gmail.com].
