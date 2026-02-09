# Gamified AI Study Platform

🎮 AI-powered gamified learning platform with quizzes, XP, achievements, and progress tracking.

## Features

- **AI Quiz Generation**: Generate quizzes on any topic using AI
- **Gamification**: Earn XP, level up, unlock achievements
- **Progress Tracking**: Track your learning journey
- **7 Languages**: English, 中文, 日本語, Deutsch, Français, 한국어, Español
- **Payment Integration**: Powered by Creem

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Python FastAPI
- **AI**: Claude via LLM Proxy
- **Database**: SQLite
- **Deployment**: Docker

## Development

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker & Docker Compose

### Setup

```bash
# Clone
git clone https://github.com/densematrix-labs/gamified-study.git
cd gamified-study

# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Testing

```bash
# Backend
cd backend
pytest --cov=app --cov-fail-under=95

# Frontend
cd frontend
npm run test:coverage
```

## Deployment

```bash
docker compose up -d --build
```

## Environment Variables

See `.env.example` for required environment variables.

## License

Proprietary - DenseMatrix Labs
