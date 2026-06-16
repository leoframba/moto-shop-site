# routers/public.py
from dependencies import supabase
from fastapi import APIRouter, HTTPException
from service_pricing import serialize_service

# Router
router = APIRouter(
    prefix="/api",
    tags=["Public"],
)


# Gets a list of services, categories, and the shop hourly rate
@router.get("/services")
async def get_services():
    try:
        # Fetch Hourly Rate
        settings_response = (
            supabase.table("shop_settings").select("hourly_rate").eq("id", 1).execute()
        )
        if not settings_response.data:
            raise HTTPException(status_code=500, detail="Shop settings not found")

        hourly_rate = float(settings_response.data[0]["hourly_rate"])

        # Fetch Categories
        categories_response = supabase.table("categories").select("*").execute()

        # Fetch Services joined with Categories
        services_response = (
            supabase.table("services").select("*, categories(id, name)").execute()
        )
        services = services_response.data

        # Calculate prices and drop services flagged as hidden so they never
        # appear on the public menu. Categories with no visible services simply
        # won't render, since the menu groups by the services present.
        calculated_services = [
            serialize_service(service, hourly_rate)
            for service in services
            if not service.get("is_hidden")
        ]

        return {
            "hourly_rate": hourly_rate,
            "categories": categories_response.data,  # NEW: Include global categories list
            "services": calculated_services,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
