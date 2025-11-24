// src/ping.js
// Ping Worker – Cron записва, fetch проверява live статус

export default {
  async scheduled(event, env) {
    const result = await pingBackend(env.BACKEND_URL);
    const key = `ping:${result.timestamp}`;
    await env.UPTIME_LOG.put(key, JSON.stringify(result));
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
    timestamp = new Date(data.timestamp).toISOString();
  } catch {
    // ако има грешка или timeout, status остава down
  }

  return { status, timestamp };
}
