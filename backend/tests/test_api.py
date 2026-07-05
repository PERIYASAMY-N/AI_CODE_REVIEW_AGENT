"""
Backend Integration Tests — Module 12
Run with: pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

client = TestClient(app)

# ─── AUTH TESTS ─────────────────────────────────────────────────────────────

class TestAuth:
    REGISTER_PAYLOAD = {"name": "Test User", "email": "testuser_m12@example.com", "password": "securepass123"}
    LOGIN_PAYLOAD    = {"email": "testuser_m12@example.com", "password": "securepass123"}

    def test_register_success(self):
        res = client.post("/api/v1/auth/register", json=self.REGISTER_PAYLOAD)
        assert res.status_code in (201, 400)  # 400 if already seeded

    def test_register_duplicate_email(self):
        client.post("/api/v1/auth/register", json=self.REGISTER_PAYLOAD)
        res = client.post("/api/v1/auth/register", json=self.REGISTER_PAYLOAD)
        assert res.status_code == 400
        assert "already registered" in res.json()["detail"].lower()

    def test_register_short_password(self):
        payload = {**self.REGISTER_PAYLOAD, "email": "new2@test.com", "password": "123"}
        res = client.post("/api/v1/auth/register", json=payload)
        assert res.status_code == 422

    def test_login_success(self):
        client.post("/api/v1/auth/register", json=self.REGISTER_PAYLOAD)
        res = client.post("/api/v1/auth/login", json=self.LOGIN_PAYLOAD)
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self):
        res = client.post("/api/v1/auth/login", json={**self.LOGIN_PAYLOAD, "password": "wrongpass"})
        assert res.status_code == 401

    def test_login_unknown_email(self):
        res = client.post("/api/v1/auth/login", json={"email": "ghost@none.com", "password": "pass"})
        assert res.status_code == 401

    def _get_token(self):
        client.post("/api/v1/auth/register", json=self.REGISTER_PAYLOAD)
        res = client.post("/api/v1/auth/login", json=self.LOGIN_PAYLOAD)
        return res.json()["access_token"]

    def test_get_me_authenticated(self):
        token = self._get_token()
        res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        assert res.json()["email"] == self.LOGIN_PAYLOAD["email"]

    def test_get_me_no_token(self):
        res = client.get("/api/v1/auth/me")
        assert res.status_code == 403

    def test_get_me_invalid_token(self):
        res = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer totallyfaketoken"})
        assert res.status_code == 401


# ─── REVIEW ENDPOINT TESTS ──────────────────────────────────────────────────

class TestReview:
    REGISTER = {"name": "Review Tester", "email": "revtester_m12@test.com", "password": "password123"}
    LOGIN    = {"email": "revtester_m12@test.com", "password": "password123"}

    def _token(self):
        client.post("/api/v1/auth/register", json=self.REGISTER)
        return client.post("/api/v1/auth/login", json=self.LOGIN).json()["access_token"]

    def test_analyze_unauthenticated(self):
        res = client.post("/api/v1/review/analyze", json={"language": "python", "source_code": "print('hi')"})
        assert res.status_code == 403

    def test_analyze_invalid_language(self):
        token = self._token()
        res = client.post("/api/v1/review/analyze",
            json={"language": "brainfuck", "source_code": "some code here"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 422

    def test_analyze_source_too_short(self):
        token = self._token()
        res = client.post("/api/v1/review/analyze",
            json={"language": "python", "source_code": "hi"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 422

    def test_analyze_success_mocked(self):
        token = self._token()
        mock_result = {
            "bugs": [], "security_issues": [], "best_practices": ["Good code"],
            "optimizations": [], "root_cause": [],
            "corrected_code": "print('hello')",
            "summary": "Clean code.", "overall_score": 90,
            "security_score": 95, "maintainability_score": 88,
            "complexity": "Low", "estimated_time_complexity": "O(1)", "risk_level": "LOW"
        }
        with patch("app.services.ai_review_service.review_code", new=AsyncMock(return_value=mock_result)):
            res = client.post("/api/v1/review/analyze",
                json={"language": "python", "source_code": "print('hello world')"},
                headers={"Authorization": f"Bearer {token}"}
            )
        assert res.status_code == 200
        assert res.json()["overall_score"] == 90
        assert res.json()["risk_level"] == "LOW"


# ─── HISTORY & DASHBOARD TESTS ──────────────────────────────────────────────

class TestHistory:
    REGISTER = {"name": "Hist Tester", "email": "histtest_m12@test.com", "password": "password123"}
    LOGIN    = {"email": "histtest_m12@test.com", "password": "password123"}

    def _token(self):
        client.post("/api/v1/auth/register", json=self.REGISTER)
        return client.post("/api/v1/auth/login", json=self.LOGIN).json()["access_token"]

    def test_history_empty(self):
        token = self._token()
        res = client.get("/api/v1/history", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()
        assert "reviews" in data
        assert isinstance(data["reviews"], list)

    def test_history_unauthenticated(self):
        res = client.get("/api/v1/history")
        assert res.status_code == 403

    def test_history_filter_risk(self):
        token = self._token()
        res = client.get("/api/v1/history?risk_level=LOW", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200

    def test_history_filter_min_score(self):
        token = self._token()
        res = client.get("/api/v1/history?min_score=80", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200

    def test_dashboard_stats(self):
        token = self._token()
        res = client.get("/api/v1/dashboard/stats", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()
        assert "total_reviews" in data
        assert "average_score" in data

    def test_single_review_not_found(self):
        token = self._token()
        res = client.get("/api/v1/history/999999", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 404


# ─── USER PROFILE TESTS ─────────────────────────────────────────────────────

class TestUserProfile:
    REGISTER = {"name": "Profile Tester", "email": "profiletest_m12@test.com", "password": "password123"}
    LOGIN    = {"email": "profiletest_m12@test.com", "password": "password123"}

    def _token(self):
        client.post("/api/v1/auth/register", json=self.REGISTER)
        return client.post("/api/v1/auth/login", json=self.LOGIN).json()["access_token"]

    def test_update_name(self):
        token = self._token()
        res = client.put("/api/v1/users/me", json={"name": "Updated Name"},
            headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        assert res.json()["success"] is True

    def test_change_password_wrong_old(self):
        token = self._token()
        res = client.put("/api/v1/users/me/password",
            json={"old_password": "wrongpass", "new_password": "newpass123"},
            headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 400

    def test_change_password_success(self):
        token = self._token()
        res = client.put("/api/v1/users/me/password",
            json={"old_password": "password123", "new_password": "newpassword456"},
            headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
