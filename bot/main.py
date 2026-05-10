from __future__ import annotations

import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage

from bot.config import load_settings
from bot.handlers import create_router
from bot.repository import VendorRepository

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
log = logging.getLogger(__name__)


async def main() -> None:
    settings = load_settings()
    repo = VendorRepository(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )
    bot = Bot(settings.telegram_bot_token)
    dp = Dispatcher(storage=MemoryStorage())
    dp.include_router(create_router(settings, repo))

    # Иначе webhook (если когда-то включали) забирает апдейты — long polling пустой.
    await bot.delete_webhook(drop_pending_updates=False)
    log.info("Webhook cleared for polling (vendor onboarding FSM)")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
