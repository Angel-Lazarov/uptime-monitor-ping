// src/ping.js
// Пингва бекенда и записва резултата в KV

export default {
  async fetch(request, env) {
    // Ping се извършва автоматично от Cron, не се използва fetch от браузър
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

    return new Response(JSON.stringify({ status, timestamp: now }), {
      headers: { "Content-Type": "application/json" }
    });
  }
};
