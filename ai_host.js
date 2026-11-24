"use strict";
(() => {
  if(document.getElementById("jahesh-host"))return;
  const launch=document.createElement("button");
  const mark='<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 10a5 5 0 0 1 5-5h12a5 5 0 0 1 5 5v9a5 5 0 0 1-5 5h-8l-6 4v-4a5 5 0 0 1-3-5z" stroke="currentColor" stroke-width="2"/><path d="M16 8c0 5-2 7-7 7 5 0 7 2 7 7 0-5 2-7 7-7-5 0-7-2-7-7z" fill="currentColor"/></svg>';
  launch.type="button";launch.className="jahesh-host-launch";launch.innerHTML='<span class="host-mark">'+mark+'</span><span>دستیار جهش</span>';
  launch.setAttribute("aria-controls","jahesh-host");launch.setAttribute("aria-expanded","false");
  const panel=document.createElement("aside");panel.id="jahesh-host";panel.className="jahesh-host";panel.hidden=true;
  panel.setAttribute("aria-label","راهنمای خدمات مرکز جهش");
  panel.innerHTML='<header class="host-head"><span class="host-mark">'+mark+'</span><div><h2>دستیار جهش</h2><p>راهنمای خدمات مرکز</p></div><button type="button" class="host-close" aria-label="بستن دستیار">×</button></header><div class="host-body"><p class="host-welcome"><strong>سلام! از کجا شروع کنیم؟</strong><br>یک پرسش آماده را انتخاب کنید یا سؤال خودتان را بنویسید.</p><div class="host-topics" aria-label="پرسش‌های آماده"></div><div class="host-messages" role="log" aria-live="polite"></div><form><label for="host-question">پرسش شما</label><textarea id="host-question" maxlength="1200" required placeholder="مثلاً: چطور برای سینما بلیت بگیرم؟"></textarea><div class="host-send"><span class="host-quota" aria-live="polite"></span><button type="submit">ارسال پرسش <span aria-hidden="true">←</span></button></div></form><small class="host-status" role="status"></small><small class="host-note">اطلاعات شخصی نفرستید. در صورت نیاز، فقط موضوع و نوع پرسش برای مدل ارسال می‌شود.</small></div>';
  document.body.append(launch,panel);
  const input=panel.querySelector("textarea"),form=panel.querySelector("form"),messages=panel.querySelector(".host-messages"),status=panel.querySelector(".host-status");
  const quota=panel.querySelector(".host-quota");
  const publicSite=typeof connectionEndpoint==="function";
  let visitor;
  if(publicSite){
    try{visitor=localStorage.getItem("jahesh-host-visitor");}catch{}
    if(!/^[a-f0-9]{32}$/.test(visitor||"")){
      visitor=globalThis.crypto?.randomUUID?.().replaceAll("-","");
      try{if(visitor)localStorage.setItem("jahesh-host-visitor",visitor);}catch{}
    }
  }
  const toggle=opened=>{panel.hidden=!opened;launch.setAttribute("aria-expanded",String(opened));if(opened)input.focus();else launch.focus();};
  launch.onclick=()=>toggle(panel.hidden);
  panel.querySelector(".host-close").onclick=()=>toggle(false);
  panel.addEventListener("keydown",event=>{if(event.key==="Escape")toggle(false);});
  const append=(body,question=false)=>{const item=document.createElement("p");item.className="host-message"+(question?" host-question":"");item.textContent=body;messages.append(item);while(messages.children.length>20)messages.firstElementChild.remove();messages.scrollTop=messages.scrollHeight;};
  if(typeof window!=="undefined")window.JaheshHost={panel,messages,status,append};
  for(const [label,prompt] of [["سانس بازی","چطور سانس بازیکده رزرو کنم؟"],["بلیت سینما","چطور برای سینما بلیت بگیرم؟"],["تمدید کتاب","چطور امانت کتاب را تمدید کنم؟"],["امتیاز باشگاه","درباره امتیاز باشگاه راهنمایی کن"],["کافه","درباره کافه راهنمایی کن"],["کلاس‌ها","درباره کلاس‌ها و کارگاه‌ها راهنمایی کن"]]){
    const button=document.createElement("button");button.type="button";button.textContent=label;button.onclick=()=>{input.value=prompt;input.focus();};panel.querySelector(".host-topics").append(button);
  }
  let busy=false;
  form.onsubmit=async event=>{
    event.preventDefault();if(busy||!input.value.trim())return;
    const message=input.value.trim();
    busy=true;form.querySelector("button").disabled=true;
    status.textContent="در حال دریافت راهنمایی…";
    try{
      if(typeof window!=="undefined"&&await window.JaheshMemberAssistant?.ask(message)){
        input.value="";return;
      }
      let base="";
      const headers={"Content-Type":"application/json"};
      if(publicSite){
        const endpoint=await connectionEndpoint();
        if(!/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.app\.lhr\.life\/connect$/.test(endpoint))throw new Error("نشانی امن مرکز در دسترس نیست.");
        base=endpoint.slice(0,-8);
      }else{
        headers["X-Jahesh-Request"]="1";
      }
      const response=await fetch(base+"/host/chat",{method:"POST",headers,credentials:"omit",redirect:"error",cache:"no-store",signal:AbortSignal.timeout(25000),body:JSON.stringify({message,visitor_id:visitor})});
      if(!response.ok){
        status.textContent=({422:"پرسش را بدون شماره، رمز، کد تأیید و اطلاعات شخصی بنویسید.",429:"تعداد پرسش‌ها به سقف رسیده است؛ بعداً دوباره تلاش کنید."})[response.status]||"دریافت پاسخ از مرکز ممکن نشد؛ دوباره تلاش کنید.";
        return;
      }
      const data=await response.json();
      if(typeof data.answer!=="string"||typeof data.notice!=="string")throw new Error("پاسخ مرکز معتبر نیست.");
      append(message,true);append(data.answer);input.value="";status.textContent=data.notice;
      if(publicSite&&data.quota)quota.textContent=data.quota.remaining.toLocaleString("fa-IR")+" پرسش باقی‌مانده امروز";
    }catch{status.textContent="اتصال به دستیار ممکن نشد؛ دوباره تلاش کنید یا از بخش خدمات استفاده کنید.";}
    finally{busy=false;form.querySelector("button").disabled=false;}
  };
})();
