from openpyxl.workbook import Workbook

import db_connector

def contruct_order_list(data):
    orders = {}
    for row in data:
        order_id = row['order_id']
        if order_id not in orders:
            orders[order_id] = {
                'id': order_id,
                'items_count': 0,
                'status': row['os_name'],
                'items': []
            }
        orders[order_id]['items_count'] += row['quantity']
        orders[order_id]['items'].append(
            {
                'album': row['album']
            }
        )
    return orders

def db_exec_get_request(procedure, args = []):

    conn = db_connector.connect()
    cursor = conn.cursor(dictionary=True)
    cursor.callproc(procedure, args)
    results = []
    for result in cursor.stored_results():
        results.extend(result.fetchall())
    cursor.close()
    conn.close()
    return results

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

def get_all_categories():
    results = db_exec_get_request('get_all_categories')

    grouped_categories = {}

    for row in results:
        group_name = row['group_name']
        if group_name not in grouped_categories:
            grouped_categories[group_name] = {
                'group_name': group_name,
                'group_is_hidden' : row['group_is_hidden'],
                'categories': []
            }
        grouped_categories[group_name]['categories'].append({
            'category_id': row['category_id'],
            'name': row['category_name'],
            'icon': row['icon'],
            'category_is_hidden': row['category_is_hidden']
        })

    return list(grouped_categories.values())  # Теперь это список объектов с group_name и categories

def get_items(category_id):
    results = db_exec_get_request('get_items',[category_id])
    grouped_items = {}

    for row in results:
        group_name = row['group_name']
        group_id = row['item_group_id']
        if group_name not  in grouped_items:
            grouped_items[group_name] = {
                'group_id' : group_id,
                'group_name' : group_name,
                'items' : []
            }
        grouped_items[group_name]['items'].append({
            'id' : row['item_id'],
            'name' : row['item_name'],
            'normal_price' : row['normal_price'],
            'description' : row['description'],
            'discount_price' : row['discount_price'],
            'album' : row['album']
        })
    return list(grouped_items.values())

def get_items_from_group(items_group_id):
    return db_exec_get_request('get_items_from_group', [items_group_id])

def get_item(item_id, user_id):
    return db_exec_get_request('get_item', [item_id, get_active_cart_id(user_id)])[0]

def get_item_details(item_id):
    raw_results = db_exec_get_request('get_item_details', [item_id])
    results = {
        'main' : [],
        'sub' : []
    }
    for raw_result in raw_results:
        if raw_result['is_main']:
            results['main'].append(raw_result)
        else:
            results['sub'].append(raw_result)

    return results

def get_discount_items():
    return db_exec_get_request('get_discount_items')

def get_newest_items():
    return db_exec_get_request('get_newest_items')

def get_favorites(user_id):
    return db_exec_get_request('get_favorites', [user_id])

def is_favorite(item_id, user_id):
    return bool(db_exec_get_request('is_favorite', [item_id, user_id])[0]['fav_status'])

def insert_into_favorites(item_id ,user_id):
    conn = db_connector.connect()
    cursor = conn.cursor()
    cursor.callproc('insert_into_favorites', [item_id, user_id])
    conn.commit()
    cursor.close()
    conn.close()
    return 0

def delete_from_favorites(item_id, user_id):
    conn = db_connector.connect()
    cursor = conn.cursor()
    cursor.callproc('delete_from_favorites', [item_id, user_id])
    conn.commit()
    cursor.close()
    conn.close()
    return 0

def create_cart(user_id):
    conn = db_connector.connect()
    cursor = conn.cursor()
    cursor.callproc('create_cart', [user_id])
    conn.commit()
    cursor.close()
    conn.close()
    return 0

def insert_item_into_cart(item_id, user_id):
    cart_id = get_active_cart_id(user_id)
    conn = db_connector.connect()
    cursor = conn.cursor()
    cursor.callproc('insert_item_into_cart', [item_id, cart_id])
    conn.commit()
    cursor.close()
    conn.close()
    return 0

def increment_item_count_in_cart(item_id, user_id):
    conn = db_connector.connect()
    cursor = conn.cursor()
    cursor.callproc('increment_item_count_in_cart', [item_id, get_active_cart_id(user_id)])
    conn.commit()
    cursor.close()
    conn.close()
    return 0

def decrement_item_count_in_cart(item_id, user_id):
    cart_id = get_active_cart_id(user_id)
    conn = db_connector.connect()
    cursor = conn.cursor()
    cursor.callproc('decrement_item_count_in_cart', [item_id, cart_id])
    conn.commit()
    cursor.close()
    conn.close()
    return 0

def delete_from_cart(item_id, user_id):
    cart_id = get_active_cart_id(user_id)
    conn = db_connector.connect()
    cursor = conn.cursor()
    cursor.callproc('delete_from_cart', [item_id, cart_id])
    conn.commit()
    cursor.close()
    conn.close()
    return 0

def get_cart(user_id = None, cart_id = None):
    if cart_id is None:
        cart_id = get_active_cart_id(user_id)
    return db_exec_get_request('get_cart', [cart_id])

def get_active_cart_id(user_id):
    result = db_exec_get_request('get_active_cart_id', [user_id])
    if len(result) > 0:
        return result[0]['cart_id']
    else:
        return None

def get_cart_id(order_id):
    return db_exec_get_request('get_cart_id', [order_id])[0]['cart_id']

def remove_cart_details(user_id):
    cart_id = get_active_cart_id(user_id)
    conn = db_connector.connect()
    cursor = conn.cursor()
    cursor.callproc('remove_cart_details', [cart_id])
    conn.commit()
    cursor.close()
    conn.close()
    return 0

def insert_order(user_id, drop_point_id = 1, payment_method_id = 1):
    cart_id = get_active_cart_id(user_id)
    conn = db_connector.connect()
    cursor = conn.cursor()
    cursor.callproc('insert_order', [cart_id, user_id, drop_point_id, payment_method_id])
    cursor.execute('SELECT LAST_INSERT_ID()')
    order_id = cursor.fetchone()[0]
    print(order_id)
    conn.commit()
    cursor.close()
    conn.close()
    return order_id

def get_user_by_order(order_id):
    return db_exec_get_request('get_user_by_order', [order_id])[0]

def get_orders(user_id):
    return list(contruct_order_list(db_exec_get_request('get_orders', [user_id])).values())

def get_order(order_id, user_id):
    cart_id = get_cart_id(order_id)
    items = get_cart(user_id, cart_id)
    cart_info = get_cart_info(items)
    order_info = get_order_info(order_id)
    order = {
        'order_id' : order_id,
        'user_id' : order_info['user_id'],
        'order_status' : order_info['status_name'],
        'status_description': order_info['status_description'],
        'drop_point' : order_info['drop_point'],
        'payment_method' : order_info['payment_method'],
        'payment_method_icon' : order_info['icon'],
        'is_completed' : order_info['is_completed'],
        'is_canceled': order_info['is_canceled'],
        'items' : items,
        'cart_info' : cart_info
    }
    return order

def get_order_info(order_id):
    return db_exec_get_request('get_order_info', [order_id])[0]

def get_order_statuses():
    return db_exec_get_request('get_order_statuses')

def get_payment_methods():
    return db_exec_get_request('get_payment_methods')

def get_drop_points():
    return db_exec_get_request('get_drop_points')

def cancel_order(order_id, user_id):
    conn = db_connector.connect()
    cursor = conn.cursor()
    cursor.callproc('cancel_order', [order_id, user_id])
    conn.commit()
    cursor.close()
    conn.close()
    return 0

def get_orders_admin(status_id, is_completed = False, is_canceled = False):

    if is_completed:
        results = db_exec_get_request('get_completed_orders_admin')
    elif is_canceled:
        results = db_exec_get_request('get_canceled_orders_admin')
    else:
        results = db_exec_get_request('get_orders_admin', [status_id])

    return list(contruct_order_list(results).values())


def update_order_status(order_id, status_id, is_completed):
    conn = db_connector.connect()
    cursor = conn.cursor()
    if is_completed:
        cursor.callproc('set_order_completed', [order_id])
    else:
        cursor.callproc('update_order_status', [order_id, status_id])
    conn.commit()
    cursor.close()
    conn.close()
    return 0

def get_category_groups():
    return db_exec_get_request('get_category_groups')

def get_item_groups():
    return db_exec_get_request('get_item_groups')

def get_all_items():
    items_details = get_all_items_details()
    results = db_exec_get_request('get_all_items')
    items = {}
    for row in results:
        item_id = row['id']
        if item_id not in items:
            items[item_id]={
                'item_id': item_id,
                'category_name': row['category_name'],
                'item_group_name': row['item_group_name'],
                'name': row['name'],
                'price': row['price'],
                'discount': row['discount'],
                'album': row['album'],
                'is_hidden' : row['is_hidden'],
                'details': []
            }
        if item_id in items_details:
            items[item_id]['details'] = items_details[item_id]['details']
    return items

def get_all_items_details():
    results = db_exec_get_request('get_all_items_details')
    items_details={}
    for row in results:
        item_id = row['item_id']
        if item_id not in items_details:
            items_details[item_id]={
                'item_id': item_id,
                'details': []
            }
        items_details[item_id]['details'].append({
                'name': row['name'],
                'value': row['value']
        })
    return items_details

def get_all_category_details():
    results = db_exec_get_request('get_category_details_list')
    return results
    pass
def get_main_categories_list():
    results = db_exec_get_request('get_main_categories_list')
    escaped_results = {}
    for result in results:
        escaped_results[result['name']] = result['id']
    return escaped_results

def get_category_groups_list():
    results = db_exec_get_request('get_category_groups_list')
    escaped_results = {}
    for result in results:
        escaped_results[result['name']] = result['id']
    return escaped_results

def get_categories_list():
    results = db_exec_get_request('get_categories_list')
    escaped_results = {}
    for result in results:
            escaped_results[f'"{result["name"]}"'] = result['category_id']
    return escaped_results

def get_items_groups_list():
    results = db_exec_get_request('get_item_groups')
    escaped_results = {}
    for result in results:
        escaped_results[f'"{result["name"]}"'] = result['id']
    return escaped_results

def get_category_details_list():
    results = db_exec_get_request('get_category_details_list')
    escaped_results = {}
    for result in results:
        escaped_results[result['name']] = result['id']
    print(escaped_results)
    return escaped_results

def get_drop_points_list():
    results = db_exec_get_request('get_drop_points_list')
    return results

def manage_main_categories(new_entry, data):
    conn = db_connector.connect()
    cursor = conn.cursor()
    if new_entry:
        for mc in data:
            cursor.callproc('add_main_category', [mc['name']])
    else:
        for mc in data:
            cursor.callproc('update_main_category', [mc['id'], mc['name']])
    conn.commit()
    cursor.close()
    conn.close()
    pass

def manage_category_groups(new_entry, data):
    conn = db_connector.connect()
    cursor = conn.cursor()
    if new_entry:
        for cg in data:
            cursor.callproc('add_category_group', [ cg['main_category'], cg['name'], cg['is_hidden']])
    else:
        for cg in data:
            cursor.callproc('update_category_group', [cg['id'], cg['main_category'],cg['name'], cg['is_hidden']])
    conn.commit()
    cursor.close()
    conn.close()
    pass

def manage_category(new_entry, data):
    conn = db_connector.connect()
    cursor = conn.cursor()
    if new_entry:
        for c in data:
            cursor.callproc('add_category', [c['name'], c['group'], c['album'], c['is_hidden']])
    else:
        for c in data:
            cursor.callproc('update_category', [c['id'], c['name'], c['group'], c['album'], c['is_hidden']])
    conn.commit()
    cursor.close()
    conn.close()
    pass

def manage_item_groups(new_entry, data):
    conn = db_connector.connect()
    cursor = conn.cursor()
    if new_entry:
        for ig in data:
            cursor.callproc('add_item_group', [ig['name'], ig['is_hidden']])
    else:
        for ig in data:
            cursor.callproc('update_item_group', [ig['id'], ig['name'], ig['is_hidden']])
    conn.commit()
    cursor.close()
    conn.close()
    pass

def manage_items(new_entry, data):
    conn = db_connector.connect()
    cursor = conn.cursor()
    if new_entry:
        for i in data:
            cursor.callproc('add_item', [i['category'], i['group'], i['name'], i['price'], i['discount'], i['album'], i['is_hidden']])
            cursor.execute('SELECT LAST_INSERT_ID()')
            item_id = cursor.fetchone()[0]
            for item_detail in i['details']:
                cursor.callproc('add_item_details',
                                [item_id, item_detail['id'], item_detail['value']])
    else:
        for i in data:
            cursor.callproc('update_item', [i['id'], i[ 'category'], i['group'], i['name'], i['price'], i['discount'], i['album'], i['is_hidden']])
            for item_detail in i['details']:
                cursor.callproc('update_item_details',
                            [i['id'], item_detail['id'], item_detail['value']])
    conn.commit()
    cursor.close()
    conn.close()
    pass

def manage_drop_points(new_entry, data):
    conn = db_connector.connect()
    cursor = conn.cursor()
    if new_entry:
        for dp in data:
            cursor.callproc('add_drop_point', [dp['country'], dp['city'], dp['street'], dp['building'], dp['notes'], dp['is_hidden']])
    else:
        for dp in data:
            cursor.callproc('update_drop_point', [dp['id'], dp['country'], dp['city'], dp['street'], dp['building'], dp['notes'], dp['is_hidden']])
    conn.commit()
    cursor.close()
    conn.close()
    pass

def manage_category_details(new_entry, data):
    conn = db_connector.connect()
    cursor = conn.cursor()
    if new_entry:
        for cd in data:
            cursor.callproc('add_category_detail', [cd['main_category_id'], cd['name'], cd['is_main']])
    else:
        for cd in data:
            cursor.callproc('update_category_detail', [cd['id'] ,cd['main_category_id'], cd['name'], cd['is_main']])
    conn.commit()
    cursor.close()
    conn.close()
    pass