"""Payment API routes using Creem."""
import json
import hmac
import hashlib
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import GenerationToken, PaymentTransaction
from app.schemas import CreateCheckoutRequest, CheckoutResponse
from app.config import get_settings
from app.metrics import record_payment
import httpx

router = APIRouter(prefix="/api/v1/payment", tags=["payment"])
settings = get_settings()

# Product configuration
PRODUCTS = {
    "quiz_5": {"tokens": 5, "name": "5 Quizzes"},
    "quiz_20": {"tokens": 20, "name": "20 Quizzes"},
    "quiz_50": {"tokens": 50, "name": "50 Quizzes"},
}


def get_product_ids() -> dict:
    """Get product IDs from settings."""
    try:
        return json.loads(settings.creem_product_ids)
    except:
        return {}


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    request: CreateCheckoutRequest,
    db: Session = Depends(get_db)
):
    """Create a Creem checkout session."""
    if request.product_sku not in PRODUCTS:
        raise HTTPException(status_code=400, detail="Invalid product SKU")
    
    product_ids = get_product_ids()
    product_id = product_ids.get(request.product_sku)
    
    if not product_id:
        raise HTTPException(status_code=500, detail="Product not configured")
    
    if not settings.creem_api_key:
        raise HTTPException(status_code=500, detail="Payment not configured")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.creem.io/v1/checkouts",
                headers={
                    "Authorization": f"Bearer {settings.creem_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "product_id": product_id,
                    "success_url": request.success_url,
                    "cancel_url": request.cancel_url or request.success_url,
                    "metadata": {
                        "device_id": request.device_id,
                        "product_sku": request.product_sku
                    }
                }
            )
            response.raise_for_status()
            data = response.json()
            
            # Create pending transaction
            transaction = PaymentTransaction(
                checkout_id=data["id"],
                device_id=request.device_id,
                product_id=product_id,
                amount_cents=0,  # Will be updated on webhook
                currency="usd",
                status="pending",
                tokens_granted=PRODUCTS[request.product_sku]["tokens"]
            )
            db.add(transaction)
            db.commit()
            
            return CheckoutResponse(
                checkout_url=data["checkout_url"],
                checkout_id=data["id"]
            )
            
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=500, detail=f"Payment service error: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """Verify Creem webhook signature."""
    if not settings.creem_webhook_secret:
        return False
    
    expected = hmac.new(
        settings.creem_webhook_secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected, signature)


@router.post("/webhook")
async def handle_webhook(
    request: Request,
    x_creem_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    """Handle Creem payment webhooks."""
    body = await request.body()
    
    # Verify signature
    if x_creem_signature and not verify_webhook_signature(body, x_creem_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    event_type = payload.get("event_type", payload.get("type"))
    checkout_id = payload.get("checkout_id", payload.get("data", {}).get("checkout_id"))
    
    if event_type in ["checkout.completed", "payment.completed"]:
        # Find transaction
        transaction = db.query(PaymentTransaction).filter(
            PaymentTransaction.checkout_id == checkout_id
        ).first()
        
        if not transaction:
            # Create transaction if not found (metadata should contain device_id)
            metadata = payload.get("metadata", payload.get("data", {}).get("metadata", {}))
            device_id = metadata.get("device_id")
            product_sku = metadata.get("product_sku", "quiz_5")
            
            if not device_id:
                raise HTTPException(status_code=400, detail="Missing device_id in metadata")
            
            transaction = PaymentTransaction(
                checkout_id=checkout_id,
                device_id=device_id,
                product_id=payload.get("product_id", ""),
                amount_cents=payload.get("amount", 0),
                currency=payload.get("currency", "usd"),
                status="completed",
                tokens_granted=PRODUCTS.get(product_sku, {}).get("tokens", 5),
                completed_at=datetime.utcnow()
            )
            db.add(transaction)
        else:
            transaction.status = "completed"
            transaction.amount_cents = payload.get("amount", transaction.amount_cents)
            transaction.completed_at = datetime.utcnow()
        
        # Add tokens to user
        token_record = db.query(GenerationToken).filter(
            GenerationToken.device_id == transaction.device_id
        ).first()
        
        if token_record:
            token_record.tokens_remaining += transaction.tokens_granted
            token_record.tokens_total += transaction.tokens_granted
            token_record.updated_at = datetime.utcnow()
        else:
            token_record = GenerationToken(
                device_id=transaction.device_id,
                tokens_remaining=transaction.tokens_granted,
                tokens_total=transaction.tokens_granted
            )
            db.add(token_record)
        
        db.commit()
        
        # Record metrics
        product_sku = payload.get("metadata", {}).get("product_sku", "unknown")
        record_payment(product_sku, transaction.amount_cents)
    
    return {"status": "ok"}


@router.get("/success")
async def payment_success(
    checkout_id: str,
    device_id: str = Header(None, alias="X-Device-Id"),
    db: Session = Depends(get_db)
):
    """Verify payment success and return token count."""
    transaction = db.query(PaymentTransaction).filter(
        PaymentTransaction.checkout_id == checkout_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction.status != "completed":
        return {
            "status": "pending",
            "message": "Payment is still processing"
        }
    
    # Get token balance
    token_record = db.query(GenerationToken).filter(
        GenerationToken.device_id == transaction.device_id
    ).first()
    
    return {
        "status": "completed",
        "tokens_added": transaction.tokens_granted,
        "tokens_remaining": token_record.tokens_remaining if token_record else 0
    }
