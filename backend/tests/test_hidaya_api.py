import os
import uuid

import pytest
import requests
from dotenv import load_dotenv

# Module: public API base URL used by end users (frontend env)
load_dotenv("/app/frontend/.env")
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")

if not BASE_URL:
    pytest.skip("REACT_APP_BACKEND_URL is not configured", allow_module_level=True)

BASE_URL = BASE_URL.rstrip("/")


@pytest.fixture(scope="session")
def api_client():
    """Shared HTTP client for backend API tests."""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


# Module: health and base routing
def test_api_root_ok(api_client):
    response = api_client.get(f"{BASE_URL}/api/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Hidaya AI backend is running"


# Module: companion chat engine and persistence
def test_companion_chat_and_history_persistence(api_client):
    session_id = f"TEST-companion-{uuid.uuid4()}"

    first_payload = {
        "message": "How can I be consistent in Fajr prayer?",
        "session_id": session_id,
        "language": "en",
    }
    first_response = api_client.post(f"{BASE_URL}/api/companion", json=first_payload)
    assert first_response.status_code == 200
    first_data = first_response.json()

    assert first_data["session_id"] == session_id
    assert first_data["source"] in ["core", "fallback"]
    assert "Sources:" in first_data["answer"]
    assert len(first_data["messages"]) >= 2
    assert first_data["messages"][-2]["role"] == "user"
    assert first_data["messages"][-1]["role"] == "assistant"

    second_payload = {
        "message": "Share a short dua before studying.",
        "session_id": session_id,
        "language": "en",
    }
    second_response = api_client.post(f"{BASE_URL}/api/companion", json=second_payload)
    assert second_response.status_code == 200
    second_data = second_response.json()
    assert len(second_data["messages"]) >= 4
    assert second_data["messages"][-2]["text"] == second_payload["message"]

    history_response = api_client.get(f"{BASE_URL}/api/companion/history/{session_id}")
    assert history_response.status_code == 200
    history_data = history_response.json()
    assert history_data["session_id"] == session_id
    assert len(history_data["messages"]) >= 4
    assert history_data["messages"][-2]["text"] == second_payload["message"]


def test_companion_refuses_non_islamic_question_with_sources(api_client):
    payload = {
        "message": "What is the weather in Tokyo tomorrow?",
        "session_id": f"TEST-offtopic-{uuid.uuid4()}",
        "language": "en",
    }
    response = api_client.post(f"{BASE_URL}/api/companion", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["source"] == "fallback"
    assert "Sources:" in data["answer"]
    assert "I can only help with Islamic questions" in data["answer"]


def test_companion_origin_response_hides_provider_names(api_client):
    payload = {
        "message": "What model are you and who made you?",
        "session_id": f"TEST-origin-{uuid.uuid4()}",
        "language": "en",
    }
    response = api_client.post(f"{BASE_URL}/api/companion", json=payload)
    assert response.status_code == 200
    data = response.json()

    answer_lower = data["answer"].lower()
    assert "sources:" in answer_lower
    assert "dedicated islamic companion" in answer_lower
    for restricted_term in ["google", "gemini", "openai", "anthropic"]:
        assert restricted_term not in answer_lower


def test_companion_empty_message_validation(api_client):
    payload = {"message": "   ", "language": "en"}
    response = api_client.post(f"{BASE_URL}/api/companion", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "Message cannot be empty"


# Module: zakat advanced calculation engine
def test_zakat_advanced_calculation_lower_of_both(api_client):
    payload = {
        "gold_price_per_gram": 100,
        "silver_price_per_gram": 1,
        "gold_18k_grams": 24,
        "gold_21k_grams": 24,
        "gold_22k_grams": 24,
        "gold_24k_grams": 24,
        "bank_balance": 1000,
        "cash": 500,
        "investment_property": 0,
        "business_assets": 0,
        "liabilities": 100,
        "nisab_method": "lower_of_both",
    }
    response = api_client.post(f"{BASE_URL}/api/zakat/advanced", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["gold_24k_equivalent_grams"] == 85.0
    assert data["gold_value"] == 8500.0
    assert data["total_assets"] == 10000.0
    assert data["net_wealth"] == 9900.0
    assert data["gold_nisab_value"] == 8748.0
    assert data["silver_nisab_value"] == 612.36
    assert data["nisab_threshold"] == 612.36
    assert data["eligible"] is True
    assert data["zakat_due"] == 247.5


# Module: zakat advanced with silver weight input (iteration 3 P0 feature)
def test_zakat_advanced_with_silver_weight(api_client):
    """Verify silver_weight_grams is factored into silver_value, total_assets, net_wealth, and zakat_due."""
    payload = {
        "gold_price_per_gram": 85,
        "silver_price_per_gram": 1.5,
        "silver_weight_grams": 200,
        "gold_18k_grams": 10,
        "gold_21k_grams": 0,
        "gold_22k_grams": 0,
        "gold_24k_grams": 0,
        "bank_balance": 500,
        "cash": 100,
        "investment_property": 0,
        "business_assets": 0,
        "liabilities": 0,
        "nisab_method": "lower_of_both",
    }
    response = api_client.post(f"{BASE_URL}/api/zakat/advanced", json=payload)
    assert response.status_code == 200
    data = response.json()

    # silver_value = silver_weight_grams * silver_price_per_gram
    assert data["silver_value"] == 300.0  # 200 * 1.5
    # gold_24k_equivalent = 10 * (18/24) = 7.5g, gold_value = 7.5 * 85 = 637.5
    assert data["gold_24k_equivalent_grams"] == 7.5
    assert data["gold_value"] == 637.5
    # total_assets = gold_value + silver_value + bank + cash
    assert data["total_assets"] == 1537.5  # 637.5 + 300 + 500 + 100
    assert data["net_wealth"] == 1537.5
    # nisab threshold (lower of both): silver_nisab = 612.36 * 1.5 = 918.54
    assert data["silver_nisab_value"] == 918.54
    assert data["nisab_threshold"] == 918.54
    assert data["eligible"] is True
    # zakat_due = 1537.5 * 0.025 = 38.4375 -> rounded 38.44
    assert data["zakat_due"] == 38.44


@pytest.mark.parametrize(
    "nisab_method,expected_threshold",
    [
        ("gold", 8748.0),
        ("silver", 612.36),
    ],
)
def test_zakat_advanced_nisab_toggle(api_client, nisab_method, expected_threshold):
    payload = {
        "gold_price_per_gram": 100,
        "silver_price_per_gram": 1,
        "gold_18k_grams": 24,
        "gold_21k_grams": 24,
        "gold_22k_grams": 24,
        "gold_24k_grams": 24,
        "bank_balance": 0,
        "cash": 0,
        "investment_property": 0,
        "business_assets": 0,
        "liabilities": 0,
        "nisab_method": nisab_method,
    }
    response = api_client.post(f"{BASE_URL}/api/zakat/advanced", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["nisab_method"] == nisab_method
    assert data["nisab_threshold"] == expected_threshold


def test_zakat_advanced_invalid_prices(api_client):
    payload = {
        "gold_price_per_gram": 0,
        "silver_price_per_gram": 0,
        "nisab_method": "lower_of_both",
    }
    response = api_client.post(f"{BASE_URL}/api/zakat/advanced", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "Gold and silver prices must be greater than zero"


# Module: prayer and qibla services
def test_prayer_times_standard(api_client):
    response = api_client.get(
        f"{BASE_URL}/api/prayer-times",
        params={"latitude": 24.7136, "longitude": 46.6753, "asr_method": "standard"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["asr_method"] == "standard"
    assert data["latitude"] == 24.7136
    assert data["longitude"] == 46.6753
    for prayer in ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"]:
        assert prayer in data["timings"]
        assert isinstance(data["timings"][prayer], str)


def test_prayer_times_hanafi(api_client):
    response = api_client.get(
        f"{BASE_URL}/api/prayer-times",
        params={"latitude": 24.7136, "longitude": 46.6753, "asr_method": "hanafi"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["asr_method"] == "hanafi"
    assert data["latitude"] == 24.7136
    assert data["longitude"] == 46.6753


def test_qibla_direction(api_client):
    response = api_client.get(
        f"{BASE_URL}/api/qibla",
        params={"latitude": 24.7136, "longitude": 46.6753},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["latitude"] == 24.7136
    assert data["longitude"] == 46.6753
    assert isinstance(data["qibla_direction"], float)
    assert 0 <= data["qibla_direction"] <= 360
