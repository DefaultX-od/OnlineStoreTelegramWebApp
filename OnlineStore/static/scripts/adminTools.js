function loadMainAdmin(){
    document.getElementById('content').style.display = 'none';
    document.getElementById('footer').style.display = 'none';
    document.getElementById('loading').style.display = 'flex';
    updateIcons('home');
    updatePageHeader('home');

    history.replaceState({isInitial: true, screen: 'main'},null,null);
    updateBackButtonVisibility();

    fetch(`/main_admin`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Сетевая ошибка: ' + response.statusText); // Если ответ не успешный
            }
            return response.json(); // Пытаемся парсить JSON
        })
        .then(data => {
            document.getElementById('content').innerHTML = data.content;
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
        })
        .catch(error => {
            console.error('Ошибка загрузки контента:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
            document.getElementById('content').innerHTML = "<h2>Произошла ошибка при загрузке контента. Попробуйте еще раз.</h2>";
        });
}

function loadOrdersAdmin(statusId, isCompleted = false, isCanceled = false, historyEnabled = true){
    document.getElementById('content').style.display = 'none';
    document.getElementById('loading').style.display = 'flex';
    updateIcons('orders');
    updatePageHeader('orders');
    
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];
    
    if (historyEnabled){
        history.pushState({
            screen: history.state.screen,
            statusId: statusId, 
            isCompleted: isCompleted,
            isCanceled:isCanceled
        }, null, null);
    }
    else {
        history.replaceState({
            screen: history.state.screen,
            statusId: statusId, 
            isCompleted: isCompleted,
            isCanceled:isCanceled
        }, null, null);
    }
    updateBackButtonVisibility();

    fetch('/get_orders_admin', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            status_id : statusId,
            is_completed : isCompleted,
            is_canceled : isCanceled
         })  // Отправляем данные в теле запроса
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Сетевая ошибка: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('content').innerHTML = data.content;
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
            if (data.data.length>0){
                showOrdersAdmin(data.data);
            }
            else{
                document.getElementById('content').innerHTML = "";
            }
    })
    .catch(error => {
        console.error('Ошибка загрузки контента:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
            document.getElementById('content').innerHTML = "<h2>Произошла ошибка при загрузке контента. Попробуйте еще раз.</h2>";
    });
}

function showOrdersAdmin(orders){
    const cardContainer = document.getElementById('order-card-container');
    orders.forEach(order => {
        const paddingBox = document.createElement('div');
        paddingBox.className = 'padding-box';

        const orderCard = document.createElement('div');
        orderCard.className = 'list-object row-template';

        const orderDetailsUpper = document.createElement('div');
        orderDetailsUpper.className = 'list-object-details column-template';

        const orderStatus = document.createElement('div');
        orderStatus.className = 'txt-big';
        orderStatus.textContent = order.status;

        const orderNumber = document.createElement('div');
        orderNumber.textContent = order.id;

        orderDetailsUpper.append(orderStatus, orderNumber);

        const orderGallery = document.createElement('div');
        orderGallery.className = 'list-object-gallery-container';

        order.items.forEach(item => {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'img-container';

            const img = document.createElement('img');
            img.src = item.album;
            img.referrerPolicy = "no-referrer";

            imgContainer.appendChild(img);
            orderGallery.appendChild(imgContainer);
        });

        const orderDetailsLower = document.createElement('div');
        orderDetailsLower.className = 'list-object-details column-template';

        const itemCount = document.createElement('div');
        itemCount.textContent = `${order.items_count} ${getProductWordAccordingToQuantity(order.items_count)}`;

        orderDetailsLower.appendChild(itemCount);
        paddingBox.append(orderDetailsUpper, orderGallery, orderDetailsLower);
        orderCard.appendChild(paddingBox);
        orderCard.onclick = () => loadOrderAdmin(order.id);
        cardContainer.appendChild(orderCard);
    });
}

function loadOrderAdmin(orderId, historyEnabled = true){
    document.getElementById('content').style.display = 'none';
    document.getElementById('loading').style.display = 'flex';
    updateIcons('orders');
    updatePageHeader('orders');

    if (historyEnabled){
        history.pushState({screen: history.state.screen, orderId: orderId}, null, null);
    }
    else {
        history.replaceState({screen: history.state.screen, orderId: orderId}, null, null);
    }
    updateBackButtonVisibility();

    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

    fetch(`/order?order_id=${orderId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Сетевая ошибка: ' + response.statusText);
        }
        return response.json();
    })
        .then(data => {
            document.getElementById('content').innerHTML = data.content;
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';

            showOrderAdmin(data.data);            
        })
        .catch(error => {
            console.error('Ошибка загрузки контента:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
            document.getElementById('content').innerHTML = "<h2>Произошла ошибка при загрузке контента. Попробуйте еще раз.</h2>";
        });
}

function showOrderAdmin(order){
    fetchOrderStatuses(order.order_status, order.is_completed, order.is_canceled);
    presentCart(order.items, order.cart_info, true);

    document.getElementById('drop-point').textContent = order.drop_point;
    document.getElementById('payment-method-icon').src = `/static/img/${order.payment_method_icon}`;
    document.getElementById('payment-method').textContent = order.payment_method;

    document.getElementById('cancel-btn').remove();
    
    showAdminTools(order.order_status, order.order_id, order.is_completed, order.is_canceled);
    console.log(order.order_status);
}

function showAdminTools(currentStatus, orderId, isCompleted, isCanceled){

    if (!isCompleted && !isCanceled){

        const adminBtn = document.createElement('div');
        adminBtn.className = 'btn-colored full-length admin';

        const labelBtn = document.createElement('div');
        labelBtn.className = 'label'; 
    
        switch (currentStatus){
            case 'cоздан' :
                labelBtn.textContent = 'Принять к работе';
                adminBtn.onclick = () => setOrderStatus(orderId, 2);
                break;
            case 'сборка' :
                labelBtn.textContent = 'Заказ собран';
                adminBtn.onclick = () => setOrderStatus(orderId, 4);
                break;
            case 'готов к выдаче' :
                labelBtn.textContent = 'Заказ выдан';
                adminBtn.onclick = () => setOrderStatus(orderId, 4, true);
                break;
        }
        adminBtn.appendChild(labelBtn);
        document.getElementById('cart-info').appendChild(adminBtn);
    }
}

function setOrderStatus(orderId, statusId, isCompleted = false){
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];
    fetch('/set_order_status', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            order_id: orderId,
            status_id : statusId,
            is_completed : isCompleted
         })  // Отправляем данные в теле запроса
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Сетевая ошибка: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        loadOrderAdmin(orderId, false);  // Обновляем интерфейс после успешной отмены
    })
    .catch(error => {
        console.error('Ошибка при отмене заказа:', error);
        // Обработка ошибки, например, показ сообщения пользователю
    });
}

