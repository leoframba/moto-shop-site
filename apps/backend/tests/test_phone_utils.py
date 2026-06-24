from phone_utils import normalize_phone_to_e164, resolve_optional_phone
import pytest
from fastapi import HTTPException


def test_normalize_phone_to_e164_ten_digits():
    assert normalize_phone_to_e164("5551234567") == "+15551234567"
    assert normalize_phone_to_e164("(555) 123-4567") == "+15551234567"


def test_normalize_phone_to_e164_eleven_digits():
    assert normalize_phone_to_e164("15551234567") == "+15551234567"


def test_normalize_phone_to_e164_invalid():
    assert normalize_phone_to_e164("55512") is None
    assert normalize_phone_to_e164(None) is None
    assert normalize_phone_to_e164("") is None


def test_resolve_optional_phone_empty():
    assert resolve_optional_phone(None) is None
    assert resolve_optional_phone("   ") is None


def test_resolve_optional_phone_invalid_raises():
    with pytest.raises(HTTPException) as exc:
        resolve_optional_phone("123")
    assert exc.value.status_code == 400
