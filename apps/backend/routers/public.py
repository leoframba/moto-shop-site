# routers/public.py
from dependencies import supabase
from fastapi import APIRouter, HTTPException
from service_pricing import (
    coerce_hourly_rate,
    is_public_service,
    serialize_public_service,
)

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

        hourly_rate = coerce_hourly_rate(settings_response.data[0].get("hourly_rate"))

        # Fetch Services joined with Categories
        services_response = (
            supabase.table("services").select("*, categories(id, name)").execute()
        )
        services = services_response.data or []

        public_services = [
            serialize_public_service(service, hourly_rate)
            for service in services
            if is_public_service(service)
        ]

        visible_category_ids = {
            service.get("category_id")
            for service in public_services
            if service.get("category_id")
        }

        categories_response = supabase.table("categories").select("*").execute()
        public_categories = [
            category
            for category in (categories_response.data or [])
            if category.get("id") in visible_category_ids
        ]

        return {
            "hourly_rate": hourly_rate,
            "categories": public_categories,
            "services": public_services,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
