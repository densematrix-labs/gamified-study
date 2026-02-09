"""Test error response formats."""
import pytest
from unittest.mock import patch, AsyncMock

from app.schemas import QuizQuestion, QuizOption


class TestErrorResponseFormats:
    """Test that error responses are properly formatted."""
    
    def test_402_error_detail_is_serializable(self, client):
        """Verify 402 error detail can be serialized by frontend."""
        # First, use up free trial
        with patch("app.api.quiz.generate_quiz", new_callable=AsyncMock) as mock:
            mock.return_value = [
                QuizQuestion(
                    id="q1",
                    type="multiple_choice",
                    question="Test?",
                    options=[QuizOption(id="A", text="Yes")],
                    correct_answer="A",
                    explanation="Test"
                )
            ]
            
            # Use free trial
            client.post(
                "/api/v1/quiz/generate",
                json={"topic": "Test", "num_questions": 1},
                headers={"X-Device-Id": "error-test-device"}
            )
        
        # Now try again - should get 402
        response = client.post(
            "/api/v1/quiz/generate",
            json={"topic": "Test", "num_questions": 1},
            headers={"X-Device-Id": "error-test-device"}
        )
        
        assert response.status_code == 402
        data = response.json()
        detail = data.get("detail")
        
        # Detail should be either string or object with error/message field
        if isinstance(detail, dict):
            assert "error" in detail or "message" in detail, \
                f"Object detail must have 'error' or 'message' field: {detail}"
        else:
            assert isinstance(detail, str), \
                f"detail must be string or object with error field: {detail}"
    
    def test_400_missing_device_id_format(self, client):
        """Test 400 error format for missing device ID."""
        response = client.post(
            "/api/v1/quiz/generate",
            json={"topic": "Test", "num_questions": 1}
        )
        
        assert response.status_code == 400
        data = response.json()
        detail = data.get("detail")
        
        # Should be a string
        assert isinstance(detail, str), f"400 error detail should be string: {detail}"
        assert "Device-Id" in detail
    
    def test_422_validation_error_format(self, client):
        """Test 422 validation error format."""
        response = client.post(
            "/api/v1/quiz/generate",
            json={"topic": "", "num_questions": 1},  # Empty topic
            headers={"X-Device-Id": "validation-test"}
        )
        
        assert response.status_code == 422
        data = response.json()
        
        # FastAPI validation errors have a specific format
        assert "detail" in data
        # detail is a list of validation errors
        assert isinstance(data["detail"], list)
    
    def test_500_error_format(self, client):
        """Test 500 error format when LLM fails."""
        with patch("app.api.quiz.generate_quiz", new_callable=AsyncMock) as mock:
            mock.side_effect = Exception("LLM service unavailable")
            
            response = client.post(
                "/api/v1/quiz/generate",
                json={"topic": "Test", "num_questions": 1},
                headers={"X-Device-Id": "error-500-device"}
            )
            
            assert response.status_code == 500
            data = response.json()
            detail = data.get("detail")
            
            # 500 errors should be strings
            assert isinstance(detail, str), f"500 error detail should be string: {detail}"
    
    def test_error_never_contains_object_object(self, client):
        """Ensure no error ever displays as [object Object]."""
        # Use up free trial first
        with patch("app.api.quiz.generate_quiz", new_callable=AsyncMock) as mock:
            mock.return_value = [
                QuizQuestion(
                    id="q1",
                    type="multiple_choice",
                    question="Test?",
                    options=[QuizOption(id="A", text="Yes")],
                    correct_answer="A",
                    explanation="Test"
                )
            ]
            client.post(
                "/api/v1/quiz/generate",
                json={"topic": "Test", "num_questions": 1},
                headers={"X-Device-Id": "object-object-test"}
            )
        
        # Get 402 error
        response = client.post(
            "/api/v1/quiz/generate",
            json={"topic": "Test", "num_questions": 1},
            headers={"X-Device-Id": "object-object-test"}
        )
        
        assert response.status_code == 402
        
        # Convert to string and check for [object Object]
        response_text = response.text
        assert "[object Object]" not in response_text
        assert "object Object" not in response_text
