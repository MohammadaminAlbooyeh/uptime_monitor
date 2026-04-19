from typing import List

# Example configuration - replace with environment-driven values in production
SITES = [
    {
        "id": 1,
        "name": "Salary Calculator",
        "url": "https://salary-calculator-five-ecru.vercel.app/",
    },
    {
        "id": 2,
        "name": "User Auth API",
        "url": "https://user-authentication-api-ashen.vercel.app/",
    },
    {
        "id": 3,
        "name": "Air Quality + Weather",
        "url": "https://air-quality-index-weather-live.vercel.app/",
    },
    {
        "id": 4,
        "name": "Job Finder Bot",
        "url": "https://job-finder-bot-tau.vercel.app/",
    },
]
CHECK_INTERVAL_SECONDS = 60

# Telegram notifier (use .env to set these values)
TELEGRAM_BOT_TOKEN = ""  # set from .env
TELEGRAM_CHAT_ID = ""    # set from .env
