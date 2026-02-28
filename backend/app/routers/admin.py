from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_db
from ..scanner import scan_videos_async
from ..schemas import AdminStatus, ScanResult

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/rescan", response_model=ScanResult)
async def rescan():
    result = await scan_videos_async()
    return ScanResult(**result)


@router.get("/status", response_model=AdminStatus)
def status(db: Session = Depends(get_db)):
    return AdminStatus(**crud.get_status(db))
