import os
from unittest.mock import MagicMock, patch

import pytest

os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-service-role-key")


def make_user(*, role: str | None = None) -> MagicMock:
    user = MagicMock()
    user.app_metadata = {"role": role} if role else {}
    user.id = "test-user-id"
    user.email = "test@example.com"
    return user


@pytest.fixture
def admin_user():
    return make_user(role="admin")


@pytest.fixture
def customer_user():
    return make_user()


@pytest.fixture
def mock_supabase():
    with patch("dependencies.supabase") as mock_client:
        yield mock_client


@pytest.fixture
def client():
    from fastapi.testclient import TestClient
    from main import app

    return TestClient(app)
