"""Test quiz API endpoints."""
import pytest
from unittest.mock import patch, AsyncMock

from app.schemas import QuizQuestion, QuizOption


# Mock quiz questions
MOCK_QUESTIONS = [
    QuizQuestion(
        id="q1",
        type="multiple_choice",
        question="What is 2+2?",
        options=[
            QuizOption(id="A", text="3"),
            QuizOption(id="B", text="4"),
            QuizOption(id="C", text="5"),
            QuizOption(id="D", text="6")
        ],
        correct_answer="B",
        explanation="2+2=4"
    ),
    QuizQuestion(
        id="q2",
        type="true_false",
        question="The sky is blue?",
        options=[
            QuizOption(id="A", text="True"),
            QuizOption(id="B", text="False")
        ],
        correct_answer="A",
        explanation="Yes, the sky appears blue due to Rayleigh scattering"
    )
]


class TestQuizGenerate:
    """Tests for quiz generation endpoint."""
    
    def test_generate_requires_device_id(self, client):
        """Test that device ID is required."""
        response = client.post(
            "/api/v1/quiz/generate",
            json={"topic": "Math", "num_questions": 5}
        )
        assert response.status_code == 400
        assert "X-Device-Id" in response.json()["detail"]
    
    @patch("app.api.quiz.generate_quiz", new_callable=AsyncMock)
    def test_generate_success_free_trial(self, mock_generate, client):
        """Test successful quiz generation with free trial."""
        mock_generate.return_value = MOCK_QUESTIONS
        
        response = client.post(
            "/api/v1/quiz/generate",
            json={"topic": "Math", "num_questions": 2},
            headers={"X-Device-Id": "test-device-1"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["topic"] == "Math"
        assert len(data["questions"]) == 2
        assert data["is_free_trial"] is True
    
    @patch("app.api.quiz.generate_quiz", new_callable=AsyncMock)
    def test_generate_second_attempt_fails(self, mock_generate, client):
        """Test that second attempt without tokens fails."""
        mock_generate.return_value = MOCK_QUESTIONS
        
        # First attempt (free trial)
        response1 = client.post(
            "/api/v1/quiz/generate",
            json={"topic": "Math", "num_questions": 2},
            headers={"X-Device-Id": "test-device-2"}
        )
        assert response1.status_code == 200
        
        # Second attempt (should fail)
        response2 = client.post(
            "/api/v1/quiz/generate",
            json={"topic": "Science", "num_questions": 2},
            headers={"X-Device-Id": "test-device-2"}
        )
        assert response2.status_code == 402
        data = response2.json()
        assert "detail" in data
        # Handle both string and object detail formats
        detail = data["detail"]
        if isinstance(detail, dict):
            assert detail.get("code") == "payment_required"
        else:
            assert "token" in detail.lower() or "payment" in detail.lower()
    
    def test_generate_invalid_difficulty(self, client):
        """Test invalid difficulty validation."""
        response = client.post(
            "/api/v1/quiz/generate",
            json={"topic": "Math", "difficulty": "invalid"},
            headers={"X-Device-Id": "test-device-3"}
        )
        assert response.status_code == 422
    
    def test_generate_invalid_language(self, client):
        """Test invalid language validation."""
        response = client.post(
            "/api/v1/quiz/generate",
            json={"topic": "Math", "language": "xx"},
            headers={"X-Device-Id": "test-device-4"}
        )
        assert response.status_code == 422


class TestQuizSubmit:
    """Tests for quiz submission endpoint."""
    
    def test_submit_requires_device_id(self, client):
        """Test that device ID is required for submit."""
        response = client.post(
            "/api/v1/quiz/submit",
            json={
                "topic": "Math",
                "answers": [],
                "questions": []
            }
        )
        assert response.status_code == 400
    
    def test_submit_updates_progress(self, client):
        """Test that submit updates user progress."""
        questions = [q.model_dump() for q in MOCK_QUESTIONS]
        
        response = client.post(
            "/api/v1/quiz/submit",
            json={
                "topic": "Math",
                "answers": [
                    {"question_id": "q1", "answer": "B"},
                    {"question_id": "q2", "answer": "A"}
                ],
                "questions": questions
            },
            headers={"X-Device-Id": "test-device-5"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["correct_count"] == 2
        assert data["total_count"] == 2
        assert data["xp_earned"] > 0
        assert "first_quiz" in data["new_achievements"]
        assert "perfect_score" in data["new_achievements"]
    
    def test_submit_partial_correct(self, client):
        """Test partial correct answers."""
        questions = [q.model_dump() for q in MOCK_QUESTIONS]
        
        response = client.post(
            "/api/v1/quiz/submit",
            json={
                "topic": "Math",
                "answers": [
                    {"question_id": "q1", "answer": "A"},  # Wrong
                    {"question_id": "q2", "answer": "A"}   # Correct
                ],
                "questions": questions
            },
            headers={"X-Device-Id": "test-device-6"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["correct_count"] == 1
        assert data["total_count"] == 2


class TestProgress:
    """Tests for progress endpoint."""
    
    def test_get_progress_new_user(self, client):
        """Test getting progress for new user."""
        response = client.get(
            "/api/v1/progress",
            headers={"X-Device-Id": "new-device"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["xp"] == 0
        assert data["level"] == 1
        assert data["total_questions"] == 0
    
    def test_get_progress_after_quiz(self, client):
        """Test progress after completing a quiz."""
        questions = [q.model_dump() for q in MOCK_QUESTIONS]
        
        # Submit a quiz first
        client.post(
            "/api/v1/quiz/submit",
            json={
                "topic": "Math",
                "answers": [
                    {"question_id": "q1", "answer": "B"},
                    {"question_id": "q2", "answer": "A"}
                ],
                "questions": questions
            },
            headers={"X-Device-Id": "progress-device"}
        )
        
        # Get progress
        response = client.get(
            "/api/v1/progress",
            headers={"X-Device-Id": "progress-device"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["xp"] > 0
        assert data["total_questions"] == 2
        assert data["correct_answers"] == 2


class TestTokens:
    """Tests for token endpoint."""
    
    def test_get_tokens_new_user(self, client):
        """Test getting tokens for new user."""
        response = client.get(
            "/api/v1/tokens",
            headers={"X-Device-Id": "token-device"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["tokens_remaining"] == 0
        assert data["has_free_trial"] is True
        assert data["free_trial_used"] is False
    
    @patch("app.api.quiz.generate_quiz", new_callable=AsyncMock)
    def test_get_tokens_after_free_trial(self, mock_generate, client):
        """Test tokens after using free trial."""
        mock_generate.return_value = MOCK_QUESTIONS
        
        # Use free trial
        client.post(
            "/api/v1/quiz/generate",
            json={"topic": "Math", "num_questions": 2},
            headers={"X-Device-Id": "token-device-2"}
        )
        
        # Check tokens
        response = client.get(
            "/api/v1/tokens",
            headers={"X-Device-Id": "token-device-2"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["has_free_trial"] is False
        assert data["free_trial_used"] is True
