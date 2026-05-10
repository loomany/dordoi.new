from aiogram.fsm.state import State, StatesGroup


class VendorOnboarding(StatesGroup):
    language = State()
    add_store = State()
    phone = State()
    store_name = State()
    location_row = State()
    logo = State()
    description = State()
    categories = State()
    product_photos = State()
    container_photo = State()
    min_batch = State()
    payment = State()
    delivery_help = State()
    whatsapp_1 = State()
    whatsapp_2 = State()
    instagram = State()
    telegram_channel = State()
    samples = State()
    returns = State()
    returns_conditions = State()
