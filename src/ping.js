// src/ping.js
// Ping Worker – Cron записва, fetch проверява live статус, с групово почистване на стар месец

export default {
  async scheduled(event, env) {
    const result = await pingBackend(env.BACKEND_URL);

    // Префикс по текущ месец
    const monthKey = result.timestamp.slice(0, 7); // "YYYY-MM"
    const key = `ping:${monthKey}:${result.timestamp}`;

    await env.UPTIME_LOG.put(key, JSON.stringify(result));

    // Софийско време cleanup window: 12:00–12:59
    const today = new Date(result.timestamp);
    if (today.getHours() === 12) {
      const oldestMonth = getOldestMonth(today);

      // Ограничаваме до 100 триения на едно изпълнение
      const list = await env.UPTIME_LOG.list({
        prefix: `ping:${oldestMonth}`,
        limit: 100
      });

      await Promise.all(list.keys.map(k => env.UPTIME_LOG.delete(k.name)));
    }
  },

  async fetch(request, env) {
    const result = await pingBackend(env.BACKEND_URL);
    return new Response(
      `Ping executed → check status page for results\nCurrent status: ${result.status}`,
      { headers: { "Content-Type": "text/plain;charset=UTF-8" } }
    );
  }
};

// обща функция за ping с timeout и проверка на status
async function pingBackend(url) {
  let status = "down";
  let timestamp = new Date().toISOString();

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000); // timeout 5 сек
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(id);

    const data = await resp.json(); // парсваме JSON
    if (data.status?.toLowerCase() === "ok") {
      status = "up";
    }

    // Тук преобразуваме време от бекенда към Europe/Sofia
    timestamp = convertToSofia(data.timestamp);

  } catch {
    // ако има грешка или timeout, status остава down
  }

  return { status, timestamp };
}

// helper – конвертира UTC timestamp към Europe/Sofia, в ISO-подобен формат
function convertToSofia(ts) {
  const d = new Date(ts);

  // връща форматирано "YYYY-MM-DDTHH:mm:ssZ" в Софийска зона
  const local = d.toLocaleString("sv-SE", {
    timeZone: "Europe/Sofia",
    hour12: false
  });

  return local.replace(" ", "T") + "Z";
}

// helper за изчисляване на най-стария месец (предходния месец)
function getOldestMonth(date) {
  const d = new Date(date);

  // Ако текущият месец е януари (0), връщаме декември на предходната година
  let year = d.getFullYear();
  let month = d.getMonth() - 2; // два месеца назад
  if (month < 0) {
    month += 12;
    year -= 1;
  }

  return `${year}-${(month + 1).toString().padStart(2, "0")}`;
}
