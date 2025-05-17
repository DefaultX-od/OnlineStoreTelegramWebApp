document.addEventListener("DOMContentLoaded", function() {
    if (window.Telegram?.WebApp) {
        let tg = window.Telegram.WebApp;
        const isMobile = navigator.userAgentData?.mobile;

        if (isMobile === undefined){
            tg.expand();
        }
        else{
            tg.requestFullscreen();
            const header = document.getElementById('header');
            header.style.paddingTop = '80px';

            const content = document.getElementById('content');
            content.style.marginTop = '120px';

            const footer = document.getElementById('footer');
            footer.style.paddingBottom = '15px';
        }
        Telegram.WebApp.BackButton.onClick(() => {
            window.history.back();
        });
    }
    history.replaceState({ isInitial: true, screen: 'main' }, null, null);
    loadMainPage();
    setupFreshUser();
});