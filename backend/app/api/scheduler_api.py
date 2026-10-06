from fastapi import APIRouter
from app.scheduler import get_scheduler_info, pause_scheduler, resume_scheduler
from app.schemas import SchedulerStatusResponse

router = APIRouter(prefix="/scheduler", tags=["Scheduler"])

@router.get("/status", response_model=SchedulerStatusResponse)
def get_status():
    info = get_scheduler_info()
    return SchedulerStatusResponse(**info)

@router.post("/pause", response_model=dict)
def pause():
    success = pause_scheduler()
    return {"message": "Scheduler paused." if success else "Scheduler was not active.", "status": get_scheduler_info()}

@router.post("/resume", response_model=dict)
def resume():
    success = resume_scheduler()
    return {"message": "Scheduler resumed." if success else "Scheduler was not active.", "status": get_scheduler_info()}
