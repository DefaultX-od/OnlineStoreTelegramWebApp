function loadMainPage() {
    document.getElementById('content').style.display = 'none';
    document.getElementById('loading').style.display = 'flex';
    updateIcons('home');
    updatePageHeader('home');

    history.replaceState({ isInitial: true, screen: 'main' }, null, null);
    updateBackButtonVisibility();


    fetch(`/main`)
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
            contentContainer.appendChild(presentProductsGroupHeader('Акции', loadDiscountItems));
            contentContainer.appendChild(presentProductGroupGrid(data.discount_items, imagePromises));
            contentContainer.appendChild(presentProductsGroupHeader('Новинки', loadNewestItems));
            contentContainer.appendChild(presentProductGroupGrid(data.newest_items, imagePromises));
            content.appendChild(contentContainer);
            presentCategories(data.categories);

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

function loadDiscountItems(){

}

function loadNewestItems(){

}