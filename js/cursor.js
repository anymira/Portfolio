document.addEventListener("DOMContentLoaded", () => {
  // 1. Ищем элементы
  const cursor = document.querySelector(".custom-cursor");
  const cursorDot = document.querySelector(".cursor-dot");

  // 2. ПРОВЕРКА: Если элементов нет в HTML, выводим ошибку в консоль и останавливаемся
  if (!cursor || !cursorDot) {
    console.error(
      "Ошибка: Не найдены элементы .custom-cursor или .cursor-dot в HTML",
    );
    return;
  }

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  if (isMobile) {
    cursor.style.display = "none";
    cursorDot.style.display = "none";
    return;
  }

  // Переменные для координат
  let mouseX = 0;
  let mouseY = 0;
  let dotX = 0;
  let dotY = 0;
  let isHovered = false;

  // Слушаем движение мыши
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // === БОЛЬШОЙ КРУГ (Движется сразу) ===
    // Математически центруем: (координата мыши) - (половина ширины круга)
    // 20px / 2 = 10px
    const circleX = mouseX - 10;
    const circleY = mouseY - 10;

    cursor.style.transform = `translate3d(${circleX}px, ${circleY}px, 0)`;
  });

  // Анимация ТОЧКИ (Плавное отставание)
  const animate = () => {
    // Формула плавности
    dotX += (mouseX - dotX) * 0.2; // 0.2 - скорость (чем меньше, тем медленнее)
    dotY += (mouseY - dotY) * 0.2;

    // Центровка точки: 4px / 2 = 2px
    const finalDotX = dotX - 2;
    const finalDotY = dotY - 2;

    // Эффект исчезновения точки при наведении
    const scale = isHovered ? 0 : 1;

    cursorDot.style.transform = `translate3d(${finalDotX}px, ${finalDotY}px, 0) scale(${scale})`;

    requestAnimationFrame(animate);
  };

  animate();

  // === ХОВЕРЫ ===
  const clickableElements = document.querySelectorAll(
    "a, button, .project-card",
  );
  clickableElements.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      isHovered = true;
      cursor.classList.add("hover");
    });
    el.addEventListener("mouseleave", () => {
      isHovered = false;
      cursor.classList.remove("hover");
    });
  });

  // Скрытие при уходе со страницы
  document.addEventListener("mouseleave", () => {
    cursor.style.opacity = "0";
    cursorDot.style.opacity = "0";
  });
  document.addEventListener("mouseenter", () => {
    cursor.style.opacity = "1";
    cursorDot.style.opacity = "1";
  });
});
