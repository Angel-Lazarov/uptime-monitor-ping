// src/status.js
// Worker №2: Показва уеб страница с история на uptime и статистики

export default {
  async fetch(request, env) {
    // Вземаме последните 50 ключа от KV
    const list = await env.UPTIME_LOG.list({ limit: 50, reverse: true });
    const items = await Promise.all(
      list.keys.map(async k => {
        const v = await env.UPTIME_LOG.get(k.name);
        return JSON.parse(v);
      })
    );

    // Статистика
    const total = items.length;
    const upCount = items.filter(i => i.status === "up").length;
    const downCount = total - upCount;
    const uptimePercent = total ? ((upCount / total) * 100).toFixed(1) : 0;
    const lastStatus = items[0]?.status ?? "unknown";

    // Генерираме редовете на таблицата
    const rows = items.map(i => {
      const d = new Date(i.timestamp);
      const human = d.toLocaleDateString("bg-BG") + " " + d.toLocaleTimeString("bg-BG");
      return `<tr>
        <td>${human}</td>
        <td style="color:${i.status==='up'?'green':'red'}; font-weight:bold;">${i.status}</td>
      </tr>`;
    }).join("");

    // Малка графика с цветни блокчета за последните пингове
    const sparkline = items.map(i => {
      const color = i.status === "up" ? "green" : "red";
      return `<div style="display:inline-block;width:10px;height:10px;margin:1px;background:${color};"></div>`;
    }).join("");

    // HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Uptime Monitor</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background:#f9f9f9; }
          h1 { color: #333; }
          .stats { margin-bottom: 20px; }
          .sparkline { margin: 10px 0; }
          table { border-collapse: collapse; width: 100%; max-width: 600px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #eee; }
        </style>
      </head>
      <body>
        <h1>Uptime Monitor</h1>
        <div class="stats">
          <strong>Последен статус:</strong> <span style="color:${lastStatus==='up'?'green':'red'};">${lastStatus}</span><br/>
          <strong>Общо записи:</strong> ${total}<br/>
          <strong>Up / Down:</strong> ${upCount} / ${downCount}<br/>
          <strong>Uptime %:</strong> ${uptimePercent}%
        </div>
        <div class="sparkline">${sparkline}</div>
        <table>
          <tr><th>Timestamp</th><th>Status</th></tr>
          ${rows}
        </table>
      </body>
      </html>
    `;

    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
};
