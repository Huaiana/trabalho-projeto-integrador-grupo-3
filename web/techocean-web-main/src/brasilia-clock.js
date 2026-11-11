const formatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function updateClockVisibility(element, path) {
  element.hidden = path !== "/dashboard" && !path.startsWith("/dashboard/");
}

export function updateBrasiliaClock(element, now = new Date()) {
  element.textContent = formatter.format(now);
  element.dateTime = now.toISOString();
}

export function startBrasiliaClock(element) {
  updateBrasiliaClock(element);
  return globalThis.setInterval(() => updateBrasiliaClock(element), 1000);
}
