// === АНИМАЦИЯ ФОТО ПРИ СКРОЛЛЕ ===
// Проверяем, не мобильное ли устройство
const isMobile = window.matchMedia("(max-width: 768px)").matches;

if (!isMobile) {
  // Анимация только на десктопе
  const observerOptions = {
    threshold: 0.2,
    rootMargin: "0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, observerOptions);

  const photoContainer = document.querySelector(".photo-container");
  if (photoContainer) {
    observer.observe(photoContainer);
  }
}
