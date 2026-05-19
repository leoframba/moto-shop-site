# routers/public.py
from dependencies import supabase
from fastapi import APIRouter, HTTPException

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

        # Calculate Prices
        calculated_services = []
        for service in services:
            final_price = None
            pricing_type = service.get("pricing_type", "hourly")

            # Added `is not None` checks to prevent TypeError if these columns are null
            if pricing_type == "hourly" and service.get("estimated_hours") is not None:
                final_price = round(float(service["estimated_hours"]) * hourly_rate, 2)
            elif pricing_type == "fixed" and service.get("fixed_price") is not None:
                final_price = round(float(service["fixed_price"]), 2)

            calculated_services.append(
                {
                    "id": service["id"],
                    "name": service["name"],
                    "description": service["description"],
                    "category_id": service.get("category_id"),  # NEW: Pass the ID
                    "categories": service.get(
                        "categories"
                    ),  # NEW: Pass the joined object
                    "pricing_type": pricing_type,
                    "estimated_hours": service.get("estimated_hours"),
                    "fixed_price": service.get("fixed_price"),
                    "calculated_price": final_price,
                }
            )

        return {
            "hourly_rate": hourly_rate,
            "categories": categories_response.data,  # NEW: Include global categories list
            "services": calculated_services,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
