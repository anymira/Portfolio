// === КАСТОМНЫЙ КУРСОР ===
const cursor = document.querySelector('.custom-cursor');
const cursorDot = document.querySelector('.cursor-dot');

// Проверяем, не мобильное ли устройство
const isMobile = window.matchMedia('(max-width: 768px)').matches;

if (!isMobile && cursor && cursorDot) {
    // Отслеживаем движение мыши
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        
        cursorDot.style.left = e.clientX + 'px';
        cursorDot.style.top = e.clientY + 'px';
    });

    // Все кликабельные элементы
    const clickableElements = document.querySelectorAll('a, button, .project-card');

    clickableElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
            cursorDot.classList.add('hover');
        });
        
        element.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
            cursorDot.classList.remove('hover');
        });
    });

    // Скрываем курсор когда мышь покидает окно
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
        cursorDot.style.opacity = '0';
    });

    // Показываем курсор когда мышь возвращается
    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
        cursorDot.style.opacity = '1';
    });
}
