# chat/utils.py

import time
import json
from openai import OpenAI
from django.conf import settings
import requests

client = OpenAI(api_key=settings.OPENAI_API_KEY)

def ask_assistant(assistant_id: str, payload: dict, timeout: float = 30.0) -> str:
    """
    Sends the given payload dict to the specified assistant ID,
    polling until the run completes or times out.
    """
    assistant = client.beta.assistants.retrieve(assistant_id)

    thread = client.beta.threads.create()

    instructions = (
        f"{assistant.instructions}\n\n"
        f"Here is the input payload in JSON:\n{json.dumps(payload)}"
    )
    run = client.beta.threads.runs.create(
        thread_id=thread.id,
        assistant_id=assistant_id,
        instructions=instructions
    )

    start = time.time()
    while run.status != "completed" and (time.time() - start) < timeout:
        time.sleep(0.5)
        run = client.beta.threads.runs.retrieve(
            thread_id=thread.id,
            run_id=run.id
        )

    messages = client.beta.threads.messages.list(thread_id=thread.id)
    if messages.data and messages.data[0].content:
        return messages.data[0].content[0].text.value

    return "⏳ No response (timed out or empty)."

def text_search_places(text_query: str, max_results: int = 20) -> list:
    """
    Fetch up to `max_results` places matching text_query, paging via nextPageToken.
    Defaults to 20 if max_results is omitted.
    """
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.PLACES_API_KEY,
        "X-Goog-FieldMask": ",".join([
            "places.displayName",
            "places.formattedAddress",
            "places.currentOpeningHours.openNow",
            "places.rating",
            "places.priceLevel"
        ]),
    }

    all_places = []
    body = {"textQuery": text_query}
    page_token = None

    while True:
        if page_token:
            body["pageToken"] = page_token
            # must wait briefly before using nextPageToken
            time.sleep(2)

        resp = requests.post(url, headers=headers, json=body, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        batch = data.get("places", [])
        all_places.extend(batch)

        # stop if we've reached the desired count
        if len(all_places) >= max_results:
            return all_places[:max_results]

        # prepare next page or exit
        page_token = data.get("nextPageToken")
        if not page_token:
            break

    return all_places

