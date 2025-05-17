document.addEventListener("DOMContentLoaded", function() {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        const userId = Telegram.WebApp.initDataUnsafe.user.id;

        fetch('/auth', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                auth_date: Telegram.WebApp.initDataUnsafe.auth_date, // Добавляем обязательные параметры
                hash: Telegram.WebApp.initDataUnsafe.hash
            }),
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-Init-Data': window.Telegram.WebApp.initData
            }
        })
        .then(response => {
            console.log(response);
            if (response.status === 422) {
                return response.json().then(err => {
                    throw new Error(`Validation error: ${JSON.stringify(err)}`);
                });
            }
            return response.json();
        })
        .then(data => {
            document.cookie = `access_token=${data.accessToken}; Secure; SameSite=Strict; Path=/; Max-Age=604800`;
            loadAppUi();
        })
        .catch(error => {
            console.error('Auth error:', error);
            Telegram.WebApp.showAlert(`Ошибка авторизации: ${error.message}`);
        });
    }
});