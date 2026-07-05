# AI Code Review Agent - Backend

## Project Overview

The AI Code Review Agent is a FastAPI-powered backend that allows users to submit their source code for AI review. Features include bug detection, security analysis, best practice suggestions, optimization recommendations, and root cause analysis.

This repository currently contains Module 1 (The Backend Foundation).

## Setup Instructions

### 1. PostgreSQL Setup
Make sure you have PostgreSQL installed. Create a database for the project and keep track of your credentials to construct the `DATABASE_URL` (e.g., `postgresql://user:password@localhost:5432/dbname`).

### 2. Virtual Environment Setup
It is highly recommended to use a virtual environment.
```bash
python -m venv venv
```
Activate the virtual environment:
- Windows: `venv\Scripts\activate`
- macOS/Linux: `source venv/bin/activate`

### 3. Dependency Installation
Install the project dependencies:
```bash
pip install -r requirements.txt
```

### 4. Environment Variables
Copy the example environment variables file and fill in your details:
```bash
cp .env.example .env
```

### 5. Running the Application
Start the FastAPI application using Uvicorn:
```bash
uvicorn app.main:app --reload
```

### 6. Access Documentation
FastAPI automatically generates interactive API documentation.
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
