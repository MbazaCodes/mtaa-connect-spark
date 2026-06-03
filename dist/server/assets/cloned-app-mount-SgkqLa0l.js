import { jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
async function installBrowserPolyfills() {
  if (typeof window === "undefined") return;
  const w = window;
  if (!w.Buffer) {
    const { Buffer } = await import("buffer/index.js");
    w.Buffer = Buffer;
  }
  w.global = window;
  if (typeof crypto !== "undefined" && !crypto.randomUUID) {
    crypto.randomUUID = function() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === "x" ? r : r & 3 | 8;
        return v.toString(16);
      });
    };
  }
}
function ClonedApp() {
  const [mods, setMods] = useState(null);
  useEffect(() => {
    let cancelled = false;
    installBrowserPolyfills().then(() => Promise.all([
      import("./clone-app-CdyerJsU.js"),
      import("./LanguageContext-CxZn693q.js"),
      import("./AuthContext-CfeE5G_w.js").then((n) => n.A),
      import("./ToastContext-CEX5a5jr.js")
    ]).then(([app, lang, auth, toast]) => {
      if (cancelled) return;
      setMods({
        App: app.default,
        LanguageProvider: lang.LanguageProvider,
        AuthProvider: auth.AuthProvider,
        ToastProvider: toast.ToastProvider
      });
    }));
    return () => {
      cancelled = true;
    };
  }, []);
  if (!mods) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-stone-50", children: /* @__PURE__ */ jsx("div", { className: "w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" }) });
  }
  const { App, LanguageProvider, AuthProvider, ToastProvider } = mods;
  return /* @__PURE__ */ jsx(LanguageProvider, { children: /* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsx(ToastProvider, { children: /* @__PURE__ */ jsx(App, {}) }) }) });
}
export {
  ClonedApp as C
};
