from django.urls import path
from .views import chat_view, loader_view, generate_view, schedule_view

urlpatterns = [
    path("",      chat_view,     name="chat_view"),
    path("load/", loader_view,   name="loader_view"),
    path("gen/",  generate_view, name="generate_view"),
    path("plan/", schedule_view, name="schedule_view"),
]
