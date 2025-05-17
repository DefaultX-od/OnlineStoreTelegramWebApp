let totalItems;

function fetchCart(){
    document.getElementById('content').style.display = 'none';
    document.getElementById('loading').style.display = 'flex';
    updateIcons('cart');
    updatePageHeader('cart');

    history.replaceState({isInitial: true, screen: 'cart'},null,null);
    updateBackButtonVisibility();

    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

    fetch(`/cart`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })  .then(response => {
            if (!response.ok) {
                throw new Error('Сетевая ошибка: ' + response.statusText); // Если ответ не успешный
            }
            return response.json(); // Пытаемся парсить JSON
        })
        .then(data => {
            document.getElementById('content').innerHTML = data.content;
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
            if (data.items.length>0){
                totalItems = data.cart_info.item_count;
                presentCart(data.items, data.cart_info)
                // showCartItems(data.items);
                // showCartInfo(data.cart_info);
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

function presentCart(items, cartSummary,isOrder = false){
    const itemListContainer = document.getElementById('list-container');

    items.forEach(function callback(item, index){
        let listObject = document.createElement('div');
        listObject.className = 'list-object';
        listObject.id = `item-${item.item_id}`;

        let listObjectImgContainer = document.createElement('div');
        listObjectImgContainer.className = 'list-object-img-container';
        let itemImg = document.createElement('img');
        itemImg.src = item.album;
        itemImg.referrerPolicy = 'no-referrer';

        listObjectImgContainer.appendChild(itemImg);

        let listObjectDetails = document.createElement('div');
        listObjectDetails.className = 'list-object-details';

        let productName = document.createElement('div');
        productName.className = 'product-name';
        productName.textContent = item.name;

        const priceContainer = document.createElement('div');
        priceContainer.className = "price-container";

        if(isOrder){
            const itemCount = document.createElement('div');
            itemCount.textContent = `${item.quantity} шт. `
            priceContainer.appendChild(itemCount);
        }

        if (item.normal_price == item.discount_price) {
            const normalPrice = document.createElement("div");
            normalPrice.textContent = `${item.normal_price}₽`;
            normalPrice.className = "product-price";
            priceContainer.appendChild(normalPrice);
        }
        else {
            const oldPrice = document.createElement("div");
            const newPrice = document.createElement("div");

            oldPrice.className = "product-price old";
            newPrice.className = "product-price new";

            oldPrice.textContent = item.normal_price;
            newPrice.textContent = `${item.discount_price}₽`;

            priceContainer.appendChild(newPrice);
            priceContainer.appendChild(oldPrice);
        }        

        listObjectDetails.append(productName, priceContainer);

        if(!isOrder){
            listObjectDetails.appendChild(setupProductQuantityControls(item.item_id, item.quantity));
        }

        listObject.append(listObjectImgContainer, listObjectDetails);

        itemListContainer.appendChild(listObject);
    });

    const itemsCount = document.getElementById('items-count');
    itemsCount.textContent = `${cartSummary.item_count} ${getProductWordAccordingToQuantity(cartSummary.item_count)}`;

    const cartFullPrice = document.getElementById('cart-full-price');
    cartFullPrice.textContent = cartSummary.total_full_cart_price;

    const cartDiscount = document.getElementById('cart-discount');
    cartDiscount.textContent = `-${cartSummary.total_discount}`;

    const cartFinalPrice = document.getElementById('cart-final-price');
    cartFinalPrice.textContent = cartSummary.total_discount_cart_price;
}

function updateCartSummary(){
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

    fetch(`/update_cart_info`, {
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
            totalItems = data.cart_info.item_count;
            if (data.cart_info.item_count == 0){
                document.getElementById('content').innerHTML = "";
                document.getElementById('loading').style.display = 'none';
                document.getElementById('content').style.display = 'flex';
            }
            else{       
                const itemsCount = document.getElementById('items-count');
                itemsCount.textContent = `${data.cart_info.item_count} ${getProductWordAccordingToQuantity(data.cart_info.item_count)}`;
            
                const cartFullPrice = document.getElementById('cart-full-price');
                cartFullPrice.textContent = data.cart_info.total_full_cart_price;
            
                const cartDiscount = document.getElementById('cart-discount');
                cartDiscount.textContent = `-${data.cart_info.total_discount}`;
            
                const cartFinalPrice = document.getElementById('cart-final-price');
                cartFinalPrice.textContent = data.cart_info.total_discount_cart_price;
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки контента:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
            document.getElementById('content').innerHTML = "<h2>Произошла ошибка при загрузке контента. Попробуйте еще раз.</h2>";
        });
}

function addProductToCart(itemId){
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    addToCartBtn.style.pointerEvents = "none";
    addToCartBtn.style.opacity = "0.5";

    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

    fetch(`/add_to_cart?item_id=${itemId}`, {
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
            updateStateProductCartControls(itemId, 1);
        })
        .catch(error => {
            console.error('Ошибка загрузки контента:', error);
            document.getElementById('content').innerHTML = "<h2>Произошла ошибка при загрузке контента. Попробуйте еще раз.</h2>";
        })
        .finally(() =>{
            addToCartBtn.style.pointerEvents = "auto";
            addToCartBtn.style.opacity = "1";
        });
}

function removeProductFromCart(itemId){
    const itemCard = document.getElementById(`item-${itemId}`);

    const contentContainer = document.getElementById('content');
    const cartBlocks = contentContainer.querySelectorAll('*'); 

    cartBlocks.forEach(element => {
        element.style.pointerEvents = "none";
        element.style.opacity = "0.8";
    });

    if (totalItems == 1 && itemCard){
        document.getElementById('content').style.display = 'none';
        document.getElementById('loading').style.display = 'flex';
    }
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

    fetch(`/remove_from_cart?item_id=${itemId}`, {
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
            if (itemCard){
                itemCard.style.display = 'none';
                updateCartSummary();
            }
            else{
                updateStateProductCartControls(itemId, 0);
            }

        })
        .catch(error => {
            // console.error('Ошибка загрузки контента:', error);
            // document.getElementById('content').innerHTML = "<h2>Произошла ошибка при загрузке контента. Попробуйте еще раз.</h2>";
        })
        .finally(() => {
            cartBlocks.forEach(element => {
                element.style.pointerEvents = "auto";
                element.style.opacity = "1";
            });
        });
}

function clearCart(){

    const contentContainer = document.getElementById('content');
    const cartBlocks = contentContainer.querySelectorAll('*'); 

    cartBlocks.forEach(element => {
        element.style.pointerEvents = "none";
        element.style.opacity = "0.8";
    });

    const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('access_token='))
    ?.split('=')[1];

    fetch('/clear_cart',{
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
            document.getElementById('content').innerHTML = "";
        })
        .catch(error => {
            // console.error('Ошибка загрузки контента:', error);
            // document.getElementById('content').innerHTML = "<h2>Произошла ошибка при загрузке контента. Попробуйте еще раз.</h2>";
        })
        .finally(() => {
            cartBlocks.forEach(element => {
                element.style.pointerEvents = "auto";
                element.style.opacity = "1";
            });
        });
}

function productIncrement(itemId, currentCount){
    const incBtn = document.querySelector(`#item-counter-${itemId} #item-inc-btn`);
    const decBtn = document.querySelector(`#item-counter-${itemId} #item-dec-btn`);

    // Блокируем кнопки
    incBtn.style.pointerEvents = "none";
    decBtn.style.pointerEvents = "none";
    incBtn.style.opacity = "0.5";
    decBtn.style.opacity = "0.5";

    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

    fetch(`/item_increment?item_id=${itemId}`, {
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
            updateStateProductCartControls(itemId, currentCount + 1);
            if (document.getElementById('cart-info')) {
                updateCartSummary();
            }
        })
        .catch(error => {
            console.error('Ошибка инкремента:', error);
        })
        .finally(() => {
            // Разблокируем кнопки
            incBtn.style.pointerEvents = "auto";
            decBtn.style.pointerEvents = "auto";
            incBtn.style.opacity = "1";
            decBtn.style.opacity = "1";
        });
}

function productDecrement(itemId, currentCount){
    const itemCard = document.getElementById(`item-${itemId}`);
    if (totalItems == 1 && itemCard){
        document.getElementById('content').style.display = 'none';
        document.getElementById('loading').style.display = 'flex';
    }
    if (currentCount > 1) {
        const incBtn = document.querySelector(`#item-counter-${itemId} #item-inc-btn`);
        const decBtn = document.querySelector(`#item-counter-${itemId} #item-dec-btn`);

        // Блокируем кнопки
        incBtn.style.pointerEvents = "none";
        decBtn.style.pointerEvents = "none";
        incBtn.style.opacity = "0.5";
        decBtn.style.opacity = "0.5";
        const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

        fetch(`/item_decrement?item_id=${itemId}`, {
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
                updateStateProductCartControls(itemId, currentCount - 1);
                if (document.getElementById('cart-info')) {
                    updateCartSummary();
                }
            })
            .catch(error => {
                console.error('Ошибка декремента:', error);
            })
            .finally(() => {
                // Разблокируем кнопки
                incBtn.style.pointerEvents = "auto";
                decBtn.style.pointerEvents = "auto";
                incBtn.style.opacity = "1";
                decBtn.style.opacity = "1";
            });
    } else {
        removeProductFromCart(itemId);
    }
}

function setupProductQuantityControls(itemId, quantity){
    let itemToolsContainer = document.createElement('div');
        itemToolsContainer.className = 'item-tools-container';

        let deleteBtn =  document.createElement('div');
        deleteBtn.className = 'flat-btn left-corner';
        let deletBtnImg = document.createElement('img');
        deletBtnImg.className = 'icon tiny';
        deletBtnImg.src = 'static/img/close.png';
        deleteBtn.appendChild(deletBtnImg);
    
        deleteBtn.onclick = () => presentWarningOverlay(removeProductFromCart, itemId);

        let itemCounter =  document.createElement('div');
        itemCounter.className = 'btn-group';
        itemCounter.id = `item-counter-${itemId}`;

        let decBtn =  document.createElement('div');
        decBtn.className = 'flat-btn';
        decBtn.id = 'item-dec-btn';
        let decBtnImg =  document.createElement('img');
        decBtnImg.className = 'icon tiny';
        decBtnImg.src = 'static/img/minus.png';
        decBtn.appendChild(decBtnImg);
        if(quantity == 1){
            decBtn.onclick = () => presentWarningOverlay(productDecrement, itemId, quantity);
        }
        else{
            decBtn.onclick = () => productDecrement(itemId, quantity);
        }

        let itemCountDisplay =  document.createElement('div');
        itemCountDisplay.id = 'item-counter-display';
        itemCountDisplay.textContent = quantity;
        
        let incBtn =  document.createElement('div');
        incBtn.className = 'flat-btn';
        incBtn.id = 'item-inc-btn';
        let incBtnImg =  document.createElement('img');
        incBtnImg.className = 'icon tiny';
        incBtnImg.src = 'static/img/plus.png'
        incBtn.appendChild(incBtnImg);
        incBtn.onclick = () => productIncrement(itemId, quantity);
        
        itemCounter.append(decBtn, itemCountDisplay, incBtn);

        itemToolsContainer.append(deleteBtn, itemCounter);
        return itemToolsContainer;
}

function updateStateProductCartControls(itemId, itemCount, isHidden){
    let itemCounter = document.getElementById(`item-counter-${itemId}`);
    if (isHidden){
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        addToCartBtn.style.pointerEvents = "none";
        addToCartBtn.style.backgroundColor = "grey";
        addToCartBtn.style.opacity = "0.5";
        addToCartBtn.textContent = 'Нет в наличии';
        itemCounter.style.display = 'none';
        document.getElementById('add-to-cart-btn').style.display = 'flex';
    }
    else{
        if (itemCount > 0){
            itemCounter.querySelector('#item-counter-display').textContent = itemCount;
            itemCounter.style.display = 'flex';
            if(itemCount==1){
                itemCounter.querySelector('#item-dec-btn').onclick = () => presentWarningOverlay(productDecrement, itemId, itemCount);
            }
            else{
                itemCounter.querySelector('#item-dec-btn').onclick = () => productDecrement(itemId, itemCount);
            }
            itemCounter.querySelector('#item-inc-btn').onclick = () => productIncrement(itemId, itemCount);
            const addToCartBtn = document.getElementById('add-to-cart-btn');
            if (addToCartBtn){
                addToCartBtn.style.display = 'none';
            }
        }
        else{
            itemCounter.style.display = 'none';
            document.getElementById('add-to-cart-btn').style.display = 'flex';
            document.getElementById('add-to-cart-btn').onclick = () => addProductToCart(itemId);
        }
    }
}

function getProductWordAccordingToQuantity(quantity){
    if (quantity % 100 >= 11 && quantity % 100 <= 14) {
        return "товаров";
    }
    const lastDigit = quantity % 10;
    if (lastDigit === 1) return "товар";
    if (lastDigit >= 2 && lastDigit <= 4) return "товара";
    return "товаров";
}

function presentWarningOverlay(action, ...args){
    const warningOverlay = document.getElementById('warningOverlay');
    warningOverlay.style.display = 'flex';
    const actionConfirmationBtn = document.getElementById('action-confirmation-btn');
    actionConfirmationBtn.onclick = () => acceptAction(action, ...args);
}

function closeWarningOverlay(){
    const warningOverlay = document.getElementById('warningOverlay');
    warningOverlay.style.display = 'none';
}

function acceptAction(action, ...args){
    const warningOverlay = document.getElementById('warningOverlay');
    warningOverlay.style.display = 'none';
    action(...args);
}

