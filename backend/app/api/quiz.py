"""Quiz API routes."""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models import UserProgress, StudySession, GenerationToken, FreeTrialUsage
from app.schemas import (
    QuizRequest, QuizResponse, QuizSubmitRequest, QuizSubmitResponse,
    UserProgressResponse, TokenStatusResponse, QuizResult
)
from app.services.quiz_service import (
    generate_quiz, calculate_xp, calculate_level, xp_to_next_level,
    check_achievements
)
from app.metrics import (
    record_quiz_generation, record_quiz_submission,
    record_token_consumption, record_free_trial
)

router = APIRouter(prefix="/api/v1", tags=["quiz"])


def get_device_id(x_device_id: Optional[str] = Header(None)) -> str:
    """Extract device ID from header."""
    if not x_device_id:
        raise HTTPException(status_code=400, detail="X-Device-Id header required")
    return x_device_id


def check_token_or_free_trial(device_id: str, db: Session) -> tuple[bool, int]:
    """Check if user has tokens or free trial available.
    
    Returns: (is_free_trial, tokens_remaining)
    """
    # Check for paid tokens first
    token_record = db.query(GenerationToken).filter(
        GenerationToken.device_id == device_id
    ).first()
    
    if token_record and token_record.tokens_remaining > 0:
        return False, token_record.tokens_remaining
    
    # Check free trial
    free_trial = db.query(FreeTrialUsage).filter(
        FreeTrialUsage.device_id == device_id
    ).first()
    
    if not free_trial:
        return True, 0  # Free trial available
    
    # No tokens and free trial used
    raise HTTPException(
        status_code=402,
        detail={
            "error": "No tokens remaining. Please purchase more quiz generations.",
            "code": "payment_required"
        }
    )


def consume_token_or_free_trial(device_id: str, db: Session) -> bool:
    """Consume a token or mark free trial as used.
    
    Returns: True if this was a free trial
    """
    # Check for paid tokens first
    token_record = db.query(GenerationToken).filter(
        GenerationToken.device_id == device_id
    ).first()
    
    if token_record and token_record.tokens_remaining > 0:
        token_record.tokens_remaining -= 1
        token_record.updated_at = datetime.utcnow()
        db.commit()
        record_token_consumption()
        return False
    
    # Use free trial
    free_trial = db.query(FreeTrialUsage).filter(
        FreeTrialUsage.device_id == device_id
    ).first()
    
    if not free_trial:
        free_trial = FreeTrialUsage(device_id=device_id)
        db.add(free_trial)
        db.commit()
        record_free_trial()
        return True
    
    # Should not reach here - check_token_or_free_trial should have raised
    raise HTTPException(
        status_code=402,
        detail={
            "error": "No tokens remaining. Please purchase more quiz generations.",
            "code": "payment_required"
        }
    )


@router.post("/quiz/generate", response_model=QuizResponse)
async def generate_quiz_endpoint(
    request: QuizRequest,
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db)
):
    """Generate quiz questions on a topic."""
    # Check tokens/free trial
    is_free_trial, tokens_remaining = check_token_or_free_trial(device_id, db)
    
    try:
        # Generate quiz
        questions = await generate_quiz(
            topic=request.topic,
            num_questions=request.num_questions,
            difficulty=request.difficulty,
            language=request.language
        )
        
        # Consume token after successful generation
        is_free_trial = consume_token_or_free_trial(device_id, db)
        
        # Get updated token count
        token_record = db.query(GenerationToken).filter(
            GenerationToken.device_id == device_id
        ).first()
        tokens_remaining = token_record.tokens_remaining if token_record else 0
        
        # Record metrics
        record_quiz_generation(request.topic, request.difficulty)
        
        return QuizResponse(
            topic=request.topic,
            questions=questions,
            is_free_trial=is_free_trial,
            tokens_remaining=tokens_remaining if not is_free_trial else None
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quiz/submit", response_model=QuizSubmitResponse)
async def submit_quiz(
    request: QuizSubmitRequest,
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db)
):
    """Submit quiz answers and get results."""
    # Calculate results
    results = []
    correct_count = 0
    
    # Create answer lookup
    answer_map = {a.question_id: a.answer for a in request.answers}
    
    for question in request.questions:
        user_answer = answer_map.get(question.id, "")
        is_correct = user_answer.upper() == question.correct_answer.upper()
        
        if is_correct:
            correct_count += 1
        
        results.append(QuizResult(
            question_id=question.id,
            correct=is_correct,
            correct_answer=question.correct_answer,
            explanation=question.explanation
        ))
    
    # Get or create user progress
    progress = db.query(UserProgress).filter(
        UserProgress.device_id == device_id
    ).first()
    
    if not progress:
        progress = UserProgress(
            device_id=device_id,
            xp=0,
            level=1,
            total_questions=0,
            correct_answers=0,
            current_streak=0,
            best_streak=0,
            achievements=[]
        )
        db.add(progress)
    
    # Update streak
    if correct_count == len(request.questions):
        progress.current_streak += correct_count
    else:
        progress.current_streak = correct_count
    
    if progress.current_streak > progress.best_streak:
        progress.best_streak = progress.current_streak
    
    # Calculate XP (assuming medium difficulty)
    xp_earned = calculate_xp(
        correct=correct_count,
        total=len(request.questions),
        streak=progress.current_streak,
        difficulty="medium"
    )
    
    # Update progress
    progress.xp += xp_earned
    progress.total_questions += len(request.questions)
    progress.correct_answers += correct_count
    progress.level = calculate_level(progress.xp)
    
    # Check achievements
    existing_achievements = progress.achievements or []
    new_achievements = check_achievements(
        total_questions=progress.total_questions,
        total_xp=progress.xp,
        level=progress.level,
        best_streak=progress.best_streak,
        perfect_this_quiz=(correct_count == len(request.questions)),
        existing_achievements=existing_achievements
    )
    
    if new_achievements:
        progress.achievements = existing_achievements + new_achievements
    
    progress.updated_at = datetime.utcnow()
    
    # Save study session
    session = StudySession(
        device_id=device_id,
        topic=request.topic,
        questions_count=len(request.questions),
        correct_count=correct_count,
        xp_earned=xp_earned,
        duration_seconds=request.duration_seconds
    )
    db.add(session)
    
    db.commit()
    
    # Record metrics
    record_quiz_submission(correct_count, len(request.questions), xp_earned)
    
    return QuizSubmitResponse(
        correct_count=correct_count,
        total_count=len(request.questions),
        xp_earned=xp_earned,
        new_total_xp=progress.xp,
        new_level=progress.level,
        streak=progress.current_streak,
        new_achievements=new_achievements,
        results=results
    )


@router.get("/progress", response_model=UserProgressResponse)
async def get_progress(
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db)
):
    """Get user's learning progress."""
    progress = db.query(UserProgress).filter(
        UserProgress.device_id == device_id
    ).first()
    
    if not progress:
        return UserProgressResponse(
            xp=0,
            level=1,
            xp_to_next_level=100,
            total_questions=0,
            correct_answers=0,
            accuracy_percent=0.0,
            current_streak=0,
            best_streak=0,
            achievements=[]
        )
    
    accuracy = (
        (progress.correct_answers / progress.total_questions * 100)
        if progress.total_questions > 0 else 0.0
    )
    
    return UserProgressResponse(
        xp=progress.xp,
        level=progress.level,
        xp_to_next_level=xp_to_next_level(progress.xp),
        total_questions=progress.total_questions,
        correct_answers=progress.correct_answers,
        accuracy_percent=round(accuracy, 1),
        current_streak=progress.current_streak,
        best_streak=progress.best_streak,
        achievements=progress.achievements or []
    )


@router.get("/tokens", response_model=TokenStatusResponse)
async def get_token_status(
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db)
):
    """Get token balance and free trial status."""
    # Check tokens
    token_record = db.query(GenerationToken).filter(
        GenerationToken.device_id == device_id
    ).first()
    
    tokens_remaining = token_record.tokens_remaining if token_record else 0
    
    # Check free trial
    free_trial = db.query(FreeTrialUsage).filter(
        FreeTrialUsage.device_id == device_id
    ).first()
    
    return TokenStatusResponse(
        tokens_remaining=tokens_remaining,
        has_free_trial=not bool(free_trial),
        free_trial_used=bool(free_trial)
    )
