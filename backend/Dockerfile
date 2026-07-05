FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Tables are created automatically via SQLAlchemy lifespan event in main.py.
# Do NOT run alembic upgrade here — alembic is not fully configured for this project.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
