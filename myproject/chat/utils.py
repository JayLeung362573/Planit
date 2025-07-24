# chat/utils.py

import time
import json
from openai import OpenAI
from django.conf import settings

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
