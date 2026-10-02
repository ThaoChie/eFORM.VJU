import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_render_pdf():
    payload = {
        "formCode": "DRL01",
        "templateVersion": "v1",
        "data": {
            "name": "Test User"
        }
    }
    response = client.post("/render", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF-1.4")
