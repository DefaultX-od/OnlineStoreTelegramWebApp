function fetchCategories(){
    document.getElementById('content').style.display = 'none';
    document.getElementById('loading').style.display = 'flex';
    updateIcons('categories');
    updatePageHeader('categories');

    history.replaceState({isInitial: true, screen: 'catalog'},null,null);
    
    updateBackButtonVisibility();

    fetch(`/categories`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Сетевая ошибка: ' + response.statusText);
            }
            return response.json();
        })
        .then(data =>{
            document.getElementById('content').innerHTML = "";
            presentCategories(data.data);
        })
        .catch(error => {
            console.error('Ошибка загрузки контента:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
            document.getElementById('content').innerHTML = "<h2>Произошла ошибка при загрузке контента. Попробуйте еще раз.</h2>";
        });
}

function presentCategories(groups){
    const content = document.getElementById("content");
    

    const contentContainer = document.createElement("div");
    contentContainer.className = "content-container";

    const imagePromises = []; // Массив промисов для загрузки изображений

    groups.forEach(group => {
        const sectionTitle = document.createElement("div");
        sectionTitle.className = "section-title";
        sectionTitle.textContent = group.group_name;
        const grid = document.createElement("div");
        grid.className = "grid-container";

        contentContainer.appendChild(sectionTitle);

        group.categories.forEach(category => {
            const gridItem = document.createElement("div");
            const gridItemText = document.createElement("div");
            const gridItemPicContainer = document.createElement("div");
            const gridItemPic = document.createElement("img");

            gridItem.className = "grid-object";
            gridItemText.className = "grid-object-text";
            gridItemPicContainer.className = "grid-object-img-container";

            gridItemText.textContent = category.name;
            gridItemPic.src = category.icon;
            gridItemPic.referrerPolicy = "no-referrer";

            // Создаем промис для ожидания загрузки изображения
            const imgLoadPromise = new Promise((resolve, reject) => {
                gridItemPic.onload = resolve;  // Разрешаем промис при загрузке
                gridItemPic.onerror = reject;  // Отклоняем при ошибке загрузки
            });

            imagePromises.push(imgLoadPromise); // Добавляем промис в массив

            gridItem.onclick = () => fetchProductsTruncated(category.category_id);
            gridItemPicContainer.appendChild(gridItemPic);
            gridItem.appendChild(gridItemPicContainer);
            gridItem.appendChild(gridItemText);
            grid.appendChild(gridItem);
        });
        
        contentContainer.appendChild(grid)
        content.appendChild(contentContainer);
    });

    // Ждем загрузки всех изображений перед показом контента
    Promise.all(imagePromises)
        .then(() => {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
        })
        .catch(error => {
            console.error('Ошибка загрузки изображений:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
            document.getElementById('content').innerHTML = "<h2>Ошибка загрузки изображений.</h2>";
        });
}

function fetchProductsTruncated(categoryId, historyEnabled = true){
    document.getElementById('content').style.display = 'none';
    document.getElementById('loading').style.display = 'flex';
    updateIcons('categories');
    updatePageHeader('categories');

    if (historyEnabled) {
        history.pushState({ screen: history.state.screen, categoryId: categoryId }, null, null);
    } else {
        history.replaceState({screen: history.state.screen, categoryId: categoryId }, null, null);
    }
    updateBackButtonVisibility();
    
    fetch(`/items?category_id=${categoryId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Сетевая ошибка: ' + response.statusText); // Если ответ не успешный
            }
            return response.json(); // Пытаемся парсить JSON
        })
        .then(data=>presentProductsTruncated(data))
        .catch(error => {
            console.error('Ошибка загрузки контента:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
            document.getElementById('content').innerHTML = "<h2>Произошла ошибка при загрузке контента. Попробуйте еще раз.</h2>";
        });
}

function presentProductsTruncated(data) {

    const imagePromises = [];
    const content = document.getElementById("content");
    content.innerHTML = ''
    const contentContainer = document.createElement("div");
    contentContainer.className = "content-container";
    data.data.forEach(group => {
        const grid = document.createElement("div");
        grid.className = "grid-container";
        contentContainer.appendChild(presentProductsGroupHeader(group.group_name, fetchProducts, group.group_id));
        contentContainer.appendChild(grid.appendChild(presentProductGroupGrid(group.items, imagePromises)));
    });
    content.appendChild(contentContainer);

    Promise.all(imagePromises)
        .then(() => {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
        })
        .catch(error => {
            console.error('Ошибка загрузки изображений:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
            document.getElementById('content').innerHTML = "<h2>Ошибка загрузки изображений.</h2>";
        });   
}

function presentProductsGroupHeader(groupName, func, ...args){
    const sectionContainer = document.createElement("div");
    const sectionTitle = document.createElement("div");
    
    const btn = document.createElement("div");
    const btnImg = document.createElement("img");

    sectionContainer.className = "section-container";

    btnImg.src = "/static/img/right-arrow.png";
    btnImg.className = "icon";

    btn.appendChild(btnImg);    

    sectionTitle.className = "section-title";

    sectionTitle.textContent = groupName;
    sectionContainer.appendChild(sectionTitle);
    sectionContainer.appendChild(btn);

    sectionContainer.onclick = () => func(...args);

    return sectionContainer;
}

function presentProductGroupGrid(products, imagePromises){
    const grid = document.createElement("div");
    grid.className = "grid-container";

    products.forEach(product => {
        const gridItem = document.createElement("div");
        const gridItemText = document.createElement("div");
        const priceContainer = document.createElement("div");
        const gridItemPicContainer = document.createElement("div");
        const gridItemPic = document.createElement("img");          
        
        gridItem.className = "grid-object";
        gridItemText.className = "product-name";
        gridItemPicContainer.className = "grid-object-img-container";
        
        gridItemText.textContent = product.name;

        priceContainer.className = "price-container";

        if (product.normal_price == product.discount_price){
            priceContainer.textContent = `${product.normal_price}₽`;
            priceContainer.className = "product-price";
        }
        else{
            const oldPrice = document.createElement("div");
            const newPrice = document.createElement("div");

            oldPrice.className = "product-price old";
            newPrice.className = "product-price new";

            oldPrice.textContent = product.normal_price;
            newPrice.textContent = `${product.discount_price}₽`;

            priceContainer.appendChild(newPrice);
            priceContainer.appendChild(oldPrice);
        }
        gridItemPic.src = product.album;
        gridItemPic.referrerPolicy = "no-referrer";

        const imgLoadPromise = new Promise((resolve, reject) => {
            gridItemPic.onload = resolve;  // Разрешаем промис при загрузке
            gridItemPic.onerror = reject;  // Отклоняем при ошибке загрузки
        });
        imagePromises.push(imgLoadPromise);
        

        gridItem.onclick = () => fetchProduct(product.id);
        gridItemPicContainer.appendChild(gridItemPic)
        gridItem.appendChild(gridItemPicContainer);
        gridItem.appendChild(priceContainer);
        gridItem.appendChild(gridItemText);
        grid.appendChild(gridItem);
    });

    return grid;
}

function fetchProducts(groupId, historyEnabled = true){
    document.getElementById('content').style.display = 'none';
    document.getElementById('loading').style.display = 'flex';
    updateIcons('categories');
    updatePageHeader('categories');

    if (historyEnabled){
        history.pushState({screen: history.state.screen, groupId:groupId}, null, null);
    }
    else {
        history.replaceState({screen: history.state.screen, groupId:groupId}, null, null);
    }
    updateBackButtonVisibility();

    fetch(`/items?group_id=${groupId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Сетевая ошибка: ' + response.statusText); // Если ответ не успешный
            }
            return response.json(); // Пытаемся парсить JSON
        })
        .then(data=>presentProducts(data.data))
        .catch(error => {
            console.error('Ошибка загрузки контента:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
            document.getElementById('content').innerHTML = "<h2>Произошла ошибка при загрузке контента. Попробуйте еще раз.</h2>";
        });
}

function presentProducts(products) {
    const imagePromises = [];

    document.getElementById('content').innerHTML = "";
    const content = document.getElementById("content");
    content.innerHTML = ''
    const contentContainer = document.createElement("div");
    contentContainer.className = "content-container";

    contentContainer.appendChild(presentProductGroupGrid(products, imagePromises));
    content.appendChild(contentContainer);

    Promise.all(imagePromises)
        .then(() => {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
        })
        .catch(error => {
            console.error('Ошибка загрузки изображений:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
            document.getElementById('content').innerHTML = "<h2>Ошибка загрузки изображений.</h2>";
        });
}

function fetchProduct(itemId, historyEnabled = true){
    document.getElementById('content').style.display = 'none';
    document.getElementById('loading').style.display = 'flex';
    updateIcons('categories');
    updatePageHeader('categories');

    if (historyEnabled){
        history.pushState({screen: history.state.screen, itemId:itemId}, null, null)
    }
    else {
        history.replaceState({screen: history.state.screen, itemId:itemId}, null, null);
    }
    updateBackButtonVisibility();

    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

    fetch(`/item?item_id=${itemId}`, {
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
            document.getElementById('content').innerHTML = data.content;
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
            
            console.log(data);
            
            item = data.item;
            mainDetails = data.main_details;
            subDetails = data.sub_details;
            itemAlbum = data.item_album;
            itemFavStatus = data.fav_status;

            presentProduct(itemAlbum, item, itemFavStatus, mainDetails, subDetails);

            return data;

        })
        .catch(error => {
            console.error('Ошибка загрузки контента:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
            document.getElementById('content').innerHTML = "<h2>Произошла ошибка при загрузке контента. Попробуйте еще раз.</h2>";
        });
}

function presentProduct(itemAlbum, item, itemFavStatus, mainDetails, subDetails){
    initGallery(itemAlbum);

    const itemCounter = document.getElementById('item-counter');
    itemCounter.id = `item-counter-${item.item_id}`;


    reloadFavoriteButton(item.item_id, itemFavStatus);
    updateStateProductCartControls(item.item_id, item.item_count, item.is_hidden);

    const productName = document.getElementById('product-name');
    productName.textContent = item.name;

    const priceContainer = document.createElement('div');
    priceContainer.className = "price-container";

    if (item.normal_price == item.discount_price) {
        priceContainer.textContent = `${item.normal_price}₽`;
        priceContainer.className = "product-price";
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

    const priceTag = document.getElementById('price-tag');
    priceTag.appendChild(priceContainer);


    const subDetailsContainer = document.getElementById('sub-details');
    const mainDetailsContainer = document.getElementById('main-details');
    
    insertDetails(mainDetails, mainDetailsContainer);
    insertDetails(subDetails, subDetailsContainer);
}

function insertDetails(details, container){
    details.forEach(function callback(detail, index) {
        let detailContainer = document.createElement('div');
        detailContainer.className = "product-detail-container";

        let detailName = document.createElement('div');
        detailName.className = 'main';
        let detailValue = document.createElement('div');
        detailValue.className = 'value';

        detailName.textContent = detail.name;
        detailValue.textContent = detail.value;

        detailContainer.appendChild(detailName);
        detailContainer.appendChild(detailValue);

        container.appendChild(detailContainer);
        if (index < details.length - 1){
            let sep = document.createElement('div');
            sep.className = 'h-line';
            container.appendChild(sep);
        } 
    });
}

function fetchFavorites() {
    document.getElementById('content').style.display = 'none';
    document.getElementById('loading').style.display = 'flex';
    updateIcons('likes');
    updatePageHeader('likes');

    history.replaceState({ isInitial: true, screen: 'likes' }, null, null);
    updateBackButtonVisibility();

    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

    fetch(`/favorites`, {
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
            const imagePromises = [];

            document.getElementById('content').innerHTML = "";
            const content = document.getElementById("content");
            content.innerHTML = ''
            const contentContainer = document.createElement("div");
            contentContainer.className = "content-container";

            contentContainer.appendChild(presentProductGroupGrid(data.data, imagePromises));
            content.appendChild(contentContainer);

            Promise.all(imagePromises)
                .then(() => {
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('content').style.display = 'flex';
                })
                .catch(error => {
                    console.error('Ошибка загрузки изображений:', error);
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('content').style.display = 'flex';
                    document.getElementById('content').innerHTML = "<h2>Ошибка загрузки изображений.</h2>";
                });
        })
        .catch(error => {
            console.error('Ошибка загрузки контента:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'flex';
            document.getElementById('content').innerHTML = "<h2>Произошла ошибка при загрузке контента. Попробуйте еще раз.</h2>";
        });
}

function addToFavorites(itemId){
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

    fetch(`/add_to_favorites?item_id=${itemId}`, {
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
        .then(reloadFavoriteButton(itemId, true))
        .catch(error => {
            // console.error('Ошибка загрузки контента:', error);
            // document.getElementById('content').innerHTML = "<h2>Произошла ошибка при загрузке контента. Попробуйте еще раз.</h2>";
        });
}

function removeFromFavorites(itemId){
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

    fetch(`/remove_from_favorites?item_id=${itemId}`, {
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
    .then(reloadFavoriteButton(itemId, false))
    .catch(error => {
        // console.error('Ошибка загрузки контента:', error);
        // document.getElementById('content').innerHTML = "<h2>Произошла ошибка при загрузке контента. Попробуйте еще раз.</h2>";
    });
}

function reloadFavoriteButton(itemId, itemFavStatus){
    const likeButton = document.getElementById('like-btn');
    const likeButtonImg = likeButton.querySelector('img');

    if (itemFavStatus){
        likeButtonImg.src ="static/img/like-active.png";
        likeButton.onclick = () => removeFromFavorites(itemId);
    }
    else{
        likeButtonImg.src ="static/img/like.png";
        likeButton.onclick = () => addToFavorites(itemId);
    }
}