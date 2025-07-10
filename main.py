import webview
import json
import os
import time
import requests
import threading
import subprocess
from datetime import datetime

# --- Конфигурация безопасности ---
BASE_DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Api:
    def __init__(self):
        self.window = None
        self.role_models = {
            "ORCHESTRATOR_MODEL": "", "SPEAKER_MODEL": "",
            "ANALYST_MODEL": "", "CODER_MODEL": ""
        }
        self.tasks = {
            "todo": [
                {"id": 1, "title": "Разложить план пентеста для цели XYZ", "status": "В очереди"},
                {"id": 2, "title": "Анализировать логи веб-сервера на аномалии", "status": "В очереди"}
            ],
            "inprogress": [
                {"id": 3, "title": "Сканировать порты на 192.168.1.1", "status": "Выполняется"}
            ],
            "done": [
                {"id": 4, "title": "Получить список моделей Ollama", "status": "Завершено"},
                {"id": 5, "title": "Инициализировать Git-репозиторий для 'new-project'", "status": "Завершено"}
            ]
        }
    
    def _evaluate_js(self, script):
        if self.window:
            self.window.evaluate_js(script)

    def _log_to_frontend(self, level, source, message):
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "level": level.upper(),
            "source": source,
            "message": message
        }
        self._evaluate_js(f'window.addLogMessage({json.dumps(log_entry)})')

    def _get_safe_path(self, user_path):
        if not user_path:
            return BASE_DIRECTORY
        safe_path = os.path.normpath(os.path.join(BASE_DIRECTORY, user_path))
        if os.path.commonpath([BASE_DIRECTORY, safe_path]) != BASE_DIRECTORY:
            raise PermissionError("Доступ к путям за пределами директории проекта запрещен.")
        return safe_path

    def jsReady(self):
        """Вызывается из JS, когда он готов."""
        print("--- DEBUG: Python получил сигнал jsReady() от JavaScript! ---")
        self._log_to_frontend("info", "Bridge", "JavaScript готов. Инициализация бэкенда.")
        threading.Thread(target=self.initialize_backend_data).start()

    def initialize_backend_data(self):
        print("--- DEBUG: Запускаю initialize_backend_data в отдельном потоке... ---")
        try:
            self._log_to_frontend("info", "Ollama", "Запрос моделей с http://localhost:11434...")
            print("--- DEBUG: Пытаюсь подключиться к Ollama... ---")
            response = requests.get("http://localhost:11434/api/tags", timeout=10)
            response.raise_for_status()
            ollama_models = response.json().get('models', [])
            print(f"--- DEBUG: Успешно получено {len(ollama_models)} моделей от Ollama. ---")
            
            if ollama_models:
                default_model = ollama_models[0]['name']
                for role in self.role_models:
                    self.role_models[role] = default_model
            else:
                self._log_to_frontend("warning", "Ollama", "Ollama запущена, но нет установленных моделей.")
            
            print("--- DEBUG: Вызываю window.initialize() на фронтенде... ---")
            self._evaluate_js(f'window.initialize({json.dumps(ollama_models)}, {json.dumps(self.role_models)})')
            print("--- DEBUG: Команда window.initialize() отправлена. ---")

        except Exception as e:
            print(f"--- DEBUG ERROR в initialize_backend_data: {e} ---")
            self._log_to_frontend("error", "Ollama", f"Не удалось подключиться к Ollama: {e}")
            print("--- DEBUG: Вызываю window.initialize() на фронтенде (по ветке ошибки)... ---")
            self._evaluate_js('window.initialize([], {})')
            print("--- DEBUG: Команда window.initialize() отправлена (по ветке ошибки). ---")
            self._evaluate_js('window.addSystemMessage("ОШИБКА: Не удалось подключиться к Ollama. Убедитесь, что приложение запущено.")')

    def sendMessage(self, message: str, attachments: list):
        self._log_to_frontend("info", "User", f"Получено сообщение: '{message}' с {len(attachments)} вложениями.")
        self._evaluate_js('window.updateAgentState({"isThinking": true})')
        try:
            selected_model = self.role_models.get("SPEAKER_MODEL")
            if not selected_model:
                raise ValueError("Модель для роли SPEAKER не выбрана в настройках.")
            
            self._log_to_frontend("info", "Orchestrator", f"Отправка запроса модели: {selected_model}")
            
            prompt = message
            images_data = [att['content'] for att in attachments if 'image' in att['type']]
            
            payload = { "model": selected_model, "prompt": prompt, "stream": False }
            if images_data:
                payload["images"] = images_data

            response = requests.post("http://localhost:11434/api/generate", json=payload, timeout=120)
            response.raise_for_status()
            response_content = response.json().get("response", "От модели не получен ответ.")
            
            self._log_to_frontend("info", "Agent", "Получен ответ от модели.")
            self._evaluate_js('window.updateAgentState({"isThinking": false, "isTyping": true})')
            time.sleep(0.5)
            self._evaluate_js(f'window.addAgentMessage({json.dumps(response_content)}, [])')

        except Exception as e:
            error_message = f"Произошла ошибка: {e}"
            self._log_to_frontend("error", "Agent", error_message)
            self._evaluate_js(f'window.addSystemMessage({json.dumps(error_message)})')
            self._evaluate_js('window.updateAgentState({"isThinking": false, "isTyping": false})')

    def saveModelSelection(self, role: str, model_name: str):
        self.role_models[role] = model_name
        self._log_to_frontend("info", "Settings", f"Установлена модель {model_name} для роли {role}")

    def pullOllamaModel(self, model_name: str):
        def _pull():
            try:
                self._log_to_frontend("info", "Ollama", f"Начинаю загрузку модели: {model_name}")
                response = requests.post("http://localhost:11434/api/pull", json={"name": model_name, "stream": True}, stream=True)
                response.raise_for_status()
                for chunk in response.iter_lines():
                    if chunk:
                        data = json.loads(chunk.decode('utf-8'))
                        status = data.get("status", "")
                        if "error" in data: raise Exception(data["error"])
                        if "total" in data and "completed" in data:
                            progress = (data["completed"] / data["total"]) * 100
                            status_msg = f'{status} ({progress:.1f}%)'
                        else: status_msg = status
                        self._evaluate_js(f'window.updateModelPullProgress({json.dumps(status_msg)})')
                        if status == "success": break
                self._log_to_frontend("info", "Ollama", f"Модель {model_name} успешно загружена!")
            except Exception as e:
                self._log_to_frontend("error", "Ollama", f"Ошибка при загрузке модели: {e}")
            finally:
                self._evaluate_js('window.updateModelPullProgress("")')
                self.initialize_backend_data()
        threading.Thread(target=_pull).start()

    def listFiles(self, path: str = '.'):
        try:
            safe_path = self._get_safe_path(path)
            self._log_to_frontend("info", "FileSystem", f"Запрос списка файлов в: {safe_path}")
            items = []
            for item in os.listdir(safe_path):
                item_path = os.path.join(safe_path, item)
                items.append({
                    "name": item,
                    "type": "folder" if os.path.isdir(item_path) else "file",
                    "path": os.path.relpath(item_path, BASE_DIRECTORY)
                })
            return items
        except Exception as e:
            self._log_to_frontend("error", "FileSystem", f"Ошибка чтения директории: {e}")
            return []

    def readFileContent(self, path: str):
        try:
            safe_path = self._get_safe_path(path)
            self._log_to_frontend("info", "FileSystem", f"Чтение файла: {safe_path}")
            with open(safe_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except Exception as e:
            self._log_to_frontend("error", "FileSystem", f"Ошибка чтения файла: {e}")
            return f"# ОШИБКА: Не удалось прочитать файл.\n# {e}"

    def writeFileContent(self, path: str, content: str):
        try:
            safe_path = self._get_safe_path(path)
            self._log_to_frontend("info", "FileSystem", f"Запись {len(content)} байт в: {safe_path}")
            with open(safe_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except Exception as e:
            self._log_to_frontend("error", "FileSystem", f"Ошибка записи файла: {e}")
            return False

    def executeCode(self, code: str):
        self._log_to_frontend("info", "Executor", "Выполнение Python кода...")
        try:
            result = subprocess.run(
                ['python', '-c', code], 
                capture_output=True, text=True, timeout=30, cwd=BASE_DIRECTORY
            )
            output = result.stdout
            error = result.stderr
            if error:
                self._log_to_frontend("error", "Executor", f"Ошибка выполнения:\n{error}")
            else:
                self._log_to_frontend("info", "Executor", f"Код выполнен с кодом возврата {result.returncode}")
            return {"stdout": output, "stderr": error, "returncode": result.returncode}
        except Exception as e:
            self._log_to_frontend("error", "Executor", f"Не удалось запустить код: {e}")
            return {"stdout": "", "stderr": str(e), "returncode": 1}

    def getTasks(self):
        return self.tasks

def start_webview():
    api = Api()
    html_path = os.path.join(os.path.dirname(__file__), 'dist', 'index.html')
    
    if not os.path.exists(html_path):
        print("ОШИБКА: Файл dist/index.html не найден. Сначала соберите проект командой `npm run build`.")
        return

    window = webview.create_window('Project Singularity', url=html_path, js_api=api, width=1200, height=800, min_size=(800, 600))
    api.window = window
    webview.start(debug=True)

if __name__ == '__main__':
    start_webview()
