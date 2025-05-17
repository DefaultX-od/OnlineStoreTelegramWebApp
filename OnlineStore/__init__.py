from concurrent.futures import ThreadPoolExecutor

import telebot
from telebot import TeleBot, types
from flask import Flask, render_template, jsonify, request, url_for
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity


import os
from dotenv import load_dotenv

load_dotenv()

secret = os.getenv('bot_token')
bot: TeleBot = telebot.TeleBot(secret)

from db_calls import get_items_from_group, get_all_categories, get_items, \
    get_item_details, get_item, get_favorites, insert_into_favorites, is_favorite, delete_from_favorites, \
    insert_item_into_cart, increment_item_count_in_cart, decrement_item_count_in_cart, delete_from_cart, get_cart, \
    remove_cart_details, get_discount_items, get_newest_items, insert_order, create_cart, get_orders, get_order, \
    get_order_statuses, get_payment_methods, get_drop_points, cancel_order, \
    update_order_status, get_orders_admin, get_active_cart_id, get_user_by_order
from image_manager import get_images, get_image

app = Flask(__name__)

app.config["JWT_SECRET_KEY"] = os.getenv('bot_token')  # Замените на реальный секрет в продакшене
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 86400  # 24 часа в секундах
jwt = JWTManager(app)

def notify_user(text, user_id):
    dismiss_keyboard = types.InlineKeyboardMarkup()
    dismiss_btn = types.InlineKeyboardButton('Прочитано', callback_data='dismiss')
    dismiss_keyboard.add(dismiss_btn)

    try:
        bot.send_message(user_id, text, reply_markup=dismiss_keyboard)
    except:
        pass

def get_cart_info(items):
    cart_info = {
        'item_count' : 0,
        'total_full_cart_price': 0,
        'total_discount_cart_price' : 0,
        'total_discount' : 0
    }
    for item in items:
        cart_info['item_count'] += item['quantity']
        cart_info['total_full_cart_price'] += item['quantity']*item['normal_price']
        cart_info['total_discount_cart_price'] += item['quantity']*item['discount_price']
    cart_info['total_discount'] = cart_info['total_full_cart_price'] - cart_info['total_discount_cart_price']
    return cart_info

@app.route('/')
def init():
        return render_template('auth.html')

@app.route('/auth', methods=['POST'])
def auth():
    data = request.get_json()
    if not data or 'user_id' not in data:
        return jsonify({"error": "Missing user_id"}), 400
        
    try:
        user_id = str(data['user_id'])
        access_token = create_access_token(identity=user_id)
        return jsonify({"accessToken": access_token})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/load_app_ui')
@jwt_required()
def load_app_ui():
    user_id = get_jwt_identity()
    admin_id = str(os.getenv('admin_id'))

    if user_id == admin_id:
        return render_template('base_admin.html')
    else:
        return render_template('base.html')


@app.route('/create_cart')
@jwt_required()
def fresh_user_setup():
    user_id = get_jwt_identity()
    if get_active_cart_id(user_id) is None:
        create_cart(user_id)
    return jsonify()

@app.route('/main')
def main():
    discount_items = get_discount_items()
    newest_items = get_newest_items()
    categories = get_all_categories()
    for group in categories:
        if group['group_is_hidden']:
            categories.remove(group)
        else:
            for category in group['categories']:
                if category['category_is_hidden']:
                    group['categories'].remove(category)
                else:
                    category['icon'] = get_image(category['icon'])
    with ThreadPoolExecutor() as executor:
        executor.map(lambda item: item.update({'album': get_images(item['album'])[0]}), discount_items)
        executor.map(lambda item: item.update({'album': get_images(item['album'])[0]}), newest_items)
    return jsonify(discount_items=discount_items, newest_items=newest_items, categories=categories)

@app.route('/main_admin')
def main_admin():
    content = render_template('main_admin.html')
    return jsonify(content=content)

@app.route('/categories')
def show_categories():
    categories = get_all_categories()
    for group in categories:
        if group['group_is_hidden']:
            categories.remove(group)
        else:
            for category in group['categories']:
                if category['category_is_hidden']:
                    group['categories'].remove(category)
                else:
                    category['icon'] = get_image(category['icon'])
    return jsonify(data=categories)

@app.route('/items')
def show_items():
    category_id = request.args.get('category_id')
    item_group_id = request.args.get('group_id')
    if category_id:
        items_groups = get_items(category_id)
        with ThreadPoolExecutor() as executor:
            for group in items_groups:
                executor.map(lambda item: item.update({'album': get_images(item['album'])[0]}), group['items'])
        return jsonify(data=items_groups)
    if item_group_id:
        items = get_items_from_group(item_group_id)
        with ThreadPoolExecutor() as executor:
            executor.map(lambda item: item.update({'album': get_images(item['album'])[0]}), items)
        print(items[0])
        return jsonify(data=items)



@app.route('/item')
@jwt_required()
def show_item():
    user_id = get_jwt_identity()
    item_id = request.args.get('item_id')
    fav_status = is_favorite(item_id, user_id)
    item = get_item(item_id, user_id)
    item_details = get_item_details(item_id)
    main_details = item_details['main']
    sub_details = item_details['sub']
    item_album = get_images(item['album'])
    content = render_template('item.html')
    return jsonify(content=content, item=item, main_details=main_details, sub_details=sub_details, item_album=item_album, fav_status=fav_status)
    pass

@app.route('/favorites')
@jwt_required()
def show_favorites():
    user_id = get_jwt_identity()
    items = get_favorites(user_id)
    with ThreadPoolExecutor() as executor:
        executor.map(lambda item: item.update({'album': get_images(item['album'])[0]}), items)
    return jsonify(data=items)

@app.route('/cart')
@jwt_required()
def show_cart():
    user_id = get_jwt_identity()
    items = get_cart(user_id)
    with ThreadPoolExecutor() as executor:
        executor.map(lambda item: item.update({'album': get_images(item['album'])[0]}), items)
    cart_info = get_cart_info(items)
    content = render_template('cart.html')
    return jsonify(content=content, items=items, cart_info=cart_info)
    pass

@app.route('/clear_cart')
@jwt_required()
def clear_cart():
    user_id = get_jwt_identity()
    remove_cart_details(user_id)
    return jsonify()

@app.route('/update_cart_info')
@jwt_required()
def update_cart_info():
    user_id = get_jwt_identity()
    cart_info = get_cart_info(get_cart(user_id))
    return jsonify(cart_info=cart_info)
    pass


@app.route('/orders')
@jwt_required()
def show_orders():
    user_id = get_jwt_identity()
    content = render_template('orders.html')
    orders = get_orders(user_id)

    with ThreadPoolExecutor() as executor:
        for order in orders:
            executor.map(lambda item: item.update({'album': get_images(item['album'])[0]}), order['items'])

    return jsonify(content=content, data=orders)

@app.route('/order')
@jwt_required()
def show_order():
    user_id = get_jwt_identity()
    admin_id = os.getenv('admin_id')
    order_id = request.args.get('order_id')
    content = render_template('order.html')
    order = get_order(order_id, user_id)
    
    if order['user_id'] == float(user_id) or user_id == str(admin_id):
        with ThreadPoolExecutor() as executor:
            executor.map(lambda item: item.update({'album': get_images(item['album'])[0]}), order['items'])
        return jsonify(content=content, data=order)
    else:
        return jsonify(content='Доступ запрещен!', data=None)

@app.route('/order_statuses')
def show_order_statuses():
    order_statuses = get_order_statuses()
    return jsonify(data=order_statuses)
    pass

@app.route('/order_form_data')
def get_order_form_data():
    payment_methods = get_payment_methods()
    drop_points = get_drop_points()
    return jsonify(payment_methods=payment_methods, drop_points = drop_points)

@app.route('/add_to_cart')
@jwt_required()
def add_to_cart():
    user_id = get_jwt_identity()
    item_id = request.args.get('item_id')
    insert_item_into_cart(item_id, user_id)
    return jsonify()

@app.route('/remove_from_cart')
@jwt_required()
def remove_from_cart():
    user_id = get_jwt_identity()
    item_id = request.args.get('item_id')
    delete_from_cart(item_id, user_id)
    return jsonify()

@app.route('/item_increment')
@jwt_required()
def item_increment():
    user_id = get_jwt_identity()
    item_id = request.args.get('item_id')
    increment_item_count_in_cart(item_id, user_id)
    return jsonify()

@app.route('/item_decrement')
@jwt_required()
def item_decrement():
    user_id = get_jwt_identity()
    item_id = request.args.get('item_id')
    decrement_item_count_in_cart(item_id, user_id)
    return jsonify()

@app.route('/add_to_favorites')
@jwt_required()
def add_to_favorites():
    user_id = get_jwt_identity()
    item_id = request.args.get('item_id')
    insert_into_favorites(item_id, user_id)
    return jsonify()

@app.route('/remove_from_favorites')
@jwt_required()
def remove_from_favorites():
    user_id = get_jwt_identity()
    item_id = request.args.get('item_id')
    delete_from_favorites(item_id, user_id)
    return jsonify()

@app.route('/cancel_order', methods=['POST'])
@jwt_required()
def call_cancel_order():
    user_id = get_jwt_identity()
    data = request.json
    order_id = data.get('order_id')
    cancel_order(order_id, user_id)
    notify_user(f'Заказ №{order_id} был отменен пользователем!', os.getenv('admin_id'))
    return jsonify({"status": "success"})

@app.route('/create_order')
@jwt_required()
def create_order():
    user_id = get_jwt_identity()
    payment_method = request.args.get('payment_method')
    drop_point = request.args.get('drop_point')
    order_id = insert_order(user_id, drop_point, payment_method)
    print(order_id)
    create_cart(user_id)
    notify_user('У вас новый заказ!', os.getenv('admin_id'))
    return jsonify(order_id = order_id)

@app.route('/get_orders_admin', methods=['POST'])
@jwt_required()
def show_orders_admin():
    user_id = get_jwt_identity()
    admin_id = os.getenv('admin_id')
    if str(user_id) == admin_id:
        data = request.json  # Получаем данные из тела запроса
        status_id = data.get('status_id')
        is_completed = data.get('is_completed')
        is_canceled = data.get('is_canceled')
        orders = get_orders_admin(status_id, is_completed, is_canceled)
        content = render_template('orders.html')
        with ThreadPoolExecutor() as executor:
            for order in orders:
                executor.map(lambda item: item.update({'album': get_images(item['album'])[0]}), order['items'])
        return jsonify({
            "status": "success",
            "content": content,
            "data": orders
        })
    else:
        return jsonify({"status": "fail",
                        "content" : "Доступ запрещен!"
        })


@app.route('/set_order_status', methods=['POST'])
@jwt_required()
def set_order_status():
    user_id = get_jwt_identity()
    admin_id = os.getenv('admin_id')
    if str(user_id) == admin_id:
        data = request.json  # Получаем данные из тела запроса
        order_id = data.get('order_id')
        status_id = data.get('status_id')
        is_completed = data.get('is_completed')
        update_order_status(order_id, status_id, is_completed)
        customer_id = get_user_by_order(order_id)['user_id']
        notify_user(f'Статус вашего заказа №{order_id}, был обновлен!', customer_id)
        return jsonify({"status": "success"})
    else:
        return jsonify({"status": "fail"})


if __name__ == '__main__':
    app.run()
