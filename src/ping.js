// src/ping.js
// Ping Worker – Cron записва, fetch проверява live статус

export default {
  async scheduled(event, env) {
    // Cron – записва резултат в KV
    const now = new Date().toISOString();
    let status = "unknown";

    try {
      const resp = await fetch(env.BACKEND_URL);
      if (resp.ok) {
        const data = await resp.json();
        status = data.status === "ok" ? "up" : "down";
      } else {
        status = "down";
      }
    } catch {
      status = "down";
    }

    const key = `ping:${now}`;
    const value = JSON.stringify({ status, timestamp: now });
    await env.UPTIME_LOG.put(key, value);
  },

  async fetch(request, env) {
    // Fetch – проверява бекенда на момента, не записва
    let status = "unknown";

    try {
      const resp = await fetch(env.BACKEND_URL);
      if (resp.ok) {
        const data = await resp.json();
        status = data.status === "ok" ? "up" : "down";
      } else {
        status = "down";
      }
    } catch {
      status = "down";
    }

    return new Response(
      `Ping executed → check status page for results\nCurrent status: ${status}`,
      {
        headers: { "Content-Type": "text/plain;charset=UTF-8" }
      }
    );
  }
};
