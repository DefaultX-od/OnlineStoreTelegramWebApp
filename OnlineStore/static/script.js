function updateIcons(activePage) {
    // Сначала сбросим все иконки к неактивному состоянию
    const icons = {
        home: {
            header: "img/home.png",
            footer: "img/home.png"
        },
        categories: {
            header: "img/categories.png",
            footer: "img/categories.png"
        },
        likes: {
            header: "img/likes.png",
            footer: "img/likes.png"
        },
        cart: {
            header: "img/cart.png",
            footer: "img/cart.png"
        },
        orders: {
            header: "img/orders.png",
            footer: "img/orders.png"
        }
    };

    // Устанавливаем активную иконку для выбранной страницы
    icons[activePage].header = `img/${activePage}-active.png`;
    icons[activePage].footer = `img/${activePage}-active.png`;

    // Обновляем иконки в header и footer
    document.querySelector(".header-icon img").src = `static/${icons[activePage].header}`;
    document.getElementById("home-icon").src = `static/${icons.home.footer}`;
    document.getElementById("categories-icon").src = `static/${icons.categories.footer}`;
    document.getElementById("likes-icon").src = `static/${icons.likes.footer}`;
    document.getElementById("cart-icon").src = `static/${icons.cart.footer}`;
    document.getElementById("orders-icon").src = `static/${icons.orders.footer}`;

    document.getElementById("header-icon").onclick = () => null;
}

function updatePageHeader(activePage, str = null) {

    const pageTitle = document.getElementById("app-page-title");

    if (str == null) {
        // Устанавливаем текст в зависимости от активной страницы
        if (activePage === "home") {
            pageTitle.textContent = "Главная";
        }
        else if (activePage === "categories") {
            pageTitle.textContent = "Каталог";
        }
        else if (activePage === "likes") {
            pageTitle.textContent = "Избранное";
        }
        else if (activePage === "orders") {
            pageTitle.textContent = "Заказы";
        }
        else if (activePage === "cart") {
            pageTitle.textContent = "Корзина";
        }
        else if (activePage === "applications") {
            pageTitle.textContent = "Заявки";
        }
    }
    else {
        pageTitle.textContent = str;
    }
}

function setupFreshUser(){

    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

    fetch(`/create_cart`, {
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
    .then()
    .catch(error => {
        console.error('Ошибка загрузки контента:', error);
        document.getElementById('content').innerHTML = "<h2>Произошла ошибка при загрузке контента. Попробуйте еще раз.</h2>";
    });
}