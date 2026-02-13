const isMobile = window.matchMedia("(max-width: 768px)").matches;

// 1. АНИМАЦИЯ ФОТО ПРИ СКРОЛЛЕ (Только для десктопа)
if (!isMobile) {
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

// 2. ЛУЧИ (BEAMS)
const beamsContainer = document.getElementById("beamsContainer");

if (beamsContainer) {
  const BEAM_COUNT = 12; // Сколько лучей
  const MIN_DURATION = 2; // Скорость (сек)
  const MAX_DURATION = 5;
  const MIN_DELAY = 0;
  const MAX_DELAY = 8; // Разброс старта

  // Цвета
  const COLORS = [
    "rgba(0, 255, 136, 0.6)",
    "rgba(0, 212, 255, 0.5)",
    "rgba(0, 230, 190, 0.4)",
  ];

  for (let i = 0; i < BEAM_COUNT; i++) {
    createBeam(
      beamsContainer,
      COLORS,
      MIN_DURATION,
      MAX_DURATION,
      MIN_DELAY,
      MAX_DELAY,
    );
  }
}

function createBeam(container, colors, minDur, maxDur, minDelay, maxDelay) {
  const beam = document.createElement("div");
  beam.classList.add("beam");

  // Случайная позиция
  const leftPos = Math.random() * 100;
  beam.style.left = leftPos + "%";

  // Случайная высота
  const height = 40 + Math.random() * 120;
  beam.style.height = height + "px";

  // Случайная скорость
  const duration = minDur + Math.random() * (maxDur - minDur);
  beam.style.animationDuration = duration + "s";

  // Случайная задержка (чтобы падали не все сразу)
  const delay = minDelay + Math.random() * (maxDelay - minDelay);
  beam.style.animationDelay = delay + "s";

  // Случайный цвет
  const color = colors[Math.floor(Math.random() * colors.length)];
  beam.style.background = `linear-gradient(to bottom, transparent, ${color}, transparent)`;

  beam.style.width = 1 + Math.random() * 2 + "px";
  beam.style.opacity = 0.3 + Math.random() * 0.5;

  container.appendChild(beam);

  // Вспышка при падении
  beam.addEventListener("animationiteration", () => {
    createSplash(container, leftPos, color);
  });
}

function createSplash(container, leftPos, color) {
  const splash = document.createElement("div");
  splash.classList.add("beam-splash");
  splash.style.left = leftPos + "%";
  splash.style.background = color;
  splash.style.boxShadow = `0 0 10px 4px ${color}`;

  container.appendChild(splash);

  setTimeout(() => {
    splash.remove();
  }, 500);
}

// === АНИМАЦИЯ КНОПКИ "НАЗАД" НА СТРАНИЦЕ КЕЙСА ===
const caseBack = document.querySelector(".case-back");
const arrow = document.querySelector(".back-arrow");

if (caseBack && arrow) {
  const lines = arrow.querySelectorAll("line, polyline");

  caseBack.addEventListener("mouseenter", () => {
    lines.forEach((line) => {
      line.setAttribute("stroke", "url(#gradient)");
    });
  });

  caseBack.addEventListener("mouseleave", () => {
    lines.forEach((line) => {
      line.setAttribute("stroke", "white");
    });
  });
}
// === 3D TILT ЭФФЕКТ ДЛЯ КАРТОЧЕК ===
if (!isMobile) {
  const cometCards = document.querySelectorAll(".comet-card");

  cometCards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Угол наклона (макс 6 градусов)
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      // Позиция свечения
      const glowX = (x / rect.width) * 100;
      const glowY = (y / rect.height) * 100;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
      card.style.boxShadow = `
                ${rotateY * 2}px ${-rotateX * 2}px 30px rgba(0, 255, 136, 0.1),
                0 0 60px rgba(0, 212, 255, 0.05)
            `;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform =
        "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
      card.style.boxShadow = "none";
    });
  });
}
