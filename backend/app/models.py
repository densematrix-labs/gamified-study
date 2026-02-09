"""Database models."""
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Text, JSON
from sqlalchemy.sql import func
from app.database import Base


class UserProgress(Base):
    """User progress and XP tracking."""
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(255), unique=True, index=True)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    best_streak = Column(Integer, default=0)
    achievements = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class StudySession(Base):
    """Individual study session record."""
    __tablename__ = "study_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(255), index=True)
    topic = Column(String(500))
    questions_count = Column(Integer)
    correct_count = Column(Integer)
    xp_earned = Column(Integer)
    duration_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class GenerationToken(Base):
    """Token balance for paid users."""
    __tablename__ = "generation_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(255), unique=True, index=True)
    tokens_remaining = Column(Integer, default=0)
    tokens_total = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class PaymentTransaction(Base):
    """Payment transaction record."""
    __tablename__ = "payment_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    checkout_id = Column(String(255), unique=True, index=True)
    device_id = Column(String(255), index=True)
    product_id = Column(String(255))
    amount_cents = Column(Integer)
    currency = Column(String(10))
    status = Column(String(50))
    tokens_granted = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)


class FreeTrialUsage(Base):
    """Track free trial usage per device."""
    __tablename__ = "free_trial_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(255), unique=True, index=True)
    used_at = Column(DateTime(timezone=True), server_default=func.now())
