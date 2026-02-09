// === АНИМАЦИЯ ФОТО ПРИ СКРОЛЛЕ ===
const isMobile = window.matchMedia("(max-width: 768px)").matches;

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

// === ЛУЧИ  ===
const beamsContainer = document.getElementById("beamsContainer");

if (beamsContainer && !isMobile) {
  const BEAM_COUNT = 12;
  const MIN_DURATION = 2;
  const MAX_DURATION = 6;
  const MIN_DELAY = 0;
  const MAX_DELAY = 8;

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

  const leftPos = Math.random() * 100;
  beam.style.left = leftPos + "%";

  const height = 40 + Math.random() * 120;
  beam.style.height = height + "px";

  const duration = minDur + Math.random() * (maxDur - minDur);
  beam.style.animationDuration = duration + "s";

  const delay = minDelay + Math.random() * (maxDelay - minDelay);
  beam.style.animationDelay = delay + "s";

  const color = colors[Math.floor(Math.random() * colors.length)];
  beam.style.background = `linear-gradient(to bottom, transparent, ${color}, transparent)`;

  beam.style.width = 1 + Math.random() * 2 + "px";
  beam.style.opacity = 0.3 + Math.random() * 0.5;

  container.appendChild(beam);

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
