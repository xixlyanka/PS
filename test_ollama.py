import requests
import json

print("Attempting to connect to Ollama at http://localhost:11434...")

try:
    # Пытаемся получить список моделей
    response = requests.get("http://localhost:11434/api/tags", timeout=10)

    # Проверяем, был ли успешным HTTP-запрос
    response.raise_for_status() 

    # Декодируем ответ
    data = response.json()

    # Проверяем, есть ли модели в ответе
    if data.get("models"):
        print("\nSUCCESS! Successfully connected to Ollama and found models:")
        # Красиво выводим имена моделей
        for model in data["models"]:
            print(f"- {model['name']}")
    else:
        print("\nWARNING: Connected to Ollama, but no models were found.")

except requests.exceptions.ConnectionError as e:
    print(f"\nERROR: Connection failed. Could not connect to the Ollama server.")
    print("Please ensure the Ollama application is running on your Mac.")
    print(f"Details: {e}")

except requests.exceptions.Timeout:
    print(f"\nERROR: Connection timed out. The Ollama server is not responding.")

except requests.exceptions.RequestException as e:
    print(f"\nERROR: An unexpected request error occurred.")
    print(f"Details: {e}")

except json.JSONDecodeError:
    print(f"\nERROR: Received an invalid response from the server. It was not valid JSON.")
    print(f"Response text: {response.text}")

except Exception as e:
    print(f"\nAn unknown error occurred: {e}")