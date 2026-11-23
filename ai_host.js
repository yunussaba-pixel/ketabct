"use strict";
(() => {
  if(document.getElementById("jahesh-host"))return;
  const launch=document.createElement("button");
  launch.type="button";launch.className="jahesh-host-launch";launch.textContent="✦ دستیار جهش";
  launch.setAttribute("aria-controls","jahesh-host");launch.setAttribute("aria-expanded","false");
  const panel=document.createElement("aside");panel.id="jahesh-host";panel.className="jahesh-host";panel.hidden=true;
  panel.setAttribute("aria-label","راهنمای خدمات مرکز جهش");
  panel.innerHTML='<header><h2>دستیار جهش</h2><button type="button" class="host-close" aria-label="بستن دستیار">×</button></header><small>راهنمای خدمات مرکز؛ اطلاعات شخصی، رمز و کد تأیید نفرستید.</small><div class="host-topics"></div><div class="host-messages" role="log" aria-live="polite"></div><form><label for="host-question">پرسش شما</label><textarea id="host-question" maxlength="1200" required placeholder="چطور سانس بازی رزرو کنم؟"></textarea><label><input type="checkbox" class="host-consent"> اجازه می‌دهم پرسشم برای پاسخ هوش مصنوعی به سرویس بیرونی ارسال شود؛ بدون این انتخاب فقط راهنمای محلی فعال است.</label><button type="submit">پرسیدن از دستیار</button></form><small class="host-status" role="status">هیچ رزرو یا پرداختی توسط این گفت‌وگو انجام نمی‌شود.</small>';
  document.body.append(launch,panel);
  const input=panel.querySelector("textarea"),form=panel.querySelector("form"),messages=panel.querySelector(".host-messages"),status=panel.querySelector(".host-status");
  const consent=panel.querySelector(".host-consent");
  const toggle=opened=>{panel.hidden=!opened;launch.setAttribute("aria-expanded",String(opened));if(opened)input.focus();else launch.focus();};
  launch.onclick=()=>toggle(panel.hidden);
  panel.querySelector(".host-close").onclick=()=>toggle(false);
  panel.addEventListener("keydown",event=>{if(event.key==="Escape")toggle(false);});
  const append=(body,question=false)=>{const item=document.createElement("p");item.className="host-message"+(question?" host-question":"");item.textContent=body;messages.append(item);while(messages.children.length>20)messages.firstElementChild.remove();messages.scrollTop=messages.scrollHeight;};
  append("سلام! من دستیار جهش هستم. درباره خدمات مرکز راهنمایی می‌کنم. کدام بخش مدنظرتان است؟");
  for(const topic of ["بازیکده","سینما","کتابخانه","کافه","باشگاه","کلاس‌ها"]){const button=document.createElement("button");button.type="button";button.textContent=topic;button.onclick=()=>{input.value="درباره "+topic+" راهنمایی کن";input.focus();};panel.querySelector(".host-topics").append(button);}
  let busy=false;
  form.onsubmit=async event=>{
    event.preventDefault();if(busy||!input.value.trim())return;
    const message=input.value.trim(),remoteConsent=consent.checked;
    consent.checked=false;busy=true;form.querySelector("button").disabled=true;
    status.textContent="در حال دریافت راهنمایی…";
    try{
      let base="";
      const headers={"Content-Type":"application/json"};
      if(typeof connectionEndpoint==="function"){
        const endpoint=await connectionEndpoint();
        if(!/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.app\.lhr\.life\/connect$/.test(endpoint))throw new Error("نشانی امن مرکز در دسترس نیست.");
        base=endpoint.slice(0,-8);
      }else{
        headers["X-Jahesh-Request"]="1";
      }
      const response=await fetch(base+"/host/chat",{method:"POST",headers,credentials:"omit",redirect:"error",cache:"no-store",signal:AbortSignal.timeout(25000),body:JSON.stringify({message,remote_consent:remoteConsent})});
      if(!response.ok){
        status.textContent=({422:"پرسش را بدون شماره، رمز، کد تأیید و اطلاعات شخصی بنویسید.",429:"تعداد پرسش‌ها به سقف رسیده است؛ بعداً دوباره تلاش کنید."})[response.status]||"دریافت پاسخ از مرکز ممکن نشد؛ دوباره تلاش کنید.";
        return;
      }
      const data=await response.json();
      if(typeof data.answer!=="string"||typeof data.notice!=="string")throw new Error("پاسخ مرکز معتبر نیست.");
      append(message,true);append(data.answer);input.value="";status.textContent=data.notice;
    }catch{status.textContent="اتصال به میزبان ممکن نشد؛ دوباره تلاش کنید یا از بخش خدمات استفاده کنید.";}
    finally{busy=false;form.querySelector("button").disabled=false;}
  };
})();
