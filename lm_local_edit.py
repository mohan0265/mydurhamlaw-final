import requests
import json

LM_STUDIO_API = "http://localhost:1234/v1/chat/completions"
MODEL_NAME = "gpt-oss-20b"

def edit_file_via_lm(prompt, filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    messages = [
        {"role": "system", "content": "You are a senior full-stack developer assistant. Edit the file directly to match the user's prompt. Output the final complete file content only."},
        {"role": "user", "content": f"Instruction:\n{prompt}\n\nCurrent file content:\n{code}"}
    ]

    response = requests.post(LM_STUDIO_API, json={
        "model": MODEL_NAME,
        "messages": messages,
        "temperature": 0.2
    })

    reply = response.json()['choices'][0]['message']['content']

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(reply)

    print(f"✅ File updated: {filepath}")

# Example usage:
edit_file_via_lm(
    prompt="Make this page fully mobile responsive using Tailwind's responsive classes and fix all layout issues.",
    filepath="src/pages/Wellbeing.tsx"
)
