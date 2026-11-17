"use strict";
(() => {
  const node = name => document.getElementById(name);
  const status = node("service-request-status");
  const controls = ["request-section", "request-kind", "request-text", "request-consent", "submit-service-request"];
  const labels = {pending: "منتظر بررسی", in_review: "در حال بررسی", answered: "پاسخ داده شد", rejected: "پذیرفته نشد", cancelled: "لغو شده"};
  let requestKey = null;
  let available = false;
  let busy = false;
  let displayedItems = [];
  const freeze = locked => controls.forEach(name => {node(name).disabled = locked;});
  const signedIdentity = () => {
    if(window.JaheshPublic)return window.JaheshPublic.identity().init_data||"";
    const raw = window.Eitaa?.WebApp?.initData;
    if (!raw) throw new Error("برای ثبت و پیگیری درخواست، این صفحه را از داخل برنامک ایتا باز کن.");
    return raw;
  };
  const call = async (path, payload) => {
    if(payload&&window.JaheshPublic)return window.JaheshPublic.call(path,payload);
    const endpoint = await connectionEndpoint();
    if (!/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.app\.lhr\.life\/connect$/.test(endpoint)) {
      throw new Error("نشانی معتبر مرکز در دسترس نیست؛ اطلاعات ارسال نشد.");
    }
    const response = await fetch(endpoint.slice(0, -8) + path, {
      method: payload ? "POST" : "GET", credentials: "omit", cache: "no-store", redirect: "error",
      ...(typeof AbortSignal !== "undefined" && AbortSignal.timeout ? {signal: AbortSignal.timeout(20000)} : {}),
      ...(payload ? {headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)} : {})
    });
    let result;
    try {result = await response.json();} catch {throw new Error("پاسخ مرکز قابل بررسی نیست.");}
    if (!response.ok) {
      const error = new Error(response.status === 404 && path === "/request-policy"
        ? "ثبت درخواست هنوز روی سرور مرکز فعال نشده است."
        : (result.message || "درخواست تکمیل نشد؛ نتیجه را بررسی کن."));
      error.httpStatus = response.status;
      throw error;
    }
    return result;
  };
  const render = items => {
    if (!Array.isArray(items)) throw new Error("فهرست درخواست‌ها معتبر نیست.");
    const cards = items.map(item => {
      if (!item || !/^[0-9a-f-]{36}$/i.test(item.request_key) || !labels[item.status] ||
          typeof item.text !== "string" || typeof item.public_reply !== "string" ||
          !Number.isSafeInteger(item.version) || item.version < 1 ||
          item.reservation_confirmed !== false || item.payment_recorded !== false) {
        throw new Error("پاسخ درخواست معتبر نیست؛ نتیجه را دوباره استعلام بگیر.");
      }
      const card = document.createElement("article");
      card.className = "request-result";
      const heading = document.createElement("strong");
      heading.textContent = labels[item.status] || "نیازمند بررسی";
      const key = document.createElement("p");
      key.textContent = "شناسه پیگیری: " + item.request_key;
      const text = document.createElement("p");
      text.textContent = item.text;
      const reply = document.createElement("p");
      reply.textContent = item.public_reply || "پاسخ مرکز هنوز ثبت نشده است.";
      card.append(heading, key, text, reply);
      if (["pending", "in_review"].includes(item.status)) {
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.textContent = "لغو این درخواست";
        let armed = false;
        cancel.addEventListener("click", async () => {
          if (busy || cancel.disabled) return;
          if (!armed) {
            armed = true;
            cancel.textContent = "تأیید نهایی لغو درخواست";
            status.textContent = "برای لغو همین درخواست دوباره دکمه تأیید را بزن؛ پرداخت یا رزرو قطعی تغییر نمی‌کند.";
            return;
          }
          let raw;
          try {raw = signedIdentity();} catch (error) {status.textContent = error.message; return;}
          busy = true;
          cancel.disabled = true;
          try {
            const result = await call("/service-requests/" + item.request_key + "/cancel",
              {init_data: raw, version: item.version});
            if (result.request_key !== item.request_key || result.status !== "cancelled") {
              throw new Error("نتیجه لغو قابل تأیید نیست.");
            }
            render(displayedItems.map(previous => previous.request_key === item.request_key ? result : previous));
            status.textContent = "درخواست لغو شد؛ هیچ پرداخت یا رزرو قطعی تغییر نکرد.";
          } catch (error) {
            status.textContent = error.httpStatus === 409
              ? "وضعیت درخواست تغییر کرده است؛ فهرست درخواست‌ها را دوباره دریافت کن."
              : "نتیجه لغو قطعی نیست؛ فهرست درخواست‌ها را دوباره دریافت کن و لغو را فعلاً تکرار نکن.";
          } finally {busy = false;}
        });
        card.append(cancel);
      }
      return card;
    });
    displayedItems = items;
    node("service-request-list").replaceChildren(...cards);
    if (!items.length) status.textContent = "درخواستی برای این حساب پیدا نشد.";
  };
  node("request-availability").addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    node("request-availability").disabled = true;
    try {
      const policy = await call("/request-policy");
      if (policy.enabled !== true || policy.reservation_confirmed !== false) throw new Error("سیاست درخواست‌های مرکز قابل تأیید نیست.");
      available = true;
      node("request-workspace").hidden = false;
      status.textContent = "ثبت درخواست برای بررسی آماده است؛ رزرو قطعی یا پرداخت انجام نمی‌شود.";
    } catch (error) {
      status.textContent = error.message || "ارتباط با مرکز برقرار نشد.";
    } finally {
      busy = false;
      node("request-availability").disabled = false;
    }
  });
  node("service-request-form").addEventListener("submit", async event => {
    event.preventDefault();
    if (!available || busy || requestKey) return;
    const text = node("request-text").value.trim();
    if (text.length < 5 || text.length > 1000 || !node("request-consent").checked) {
      status.textContent = "توضیحات معتبر و تأیید ثبت درخواست لازم است.";
      return;
    }
    let raw;
    try {
      raw = signedIdentity();
      requestKey = crypto.randomUUID();
    } catch (error) {
      status.textContent = error.message;
      return;
    }
    busy = true;
    freeze(true);
    node("lookup-service-request").hidden = false;
    status.textContent = "در حال ثبت درخواست؛ لطفاً منتظر بمان…";
    try {
      const result = await call("/service-requests", {init_data: raw, request_key: requestKey,
        section: node("request-section").value, kind: node("request-kind").value, text, confirm_submission: true});
      if (result.request_key !== requestKey) throw new Error("شناسه پاسخ با درخواست یکسان نیست.");
      render([result]);
      status.textContent = "درخواست برای بررسی ثبت شد؛ رزرو قطعی نیست. شناسه: " + requestKey;
    } catch (error) {
      if ([422, 429, 503].includes(error.httpStatus)) {
        requestKey = null;
        freeze(false);
        node("lookup-service-request").hidden = true;
        status.textContent = error.message;
      } else {
        status.textContent = "نتیجه ثبت قطعی نیست؛ ابتدا «استعلام نتیجهٔ همین درخواست» را بزن. شناسه: " + requestKey;
      }
    } finally {busy = false;}
  });
  const query = async currentOnly => {
    if (!available || busy || (currentOnly && !requestKey)) return;
    busy = true;
    try {
      const result = await call(currentOnly ? "/service-requests/" + requestKey + "/status" : "/service-requests/list",
        {init_data: signedIdentity()});
      render(currentOnly ? [result] : result.items);
      if (currentOnly || result.items.length) status.textContent = "وضعیت درخواست‌ها دریافت شد؛ ثبت درخواست به معنی رزرو قطعی نیست.";
    } catch (error) {
      status.textContent = error.message || "استعلام تکمیل نشد؛ ثبت را تکرار نکن.";
    } finally {busy = false;}
  };
  node("lookup-service-request").addEventListener("click", () => query(true));
  node("list-service-requests").addEventListener("click", () => query(false));
  document.addEventListener("jahesh-before-account-change",event=>{
    if(busy||(requestKey&&!displayedItems.some(item=>item.request_key===requestKey))){event.preventDefault();status.textContent="ابتدا نتیجه درخواست قبلی را پیگیری کن؛ تغییر حساب فعلاً ممکن نیست.";}
  });
  for(const event of ["jahesh-web-session-ready","jahesh-web-session-ended"]){
    document.addEventListener(event,()=>{displayedItems=[];requestKey=null;freeze(false);node("request-text").value="";node("request-consent").checked=false;node("lookup-service-request").hidden=true;node("service-request-list").replaceChildren();status.textContent="";});
  }
})();
