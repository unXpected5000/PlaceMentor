export function drawLineChart(canvas, values, labels) {
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = rect.width * ratio;
  canvas.height = Number(canvas.getAttribute("height") || 220) * ratio;
  context.scale(ratio, ratio);

  const width = rect.width;
  const height = Number(canvas.getAttribute("height") || 220);
  const padding = 28;
  context.clearRect(0, 0, width, height);
  context.strokeStyle = "rgba(148, 163, 184, 0.24)";
  context.lineWidth = 1;

  for (let index = 0; index < 4; index += 1) {
    const y = padding + index * ((height - padding * 2) / 3);
    context.beginPath();
    context.moveTo(padding, y);
    context.lineTo(width - padding, y);
    context.stroke();
  }

  const max = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x =
      values.length === 1
        ? width / 2
        : padding + index * ((width - padding * 2) / (values.length - 1));
    const y = height - padding - (value / max) * (height - padding * 2);
    return { x, y, value, label: labels[index] };
  });

  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  });
  context.strokeStyle = "#2563eb";
  context.lineWidth = 4;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.stroke();

  points.forEach((point) => {
    context.beginPath();
    context.arc(point.x, point.y, 5, 0, Math.PI * 2);
    context.fillStyle = "#f97316";
    context.fill();
    context.fillStyle = "#64748b";
    context.font = "12px Inter, sans-serif";
    context.textAlign = "center";
    context.fillText(point.label, point.x, height - 8);
  });
}

export function distribution(items, key) {
  return items.reduce((accumulator, item) => {
    const label = item[key] || "Unassigned";
    accumulator[label] = (accumulator[label] || 0) + 1;
    return accumulator;
  }, {});
}
