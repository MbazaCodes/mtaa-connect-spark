export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root{--bg:#fafafa;--muted:#4b5563;--accent:#0f766e}
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: var(--bg); color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 42rem; width: 100%; text-align: center; padding: 2rem; background: #fff; border-radius: 12px; box-shadow: 0 8px 24px rgba(16,24,40,0.06); }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: var(--muted); margin: 0 0 1rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; margin-top: 1rem }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: var(--accent); color: #fff; border-color: rgba(0,0,0,0.04); }
      .secondary { background: #fff; color: #111; border-color: #e6e7ea; }
      .details { margin-top: 0.75rem; color: #6b7280; font-size: 13px }
      .small { font-size: 13px; color:#6b7280 }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing the page or go back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
      <div class="details small">If the issue persists, please contact support or try again later.</div>
    </div>
  </body>
</html>`;
}
