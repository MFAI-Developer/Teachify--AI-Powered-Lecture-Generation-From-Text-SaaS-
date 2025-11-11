from fastapi import APIRouter, Depends
from app.database.connection import get_database

router = APIRouter()

@router.get("/test-db")
async def test_db(db=Depends(get_database)):
    collections = await db.list_collection_names()
    return {"collections": collections}
