import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_x402_quote():
    """Test 402 payment required response"""
    response = client.post("/api/v1/x402/place-bet", json={
        "market_id": "test-market",
        "side": "home",
        "stake": 0.01
    })
    
    assert response.status_code == 402
    assert "X-Quote-ID" in response.headers
    assert response.headers["Payment-Required"]

def test_markets_list():
    """Test markets endpoint"""
    response = client.get("/api/v1/markets?sport=soccer")
    assert response.status_code == 200
    assert len(response.json()) > 0
