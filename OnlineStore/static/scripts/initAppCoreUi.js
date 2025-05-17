function loadAppUi() {
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

    fetch(`/load_app_ui`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.text(); // Получаем HTML как текст
    })
    .then(html => {
        // Полная замена страницы
        document.open();
        document.write(html);
        document.close();
    })
    .catch(error => {
        console.error('Ошибка:', error);
        Telegram.WebApp.showAlert("Ошибка загрузки интерфейса");
    });
}