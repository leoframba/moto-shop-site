# routers/admin.py
from dependencies import supabase, verify_admin
from fastapi import APIRouter, Depends, HTTPException
from schemas import RateUpdate, ServiceCreate, ServiceUpdate

# Router
router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
    dependencies=[Depends(verify_admin)],
)


# Creates a Service
@router.post("/services")
async def create_service(service: ServiceCreate):
    try:
        response = supabase.table("services").insert(service.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create service")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Deletes a Service
@router.delete("/services/{service_id}")
async def delete_service(service_id: str):
    response = supabase.table("services").delete().eq("id", service_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted successfully"}


# Updates a Service
@router.patch("/services/{service_id}")
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


# Updates the Shop Rate
@router.patch("/shop-rate")
async def update_hourly_rate(update: RateUpdate):
    response = (
        supabase.table("shop_settings")
        .update({"hourly_rate": update.hourly_rate})
        .eq("id", 1)
        .execute()
    )
    if len(response.data) == 0:
        raise HTTPException(status_code=400, detail="Failed to update rate")
    return response.data[0]
