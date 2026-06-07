from pydantic import BaseModel


class KakaoLoginRequest(BaseModel):
    code: str                   # 카카오 인가 코드


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    nickname: str
    profile_image: str | None = None
