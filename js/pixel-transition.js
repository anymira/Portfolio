(() => {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const transitions = Array.from(document.querySelectorAll("[data-pixel-transition]"))
    .map((element) => {
      const canvas = element.querySelector("canvas");
      const context = canvas.getContext("2d");
      return context ? { element, canvas, context } : null;
    }).filter(Boolean);
  if (!transitions.length) return;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  let pending = false;

  function draw({ element, canvas, context }) {
    const rect = element.getBoundingClientRect();
    if (!rect.width || rect.bottom < 0 || rect.top > window.innerHeight) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(rect.width * ratio);
    const height = Math.round(rect.height * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
    const style = getComputedStyle(element);
    const from = style.getPropertyValue("--pixel-from").trim();
    const to = style.getPropertyValue("--pixel-to").trim();
    const accents = ["--pixel-mint", "--pixel-cyan"].map((name) =>
      style.getPropertyValue(name).trim());
    const progress = motion.matches ? 0.5 : clamp(
      (window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0, 1);
    const frontier = 0.78 - progress * 0.56;
    const columns = Math.ceil(rect.width / (rect.width < 768 ? 18 : 24));
    const size = rect.width / columns;
    const rows = Math.ceil(rect.height / size);
    const colors = [];

    // Stable cell noise makes reverse scrolling retrace the same mosaic.
    for (let row = 0; row < rows; row++) {
      colors[row] = [];
      for (let col = 0; col < columns; col++) {
        const seed = Math.sin(col * 127.1 + row * 311.7) * 43758.5453;
        const noise = seed - Math.floor(seed);
        const y = (row + 0.5) / rows;
        const distance = y - frontier + (noise - 0.5) * 0.42;
        let color = distance > 0 ? to : from;
        if (Math.abs(distance) < 0.12 && noise > 0.85) {
          color = accents[noise > 0.925 ? 1 : 0];
        }
        // Solid boundary rows join the adjoining sections without a hard seam.
        if (row === 0) color = from;
        if (row === rows - 1) color = to;
        colors[row][col] = color;
      }
    }

    const boundaryRow = clamp(Math.ceil(frontier * rows - 0.5), 1, rows - 1);
    const boundaryY = Math.min(height, Math.round(boundaryRow * size * ratio));
    context.fillStyle = from;
    context.fillRect(0, 0, width, boundaryY);
    context.fillStyle = to;
    context.fillRect(0, boundaryY, width, height - boundaryY);

    for (let row = 0; row < rows; row++) {
      const background = row < boundaryRow ? from : to;
      for (let col = 0; col < columns; col++) {
        const color = colors[row][col];
        if (color === background) continue;
        context.fillStyle = color;
        // Shared integer pixel edges prevent antialiasing lines between cells.
        const left = Math.round(col * width / columns);
        const right = Math.round((col + 1) * width / columns);
        const top = Math.min(height, Math.round(row * size * ratio));
        const bottom = Math.min(height, Math.round((row + 1) * size * ratio));
        // Round only exposed corners, keeping joined cells free of grid gaps.
        const radius = Math.min(3 * ratio, (right - left) / 2, (bottom - top) / 2);
        const sameAbove = colors[row - 1]?.[col] === color;
        const sameBelow = colors[row + 1]?.[col] === color;
        const sameLeft = colors[row][col - 1] === color;
        const sameRight = colors[row][col + 1] === color;
        const radii = [
          sameAbove || sameLeft ? 0 : radius,
          sameAbove || sameRight ? 0 : radius,
          sameBelow || sameRight ? 0 : radius,
          sameBelow || sameLeft ? 0 : radius,
        ];
        context.beginPath();
        context.roundRect(left, top, right - left, bottom - top, radii);
        context.fill();
      }
    }
  }

  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      transitions.forEach(draw);
      pending = false;
    });
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("pageshow", schedule);
  motion.addEventListener("change", schedule);
  const observer = new ResizeObserver(schedule);
  transitions.forEach(({ element }) => observer.observe(element));
  schedule();
})();
