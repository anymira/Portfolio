// Tracing Beam Animation
document.addEventListener("DOMContentLoaded", function () {
  const beam = document.querySelector(".tracing-beam");
  const beamLine = document.querySelector(".beam-line");
  const beamProgress = document.querySelector(".beam-progress");
  const beamDot = document.querySelector(".beam-dot");
  const caseLayout = document.querySelector(".case-layout");
  const caseCta = document.querySelector(".case-cta");

  if (!beam || !beamProgress || !beamDot || !caseLayout) return;

  function updateBeam() {
    const scrollTop = window.scrollY;

    // Высота case-layout (до CTA блока)
    const caseLayoutHeight = caseLayout.offsetHeight;
    const windowHeight = window.innerHeight;

    // Максимальный скролл до CTA
    const maxScroll = caseLayoutHeight - windowHeight;

    // Процент скролла (от 0 до 100)
    let scrollPercent = (scrollTop / maxScroll) * 100;
    scrollPercent = Math.min(Math.max(scrollPercent, 0), 100);

    // Обновляем прогресс линии
    beamProgress.style.height = scrollPercent + "%";

    // Позиция точки
    const lineHeight = beamLine.offsetHeight;
    const dotOffset = 54; // начальная позиция (на уровне H1)
    const maxDotTravel = lineHeight;
    const dotPosition = dotOffset + (scrollPercent / 100) * maxDotTravel;

    beamDot.style.top = dotPosition + "px";

    // Меняем цвет границы точки
    if (scrollPercent > 50) {
      beamDot.style.borderColor = "#00d4ff";
    } else {
      beamDot.style.borderColor = "#00ff88";
    }

    // Скрываем beam когда достигли CTA
    if (caseCta) {
      const ctaTop = caseCta.getBoundingClientRect().top;
      if (ctaTop <= windowHeight) {
        beam.style.opacity = Math.max(0, ctaTop / windowHeight);
      } else {
        beam.style.opacity = 1;
      }
    }
  }

  window.addEventListener("scroll", updateBeam);
  window.addEventListener("resize", updateBeam);

  // Инициализация
  updateBeam();
});
