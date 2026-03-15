import logging
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Literal, Optional

import requests
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Hidaya AI API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

RECITERS = [
    {"id": "ar.alafasy", "name": "Mishary Rashid Alafasy"},
    {"id": "ar.abdurrahmaansudais", "name": "Abdul Rahman Al-Sudais"},
    {"id": "ar.husary", "name": "Mahmoud Khalil Al-Husary"},
]

ISLAMIC_KEYWORDS = [
    "quran",
    "surah",
    "ayah",
    "tafsir",
    "hadith",
    "sunnah",
    "sunna",
    "allah",
    "prophet",
    "muhammad",
    "rasul",
    "salah",
    "salat",
    "pray",
    "prayer",
    "witr",
    "tahajjud",
    "fajr",
    "dhuhr",
    "asr",
    "maghrib",
    "isha",
    "jummah",
    "jumuah",
    "adhan",
    "iqamah",
    "wudu",
    "ghusl",
    "tayammum",
    "fiqh",
    "fatwa",
    "sharia",
    "aqeedah",
    "aqidah",
    "zakat",
    "sadaqah",
    "nisab",
    "sawm",
    "fast",
    "fasting",
    "iftar",
    "suhoor",
    "ramadan",
    "eid",
    "fitr",
    "adha",
    "hijri",
    "hajj",
    "umrah",
    "ihram",
    "tawaf",
    "sai",
    "sa'i",
    "dua",
    "dhikr",
    "tasbih",
    "imam",
    "masjid",
    "qibla",
    "kaaba",
    "halal",
    "haram",
    "islam",
    "islamic",
    "nikah",
    "talaq",
    "janazah",
    "قرآن",
    "سورة",
    "آية",
    "تفسير",
    "حديث",
    "صلاة",
    "الوتر",
    "وتر",
    "فجر",
    "ظهر",
    "عصر",
    "مغرب",
    "عشاء",
    "أذان",
    "اذان",
    "زكاة",
    "صدقة",
    "نصاب",
    "دعاء",
    "ذكر",
    "تسبيح",
    "وضوء",
    "غسل",
    "تيمم",
    "حج",
    "عمرة",
    "إحرام",
    "احرام",
    "طواف",
    "سعي",
    "قبلة",
    "الكعبة",
    "الله",
    "سنة",
    "فقه",
    "حلال",
    "حرام",
    "صيام",
    "رمضان",
    "عيد",
    "الاسلام",
]

ISLAMIC_INTENT_PATTERNS_EN = [
    r"\bhow\s+to\s+pray\b",
    r"\bhow\s+do\s+i\s+pray\b",
    r"\bcan\s+i\s+pray\b",
    r"\bhow\s+to\s+perform\s+(wudu|ghusl|tayammum|umrah|hajj)\b",
    r"\bdua\s+for\b",
    r"\bwhat\s+does\s+(quran|islam)\s+say\b",
    r"\bis\s+.*\b(halal|haram)\b",
    r"\bcan\s+i\s+break\s+my\s+fast\b",
    r"\bhow\s+much\s+zakat\b",
    r"\bis\s+my\s+zakat\s+due\b",
    r"\bwhen\s+is\s+(fajr|dhuhr|asr|maghrib|isha)\b",
    r"\bsteps?\s+of\s+(hajj|umrah)\b",
    r"\bmake\s+up\s+.*\bprayer\b",
    r"\bmissed\s+prayer\b",
]

ISLAMIC_INTENT_PATTERNS_AR = [
    r"كيف\s+أصلي",
    r"كيف\s+اصلي",
    r"كيفية\s+الصلاة",
    r"هل\s+.*\s+(حلال|حرام)",
    r"دعاء\s+ل",
    r"ماذا\s+يقول\s+(القرآن|الاسلام)",
    r"كيف\s+أؤدي\s+(الوضوء|الغسل|التيمم|العمرة|الحج)",
    r"كيف\s+اؤدي\s+(الوضوء|الغسل|التيمم|العمرة|الحج)",
    r"موعد\s+(الفجر|الظهر|العصر|المغرب|العشاء)",
    r"كم\s+زكاة",
    r"احكام\s+الصيام",
]

ORIGIN_PATTERNS = [
    "who made you",
    "what are you",
    "what model",
    "which model",
    "where are you from",
    "are you",
    "من صنعك",
    "ما أصلك",
    "ما نموذجك",
    "من انت",
]

RESTRICTED_TERMS = [
    "google",
    "gemini",
    "openai",
    "anthropic",
    "large language model",
    "language model",
]


class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class CompanionMessage(BaseModel):
    role: Literal["user", "assistant"]
    text: str
    timestamp: str
    language: Optional[str] = None


class CompanionRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    language: str = "en"


class CompanionResponse(BaseModel):
    session_id: str
    answer: str
    source: Literal["core", "fallback"]
    messages: List[CompanionMessage]


class CompanionHistoryResponse(BaseModel):
    session_id: str
    messages: List[CompanionMessage]


# Secure Chat Proxy Models (for /api/chat)
class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    language: str = "en"
    history: Optional[List[ChatMessage]] = None  # Optional: frontend can send last 6 messages


class ChatResponse(BaseModel):
    session_id: str
    response: str
    messages: List[ChatMessage]


class SurahSummary(BaseModel):
    number: int
    name_arabic: str
    name_english: str
    translation_english: str
    ayah_count: int


class QuranAyah(BaseModel):
    number_in_surah: int
    text_arabic: str
    text_english: str
    audio_url: str


class SurahDetailsResponse(BaseModel):
    number: int
    name_arabic: str
    name_english: str
    reciter_id: str
    reciter_name: str
    ayahs: List[QuranAyah]


class PrayerTimesResponse(BaseModel):
    latitude: float
    longitude: float
    asr_method: Literal["standard", "hanafi"]
    timezone: str
    readable_date: str
    timings: Dict[str, str]


class QiblaResponse(BaseModel):
    latitude: float
    longitude: float
    qibla_direction: float


class ZakatBasicRequest(BaseModel):
    wealth: float
    debts: float = 0
    nisab: float


class ZakatBasicResponse(BaseModel):
    net_wealth: float
    nisab: float
    zakat_due: float
    eligible: bool


class ZakatAdvancedRequest(BaseModel):
    gold_price_per_gram: float
    silver_price_per_gram: float
    silver_weight_grams: float = 0
    gold_14k_grams: float = 0
    gold_16k_grams: float = 0
    gold_18k_grams: float = 0
    gold_21k_grams: float = 0
    gold_22k_grams: float = 0
    gold_24k_grams: float = 0
    bank_balance: float = 0
    cash: float = 0
    investment_property: float = 0
    business_assets: float = 0
    liabilities: float = 0
    nisab_method: Literal["gold", "silver", "lower_of_both"] = "lower_of_both"


class ZakatAdvancedResponse(BaseModel):
    gold_24k_equivalent_grams: float
    gold_value: float
    silver_value: float
    total_assets: float
    net_wealth: float
    nisab_method: Literal["gold", "silver", "lower_of_both"]
    nisab_threshold: float
    gold_nisab_value: float
    silver_nisab_value: float
    eligible: bool
    zakat_due: float


def has_arabic(text: str) -> bool:
    return any("\u0600" <= char <= "\u06ff" for char in text)


def looks_like_islamic_question(text: str) -> bool:
    lowered = text.lower()
    keyword_match = any(keyword in lowered for keyword in ISLAMIC_KEYWORDS)
    en_pattern_match = any(re.search(pattern, lowered) for pattern in ISLAMIC_INTENT_PATTERNS_EN)
    ar_pattern_match = any(re.search(pattern, text) for pattern in ISLAMIC_INTENT_PATTERNS_AR)
    return keyword_match or en_pattern_match or ar_pattern_match


def asks_origin(text: str) -> bool:
    lowered = text.lower()
    return any(pattern in lowered for pattern in ORIGIN_PATTERNS)


def origin_response(language: str) -> str:
    arabic = language.lower().startswith("ar")
    if arabic:
        return (
            "أنا رفيقك الإسلامي المخصص، صُمّمت لدعم رحلتك الإيمانية.\n\n"
            "Sources:\n"
            "- Quran 16:43\n"
            "- Sahih al-Bukhari 71"
        )
    return (
        "I am your dedicated Islamic Companion, built to support your spiritual journey.\n\n"
        "Sources:\n"
        "- Quran 16:43\n"
        "- Sahih al-Bukhari 71"
    )


def non_islamic_response(language: str) -> str:
    arabic = language.lower().startswith("ar")
    if arabic:
        return (
            "يمكنني المساعدة فقط في الأسئلة الإسلامية والعبادات والسلوك الإيماني.\n"
            "يرجى إرسال سؤال متعلق بالإسلام، القرآن، الحديث، أو الفقه."
        )
    return (
        "I can only help with Islamic questions related to faith, worship, and spiritual practice.\n"
        "Please ask about Quran, Hadith, prayer, zakat, fasting, family ethics, or fiqh."
    )


def ensure_sources(answer: str, language: str) -> str:
    if "sources:" in answer.lower() or "المصادر" in answer:
        return answer

    if language.lower().startswith("ar"):
        return (
            f"{answer.strip()}\n\n"
            "Sources:\n"
            "- Quran 2:286\n"
            "- Sahih al-Bukhari 6464"
        )

    return (
        f"{answer.strip()}\n\n"
        "Sources:\n"
        "- Quran 2:286\n"
        "- Sahih al-Bukhari 6464"
    )


def scrub_restricted_terms(answer: str) -> str:
    cleaned = answer
    for term in RESTRICTED_TERMS:
        cleaned = re.sub(term, "Hidaya AI", cleaned, flags=re.IGNORECASE)
    return cleaned


def fallback_companion_answer(question: str, language: str) -> str:
    if asks_origin(question):
        return origin_response(language)

    if not looks_like_islamic_question(question):
        return non_islamic_response(language)

    arabic = language.lower().startswith("ar") or has_arabic(question)
    if arabic:
        return (
            "**إجابة من هداية AI**\n"
            "- هذا جواب إرشادي عام وليس فتوى ملزمة.\n"
            "- راجع عالماً موثوقاً في المسائل التفصيلية.\n"
            "- اذكر ظروفك بدقة لنصيحة أدق.\n\n"
            "Sources:\n"
            "- Quran 16:43\n"
            "- Sahih al-Bukhari 52"
        )

    return (
        "**Guidance from Hidaya AI**\n"
        "- This is general Islamic guidance and not a binding fatwa.\n"
        "- For detailed rulings, consult a qualified scholar.\n"
        "- Share your full context for more precise advice.\n\n"
        "Sources:\n"
        "- Quran 16:43\n"
        "- Sahih al-Bukhari 52"
    )


async def generate_companion_answer(session_id: str, question: str, language: str) -> CompanionResponse:
    if asks_origin(question):
        answer = origin_response(language)
        return CompanionResponse(session_id=session_id, answer=answer, source="fallback", messages=[])

    if not looks_like_islamic_question(question):
        answer = non_islamic_response(language)
        return CompanionResponse(session_id=session_id, answer=answer, source="fallback", messages=[])

    token = os.environ.get("HIDAYA_CORE_ENGINE_TOKEN")
    if not token or LlmChat is None or UserMessage is None:
        answer = fallback_companion_answer(question, language)
        return CompanionResponse(session_id=session_id, answer=answer, source="fallback", messages=[])

    system_message = (
        "You are Hidaya AI. Never mention provider names, technical model names, or that you are an AI model. "
        "If asked about your origin, reply exactly: 'I am your dedicated Islamic Companion, built to support your spiritual journey.' "
        "Only answer Islamic questions. If question is outside Islamic scope, politely refuse and ask for an Islamic question. "
        "Always include a final section titled 'Sources:' with Quran ayah references and/or Sahih Hadith references. "
        "Use concise, practical guidance in bullet points."
    )

    try:
        chat = (
            LlmChat(api_key=token, session_id=session_id, system_message=system_message)
            .with_model("gemini", "gemini-3-flash-preview")
        )
        response = await chat.send_message(UserMessage(text=question))
        answer = str(response).strip()
        answer = scrub_restricted_terms(answer)
        answer = ensure_sources(answer, language)
        return CompanionResponse(session_id=session_id, answer=answer, source="core", messages=[])
    except Exception as exc:  # pragma: no cover
        logger.exception("Companion engine call failed: %s", exc)
        answer = fallback_companion_answer(question, language)
        return CompanionResponse(session_id=session_id, answer=answer, source="fallback", messages=[])


@api_router.get("/")
async def root():
    return {"message": "Hidaya AI backend is running"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input_data: StatusCheckCreate):
    status_obj = StatusCheck(**input_data.model_dump())
    status_doc = status_obj.model_dump()
    status_doc["timestamp"] = status_obj.timestamp.isoformat()
    await db.status_checks.insert_one(status_doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    checks = await db.status_checks.find({}, {"_id": 0}).to_list(200)
    result = []
    for item in checks:
        if isinstance(item.get("timestamp"), str):
            item["timestamp"] = datetime.fromisoformat(item["timestamp"])
        result.append(StatusCheck(**item))
    return result


@api_router.post("/companion", response_model=CompanionResponse)
async def companion_chat(payload: CompanionRequest):
    user_text = payload.message.strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    session_id = payload.session_id or str(uuid.uuid4())
    history_doc = await db.companion_sessions.find_one({"session_id": session_id}, {"_id": 0})
    history_messages = history_doc.get("messages", []) if history_doc else []

    user_message = {
        "role": "user",
        "text": user_text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "language": payload.language,
    }

    answer_payload = await generate_companion_answer(session_id, user_text, payload.language)
    assistant_message = {
        "role": "assistant",
        "text": answer_payload.answer,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "language": "ar" if has_arabic(answer_payload.answer) else "en",
    }

    updated_messages = [*history_messages, user_message, assistant_message]
    await db.companion_sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "session_id": session_id,
                "messages": updated_messages,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
            "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()},
        },
        upsert=True,
    )

    return CompanionResponse(
        session_id=session_id,
        answer=answer_payload.answer,
        source=answer_payload.source,
        messages=[CompanionMessage(**item) for item in updated_messages],
    )


@api_router.get("/companion/history/{session_id}", response_model=CompanionHistoryResponse)
async def companion_chat_history(session_id: str):
    history_doc = await db.companion_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not history_doc:
        return CompanionHistoryResponse(session_id=session_id, messages=[])

    return CompanionHistoryResponse(
        session_id=session_id,
        messages=[CompanionMessage(**message) for message in history_doc.get("messages", [])],
    )


# ============================================================================
# SECURE CHAT PROXY - /api/chat
# This endpoint acts as a secure server-side proxy for AI chat
# Frontend never communicates with AI API directly
# Authentication handled server-side with Hidaya_ai_core key
# ============================================================================

async def generate_secure_chat_response(session_id: str, user_message: str, language: str, chat_history: List[ChatMessage]) -> str:
    """
    Generate AI response using Hidaya_ai_core key (server-side only).
    Bot identifies as 'Hidaya AI' - specialized Islamic guidance companion.
    Uses conversation history (last 6 messages) for context.
    """
    # Get server-side API key (never exposed to client)
    # Use Hidaya AI core engine key
    api_key = os.environ.get("Hidaya_ai_core")
    
    # Debug logging
    logger.info(f"API Key status: {'Present' if api_key else 'MISSING'}")
    if api_key:
        logger.info(f"API Key prefix: {api_key[:15]}...")
    
    if not api_key:
        logger.error("No API key found in environment")
        raise HTTPException(status_code=500, detail="Server configuration error: API key not found in environment")
    
    # Hidaya AI System Instructions - Whitelabel Persona
    system_instructions = """You are Hidaya AI, a specialized Islamic guidance companion designed to support Muslims in their spiritual journey.

**Your Identity:**
- You are Hidaya AI - never mention other AI providers, models, or technical names
- You specialize in prayer guidance, Zakat calculations (including silver/gold), Hajj/Umrah guidance, and general Islamic knowledge
- If asked about your origin, respond: "I am Hidaya AI, your dedicated Islamic companion built to support your spiritual journey with authentic Islamic guidance."

**Your Expertise:**
1. **Prayer (Salah):** Times, methods, qibla direction, missed prayers, witr, tahajjud
2. **Zakat:** Gold/silver calculations, nisab thresholds, wealth assessments, zakat on different assets
3. **Hajj & Umrah:** Step-by-step rituals, requirements, common mistakes, spiritual preparation
4. **Quran & Hadith:** Verses, interpretations, authentic hadith references
5. **Islamic Jurisprudence:** Fiqh rulings, halal/haram, daily Islamic practices
6. **Dua & Remembrance:** Supplications for various occasions

**Response Guidelines:**
- Only answer Islamic questions - politely refuse non-Islamic topics
- Provide concise, practical guidance in bullet points
- Always cite sources: Quran ayahs and/or Sahih Hadith references
- Include a "Sources:" section at the end of every response
- For detailed rulings, remind users to consult qualified scholars
- Be respectful, humble, and supportive

**Language:**
- Respond in the user's language (English or Arabic)
- Maintain warm, supportive tone
- Use clear, accessible language

Remember: You are Hidaya AI, not a general assistant. Stay focused on Islamic guidance."""

    try:
        # Use Google Gemini API with Hidaya API key
        if api_key.startswith("AIza"):
            logger.info("Using Google Gemini API - gemini-3.1-flash-lite-preview with conversation history")
            # Configure Gemini with Hidaya API key
            genai.configure(api_key=api_key)
            
            # Use Gemini 3.1 Flash Lite Preview model
            model = genai.GenerativeModel('models/gemini-3.1-flash-lite-preview')
            
            # Get last 6 messages for context (3 user + 3 assistant pairs max)
            # This keeps context manageable while maintaining conversation flow
            recent_history = chat_history[-6:] if len(chat_history) > 6 else chat_history
            
            # Build conversation context
            conversation_context = ""
            if recent_history:
                conversation_context = "\n\n**Previous Conversation:**\n"
                for msg in recent_history:
                    role_label = "User" if msg.role == "user" else "Hidaya AI"
                    conversation_context += f"{role_label}: {msg.content}\n\n"
            
            # Build prompt with system instructions and conversation history
            full_prompt = f"""{system_instructions}
{conversation_context}
User Question: {user_message}

Provide a helpful response as Hidaya AI, taking into account the conversation history above."""
            
            # Send user message and get response
            response = model.generate_content(full_prompt)
            answer = response.text.strip()
        else:
            raise HTTPException(status_code=400, detail="Invalid API key format. Please provide a valid Gemini API key.")
        
        # Security: Scrub any restricted terms that might leak provider info
        answer = scrub_restricted_terms(answer)
        
        # Ensure Islamic sources are included
        answer = ensure_sources(answer, language)
        
        return answer
        
    except Exception as exc:
        logger.exception("Secure chat proxy failed: %s", exc)
        # Log detailed error for debugging
        logger.error(f"API Key present: {bool(api_key)}, Key prefix: {api_key[:15] if api_key else 'None'}...")
        
        # Check if it's a quota error
        if "429" in str(exc) or "quota" in str(exc).lower():
            raise HTTPException(
                status_code=429, 
                detail="Free tier quota exceeded. Please wait 24 hours for quota reset or upgrade your Gemini API plan."
            )
        
        raise HTTPException(status_code=500, detail=f"Unable to generate response: {str(exc)}")


@api_router.post("/chat", response_model=ChatResponse)
async def secure_chat_proxy(payload: ChatRequest):
    """
    Secure server-side proxy for AI chat.
    Frontend communicates only with this endpoint, never with AI API directly.
    All authentication handled server-side with Hidaya_ai_core key.
    """
    user_text = payload.message.strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    # Generate or use existing session ID
    session_id = payload.session_id or str(uuid.uuid4())
    
    # Retrieve chat history from database or use frontend-provided history
    chat_history = []
    if payload.history:
        # Use history provided by frontend (already limited to last 6)
        chat_history = payload.history
        logger.info(f"Using frontend-provided history: {len(chat_history)} messages")
    else:
        # Fall back to database history
        chat_doc = await db.secure_chat_sessions.find_one({"session_id": session_id}, {"_id": 0})
        if chat_doc:
            chat_history = [ChatMessage(**msg) for msg in chat_doc.get("messages", [])]
            logger.info(f"Using database history: {len(chat_history)} messages")
    
    # Create user message
    user_message = ChatMessage(
        role="user",
        content=user_text,
        timestamp=datetime.now(timezone.utc).isoformat()
    )
    
    # Generate AI response using secure server-side proxy
    try:
        ai_response_text = await generate_secure_chat_response(
            session_id=session_id,
            user_message=user_text,
            language=payload.language,
            chat_history=chat_history
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Chat generation failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to generate response")
    
    # Create assistant message
    assistant_message = ChatMessage(
        role="assistant",
        content=ai_response_text,
        timestamp=datetime.now(timezone.utc).isoformat()
    )
    
    # Update chat history
    updated_messages = [*chat_history, user_message, assistant_message]
    
    # Store in database
    await db.secure_chat_sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "session_id": session_id,
                "messages": [msg.model_dump() for msg in updated_messages],
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
            "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()},
        },
        upsert=True,
    )
    
    return ChatResponse(
        session_id=session_id,
        response=ai_response_text,
        messages=updated_messages
    )


@api_router.get("/chat/history/{session_id}")
async def get_secure_chat_history(session_id: str):
    """Get chat history for a specific session."""
    chat_doc = await db.secure_chat_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not chat_doc:
        return {"session_id": session_id, "messages": []}
    
    return {
        "session_id": session_id,
        "messages": chat_doc.get("messages", [])
    }



@api_router.get("/quran/reciters")
async def get_reciters():
    return RECITERS


@api_router.get("/quran/surahs", response_model=List[SurahSummary])
async def get_quran_surahs():
    try:
        response = requests.get("https://api.alquran.cloud/v1/surah", timeout=20)
        response.raise_for_status()
        data = response.json().get("data", [])
        return [
            SurahSummary(
                number=item["number"],
                name_arabic=item["name"],
                name_english=item["englishName"],
                translation_english=item["englishNameTranslation"],
                ayah_count=item["numberOfAyahs"],
            )
            for item in data
        ]
    except Exception as exc:
        logger.exception("Failed to fetch surahs: %s", exc)
        raise HTTPException(status_code=503, detail="Unable to fetch Quran surah list")


@api_router.get("/quran/surah/{surah_number}", response_model=SurahDetailsResponse)
async def get_surah_details(surah_number: int, reciter: str = Query(default="ar.alafasy")):
    requested_reciter = reciter if any(item["id"] == reciter for item in RECITERS) else "ar.alafasy"
    editions = ["quran-uthmani", "en.asad", requested_reciter]
    if requested_reciter != "ar.alafasy":
        editions.append("ar.alafasy")

    editions_query = ",".join(editions)
    url = f"https://api.alquran.cloud/v1/surah/{surah_number}/editions/{editions_query}"

    try:
        response = requests.get(url, timeout=20)
        response.raise_for_status()
        payload = response.json().get("data", [])
    except Exception as exc:
        logger.exception("Failed to fetch surah details: %s", exc)
        raise HTTPException(status_code=503, detail="Unable to fetch surah details")

    by_identifier: Dict[str, dict] = {}
    for edition_data in payload:
        identifier = edition_data.get("edition", {}).get("identifier")
        if identifier:
            by_identifier[identifier] = edition_data

    arabic = by_identifier.get("quran-uthmani", {})
    english = by_identifier.get("en.asad", {})
    reciter_data = by_identifier.get(requested_reciter) or by_identifier.get("ar.alafasy", {})
    resolved_reciter = requested_reciter if requested_reciter in by_identifier else "ar.alafasy"
    resolved_name = next((item["name"] for item in RECITERS if item["id"] == resolved_reciter), "Mishary Rashid Alafasy")

    arabic_ayahs = arabic.get("ayahs", [])
    english_ayahs = english.get("ayahs", [])
    reciter_ayahs = reciter_data.get("ayahs", [])

    ayahs: List[QuranAyah] = []
    for index, ayah in enumerate(arabic_ayahs):
        english_text = english_ayahs[index]["text"] if index < len(english_ayahs) else ""
        audio_url = reciter_ayahs[index].get("audio", "") if index < len(reciter_ayahs) else ""
        ayahs.append(
            QuranAyah(
                number_in_surah=ayah.get("numberInSurah", index + 1),
                text_arabic=ayah.get("text", ""),
                text_english=english_text,
                audio_url=audio_url,
            )
        )

    if not ayahs:
        raise HTTPException(status_code=404, detail="Surah not found")

    return SurahDetailsResponse(
        number=surah_number,
        name_arabic=arabic.get("name", ""),
        name_english=arabic.get("englishName", ""),
        reciter_id=resolved_reciter,
        reciter_name=resolved_name,
        ayahs=ayahs,
    )


@api_router.get("/prayer-times", response_model=PrayerTimesResponse)
async def get_prayer_times(
    latitude: float,
    longitude: float,
    asr_method: Literal["standard", "hanafi"] = "standard",
    method: int = 2,
):
    school = 1 if asr_method == "hanafi" else 0
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "method": method,
        "school": school,
    }

    try:
        response = requests.get("https://api.aladhan.com/v1/timings", params=params, timeout=20)
        response.raise_for_status()
        data = response.json().get("data", {})
    except Exception as exc:
        logger.exception("Failed to fetch prayer times: %s", exc)
        raise HTTPException(status_code=503, detail="Unable to fetch prayer times")

    timings = data.get("timings", {})
    clean_timings = {
        prayer: timings.get(prayer, "--:--").split(" ")[0]
        for prayer in ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"]
    }

    return PrayerTimesResponse(
        latitude=latitude,
        longitude=longitude,
        asr_method=asr_method,
        timezone=data.get("meta", {}).get("timezone", "Unknown"),
        readable_date=data.get("date", {}).get("readable", "Unknown"),
        timings=clean_timings,
    )


@api_router.get("/qibla", response_model=QiblaResponse)
async def get_qibla_direction(latitude: float, longitude: float):
    url = f"https://api.aladhan.com/v1/qibla/{latitude}/{longitude}"
    try:
        response = requests.get(url, timeout=20)
        response.raise_for_status()
        direction = response.json().get("data", {}).get("direction")
    except Exception as exc:
        logger.exception("Failed to fetch qibla: %s", exc)
        raise HTTPException(status_code=503, detail="Unable to fetch Qibla direction")

    if direction is None:
        raise HTTPException(status_code=503, detail="Qibla direction unavailable")

    return QiblaResponse(latitude=latitude, longitude=longitude, qibla_direction=float(direction))


@api_router.post("/zakat/calculate", response_model=ZakatBasicResponse)
async def calculate_zakat_basic(payload: ZakatBasicRequest):
    if payload.nisab <= 0:
        raise HTTPException(status_code=400, detail="Nisab must be greater than zero")

    net_wealth = round(payload.wealth - payload.debts, 2)
    eligible = net_wealth >= payload.nisab
    zakat_due = round(net_wealth * 0.025, 2) if eligible else 0.0
    return ZakatBasicResponse(net_wealth=net_wealth, nisab=payload.nisab, zakat_due=zakat_due, eligible=eligible)


@api_router.post("/zakat/advanced", response_model=ZakatAdvancedResponse)
async def calculate_zakat_advanced(payload: ZakatAdvancedRequest):
    if payload.gold_price_per_gram <= 0 or payload.silver_price_per_gram <= 0:
        raise HTTPException(status_code=400, detail="Gold and silver prices must be greater than zero")

    gold_24k_equivalent_grams = (
        payload.gold_14k_grams * (14 / 24)
        + payload.gold_16k_grams * (16 / 24)
        + payload.gold_18k_grams * (18 / 24)
        + payload.gold_21k_grams * (21 / 24)
        + payload.gold_22k_grams * (22 / 24)
        + payload.gold_24k_grams
    )

    gold_value = gold_24k_equivalent_grams * payload.gold_price_per_gram
    silver_value = payload.silver_weight_grams * payload.silver_price_per_gram
    total_assets = (
        gold_value
        + silver_value
        + payload.bank_balance
        + payload.cash
        + payload.investment_property
        + payload.business_assets
    )
    net_wealth = total_assets - payload.liabilities

    gold_nisab_value = 87.48 * payload.gold_price_per_gram
    silver_nisab_value = 612.36 * payload.silver_price_per_gram

    if payload.nisab_method == "gold":
        nisab_threshold = gold_nisab_value
    elif payload.nisab_method == "silver":
        nisab_threshold = silver_nisab_value
    else:
        nisab_threshold = min(gold_nisab_value, silver_nisab_value)

    eligible = net_wealth >= nisab_threshold
    zakat_due = net_wealth * 0.025 if eligible else 0.0

    return ZakatAdvancedResponse(
        gold_24k_equivalent_grams=round(gold_24k_equivalent_grams, 4),
        gold_value=round(gold_value, 2),
        silver_value=round(silver_value, 2),
        total_assets=round(total_assets, 2),
        net_wealth=round(net_wealth, 2),
        nisab_method=payload.nisab_method,
        nisab_threshold=round(nisab_threshold, 2),
        gold_nisab_value=round(gold_nisab_value, 2),
        silver_nisab_value=round(silver_nisab_value, 2),
        eligible=eligible,
        zakat_due=round(zakat_due, 2),
    )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://hidaya-ai-2had.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    
import uvicorn
import os

if __name__ == "__main__":
    # Render provides the port via an environment variable
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
