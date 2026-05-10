from aiogram.fsm.state import State, StatesGroup


class VendorPhotoBatch(StatesGroup):
    collecting = State()


class VendorOnboarding(StatesGroup):
    language = State()
    phone = State()
    store_name = State()
    location_row = State()
    logo = State()
    description = State()
    description_detail = State()
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
    samples_custom = State()
    returns = State()
    returns_conditions = State()
