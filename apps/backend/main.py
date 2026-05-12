import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Init Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

@app.get("/api/services")
async def get_services():
    try:
        # 1. Fetch the global hourly rate
        settings_response = supabase.table("shop_settings").select("hourly_rate").eq("id", 1).execute()
        if not settings_response.data:
            raise HTTPException(status_code=500, detail="Shop settings not found")
        
        hourly_rate = float(settings_response.data[0]['hourly_rate'])

        # 2. Fetch all services
        services_response = supabase.table("services").select("*").execute()
        services = services_response.data

        # 3. Calc final prices
        calculated_services = []
        for service in services:
            estimated_hours = float(service['estimated_hours'])
            final_price = round(estimated_hours * hourly_rate, 2)
            
            calculated_services.append({
                "id": service['id'],
                "name": service['name'],
                "description": service['description'],
                "estimated_hours": estimated_hours,
                "calculated_price": final_price
            })

        return {
            "hourly_rate": hourly_rate,
            "services": calculated_services
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))