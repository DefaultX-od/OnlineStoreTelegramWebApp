let gallery;
let items;
let galleryDots;
let prev;
let next;
let active;

let isTouchingGallery = false;
let startX = 0;
let endX = 0;

function initGallery(itemAlbum) {
    active = 0;
    galleryDots = document.createElement('ul');
    galleryDots.className = 'gallery-items-dots'
    galleryContainer = document.querySelector('.gallery-container');
    gallery = document.querySelector('.gallery-container .gallery');

    itemAlbum.forEach(object => {

        galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        itemImg = document.createElement('img');
        itemImg.referrerPolicy = 'no-referrer';
        itemImg.src = object;
        galleryItem.appendChild(itemImg);

        gallery.appendChild(galleryItem);
        
        dot = document.createElement('li');
        galleryDots.appendChild(dot);
    });

    galleryContainer.appendChild(galleryDots);

    items = document.querySelectorAll('.gallery-container .gallery .gallery-item');
    galleryDots = document.querySelectorAll('.gallery-container .gallery-items-dots li');

    gallery.addEventListener('touchstart', touchStart);
    gallery.addEventListener('touchmove', touchMove);
    gallery.addEventListener('touchend', touchEnd);

    reloadGallery();
}

function reloadGallery() {
    document.querySelectorAll('video').forEach(vid => vid.pause());
    let offset = -active * 100; // Смещение в процентах
    gallery.style.transform = `translateX(${offset}%)`;
    

    // Обновляем активную точку (dot)
    galleryDots.forEach((dot, index) => {
        dot.classList.toggle('active', index === active);
    });
}

// Запоминаем начальное касание
function touchStart(event) {
    if (!gallery.contains(event.target)) return;
    isTouchingGallery = true;
    startX = event.touches[0].clientX;
}

// Определяем конечное касание
function touchMove(event) {
    if (!isTouchingGallery) return;
    event.preventDefault();
    endX = event.touches[0].clientX;
}

// Анализируем свайп
function touchEnd() {
    if (!isTouchingGallery) return;
    let diff = startX - endX;

    // Если сдвиг больше 50px - считаем это свайпом
    if (diff > 50 && active < items.length - 1) {
        active += 1;
    } else if (diff < -50 && active > 0) {
        active -= 1;
    }

    reloadGallery();
    isTouchingGallery = false;
}