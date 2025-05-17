function fetchOrders(){
    document.getElementById('content').style.display = 'none';
    document.getElementById('loading').style.display = 'flex';
    updateIcons('orders');
    updatePageHeader('orders');

    history.replaceState({isInitial: true, screen: 'orders'},null,null);
    updateBackButtonVisibility();

    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

    fetch(`/orders`, {
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
        if (data.data.length>0){
            presentOrders(data.data);
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

function presentOrders(orders){
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
        orderCard.onclick = () => fetchOrder(order.id);
        cardContainer.appendChild(orderCard);
    });
}

function fetchOrder(orderId, historyEnabled = true){
    document.getElementById('content').style.display = 'none';
    document.getElementById('loading').style.display = 'flex';
    updateIcons('orders');
    updatePageHeader('orders');

    if (historyEnabled){
        history.pushState({screen: history.state.screen}, null, null);
    }
    else {
        history.replaceState({screen: history.state.screen}, null, null);
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

            presentOrder(data.data);            
        })
        .catch(error => {
            console.error('Ошибка загрузки контента:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
            document.getElementById('content').innerHTML = "<h2>Произошла ошибка при загрузке контента. Попробуйте еще раз.</h2>";
        });
}

function presentOrder(order){
    fetchOrderStatuses(order.order_status, order.is_completed, order.is_canceled);

    presentCart(order.items, order.cart_info, true);

    document.getElementById('drop-point').textContent = order.drop_point;
    document.getElementById('payment-method-icon').src = `/static/img/${order.payment_method_icon}`;
    document.getElementById('payment-method').textContent = order.payment_method;

    if (order.is_completed || order.is_canceled){
        document.getElementById('cancel-btn').remove();
    }
    else{
        document.getElementById('cancel-btn').onclick = () => presentWarningOverlay(cancelOrder, order.order_id);
    }
}

function fetchOrderStatuses(currentStatus, isCompleted, isCanceled){
    fetch(`/order_statuses`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Сетевая ошибка: ' + response.statusText); // Если ответ не успешный
            }
            return response.json(); // Пытаемся парсить JSON
        })
        .then(data => {
            presentOrderStatusSection(data.data, currentStatus, isCompleted, isCanceled);
        })
        .catch(error => {
            console.error('Ошибка загрузки контента:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
            document.getElementById('content').innerHTML = "<h2>Произошла ошибка при загрузке контента. Попробуйте еще раз.</h2>";
        });
}

function presentOrderStatusSection(statuses, currentStatus, isCompleted, isCanceled){
    const statusesContainer = document.getElementById('statuses-container');

    if (isCanceled || isCompleted){
        const statusContainer = document.createElement('div');
        if(!isCanceled){
            statusContainer.textContent = 'завершен';
        }
        else{
            statusContainer.textContent = 'отменен';
        }
        statusesContainer.appendChild(statusContainer);
        statusContainer.style.fontWeight = 'bold';
    }
    else{
    statuses.forEach(status => {
        const statusContainer = document.createElement('div');
        statusContainer.textContent = status.name;

        const line1 = document.createElement('hr');
        line1.className = 'vertical';

        const line2 = document.createElement('hr');
        line2.className = 'vertical';

        const statusDescriptionContainer = document.createElement('div');
        statusDescriptionContainer.className = 'status-description-container';

        const statusImg = document.createElement('img');
        statusImg.className = 'icon small';
        statusImg.src = `/static/img/${status.link}`;

        const statusDescription = document.createElement('div');
        statusDescription.textContent = status.description;
        
        statusDescriptionContainer.append(statusImg, statusDescription);

        if(status.name == currentStatus && !isCompleted && !isCanceled){
            statusContainer.style.fontWeight = 'bold';
        }
        else{
            statusContainer.style.opacity = '60%';
            statusDescriptionContainer.style.opacity = '60%';
        }
        
        statusesContainer.append(statusContainer, line1, statusDescriptionContainer, line2);
    });
    
    const statusContainer = document.createElement('div');
    if(!isCanceled){
        statusContainer.textContent = 'завершен';
    }
    else{
        statusContainer.textContent = 'отменен';
    }

    if(!isCompleted && !isCanceled){
        statusContainer.style.opacity = '60%';
    }
    else{
        statusContainer.style.fontWeight = 'bold';
    }
    statusesContainer.appendChild(statusContainer);
}
}

function createOrder(){
    const selectedPaymentMethod = document.querySelector('input[name="payment-methods"]:checked')?.value;
    const selectedDropPoint = document.querySelector('input[name="drop-points"]:checked')?.value;
    closeOrderOverlay();
    document.getElementById('content').style.display = 'none';
    document.getElementById('loading').style.display = 'flex';
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

    fetch(`/create_order?payment_method=${selectedPaymentMethod}&drop_point=${selectedDropPoint}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Сетевая ошибка: ' + response.statusText); // Если ответ не успешный
            }
            return response.json(); // Пытаемся парсить JSON
        })
        .then(data => {
            history.replaceState({isInitial: true, screen: 'orders'},null,null);
            updateBackButtonVisibility();
            console.log(data.order_id);
            fetchOrder(data.order_id, true);
            // updateCartSummary();
        })
        .catch(error => {
            // console.error('Ошибка загрузки контента:', error);
            document.getElementById('content').style.display = 'flex';
            document.getElementById('content').innerHTML = "<h2>Произошла ошибка при загрузке контента. Попробуйте еще раз.</h2>";
        });
}

function cancelOrder(orderId) {
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

    fetch('/cancel_order', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order_id: orderId })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Сетевая ошибка: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        fetchOrder(orderId);  // Обновляем интерфейс после успешной отмены
    })
    .catch(error => {
        console.error('Ошибка при отмене заказа:', error);
        // Обработка ошибки, например, показ сообщения пользователю
    });
}

function fetchOrderOptions(){
    document.getElementById('order-overlay').style.display = 'flex';
    fetch(`/order_form_data`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Сетевая ошибка: ' + response.statusText); // Если ответ не успешный
            }
            return response.json(); // Пытаемся парсить JSON
        })
        .then(data => {
            presentOrderOverlay(data.payment_methods, data.drop_points);
        })
        .catch(error => {
            // console.error('Ошибка загрузки контента:', error);
            // document.getElementById('content').innerHTML = "<h2>Произошла ошибка при загрузке контента. Попробуйте еще раз.</h2>";
        });
}

function presentOrderOverlay(paymentMethods, dropPoints){
    // document.getElementById('order-overlay').style.display = 'flex';
    document.getElementById('loading-order-options').style.display = 'none';
    addPaymentsOptions('payment-methods', paymentMethods, document.getElementById('payment-methods-container'));
    addDropPointsOptions('drop-points', dropPoints, document.getElementById('drop-points-container'));    
    checkFormValidity();
}

function closeOrderOverlay(){
    document.getElementById('payment-methods-container').reset();
    document.getElementById('drop-points-container').reset();
    checkFormValidity();
    document.getElementById('order-overlay').style.display = 'none';
}

function addPaymentsOptions(inputName, items, optionsContainer){
    optionsContainer.innerHTML = '';
    items.forEach(item => {
        const paymentOption = addOption(inputName, item);
        paymentOption.className = 'grid-object radio-btn column-template';
        optionsContainer.appendChild(paymentOption);
    });
    optionsContainer.addEventListener('change', checkFormValidity);
}

function addDropPointsOptions(inputName, items, optionsContainer){
    optionsContainer.innerHTML = '';
    items.forEach(item => {
        const dropPointOption = addOption(inputName, item);
        dropPointOption.className = 'radio-btn';
        optionsContainer.appendChild(dropPointOption);
    });
    optionsContainer.addEventListener('change', checkFormValidity);
}

function addOption(inputName, item){
        const optionBtn = document.createElement('div');
                
        const input = document.createElement('input');
        input.type = 'radio';
        input.id = `${inputName}Option${item.id}`;
        input.name = inputName;
        input.value = item.id;
        input.required = true;

        const label = document.createElement('label');
        label.htmlFor = `${inputName}Option${item.id}`;
    
        const optionDetails = document.createElement('div');
        optionDetails.className = 'flex-row';

        if (item.icon){
            const icon = document.createElement('img');
            icon.className = 'icon';
            icon.src = `/static/img/${item.icon}`;   
            optionDetails.appendChild(icon);                        
        }
        const text = document.createTextNode(` ${item.name}`);

        optionDetails.appendChild(text);

        label.appendChild(optionDetails);
    
        optionBtn.appendChild(input);
        optionBtn.appendChild(label);
    
        return optionBtn;
} 

function checkFormValidity(){
    const paymentMethodsForm = document.getElementById('payment-methods-container');
    const dropPointsForm = document.getElementById('drop-points-container');
    const submitBtn = document.getElementById('create-order-btn')

    if (paymentMethodsForm.checkValidity() && dropPointsForm.checkValidity()){
        submitBtn.classList.remove('disabled');
        submitBtn.onclick = () => createOrder();
    }
    else{
        submitBtn.classList.add('disabled');
        submitBtn.onclick = null;
    }
}
