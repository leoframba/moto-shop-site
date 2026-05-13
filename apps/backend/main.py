import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from supabase import Client, create_client

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


# Patch Request for editing services
class ServiceUpdate(BaseModel):
    name: str
    description: str
    estimated_hours: float


@app.patch("/api/admin/services/{service_id}")
async def update_service(service_id: str, service: ServiceUpdate):
    response = (
        supabase.table("services")
        .update(service.model_dump())
        .eq("id", service_id)
        .execute()
    )

    if len(response.data) == 0:
        raise HTTPException(status_code=400, detail="Failed to update service")

    return response.data[0]


# Editable service page
@app.get("/api/services")
async def get_services():
    try:
        # 1. Fetch the global hourly rate
        settings_response = (
            supabase.table("shop_settings").select("hourly_rate").eq("id", 1).execute()
        )
        if not settings_response.data:
            raise HTTPException(status_code=500, detail="Shop settings not found")

        hourly_rate = float(settings_response.data[0]["hourly_rate"])

        # 2. Fetch all services
        services_response = supabase.table("services").select("*").execute()
        services = services_response.data

        # 3. Calc final prices
        calculated_services = []
        for service in services:
            estimated_hours = float(service["estimated_hours"])
            final_price = round(estimated_hours * hourly_rate, 2)

            calculated_services.append(
                {
                    "id": service["id"],
                    "name": service["name"],
                    "description": service["description"],
                    "estimated_hours": estimated_hours,
                    "calculated_price": final_price,
                }
            )
        print(hourly_rate)

        return {"hourly_rate": hourly_rate, "services": calculated_services}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class RateUpdate(BaseModel):
    hourly_rate: float


@app.patch("/api/admin/shop-rate")
async def update_hourly_rate(update: RateUpdate):
    response = (
        supabase.table("shop_settings")
        .update({"hourly_rate": update.hourly_rate})
        .eq("id", 1)
        .execute()
    )
    print(response)
    if len(response.data) == 0:
        raise HTTPException(status_code=400, detail="Failed to update rate")
    return response.data[0]


class ServiceCreate(BaseModel):
    name: str = Field(..., min_length=2)
    description: str | None = None

    # Ensure value is at least 0.1
    estimated_hours: float = Field(..., gt=0)

    @field_validator("name")
    @classmethod
    def capitalize_name(cls, v: str) -> str:
        if not v:
            return v
        return v.strip().title()

    @field_validator("estimated_hours")
    @classmethod
    def check_positive_hours(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Estimated hours must be greater than zero")
        return v


# Adding a new service
@app.post("/api/admin/services")
async def create_service(service: ServiceCreate):
    try:
        response = supabase.table("services").insert(service.model_dump()).execute()

        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create service")

        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Deleting a service
@app.delete("/api/admin/services/{service_id}")
async def delete_service(service_id: str):
    response = supabase.table("services").delete().eq("id", service_id).execute()

    if not response.data:
        raise HTTPException(
            status_code=404, detail="Service not found or already deleted"
        )

    return {"message": "Service deleted successfully"}
