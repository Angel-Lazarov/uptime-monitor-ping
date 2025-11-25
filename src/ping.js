// src/ping.js
// Ping Worker – Cron записва, fetch проверява live статус, с групово почистване на стар месец

export default {
  async scheduled(event, env) {
    const result = await pingBackend(env.BACKEND_URL);

    // Префикс по текущ месец
    const monthKey = result.timestamp.slice(0, 7); // "YYYY-MM"
    const key = `ping:${monthKey}:${result.timestamp}`;

    await env.UPTIME_LOG.put(key, JSON.stringify(result));

    // Ако е 1-во число, изтриваме ключовете от най-стария месец
    const today = new Date(result.timestamp);
    if (today.getDate() === 1) {
      const oldestMonth = getOldestMonth(today);
      const list = await env.UPTIME_LOG.list({ prefix: `ping:${oldestMonth}` });
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
  d.setMonth(d.getMonth() - 2); // два месеца назад
  const month = d.getMonth() + 1;
  return `${d.getFullYear()}-${month.toString().padStart(2, "0")}`;
}
