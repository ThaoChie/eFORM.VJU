from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from fastapi.responses import Response

app = FastAPI(title="Word Parser Engine", description="Render E-DRL PDFs")

class RenderRequest(BaseModel):
    formCode: str
    templateVersion: str
    data: Dict[str, Any]

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/render")
def render_pdf(request: RenderRequest):
    try:
        # Mocking PDF generation
        dummy_pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 53 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Mock PDF from Python Engine) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000223 00000 n \n0000000329 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n416\n%%EOF"
        return Response(content=dummy_pdf_content, media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
