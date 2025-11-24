// src/ping.js
export default {
  async scheduled(event, env) {
    const now = new Date().toISOString();
    let status = "unknown";

    try {
      const resp = await fetch(env.BACKEND_URL);
      if (resp.ok) {
        const text = await resp.text(); // взимаме текст първо
        try {
          const data = JSON.parse(text);
          status = data.status && data.status.toLowerCase() === "ok" ? "up" : "down";
        } catch {
          status = "down"; // ако не е валиден JSON
        }
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
    let status = "unknown";

    try {
      const resp = await fetch(env.BACKEND_URL);
      if (resp.ok) {
        const text = await resp.text();
        try {
          const data = JSON.parse(text);
          status = data.status && data.status.toLowerCase() === "ok" ? "up" : "down";
        } catch {
          status = "down";
        }
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
