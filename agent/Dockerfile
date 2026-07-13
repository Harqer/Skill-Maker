FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# We would normally generate gRPC code here, but for this scaffolding we will just copy
COPY . .

CMD ["python", "server.py"]
