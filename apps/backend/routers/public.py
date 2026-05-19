# routers/public.py
from dependencies import supabase
from fastapi import APIRouter, HTTPException

# Router
router = APIRouter(
    prefix="/api",
    tags=["Public"],
)


# Gets a list of services and the shop hourly rate
@router.get("/services")
async def get_services():
    try:
        settings_response = (
            supabase.table("shop_settings").select("hourly_rate").eq("id", 1).execute()
        )
        if not settings_response.data:
            raise HTTPException(status_code=500, detail="Shop settings not found")

        hourly_rate = float(settings_response.data[0]["hourly_rate"])

        services_response = supabase.table("services").select("*").execute()
        services = services_response.data

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
