"""Pydantic schemas."""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# Quiz schemas
class QuizRequest(BaseModel):
    """Request to generate quiz questions."""
    topic: str = Field(..., min_length=1, max_length=500, description="Topic to study")
    num_questions: int = Field(default=5, ge=1, le=10, description="Number of questions")
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")
    language: str = Field(default="en", pattern="^(en|zh|ja|de|fr|ko|es)$")


class QuizOption(BaseModel):
    """Single answer option."""
    id: str
    text: str


class QuizQuestion(BaseModel):
    """Single quiz question."""
    id: str
    type: str  # multiple_choice, true_false, fill_blank
    question: str
    options: Optional[List[QuizOption]] = None
    correct_answer: str
    explanation: str


class QuizResponse(BaseModel):
    """Generated quiz response."""
    topic: str
    questions: List[QuizQuestion]
    is_free_trial: bool
    tokens_remaining: Optional[int] = None


class AnswerSubmission(BaseModel):
    """User's answer submission."""
    question_id: str
    answer: str


class QuizSubmitRequest(BaseModel):
    """Submit quiz answers."""
    topic: str
    answers: List[AnswerSubmission]
    questions: List[QuizQuestion]
    duration_seconds: Optional[int] = None


class QuizResult(BaseModel):
    """Result of a single question."""
    question_id: str
    correct: bool
    correct_answer: str
    explanation: str


class QuizSubmitResponse(BaseModel):
    """Quiz submission response."""
    correct_count: int
    total_count: int
    xp_earned: int
    new_total_xp: int
    new_level: int
    streak: int
    new_achievements: List[str]
    results: List[QuizResult]


# Progress schemas
class UserProgressResponse(BaseModel):
    """User progress data."""
    xp: int
    level: int
    xp_to_next_level: int
    total_questions: int
    correct_answers: int
    accuracy_percent: float
    current_streak: int
    best_streak: int
    achievements: List[str]


# Token schemas
class TokenStatusResponse(BaseModel):
    """Token balance status."""
    tokens_remaining: int
    has_free_trial: bool
    free_trial_used: bool


# Payment schemas
class CreateCheckoutRequest(BaseModel):
    """Create checkout request."""
    product_sku: str
    device_id: str
    success_url: str
    cancel_url: Optional[str] = None


class CheckoutResponse(BaseModel):
    """Checkout creation response."""
    checkout_url: str
    checkout_id: str


class WebhookPayload(BaseModel):
    """Creem webhook payload."""
    event_type: str
    checkout_id: str
    product_id: str
    customer_id: Optional[str] = None
    amount: int
    currency: str
    metadata: Optional[dict] = None


# Health
class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
