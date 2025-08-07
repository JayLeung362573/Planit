from django.test import TestCase
from django.conf import settings
from .utils import ask_assistant
import os
import requests

class OpenAIAssistantTests(TestCase):
    def test_ask_assistant_returns_response(self):
        """Test OpenAI assistant returns a non-empty string for a simple prompt."""
        prompt = {"user_prompt": "Say hello!"}
        response = ask_assistant(settings.OPENAI_ASSISTANT_ID, prompt)
        self.assertIsInstance(response, str)
        self.assertTrue(len(response) > 0)

    def test_ask_assistant_handles_empty_prompt(self):
        """Test OpenAI assistant handles empty prompt gracefully."""
        prompt = {"user_prompt": ""}
        response = ask_assistant(settings.OPENAI_ASSISTANT_ID, prompt)
        self.assertIsInstance(response, str)

class WeatherAPITests(TestCase):
    def test_weather_api_valid_coords(self):
        """Test OpenWeatherMap API returns data for valid coordinates."""
        api_key = os.environ.get("OWM_KEY") or getattr(settings, "OWM_KEY", None)
        self.assertIsNotNone(api_key, "OWM_KEY must be set in environment or settings")
        lat, lon = 51.5074, -0.1278  # London
        url = (
            f"https://pro.openweathermap.org/data/2.5/forecast/hourly?"
            f"lat={lat}&lon={lon}&units=metric&appid={api_key}"
        )
        resp = requests.get(url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("list", data)
        self.assertIsInstance(data["list"], list)

    def test_weather_api_invalid_coords(self):
        """Test OpenWeatherMap API handles invalid coordinates."""
        api_key = os.environ.get("OWM_KEY") or getattr(settings, "OWM_KEY", None)
        self.assertIsNotNone(api_key, "OWM_KEY must be set in environment or settings")
        lat, lon = 999, 999
        url = (
            f"https://pro.openweathermap.org/data/2.5/forecast/hourly?"
            f"lat={lat}&lon={lon}&units=metric&appid={api_key}"
        )
        resp = requests.get(url)
        # OWM returns 400 or 404 for invalid
