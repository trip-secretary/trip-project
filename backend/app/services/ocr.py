import base64
import json
import logging
import re
from google import genai
from google.genai import types
from app.core.config import settings
from app.schemas.dutch_pay import OCRResponse

logger = logging.getLogger(__name__)

OCR_PROMPT = """
이 영수증 이미지를 분석해서 아래 JSON 형식으로만 답해주세요. 다른 텍스트는 출력하지 마세요.

{
  "store_name": "가게명 (없으면 null)",
  "total_amount": 총금액(숫자만, 원 단위, 없으면 null),
  "items": [
    {"name": "품목명", "price": 가격(숫자)}
  ],
  "raw_text": "영수증에서 읽은 원본 텍스트"
}
"""


async def extract_receipt(image_base64: str) -> OCRResponse:
    logger.info("OCR 시작, 이미지 크기: %d bytes", len(image_base64))

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    image_bytes = base64.b64decode(image_base64)
    image_part = types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[OCR_PROMPT, image_part],
        config=types.GenerateContentConfig(
            temperature=0.1,
            response_mime_type="application/json",
        ),
    )

    raw = response.text.strip()
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    data = json.loads(match.group() if match else raw)

    return OCRResponse(
        store_name=data.get("store_name"),
        total_amount=data.get("total_amount"),
        items=data.get("items", []),
        raw_text=data.get("raw_text"),
    )
