from gc import callbacks

import time
import telebot
import os
from dotenv import load_dotenv
from telebot import TeleBot, types
from telebot.types import InlineKeyboardButton

from db_calls import get_main_categories_list, get_category_groups, get_all_categories, get_item_groups, get_all_items, \
    get_drop_points_list, manage_main_categories, manage_category_groups, manage_category, manage_item_groups, \
    manage_items, manage_drop_points, get_all_category_details, manage_category_details, get_user_by_order

from workbook_master import create_main_categories_template, create_category_groups_template, \
    create_categories_template, create_item_groups_template, create_items_template, create_drop_points_template, \
    get_data_from_file, save_doc, construct_main_categories, construct_category_groups, construct_categories, \
    construct_items, construct_drop_point, construct_item_groups, create_category_details_template, \
    construct_category_details

load_dotenv()

secret = os.getenv('bot_token')
bot: TeleBot = telebot.TeleBot(secret)

ACTIONS = {
    'mmcb': ('Главные категории', create_main_categories_template, get_main_categories_list, manage_main_categories, construct_main_categories),
    'mcgb': ('Группы категорий', create_category_groups_template, get_category_groups, manage_category_groups, construct_category_groups),
    'mcb': ('Категории', create_categories_template, get_all_categories, manage_category, construct_categories),
    'mcdb': ('Характеристики', create_category_details_template, get_all_category_details, manage_category_details, construct_category_details),
    'migb': ('Группы товаров', create_item_groups_template, get_item_groups, manage_item_groups, construct_item_groups),
    'mpb': ('Товары', create_items_template, get_all_items, manage_items, construct_items),
    'mdpb': ('Пункты вывоза заказов', create_drop_points_template, get_drop_points_list, manage_drop_points, construct_drop_point)
}

def receive_file(message, mod, operation, extruct_data_func, db_action_func):
    file_info = bot.get_file(message.document.file_id)
    downloaded_file = bot.download_file(file_info.file_path)
    filled_file_path = os.path.join("storage", message.document.file_name)
    with open(filled_file_path, "wb") as new_file:
        new_file.write(downloaded_file)
    if mod == 'mpb':
        data = extruct_data_func(operation, get_data_from_file(message.document.file_name))
    else:
        data = extruct_data_func(get_data_from_file(message.document.file_name))
    if data is None:
        bot.send_message(message.from_user.id, 'Не корректно заполнен файл, попробуйте еще раз!')
        bot.register_next_step_handler(message, receive_file, mod, operation, extruct_data_func, db_action_func)
    else:
        bot.send_message(message.from_user.id, 'Данные успешно прошли проверку!')
        db_action_func(True if operation == 'add' else False, data)
        bot.send_message(message.from_user.id, 'Изменения были примененны!')


def construct_main_menu():
    main_menu_keyboard = types.InlineKeyboardMarkup(row_width=1)
    manage_main_categories_btn = types.InlineKeyboardButton(text='Управление главными категориями',callback_data='ctrl_mmcb')
    manage_categories_groups_btn = types.InlineKeyboardButton(text='Управление группами категорий',callback_data='ctrl_mcgb')
    manage_categories_btn = types.InlineKeyboardButton(text='Управление категориями', callback_data='ctrl_mcb')
    manage_category_details_btn = types.InlineKeyboardButton(text='Управление характеристиками', callback_data='ctrl_mcdb')
    manage_items_groups_btn = types.InlineKeyboardButton(text='Управление группами товаров',callback_data='ctrl_migb')
    manage_products_btn = types.InlineKeyboardButton(text='Управление товарами', callback_data='ctrl_mpb')
    manage_drop_points_btn = types.InlineKeyboardButton(text='Управление пунктами вывоза',callback_data='ctrl_mdpb')
    main_menu_keyboard.add(
        manage_main_categories_btn,
        manage_categories_groups_btn,
        manage_categories_btn,
        manage_category_details_btn,
        manage_items_groups_btn,
        manage_products_btn,
        manage_drop_points_btn
    )
    return main_menu_keyboard

@bot.message_handler(commands=['start'])
def start(message):
    
    if str(message.from_user.id) == os.getenv('admin_id'):
        bot.send_message(message.from_user.id, text='Меню выбора действия:', reply_markup=construct_main_menu())
    else:
        bot.send_message(message.from_user.id, text='Для открытия приложения, откройте профиль бота и нажмите кнопку "Отрыть приложение"')

@bot.callback_query_handler(func=lambda call: True)
def callback_worker(call):
    if '_' in call.data:
        operation, mod = call.data.split('_')
    else:
        operation = call.data

    if operation == 'ctrl':
        msg_text = ACTIONS[mod][0]
        action_keyboard = types.InlineKeyboardMarkup(row_width=1)
        add_btn = types.InlineKeyboardButton(text='Добавить', callback_data=f'add_{mod}')
        edit_btn = types.InlineKeyboardButton(text='Изменить', callback_data=f'edit_{mod}')
        back_btn = types.InlineKeyboardButton(text='Назад', callback_data='back')
        action_keyboard.add(add_btn, edit_btn, back_btn)
        bot.edit_message_text(chat_id=call.message.chat.id, message_id=call.message.id, text=f'{msg_text} (Выберите операцию):')
        bot.edit_message_reply_markup(chat_id=call.message.chat.id, message_id=call.message.id, reply_markup=action_keyboard)

    elif operation == 'back':
        bot.edit_message_text(chat_id=call.message.chat.id, message_id=call.message.id, text='Меню выбора действия:')
        bot.edit_message_reply_markup(chat_id=call.message.chat.id, message_id=call.message.id, reply_markup=construct_main_menu())

    elif operation in ('add', 'edit'):
        if mod in ACTIONS:
            msg_text, template_func, template_data_func, db_action_func, extruct_data_func = ACTIONS[mod]
            bot.send_message(call.message.chat.id, 'Генерирую шаблон, пожалуйста подождите...')
            doc = template_func() if operation == 'add' else template_func(template_data_func())
            save_doc(doc, mod)
            bot.send_message(call.message.chat.id, 'Шаблон сгенерирован. Необходимо заполнить все ячейки в строке для успешной обработки и внесение изменений в интернет магазин.')
            bot.send_document(call.message.chat.id, document=open(f'storage/doc_{mod}.xlsx','rb'),caption=f'Файл ({msg_text})')
            bot.send_message(call.message.chat.id, 'Перехожу в режим ожидания документа.')
            bot.register_next_step_handler(call.message, receive_file, mod, operation, extruct_data_func, db_action_func)
        else:
            bot.send_message(call.message.chat.id, "Неизвестная операция!")
            return
    elif operation == 'dismiss':
        bot.delete_message(call.message.chat.id, call.message.id)

def run_bot():
    while True:
        try:
            bot.infinity_polling(timeout=10, long_polling_timeout=5)
        except Exception as e:
            print(f"Error occurred: {e}")
            time.sleep(15)  # Ждем перед повторным запуском

if __name__ == '__main__':
    run_bot()