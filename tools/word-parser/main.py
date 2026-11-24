from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from fastapi.responses import Response

app = FastAPI(title="Word Parser Engine", description="Render E-DRL PDFs")

class RenderRequest(BaseModel):
    formCode: str = "DRL_2026"
    templateVersion: str = "1.0"
    data: Dict[str, Any] = {}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/render")
def render_pdf(request: RenderRequest):
    try:
        # Standard mock PDF containing markers [[SIG_STUDENT]], [[SIG_CLASS]], [[SIG_DEAN]]
        content = (
            "BT\n"
            "/F1 16 Tf\n"
            "50 720 Td\n"
            "(TRUONG DAI HOC VIET NHAT - PHIEU DANH GIA DIEM REN LUYEN) Tj\n"
            "0 -40 Td\n"
            "(Sinh vien: " + str(request.data.get("studentName", "Sinh Vien")) + ") Tj\n"
            "0 -300 Td\n"
            "50 200 Td\n"
            "([[SIG_STUDENT]]) Tj\n"
            "200 0 Td\n"
            "([[SIG_CLASS]]) Tj\n"
            "200 0 Td\n"
            "([[SIG_DEAN]]) Tj\n"
            "ET\n"
        )
        stream_bytes = content.encode("latin-1")
        stream_len = len(stream_bytes)

        pdf_str = (
            f"%PDF-1.4\n"
            f"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
            f"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
            f"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
            f"4 0 obj\n<< /Length {stream_len} >>\nstream\n"
        )
        pdf_bytes = pdf_str.encode("latin-1") + stream_bytes + (
            f"\nendstream\nendobj\n"
            f"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
            f"xref\n0 6\n0000000000 65535 f \n"
            f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n500\n%%EOF\n"
        ).encode("latin-1")

        return Response(content=pdf_bytes, media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
