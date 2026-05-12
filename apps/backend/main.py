from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "API is working"}

@app.get("/services")
async def get_services():
    return [
        {"id": 1, "name": "Test1", "price": 180},
        {"id": 2, "name": "Test2", "price": 45}
    ]