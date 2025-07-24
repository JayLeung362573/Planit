import json
import re
from django.conf import settings
from django.shortcuts import render, redirect
from django.urls import reverse
from .utils import ask_assistant

def chat_view(request):
    return render(request, "chat/chat.html", {
        "owm_key": settings.OWM_KEY,
    })

def loader_view(request):
    if request.method != "POST":
        return redirect("chat_view")

    request.session["form_data"] = {
        "location": request.POST.get("location", ""),
        "date": request.POST.get("date", ""),
        "prompt": request.POST.get("prompt", "").strip(),
        "hourly": request.POST.get("hourly_forecast_input", "[]"),
    }

    return render(request, "chat/loader.html", {
        "generate_url": reverse("generate_view"),
    })

def generate_view(request):
    form = request.session.get("form_data", {})
    if not form:
        return redirect("chat_view")

    location = form["location"]
    date     = form["date"]
    prompt   = form["prompt"]
    try:
        hourly = json.loads(form["hourly"])
    except json.JSONDecodeError:
        hourly = []

    activities = []
    if prompt:
        payload = {
            "location":        location,
            "date":            date,
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

    request.session["activities"] = activities
    request.session["location"]   = location
    request.session["date"]       = date

    return redirect("schedule_view")

def schedule_view(request):
    activities = request.session.pop("activities", [])
    location   = request.session.pop("location", "")
    date       = request.session.pop("date", "")

    return render(request, "chat/schedule.html", {
        "activities": activities,
        "location":   location,
        "date":       date,
    })
