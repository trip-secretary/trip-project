import httpx
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import KakaoLoginRequest, TokenResponse
from app.core.security import create_access_token
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token"
KAKAO_USERINFO_URL = "https://kapi.kakao.com/v2/user/me"


@router.post("/kakao", response_model=TokenResponse)
async def kakao_login(body: KakaoLoginRequest, db: Session = Depends(get_db)):
    """
    프론트에서 카카오 인가 코드를 받아 → 카카오 액세스 토큰 교환 → 유저 정보 조회
    → DB 저장/조회 → 자체 JWT 발급
    """
    # 1) 인가 코드 → 카카오 액세스 토큰
    print(f"[DEBUG] client_id={settings.KAKAO_CLIENT_ID!r} redirect_uri={settings.KAKAO_REDIRECT_URI!r} code={body.code[:10]}...")
    async with httpx.AsyncClient() as client:
        token_res = await client.post(KAKAO_TOKEN_URL, data={
            "grant_type": "authorization_code",
            "client_id": settings.KAKAO_CLIENT_ID,
            "redirect_uri": settings.KAKAO_REDIRECT_URI,
            "code": body.code,
        })

    if token_res.status_code != 200:
        logger.error("카카오 토큰 발급 실패: status=%s body=%s", token_res.status_code, token_res.text)
        raise HTTPException(status_code=400, detail=f"카카오 토큰 발급 실패: {token_res.text}")

    kakao_token = token_res.json().get("access_token")

    # 2) 카카오 유저 정보 조회
    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            KAKAO_USERINFO_URL,
            headers={"Authorization": f"Bearer {kakao_token}"},
        )

    if user_res.status_code != 200:
        raise HTTPException(status_code=400, detail="카카오 유저 정보 조회 실패")

    kakao_user = user_res.json()
    kakao_id = str(kakao_user["id"])
    kakao_account = kakao_user.get("kakao_account", {})
    profile = kakao_account.get("profile", {})

    nickname = profile.get("nickname", "여행자")
    profile_image = profile.get("profile_image_url")
    email = kakao_account.get("email")

    # 3) DB 저장 또는 조회
    user = db.query(User).filter(User.kakao_id == kakao_id).first()
    if not user:
        user = User(
            kakao_id=kakao_id,
            nickname=nickname,
            profile_image=profile_image,
            email=email,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.nickname = nickname
        user.profile_image = profile_image
        db.commit()

    # 4) 자체 JWT 발급
    access_token = create_access_token({"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        user_id=user.id,
        nickname=user.nickname,
        profile_image=user.profile_image,
    )
