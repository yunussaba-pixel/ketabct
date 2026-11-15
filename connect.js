"use strict";
const connectButton = document.getElementById("connect");
const connectStatus = document.getElementById("status");
let refreshWritePermission = false;
async function connectionEndpoint() {
  if (!connectButton.dataset?.gatewayManifest) return "/connect";
  let invalidManifest = false;
  const sources = [
    "https://api.github.com/repos/yunussaba-pixel/ketabct/contents/gateway.json?ref=gateway-state&fresh=",
    "https://raw.githubusercontent.com/yunussaba-pixel/ketabct/gateway-state/gateway.json?fresh="
  ];
  for (const source of sources) {
    try {
      const response = await fetch(source + Date.now(), {
        credentials: "omit", cache: "no-store", redirect: "error",
        headers: {Accept: "application/vnd.github.raw+json"},
        ...(typeof AbortSignal !== "undefined" && AbortSignal.timeout ? {signal: AbortSignal.timeout(10000)} : {})
      });
      if (!response.ok) throw new Error("gateway discovery unavailable");
      const manifest = await response.json();
      const now = Date.now() / 1000;
      if (!manifest || manifest.version !== 1 || manifest.status !== "ready" ||
          !Number.isInteger(manifest.generated_at) || !Number.isInteger(manifest.expires_at) ||
          manifest.generated_at > now + 30 || manifest.expires_at <= now ||
          manifest.expires_at <= manifest.generated_at || manifest.expires_at - manifest.generated_at > 600 ||
          typeof manifest.origin !== "string" ||
          !/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.app\.lhr\.life$/.test(manifest.origin)) {
        invalidManifest = true;
        continue;
      }
      return manifest.origin + "/connect";
    } catch {
      continue;
    }
  }
  throw new Error(invalidManifest
    ? "نشانی سرور مرکز منقضی یا غیرفعال است؛ اپراتور باید درگاه، تونل و انتشار نشانی را راه‌اندازی کند. اطلاعات شما ارسال نشد."
    : "نشانی سرور مرکز دریافت نشد؛ ارتباط اینترنت یا سرویس انتشار نشانی را بررسی کنید. اطلاعات شما ارسال نشد.");
}
connectButton.addEventListener("click", async () => {
  if (connectButton.disabled) return;
  const app = window.Eitaa && window.Eitaa.WebApp;
  if (!app || !app.initData) {
    connectStatus.textContent = "این صفحه را از دکمه خدمات مرکز داخل برنامک ایتا باز کنید.";
    return;
  }
  connectButton.disabled = true;
  connectStatus.textContent = "در حال بررسی اتصال…";
  let submitted = false;
  try {
    if (refreshWritePermission || !app.initDataUnsafe?.user?.allows_write_to_pm) {
      if (typeof app.requestWriteAccess !== "function") {
        connectStatus.textContent = "برای دریافت اجازه پیام، ایتا را به‌روز کنید.";
        connectButton.disabled = false;
        return;
      }
      const allowed = await new Promise(resolve => app.requestWriteAccess(resolve));
      if (!allowed) {
        connectStatus.textContent = "اجازه پیام داده نشد؛ هیچ پیام آزمایشی درخواست نشد.";
        connectButton.disabled = false;
        return;
      }
    }
    const endpoint = await connectionEndpoint();
    submitted = true;
    const response = await fetch(endpoint, {
      method: "POST", credentials: "omit", cache: "no-store", redirect: "error",
      ...(typeof AbortSignal !== "undefined" && AbortSignal.timeout ? {signal: AbortSignal.timeout(20000)} : {}),
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({init_data: app.initData, confirm_test_message: true})
    });
    const result = await response.json();
    if (!response.ok) {
      if (typeof result.message === "string" && result.message.includes("EITAA_PERMISSION")) {
        refreshWritePermission = true;
      }
      connectStatus.textContent = result.message || "اتصال تکمیل نشد؛ با مسئول مرکز هماهنگ کنید.";
      connectButton.disabled = false;
      return;
    }
    connectStatus.textContent = result.status === "accepted"
      ? (result.repeated ? "این حساب در ۲۴ ساعت اخیر آزمایش شده؛ پیام تکراری نفرستادیم. گفت‌وگو را بررسی کنید." : "سرویس درخواست پیام را پذیرفت؛ گفت‌وگوی برنامک در ایتا را بررسی کنید. تحویل قطعی هنوز تأیید نشده است.")
      : "نتیجه ارسال قطعی نیست؛ ابتدا گفت‌وگوی برنامک را بررسی کنید. برای جلوگیری از پیام تکراری، ارسال مجدد خودکار انجام نمی‌شود.";
  } catch {
    connectButton.disabled = submitted;
    connectStatus.textContent = submitted
      ? "ارتباط قطع شد؛ نتیجه ممکن است ثبت شده باشد. ابتدا گفت‌وگوی برنامک را بررسی کنید؛ پیام خودکار تکرار نمی‌شود."
      : "مسیر ارتباط مرکز فعلاً آماده نیست یا نشانی آن منقضی شده است؛ اطلاعات حساب ارسال نشد. کمی بعد دوباره همین دکمه را بزنید.";
  }
});
