window.addEventListener("popstate", function (event) {
    console.log(event.state)
    if (event.state) {
        if (event.state.screen == 'main'){

            if (event.state.statusId){
                loadOrdersAdmin(event.state.statusId, event.state.isCompleted, event.state.isCanceled, false)
            }else if (event.state.orderId){
                loadOrderAdmin(event.state.orderId,event.state.statusId, false)
            }
            else{
                loadMainAdmin();
            }
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