import json
import re
import requests
from django.http import JsonResponse

from django.shortcuts import render, redirect
from django.urls import reverse
from django.conf import settings
from django.views.decorators.http import require_POST

from .utils import ask_assistant, text_search_places

def chat_view(request):
    """
    Renders the initial chat form where user enters location, date, and prompt.
    """
    return render(request, "chat/chat.html", {
        "owm_key": settings.OWM_KEY,
    })

def loader_view(request):
    """
    Handles the POST from chat_view, stores form data in session, 
    and shows a loading page before redirecting to generate_view.
    """
    if request.method != "POST":
        return redirect("chat_view")

    request.session["form_data"] = {
        "location": request.POST.get("location", ""),
        "date":     request.POST.get("date", ""),
        "prompt":   request.POST.get("prompt", "").strip(),
        "hourly":   request.POST.get("hourly_forecast_input", "[]"),
    }

    return render(request, "chat/loader.html", {
        "generate_url": reverse("generate_view"),
    })

def generate_view(request):
    """
    Reads form_data from session, fetches weather and Places API results,
    bundles them into a JSON payload, sends to OpenAI, parses activities,
    then stores everything in session before redirecting to schedule_view.
    """
    form = request.session.get("form_data", {})
    if not form:
        return redirect("chat_view")

    location = form["location"]
    date_str = form["date"]
    prompt   = form["prompt"]
    try:
        hourly = json.loads(form["hourly"])
    except json.JSONDecodeError:
        hourly = []

    # 1) Assistant-generated activities (unchanged flow)
    activities = []
    if prompt:
        payload = {
            "location":        location,
            "date":            date_str,
            "user_prompt":     prompt,
            "hourly_forecast": hourly,
        }
        raw = ask_assistant(settings.OPENAI_ASSISTANT_ID, payload)
        clean = raw.strip()
        m = re.search(r"```(?:json)?\n(.+?)```", clean, flags=re.S)
        jstr = m.group(1) if m else clean
        try:
            data = json.loads(jstr)
            activities = data.get("activities", [])
        except json.JSONDecodeError:
            activities = []

    # 2) Fetch 30 POIs via Text Search
    categories = (
        "tourist attractions, restaurants and museums"
    )
    text_query = f"{categories} in {location}"
    try:
        places = text_search_places(text_query, max_results=20)
    except TypeError:
        places = text_search_places(text_query)
    except requests.RequestException:
        places = []

    # 3) Annotate open/closed and price label
    price_labels = {
        "PRICE_LEVEL_FREE": "Free",
        "PRICE_LEVEL_INEXPENSIVE": "Inexpensive ($)",
        "PRICE_LEVEL_MODERATE": "Moderate ($$)",
        "PRICE_LEVEL_EXPENSIVE": "Expensive ($$$)",
        "PRICE_LEVEL_VERY_EXPENSIVE": "Very Expensive ($$$$)",
    }
    for place in places:
        current = place.get("currentOpeningHours")
        place["isOpen"]     = (current is None) or current.get("openNow", False)
        enum                = place.get("priceLevel")
        place["priceLabel"] = price_labels.get(enum, "No info")

    # 4) Build & serialize combined payload
    combined = {
        "location":        location,
        "date":            date_str,
        "hourly_forecast": hourly,
        "places":          places,
        "user_prompt":     prompt,
    }
    combined_json = json.dumps(combined)

    # 5) Send to OpenAI (pass dict), parse activities
    raw = ask_assistant(settings.OPENAI_ASSISTANT_ID, combined)
    clean = raw.strip()
    m = re.search(r"```(?:json)?\n(.+?)```", clean, flags=re.S)
    jstr = m.group(1) if m else clean
    try:
        data = json.loads(jstr)
        activities = data.get("activities", [])
    except json.JSONDecodeError:
        activities = []

    # 6) Store everything for schedule_view
    request.session["combined_json"] = combined_json
    request.session["activities"]    = activities
    request.session["places"]        = places
    request.session["location"]      = location
    request.session["date"]          = date_str
    request.session["prompt"]        = prompt

    return redirect("schedule_view")

def schedule_view(request):
    """
    Renders the final schedule page, pulling activities, places, and raw
    payload JSON from session.
    """
    combined_json = request.session.pop("combined_json", "{}")
    activities    = request.session.pop("activities", [])
    places        = request.session.pop("places", [])
    location      = request.session.pop("location", "")
    date_str      = request.session.pop("date", "")
    prompt        = request.session.pop("prompt", "")

    for act in activities:
        act['expected_weather_code'] = act.get('weather_icon', '')

    return render(request, "chat/schedule.html", {
        "combined_json": combined_json,
        "activities":    activities,
        "places":        places,
        "location":      location,
        "date":          date_str,
        "prompt":        prompt,
    })

@require_POST
def reflect_view(request):
    """
    Expects a POST with JSON body:
      { "activities": [ {time, location, description, rating, feedback}, … ] }
    Calls the reflection assistant, strips any markdown fences, parses JSON,
    and returns a clean JSON response with keys:
      summary, reflections, accomplishments, next_step
    """
    body = json.loads(request.body)
    activities = body.get("activities", [])

    # Call the assistant
    raw = ask_assistant(settings.REFLECTION_ASSISTANT_ID, {"activities": activities})

    # Strip Markdown ```json fences``` if present
    fence_match = re.search(r"```(?:json)?\s*(\{[\s\S]*\})\s*```", raw, flags=re.S)
    json_str = fence_match.group(1) if fence_match else raw

    # Parse JSON
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError:
        # Fallback: wrap raw text as reflections
        data = {
            "summary": "",
            "reflections": raw.strip(),
            "accomplishments": [],
            "next_step": ""
        }

    return JsonResponse(data)

@require_POST
def helper_view(request):
    """
    Accepts { question: str, activities: [ ... ] }
    Calls the helper assistant and returns its reply.
    """
    body = json.loads(request.body)
    question   = body.get("question", "")
    activities = body.get("activities", [])

    # Build payload for helper AI
    payload = {
        "question": question,
        "activities": activities
    }

    raw = ask_assistant(settings.HELPER_ASSISTANT_ID, payload)
    # assume raw is plain text reply
    return JsonResponse({"reply": raw.strip()})

def weather_view(request):
    owm_key = settings.OWM_KEY
    return render(request, "chat/weather.html", {"owm_key": owm_key})