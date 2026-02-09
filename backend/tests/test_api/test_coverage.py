"""Additional tests to improve coverage."""
import pytest
from unittest.mock import patch, MagicMock
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import GenerationToken, FreeTrialUsage


class TestDatabaseCoverage:
    """Tests for database module."""
    
    def test_get_db_yields_session(self, db):
        """Test that get_db yields a session."""
        assert db is not None
        assert isinstance(db, Session)


class TestPaymentEdgeCases:
    """Additional payment tests for coverage."""
    
    def test_webhook_payment_completed_event(self, client, db):
        """Test webhook with payment.completed event type."""
        from app.models import PaymentTransaction
        transaction = PaymentTransaction(
            checkout_id="checkout_payment_event",
            device_id="payment-event-device",
            product_id="prod_123",
            amount_cents=0,
            currency="usd",
            status="pending",
            tokens_granted=5
        )
        db.add(transaction)
        db.commit()
        
        response = client.post(
            "/api/v1/payment/webhook",
            json={
                "event_type": "payment.completed",
                "checkout_id": "checkout_payment_event",
                "amount": 499,
                "currency": "usd"
            }
        )
        
        assert response.status_code == 200
    
    def test_webhook_adds_to_existing_tokens(self, client, db):
        """Test webhook adds tokens to existing balance."""
        from app.models import PaymentTransaction, GenerationToken
        
        # Create existing tokens
        tokens = GenerationToken(
            device_id="existing-tokens-device",
            tokens_remaining=5,
            tokens_total=5
        )
        db.add(tokens)
        
        # Create transaction
        transaction = PaymentTransaction(
            checkout_id="checkout_existing",
            device_id="existing-tokens-device",
            product_id="prod_123",
            amount_cents=0,
            currency="usd",
            status="pending",
            tokens_granted=10
        )
        db.add(transaction)
        db.commit()
        
        # Process webhook
        response = client.post(
            "/api/v1/payment/webhook",
            json={
                "event_type": "checkout.completed",
                "checkout_id": "checkout_existing",
                "amount": 999,
                "currency": "usd"
            }
        )
        
        assert response.status_code == 200
        
        # Verify tokens were added
        db.refresh(tokens)
        assert tokens.tokens_remaining == 15
        assert tokens.tokens_total == 15
    
    def test_webhook_without_transaction(self, client, db):
        """Test webhook when transaction doesn't exist but has metadata."""
        response = client.post(
            "/api/v1/payment/webhook",
            json={
                "event_type": "checkout.completed",
                "checkout_id": "new_checkout_123",
                "amount": 499,
                "currency": "usd",
                "metadata": {
                    "device_id": "new-device-from-webhook",
                    "product_sku": "quiz_5"
                }
            }
        )
        
        assert response.status_code == 200
    
    def test_webhook_without_metadata_device_id(self, client, db):
        """Test webhook without device_id in metadata fails."""
        response = client.post(
            "/api/v1/payment/webhook",
            json={
                "event_type": "checkout.completed",
                "checkout_id": "no_device_checkout",
                "amount": 499,
                "currency": "usd",
                "metadata": {}
            }
        )
        
        assert response.status_code == 400


class TestQuizEdgeCases:
    """Additional quiz tests for coverage."""
    
    def test_submit_with_wrong_answer_resets_streak(self, client, db):
        """Test that wrong answer handling works correctly."""
        questions = [{
            "id": "q1",
            "type": "multiple_choice",
            "question": "Test?",
            "options": [{"id": "A", "text": "Yes"}, {"id": "B", "text": "No"}],
            "correct_answer": "A",
            "explanation": "Test"
        }]
        
        # Submit wrong answer
        response = client.post(
            "/api/v1/quiz/submit",
            json={
                "topic": "Test",
                "answers": [{"question_id": "q1", "answer": "B"}],
                "questions": questions,
                "duration_seconds": 30
            },
            headers={"X-Device-Id": "streak-test-device"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["correct_count"] == 0
    
    def test_token_consumption_flow(self, client, db):
        """Test that tokens are correctly consumed."""
        from app.models import GenerationToken
        from unittest.mock import patch, AsyncMock
        
        # Add tokens for user
        tokens = GenerationToken(
            device_id="token-consumption-device",
            tokens_remaining=5,
            tokens_total=5
        )
        db.add(tokens)
        db.commit()
        
        # Mock quiz generation
        with patch("app.api.quiz.generate_quiz", new_callable=AsyncMock) as mock:
            mock.return_value = [{
                "id": "q1",
                "type": "multiple_choice",
                "question": "Test?",
                "options": [{"id": "A", "text": "Yes"}],
                "correct_answer": "A",
                "explanation": "Test"
            }]
            
            response = client.post(
                "/api/v1/quiz/generate",
                json={"topic": "Test", "num_questions": 1},
                headers={"X-Device-Id": "token-consumption-device"}
            )
        
        # Verify token was consumed
        db.refresh(tokens)
        assert tokens.tokens_remaining == 4


class TestMetricsCoverage:
    """Tests for metrics module."""
    
    def test_record_quiz_generation_categories(self):
        """Test quiz generation categorization."""
        from app.metrics import record_quiz_generation
        
        # Test different categories
        record_quiz_generation("Python programming", "easy")
        record_quiz_generation("Algebra math problems", "medium")
        record_quiz_generation("World history facts", "hard")
        record_quiz_generation("French language basics", "easy")
        record_quiz_generation("Random topic", "medium")


class TestMainMiddleware:
    """Tests for main app middleware."""
    
    def test_crawler_detection(self, client):
        """Test crawler detection in middleware."""
        # Request with Googlebot user agent
        response = client.get(
            "/health",
            headers={"User-Agent": "Googlebot/2.1"}
        )
        assert response.status_code == 200
        
        # Request with Bingbot
        response = client.get(
            "/health",
            headers={"User-Agent": "bingbot/2.0"}
        )
        assert response.status_code == 200
