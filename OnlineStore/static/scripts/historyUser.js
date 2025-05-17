window.addEventListener("popstate", function (event) {
    if (event.state) {

        if (event.state.screen == 'main'){
            if (event.state.categoryId) {
                fetchProductsTruncated(event.state.categoryId, false);
            } else if (event.state.groupId) {
                fetchProducts(event.state.groupId, false);
            } else if (event.state.itemId) {
                fetchProduct(event.state.itemId, false);
            }
            else{
                loadMainPage();
            }
        }
        if (event.state.screen == 'catalog'){
            if (event.state.categoryId) {
                fetchProductsTruncated(event.state.categoryId, false);
            } else if (event.state.groupId) {
                fetchProducts(event.state.groupId, false);
            } else if (event.state.itemId) {
                fetchProduct(event.state.itemId, false);
            }
            else{
                fetchCategories();
            }
        }
        if (event.state.screen == 'likes'){
            fetchFavorites();
        }
        if (event.state.screen == 'orders'){
            fetchOrders();
        }
    }
    updateBackButtonVisibility();
});

function updateBackButtonVisibility() {
    if (history.state && !history.state.isInitial) {
        Telegram.WebApp.BackButton.show();
    } else {
        Telegram.WebApp.BackButton.hide();
    }
}