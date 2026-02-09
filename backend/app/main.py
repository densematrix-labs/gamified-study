"""Main FastAPI application."""
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.api import quiz, payment
from app.metrics import metrics_router, http_requests_total, http_request_duration_seconds
from app.config import get_settings

settings = get_settings()

# Bot patterns for crawler detection
BOT_PATTERNS = ["Googlebot", "bingbot", "Baiduspider", "YandexBot", "DuckDuckBot", "Slurp", "facebookexternalhit"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Create database tables
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Gamified AI Study Platform",
    description="Learn with AI-powered quizzes, achievements, and progress tracking",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """Track request metrics and crawler visits."""
    start_time = time.time()
    
    # Check for crawlers
    ua = request.headers.get("user-agent", "")
    for bot in BOT_PATTERNS:
        if bot.lower() in ua.lower():
            from app.metrics import crawler_visits_total
            crawler_visits_total.labels(tool=settings.tool_name, bot=bot).inc()
            break
    
    response = await call_next(request)
    
    # Record metrics
    duration = time.time() - start_time
    endpoint = request.url.path
    method = request.method
    status = str(response.status_code)
    
    http_requests_total.labels(
        tool=settings.tool_name,
        endpoint=endpoint,
        method=method,
        status=status
    ).inc()
    
    http_request_duration_seconds.labels(
        tool=settings.tool_name,
        endpoint=endpoint,
        method=method
    ).observe(duration)
    
    return response


# Include routers
app.include_router(quiz.router)
app.include_router(payment.router)
app.include_router(metrics_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Gamified AI Study Platform",
        "version": "1.0.0",
        "docs": "/docs"
    }
