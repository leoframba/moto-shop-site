# main.py
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import admin, public

load_dotenv()

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://moto-shop-site-frontend.vercel.app"
        "https://moto-shop-site-frontend-leoframbas-projects.vercel.app",
    ],
    allow_origin_regex=r"https://moto-shop-site-frontend-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(public.router)
app.include_router(admin.router)
