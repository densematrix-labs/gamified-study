"""Prometheus metrics."""
import os
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import APIRouter, Response

TOOL_NAME = os.getenv("TOOL_NAME", "gamified-study")

# HTTP metrics
http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["tool", "endpoint", "method", "status"]
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["tool", "endpoint", "method"]
)

# Business metrics
quiz_generations_total = Counter(
    "quiz_generations_total",
    "Total quiz generations",
    ["tool", "topic_category", "difficulty"]
)

quiz_submissions_total = Counter(
    "quiz_submissions_total",
    "Total quiz submissions",
    ["tool"]
)

correct_answers_total = Counter(
    "correct_answers_total",
    "Total correct answers",
    ["tool"]
)

xp_earned_total = Counter(
    "xp_earned_total",
    "Total XP earned",
    ["tool"]
)

# Payment metrics
payment_success_total = Counter(
    "payment_success_total",
    "Successful payments",
    ["tool", "product_sku"]
)

payment_revenue_cents_total = Counter(
    "payment_revenue_cents_total",
    "Total revenue in cents",
    ["tool"]
)

tokens_consumed_total = Counter(
    "tokens_consumed_total",
    "Tokens consumed",
    ["tool"]
)

free_trial_used_total = Counter(
    "free_trial_used_total",
    "Free trial uses",
    ["tool"]
)

# SEO metrics
page_views_total = Counter(
    "page_views_total",
    "Page views",
    ["tool", "page_type"]
)

crawler_visits_total = Counter(
    "crawler_visits_total",
    "Crawler visits",
    ["tool", "bot"]
)

programmatic_pages_count = Gauge(
    "programmatic_pages_count",
    "Number of programmatic SEO pages",
    ["tool"]
)

# Router
metrics_router = APIRouter()


@metrics_router.get("/metrics")
async def metrics():
    """Expose Prometheus metrics."""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


def record_quiz_generation(topic: str, difficulty: str):
    """Record a quiz generation."""
    # Categorize topic for metrics (simplified)
    category = "general"
    topic_lower = topic.lower()
    if any(kw in topic_lower for kw in ["python", "javascript", "code", "programming"]):
        category = "programming"
    elif any(kw in topic_lower for kw in ["math", "algebra", "calculus"]):
        category = "math"
    elif any(kw in topic_lower for kw in ["history", "geography", "science"]):
        category = "academic"
    elif any(kw in topic_lower for kw in ["french", "spanish", "japanese", "language"]):
        category = "language"
    
    quiz_generations_total.labels(tool=TOOL_NAME, topic_category=category, difficulty=difficulty).inc()


def record_quiz_submission(correct: int, total: int, xp: int):
    """Record quiz submission metrics."""
    quiz_submissions_total.labels(tool=TOOL_NAME).inc()
    correct_answers_total.labels(tool=TOOL_NAME).inc(correct)
    xp_earned_total.labels(tool=TOOL_NAME).inc(xp)


def record_payment(product_sku: str, amount_cents: int):
    """Record successful payment."""
    payment_success_total.labels(tool=TOOL_NAME, product_sku=product_sku).inc()
    payment_revenue_cents_total.labels(tool=TOOL_NAME).inc(amount_cents)


def record_token_consumption():
    """Record token consumption."""
    tokens_consumed_total.labels(tool=TOOL_NAME).inc()


def record_free_trial():
    """Record free trial usage."""
    free_trial_used_total.labels(tool=TOOL_NAME).inc()
