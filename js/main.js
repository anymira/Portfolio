const isMobile = window.matchMedia("(max-width: 768px)").matches;
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

document.documentElement.classList.add("reveal-ready");

// 0. МЯГКАЯ РЕАКЦИЯ HERO НА КУРСОР
const hero = document.querySelector(".hero-sticky-box");

if (hero && !isMobile && !prefersReducedMotion) {
  let rafId = null;

  const moveHeroLight = (event) => {
    if (rafId) return;

    rafId = requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      const copyX = (x - 50) * 0.08;
      const copyY = (y - 50) * 0.06;

      hero.style.setProperty("--hero-glow-x", `${x}%`);
      hero.style.setProperty("--hero-glow-y", `${y}%`);
      hero.style.setProperty("--hero-copy-x", `${copyX}px`);
      hero.style.setProperty("--hero-copy-y", `${copyY}px`);

      rafId = null;
    });
  };

  hero.addEventListener("mousemove", moveHeroLight);
  hero.addEventListener("mouseleave", () => {
    hero.style.setProperty("--hero-glow-x", "50%");
    hero.style.setProperty("--hero-glow-y", "45%");
    hero.style.setProperty("--hero-copy-x", "0px");
    hero.style.setProperty("--hero-copy-y", "0px");
  });
}

// 1. ПОЯВЛЕНИЕ БЛОКОВ ПРИ СКРОЛЛЕ И СЧЕТЧИК ОПЫТА
const revealItems = [
  [".about-label", 0],
  [".about-title", 180],
  [".about-description", 360],
  [".about-stats", 540],
  [".about-image-block", 240],
  [".awards-label", 0],
];

revealItems.forEach(([selector, delay]) => {
  const element = document.querySelector(selector);
  if (!element) return;

  element.classList.add("scroll-reveal");
  element.style.setProperty("--reveal-delay", `${delay}ms`);
});

document.querySelectorAll(".award-card").forEach((card, index) => {
  card.classList.add("scroll-reveal");
  card.style.setProperty("--reveal-delay", `${index * 190}ms`);
});

const revealElements = document.querySelectorAll(".scroll-reveal");
const statNumberElement = document.querySelector(".stat-number");

if (statNumberElement && !prefersReducedMotion) {
  prepareStatNumber(statNumberElement);
}

if (prefersReducedMotion) {
  revealElements.forEach((element) => {
    element.classList.add("is-visible");
  });

  if (statNumberElement) {
    statNumberElement.dataset.counted = "true";
  }
} else if (revealElements.length) {
  const revealElement = (element) => {
    if (element.classList.contains("is-visible")) return;

    element.classList.add("is-visible");
  };

  let revealFrame = null;
  const revealPassedElements = () => {
    if (revealFrame) return;

    revealFrame = requestAnimationFrame(() => {
      const triggerLine = window.innerHeight * 0.9;

      revealElements.forEach((element) => {
        if (element.classList.contains("is-visible")) return;

        const rect = element.getBoundingClientRect();
        if (rect.top < triggerLine) {
          revealElement(element);
        }
      });

      revealFrame = null;
    });
  };

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        revealElement(entry.target);
        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -10% 0px",
    },
  );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });

  window.addEventListener("scroll", revealPassedElements, { passive: true });
  window.addEventListener("resize", revealPassedElements);
  revealPassedElements();

  if (statNumberElement) {
    const countNumberWhenReady = () => {
      if (statNumberElement.dataset.counted === "true") return;

      const rect = statNumberElement.getBoundingClientRect();
      const triggerLine = window.innerHeight * 0.68;

      if (rect.top < triggerLine && rect.bottom > 0) {
        animateStatNumber(statNumberElement);
      }
    };

    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          countNumberWhenReady();
          statObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.8,
        rootMargin: "0px 0px -24% 0px",
      },
    );

    statObserver.observe(statNumberElement);
    window.addEventListener("scroll", countNumberWhenReady, { passive: true });
    window.addEventListener("resize", countNumberWhenReady);
    countNumberWhenReady();
  }
}

function animateStatNumber(element) {
  if (element.dataset.counted === "true") return;

  const target = Number(element.dataset.countTarget);
  const prefix = element.dataset.countPrefix || "";
  const suffix = element.dataset.countSuffix || "";
  if (!target) return;

  element.dataset.counted = "true";
  let current = 0;
  const stepDuration = 180;

  element.textContent = `${prefix}${current}${suffix}`;

  const tick = () => {
    current += 1;
    element.textContent = `${prefix}${current}${suffix}`;

    if (current < target) {
      setTimeout(tick, stepDuration);
    }
  };

  setTimeout(tick, stepDuration);
}

function prepareStatNumber(element) {
  const value = element.textContent.trim();
  const match = value.match(/(\d+)/);

  if (!match) return;

  element.dataset.countTarget = match[1];
  element.dataset.countPrefix = value.slice(0, match.index);
  element.dataset.countSuffix = value.slice(match.index + match[1].length);
  element.textContent = `${element.dataset.countPrefix}0${element.dataset.countSuffix}`;
}

// 2. АНИМАЦИЯ ФОТО ПРИ СКРОЛЛЕ (Только для десктопа)
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

// 3. ЛУЧИ (BEAMS)
const beamsContainer = document.getElementById("beamsContainer");

if (beamsContainer && !prefersReducedMotion) {
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
