// src/ping.js
// Ping Worker – записва статус в KV при Cron

export default {
  async scheduled(event, env) {
    const now = new Date().toISOString();
    let status = "unknown";

    try {
      const resp = await fetch(env.BACKEND_URL);
      status = resp.ok ? "up" : "down";
    } catch {
      status = "down";
    }

    const key = `ping:${now}`;
    const value = JSON.stringify({ status, timestamp: now });
    await env.UPTIME_LOG.put(key, value);
  },

  async fetch(request, env) {
    // Само връща, че пинга е активен
    return new Response("Ping executed → check status page for results", {
      headers: { "Content-Type": "text/plain" }
    });
  }
};
