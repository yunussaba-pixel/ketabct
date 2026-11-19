"use strict";
(() => {
  const container=document.querySelector('[data-view="booking"]');
  if(!container)return;
  container.innerHTML=`<div class="page-heading"><span>رزرو خدمات مرکز</span><h1 id="booking-title">بازیکده، کافه و سینما</h1><button id="reservation-back" class="secondary" type="button" hidden>بازگشت به انتخاب فیلم و سانس</button></div>
    <section class="reservation-panel"><button id="reservation-load" class="primary" type="button">انتخاب خدمت و رزرو جدید</button>
    <button id="reservation-track" class="secondary" type="button">پیگیری رزروها و بلیت‌های من</button>
    <label><input id="reservation-auto-track" type="checkbox"> پیگیری خودکار هر ۳۰ ثانیه تا وقتی این بخش باز است</label>
    <p id="reservation-tracking-status" role="status" aria-live="polite"></p>
    <p id="reservation-status" role="status" aria-live="polite" tabindex="-1">سانس دلخواه را انتخاب کن.</p>
    <form id="reservation-form" hidden><label>بخش<select id="reservation-kind"><option value="gamenet">بازیکده</option><option value="cafe">کافه</option><option value="cinema">سینما</option></select></label>
      <label>دستگاه، میز یا سانس<select id="reservation-resource" required></select></label>
      <div id="reservation-window" class="reservation-grid"><label>روز (شمسی)<input id="reservation-date" type="date" required></label><label>ساعت محلی مرکز<input id="reservation-time" type="time" required></label><label>مدت (دقیقه)<input id="reservation-minutes" type="number" required min="1" max="1440" value="60"></label></div>
      <fieldset id="reservation-availability" hidden><legend>زمان‌های قابل درخواست بازیکده</legend><div class="reservation-grid"><label>جست‌وجو از ساعت<input id="reservation-search-start" type="time" value="09:00"></label><label>تا ساعت<input id="reservation-search-end" type="time" value="23:00"></label></div><button id="reservation-search" class="secondary" type="button">نمایش زمان‌ها</button><p id="reservation-slots-status" role="status" aria-live="polite"></p><div id="reservation-slots" class="reservation-seats"></div></fieldset>
      <label id="reservation-quantity-label">تعداد مهمان یا بلیت<input id="reservation-quantity" type="number" min="1" max="100" value="1" required></label>
      <fieldset id="reservation-seating" hidden><legend>صندلی‌های آزاد را انتخاب کن</legend><div id="reservation-seats" class="reservation-seats"></div><p id="reservation-seat-summary" aria-live="polite"></p></fieldset>
      <p id="reservation-estimate" class="notice"></p><label><input id="reservation-consent" type="checkbox" required> زمان، خدمت و مبلغ برآوردی را بررسی کردم. ثبت این فرم به‌تنهایی تأیید نهایی نیست.</label>
      <button type="submit" class="primary">ثبت رزرو برای تأیید</button></form>
      <button id="reservation-reconcile" class="secondary" type="button" hidden>بررسی نتیجه عملیات قبلی</button>
      <button id="reservation-retry" class="secondary" type="button" hidden>تکرار امن همان عملیات با همان شناسه</button>
      <div id="reservation-list"></div></section>`;
  const node=id=>document.getElementById("reservation-"+id);
  const form=node("form"),status=node("status");
  const labels={gamenet:"بازیکده",cafe:"کافه",cinema:"سینما"};
  let sectionKind=null;
  const number=value=>new Intl.NumberFormat("fa-IR").format(value);
  const registration=document.createElement("form");
  registration.className="reservation-panel";
  registration.hidden=true;
  registration.innerHTML=`<h2>ورود و ادامه رزرو</h2><p>اگر قبلاً عضو مرکز هستی، پرونده خودت را همین‌جا با مشخصات و کد تأیید همراه متصل کن؛ نیازی به حضور اپراتور نیست.</p>
    <button id="reservation-member-mode" type="button" class="secondary">قبلاً عضو هستم؛ اتصال خودکار</button>
    <button id="reservation-new-mode" type="button" class="secondary" hidden>اولین مراجعه؛ ثبت‌نام جدید</button>
    <fieldset id="reservation-register-new"><legend>مشخصات عضو جدید</legend>
    <label>نام<input name="first_name" autocomplete="given-name" maxlength="80" required></label>
    <label>نام خانوادگی<input name="last_name" autocomplete="family-name" maxlength="80" required></label>
    <label>نام پدر<input name="father_name" maxlength="100" required></label>
    <label>شماره همراه<input name="phone" type="tel" inputmode="numeric" maxlength="11" required></label>
    <label><input name="consent" type="checkbox" required> ذخیره مشخصات برای رزرو و بررسی رسید توسط مرکز را می‌پذیرم. شماره همراه هنوز تأیید پیامکی نمی‌شود.</label></fieldset>
    <fieldset id="reservation-register-member" hidden disabled><legend>اتصال پرونده قبلی</legend>
    <label>کد ملی<input name="member_national_id" inputmode="numeric" minlength="10" maxlength="10" required autocomplete="off"></label>
    <label>همراه ثبت‌شده در پرونده<input name="member_phone" type="tel" inputmode="numeric" maxlength="20" required autocomplete="tel"></label>
    <label><input name="member_consent" type="checkbox" required> تطبیق مشخصات و دریافت کد تأیید همراه خودم را می‌پذیرم.</label></fieldset>
    <fieldset id="reservation-register-proof" hidden disabled><legend>تأیید همراه</legend>
    <label>کد تأیید شش‌رقمی<input name="member_code" inputmode="numeric" minlength="6" maxlength="6" required autocomplete="one-time-code"></label></fieldset>
    <button id="reservation-member-edit" type="button" class="secondary" hidden>اصلاح مشخصات / دریافت کد تازه</button>
    <button id="reservation-register-submit" type="submit" class="primary">ثبت‌نام و ادامه رزرو</button>`;
  container.insertBefore(registration,container.querySelector(".reservation-panel"));
  let catalog=null,busy=false,pending=null,listRevision=0;
  let receiptForms=new Map(),autoTimer=null,autoDelay=30000,hasList=false,viewActive=container.hidden===false;
  const stopAuto=()=>{if(autoTimer!==null)clearTimeout(autoTimer);autoTimer=null;};
  const editingReservation=()=>node("list").contains?.(document.activeElement)||form.contains?.(document.activeElement);
  const canAuto=()=>node("auto-track").checked&&hasList&&viewActive&&!document.hidden&&(typeof navigator==="undefined"||navigator.onLine!==false);
  const scheduleAuto=()=>{
    stopAuto();if(!canAuto())return;
    autoTimer=setTimeout(async()=>{
      autoTimer=null;if(!canAuto())return;
      if(busy||pending||editingReservation()){scheduleAuto();return;}
      await node("track").onclick({automatic:true});
    },autoDelay);
  };
  const invalidateList=()=>{listRevision++;hasList=false;autoDelay=30000;stopAuto();receiptForms.clear();clearTicketUrls();node("list").replaceChildren();node("tracking-status").textContent="";};
  node("auto-track").addEventListener("change",()=>{autoDelay=30000;scheduleAuto();});
  document.addEventListener("visibilitychange",scheduleAuto);
  window.addEventListener?.("offline",stopAuto);
  window.addEventListener?.("online",scheduleAuto);
  document.addEventListener("jahesh-view-changed",event=>{viewActive=event.detail?.view==="booking";scheduleAuto();});
  let memberMode=false,memberChallenge="";
  const memberStep=()=>{
    for(const [name,enabled] of [["new",!memberMode],["member",memberMode&&!memberChallenge],["proof",memberMode&&Boolean(memberChallenge)]]){
      node("register-"+name).hidden=!enabled;node("register-"+name).disabled=!enabled;
    }
    node("member-mode").hidden=memberMode;node("new-mode").hidden=!memberMode;
    node("member-edit").hidden=!memberChallenge;
    node("register-submit").textContent=memberMode?(memberChallenge?"تأیید و ادامه همان رزرو":"بررسی مشخصات و دریافت کد"):"ثبت‌نام و ادامه رزرو";
  };
  node("member-mode").onclick=()=>{if(busy)return;memberMode=true;memberChallenge="";memberStep();};
  node("new-mode").onclick=()=>{if(busy)return;memberMode=false;memberChallenge="";memberStep();};
  node("member-edit").onclick=()=>{if(busy)return;memberChallenge="";registration.elements.namedItem("member_code").value="";memberStep();};
  const selectedSeats=new Set();
  const query=typeof URLSearchParams!=="undefined"?new URLSearchParams(window.location?.search||""):null;
  let selectedShowId=query?.get("show")||null;
  const initialKind={cinema:"cinema",games:"gamenet",gamenet:"gamenet",cafe:"cafe"}[query?.get("section")];
  if(initialKind){sectionKind=initialKind;node("kind").value=initialKind;node("kind").parentElement.hidden=true;document.getElementById("booking-title").textContent=labels[initialKind];}
  const message=text=>{status.textContent=text;};
  const reveal=()=>{const target=registration.hidden?status:registration;target.scrollIntoView?.({behavior:"smooth",block:"start"});if(registration.hidden)status.focus?.({preventScroll:true});};
  const selectStep=selected=>{container.classList.toggle("booking-selected",selected);node("back").hidden=!selected;node("load").hidden=selected||sectionKind==="cinema";};
  node("back").onclick=()=>{if(busy||pending)return;selectStep(false);registration.hidden=true;form.hidden=true;};
  document.addEventListener("jahesh-program-open",()=>{if(!busy&&!pending)selectStep(false);});
  document.addEventListener("jahesh-before-service-change",event=>{if(busy||pending||libraryBusy){event.preventDefault();message("ابتدا نتیجه عملیات قبلی را پیگیری کن.");}});
  document.addEventListener("jahesh-booking-section",event=>{
    if(busy||pending)return;
    sectionKind=event.detail.kind;node("kind").value=sectionKind;
    node("kind").parentElement.hidden=true;
    document.getElementById("booking-title").textContent=event.detail.title;
    selectedShowId=null;selectedSeats.clear();form.hidden=true;registration.hidden=true;
    invalidateList();selectStep(false);
    node("load").hidden=sectionKind==="cinema";
    node("load").textContent="انتخاب زمان و رزرو "+labels[sectionKind];
    node("track").textContent="پیگیری رزروها و بلیت‌های من در "+labels[sectionKind];
    message(sectionKind==="cinema"?"فیلم و سانس دلخواه را انتخاب کن.":"برای انتخاب زمان و مشاهده رزروهای همین بخش، ادامه بده.");
  });
  const identity=()=>{
    if(window.JaheshPublic)return window.JaheshPublic.identity();
    const raw=window.Eitaa?.WebApp?.initData;
    if(!raw)throw new Error("صفحه را از داخل برنامک ایتا باز کن؛ ورود امضاشده لازم است.");
    return raw;
  };
  const call=async(path,payload={})=>{
    if(window.JaheshPublic)return window.JaheshPublic.call("/reservations/"+path,payload);
    const raw=identity(),endpoint=await connectionEndpoint();
    if(!/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.app\.lhr\.life\/connect$/.test(endpoint))throw new Error("نشانی امن مرکز در دسترس نیست.");
    let response;
    try{
      response=await fetch(endpoint.slice(0,-8)+"/reservations/"+path,{method:"POST",credentials:"omit",redirect:"error",cache:"no-store",
        headers:{"Content-Type":"application/json"},body:JSON.stringify({init_data:raw,...payload}),
        ...(typeof AbortSignal!=="undefined"&&AbortSignal.timeout?{signal:AbortSignal.timeout(20000)}:{})});
    }catch{throw Object.assign(new Error("ارتباط قطع شد؛ نتیجه را بررسی کن. دوباره پرداخت نکن."),{unknown:true});}
    let data;
    try{data=await response.json();}catch{throw Object.assign(new Error("پاسخ مرکز قابل بررسی نیست؛ ابتدا استعلام بگیر."),{unknown:true});}
    if(!response.ok)throw Object.assign(new Error(response.status===404?"رزرو واقعی هنوز روی درگاه مرکز فعال نشده است.":data.message||"درخواست پذیرفته نشد."),{unknown:response.status>=500,status:response.status});
    return data;
  };
  const date=value=>new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium",timeStyle:"short",timeZone:catalog?.timezone||"Asia/Tehran"}).format(new Date(value));
  const libraryDate=value=>{
    const raw=String(value||"");
    const normalized=raw.replace(/[۰-۹]/g,digit=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
    const parts=normalized.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if(!parts)return raw;
    if(Number(parts[1])<1700)return parts.slice(1).map(part=>new Intl.NumberFormat("fa-IR",{useGrouping:false}).format(Number(part))).join("/");
    const parsed=new Date(normalized+"T12:00:00Z");
    return Number.isFinite(parsed.getTime())?new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium",timeZone:"UTC"}).format(parsed):raw;
  };
  const resource=()=>catalog?.resources.find(row=>row.kind===node("kind").value&&String(row.id)===node("resource").value);
  let availabilityRevision=0;
  const clearAvailability=()=>{
    availabilityRevision++;node("slots").replaceChildren();node("slots-status").textContent="روز و مدت بازی را مشخص کن و «نمایش زمان‌ها» را بزن.";
    node("availability").hidden=resource()?.kind!=="gamenet";
  };
  node("search").onclick=async()=>{
    if(busy||pending||resource()?.kind!=="gamenet")return;
    if(!node("date").value||!Number.isInteger(Number(node("minutes").value))||Number(node("minutes").value)<1){node("slots-status").textContent="روز و مدت معتبر را انتخاب کن.";return;}
    const revision=++availabilityRevision;
    const availability={resource_id:resource().id,local_date:node("date").value,minutes:Number(node("minutes").value),window_start:node("search-start").value,window_end:node("search-end").value};
    node("search").disabled=true;node("slots").replaceChildren();node("slots-status").textContent="در حال بررسی زمان‌ها…";
    try{
      const result=await call("availability",{availability});
      if(revision!==availabilityRevision)return;
      if(!Array.isArray(result.items))throw new Error("پاسخ زمان‌های قابل درخواست معتبر نیست.");
      node("slots-status").textContent=(result.items.length?"یک ساعت را انتخاب کن. ":"در این بازه زمان بدون تداخل پیدا نشد. ")+(result.live_session_notice||"")+" "+result.notice;
      node("slots").replaceChildren(...result.items.map(slot=>{
        const button=document.createElement("button");button.type="button";button.className="secondary";
        button.textContent=new Intl.NumberFormat("fa-IR",{minimumIntegerDigits:2,useGrouping:false}).format(Number(slot.local_time.slice(0,2)))+":"+new Intl.NumberFormat("fa-IR",{minimumIntegerDigits:2,useGrouping:false}).format(Number(slot.local_time.slice(3)));
        button.onclick=()=>{if(busy||pending||revision!==availabilityRevision)return;node("time").value=slot.local_time;estimate();node("slots-status").textContent="ساعت "+button.textContent+" انتخاب شد؛ برای نگه‌داشتن زمان، رزرو را ثبت کن.";};
        return button;
      }));
    }catch(error){if(revision===availabilityRevision)node("slots-status").textContent=error.message;}
    finally{node("search").disabled=false;}
  };
  const sync=()=>{
    form.querySelectorAll("input,select,button").forEach(control=>{control.disabled=busy||Boolean(pending)||control.dataset.seatUnavailable==="true";});
    node("load").disabled=busy;
    node("track").disabled=busy||Boolean(pending);
    node("reconcile").hidden=!pending;node("retry").hidden=!pending;
    node("reconcile").disabled=busy;node("retry").disabled=busy;
    container.querySelectorAll("[data-reservation-action]").forEach(button=>{button.disabled=busy||Boolean(pending);});
  };
  const estimate=()=>{
    const row=resource();node("consent").checked=false;
    if(!row){node("estimate").textContent="گزینه‌ای برای این بخش عرضه نشده است؛ با مرکز تماس بگیر.";return;}
    const kind=node("kind").value,timed=kind!=="cinema";
    node("seat-summary").textContent="انتخاب شده: "+number(selectedSeats.size)+" از "+number(node("quantity").value)+" صندلی";
    node("window").hidden=!timed;node("quantity-label").hidden=kind==="gamenet";
    for(const key of ["date","time","minutes"])node(key).required=timed;
    const min=row.min_minutes||catalog.settings.min_gamenet_minutes,max=row.max_minutes||catalog.settings.max_gamenet_minutes;
    node("minutes").min=min;node("minutes").max=max;
    node("quantity").max=kind==="cafe"?row.capacity:catalog.settings.max_cinema_quantity;
    const total=timed?Math.ceil(row.hourly_rate*Number(node("minutes").value)/60):row.price*Number(node("quantity").value);
    const mode=row.payment_mode||catalog.settings[kind+"_payment_mode"];
    const percent=mode==="full"?100:row.deposit_percent||catalog.settings[kind+"_deposit_percent"];
    const due=mode==="none"?0:Math.ceil(total*percent/100);
    node("estimate").textContent=(timed?"":date(row.starts_at)+" · "+number(row.remaining)+" ظرفیت باقی‌مانده\n")+
      "برآورد: "+number(total)+" تومان · پرداخت لازم: "+number(due)+" تومان"+
      (kind==="gamenet"?"\nتعرفه تقویمی یا شرایط مرکز ممکن است برآورد را تغییر دهد؛ مبلغ ثبت‌شده مرکز ملاک است.":"")+
      (kind==="cafe"?"\nنرخ برای کل میز یا سالن است، نه هر نفر. تعداد مهمان فقط برای بررسی ظرفیت است.":"");
  };
  const selectResources=()=>{
    const options=catalog.resources.filter(row=>row.kind===node("kind").value).map(row=>{
      const option=document.createElement("option");option.value=row.id;option.textContent=row.label+(row.starts_at?" · "+date(row.starts_at):"");return option;
    });
    node("resource").replaceChildren(...options);
    if(node("kind").value==="cinema"&&selectedShowId)node("resource").value=options.some(option=>String(option.value)===String(selectedShowId))?String(selectedShowId):"";
    selectSeats();estimate();
    clearAvailability();
    form.querySelector('[type="submit"]').hidden=!options.length||!resource();
  };
  const selectSeats=()=>{
    selectedSeats.clear();
    const row=resource();node("seating").hidden=row?.seat_mode!=="numbered";
    node("seats").replaceChildren(...(row?.seats||[]).map(seat=>{
      const label=document.createElement("label"),input=document.createElement("input"),caption=document.createElement("span");
      input.type="checkbox";input.disabled=!seat.available;input.dataset.seatUnavailable=String(!seat.available);
      caption.textContent=seat.code+(seat.available?"":" · اشغال");
      input.addEventListener("change",()=>{if(input.checked)selectedSeats.add(seat.code);else selectedSeats.delete(seat.code);estimate();});
      label.append(input,caption);return label;
    }));
  };
  const text=(parent,tag,value)=>{const child=document.createElement(tag);child.textContent=value;parent.append(child);return child;};
  const ticketUrls=new Set();
  const clearTicketUrls=()=>{for(const url of ticketUrls)URL.revokeObjectURL(url);ticketUrls.clear();};
  const renderTicket=(card,ticket)=>{
    const panel=document.createElement("section");panel.className="cinema-ticket";
    panel.classList.add(ticket.entry_allowed===true?"cinema-ticket-ready":"cinema-ticket-blocked");
    panel.setAttribute("aria-label","بلیت سینما");
    const rows=["بلیت سینما جهش",ticket.status_label,"کد بلیت: "+ticket.tracking_code,
      "کد درخواست: "+ticket.request_code,"فیلم: "+ticket.film_title,"سالن: "+ticket.hall_name,
      "شروع: "+date(ticket.starts_at),"پایان: "+date(ticket.ends_at),
      "تعداد: "+number(ticket.quantity),"صندلی‌ها: "+(ticket.seat_codes?.join("، ")||"بدون شماره؛ پذیرش بر اساس ظرفیت"),
      "ورود ثبت‌شده: "+number(ticket.admitted_count)+" · باقی‌مانده: "+number(ticket.remaining_count),
      "آخرین بررسی: "+date(ticket.checked_at),ticket.notice];
    rows.forEach((value,index)=>text(panel,index===0?"strong":"p",value));
    if(ticket.entry_allowed===true){
      const escape=value=>String(value).replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));
      const html='<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'"><title>بلیت سینما جهش</title><style>body{font-family:Tahoma,sans-serif;max-width:520px;margin:24px auto;padding:24px;border:2px solid #22754a;border-radius:18px;line-height:1.9;overflow-wrap:anywhere}h1{font-size:22px}p{margin:8px 0}</style></head><body><h1>'+escape(rows[0])+'</h1>'+rows.slice(1).map(value=>"<p>"+escape(value)+"</p>").join("")+"</body></html>";
      const url=URL.createObjectURL(new Blob([html],{type:"text/html;charset=utf-8"}));ticketUrls.add(url);
      const download=text(panel,"a","دریافت بلیت برای نگهداری یا چاپ");download.href=url;
      download.download="jahesh-cinema-"+String(ticket.tracking_code).replace(/[^A-Za-z0-9-]/g,"")+".html";
    }
    card.append(panel);
  };
  const render=items=>{
    if(!Array.isArray(items))throw new Error("فهرست رزرو معتبر نیست.");
    const drafts=new Map(Array.from(receiptForms,([requestId,previous])=>[requestId,{
      amountDue:previous.amountDue,
      values:Object.fromEntries(["amount","payment_date","payment_time","reference"].map(name=>[name,previous.form.elements.namedItem(name).value])),
      confirmed:previous.form.elements.namedItem("paid_confirmed").checked
    }]));
    receiptForms=new Map();
    clearTicketUrls();
    const visible=items.filter(item=>!sectionKind||item.kind===sectionKind);
    node("list").replaceChildren(...visible.map(item=>{
      const card=document.createElement("article");card.className="reservation-result";
      if(item.reservation_confirmed===true&&Number.isSafeInteger(item.reservation_reference))card.classList.add("reservation-confirmed");
      text(card,"strong",labels[item.kind]+" · "+item.status_label);
      text(card,"p","کد پیگیری: "+item.code+(item.ticket?.status==="cancelled"?" · رزرو رسمی فعال نیست":item.reservation_confirmed?" · شماره رزرو رسمی: "+item.reservation_reference:" · هنوز قطعی نشده"));
      const detail=item.details||{};
      text(card,"p",detail.device_name||detail.resource_name||detail.film_title||"");
      if(detail.starts_at)text(card,"p",date(detail.starts_at)+(detail.minutes?" · "+number(detail.minutes)+" دقیقه":""));
      if(detail.seat_codes?.length)text(card,"p","صندلی‌ها: "+detail.seat_codes.join("، "));
      text(card,"p","مبلغ کل: "+number(item.estimate)+" · پرداخت لازم: "+number(item.amount)+" تومان");
      if(item.payment_authorized===false)text(card,"p","پیش‌درخواست در انتظار بررسی اپراتور است؛ فعلاً پرداخت نکن. ظرفیت هنوز نگه داشته نشده است.");
      if(["awaiting_payment","awaiting_operator"].includes(item.status)){
        text(card,"p","مهلت بررسی: "+date(item.expires_at));
        if(item.payment_authorized!==false&&item.amount>0&&!item.receipts.some(row=>["pending","confirmed"].includes(row.status))){
          text(card,"p",item.card_number?"کارت مرکز: "+item.card_number+" · "+item.card_holder:"شماره کارت مرکز تنظیم نشده؛ قبل از پرداخت با مرکز تماس بگیر.");
          const receipt=document.createElement("form");
          receipt.innerHTML='<label>مبلغ واریزی (تومان)<input name="amount" type="number" required min="1" max="1000000000"></label><label>تاریخ واریز<input name="payment_date" type="date" required></label><label>ساعت دقیق واریز به وقت مرکز<input name="payment_time" type="time" required></label><label>شماره پیگیری واریز<input name="reference" minlength="3" maxlength="60" required></label><label><input name="paid_confirmed" type="checkbox" required> واریز را انجام داده‌ام؛ تأیید دریافت با اپراتور است.</label><button type="submit" class="secondary" data-reservation-action>ثبت اطلاعات رسید</button>';
          receipt.elements.namedItem("amount").value=item.amount;
          const draft=drafts.get(item.id);
          if(draft){
            for(const [name,value] of Object.entries(draft.values))receipt.elements.namedItem(name).value=value;
            receipt.elements.namedItem("paid_confirmed").checked=draft.confirmed&&draft.amountDue===item.amount;
            if(draft.amountDue!==item.amount)text(card,"p","مبلغ لازم تغییر کرده است؛ مبلغ رسید و شرایط پرداخت را دوباره بررسی کن.");
          }
          receiptForms.set(item.id,{form:receipt,amountDue:item.amount});
          receipt.onsubmit=event=>{event.preventDefault();write(item.id+"/receipt",{receipt:{request_key:crypto.randomUUID(),amount:Number(receipt.elements.namedItem("amount").value),reference:receipt.elements.namedItem("reference").value.trim(),payment_date:receipt.elements.namedItem("payment_date").value,payment_time:receipt.elements.namedItem("payment_time").value}});};card.append(receipt);
          if(typeof jalaliPickerScan==="function")jalaliPickerScan(receipt);
        }
        if(!item.receipts.some(row=>["pending","confirmed"].includes(row.status))){
          const cancel=text(card,"button","لغو این درخواست");cancel.type="button";cancel.className="secondary";cancel.dataset.reservationAction="";
          let armed=false;
          cancel.onclick=()=>{if(!armed){armed=true;cancel.textContent="تأیید نهایی لغو";return;}write(item.id+"/cancel",{cancellation:{request_key:crypto.randomUUID()}});};
        }
      }
      for(const receipt of item.receipts)text(card,"p","رسید "+receipt.reference+": "+({pending:"منتظر بررسی",confirmed:"تأیید اپراتور",rejected:"ردشده"}[receipt.status]||receipt.status));
      if(item.kind==="cinema"&&item.ticket)renderTicket(card,item.ticket);
      return card;
    }));
    if(!visible.length)text(node("list"),"p",sectionKind?"در بخش "+labels[sectionKind]+" رزروی برای این حساب ثبت نشده است.":"رزروی برای این حساب ثبت نشده است.");
    sync();
  };
  const refresh=async(automatic=false)=>{
    const revision=++listRevision,result=await call("list");
    if(revision!==listRevision)return false;
    if(automatic&&editingReservation()){node("tracking-status").textContent="تازه‌سازی تا پایان ویرایش فرم متوقف است.";return false;}
    render(result.items);hasList=true;autoDelay=30000;scheduleAuto();return true;
  };
  node("track").onclick=async event=>{
    if(busy||pending)return;
    const automatic=event?.automatic===true;
    stopAuto();
    busy=true;sync();node("list").setAttribute("aria-busy","true");
    node("tracking-status").textContent="در حال دریافت آخرین وضعیت رزروها و بلیت‌ها…";
    const revision=listRevision;
    try{
      if(await refresh(automatic))node("tracking-status").textContent="آخرین بررسی: "+date(new Date())+"؛ وضعیت فعلی از مرکز دریافت شد.";
    }catch(error){
      if(listRevision===revision+1){
        autoDelay=automatic?Math.min(autoDelay*2,120000):30000;
        if(error.status===401||error.status===403){invalidateList();node("tracking-status").textContent=error.message+" برای ادامه، ورود و دسترسی حساب را دوباره بررسی کن.";}
        else node("tracking-status").textContent=error.message+" وضعیت تازه دریافت نشد؛ اطلاعات قبلی ممکن است تغییر کرده باشد. می‌توانی دوباره پیگیری کنی.";
      }
    }finally{busy=false;node("list").setAttribute("aria-busy","false");sync();scheduleAuto();}
  };
  async function write(path,payload){
    if(busy||pending)return;
    try{identity();}catch(error){message(error.message);return;}
    pending={path,payload,key:(payload.booking||payload.receipt||payload.cancellation).request_key};
    await execute();
  }
  async function execute(){
    busy=true;sync();let result;
    try{
      result=await call(pending.path,pending.payload);pending=null;
      message(result.reservation_confirmed?"رزرو رسمی تأیید شده است.":"ثبت شد؛ وضعیت و شرایط پرداخت را در کارت زیر بررسی کن. هنوز قطعی نیست.");
      await refresh();
    }catch(error){
      if(!error.unknown)pending=null;
      message(error.message);
    }finally{busy=false;sync();}
  }
  node("load").onclick=async()=>{
    if(busy)return;busy=true;sync();
    message("در حال آماده‌سازی ادامه رزرو…");reveal();
    try{catalog=await call("catalog");form.hidden=false;selectResources();message(node("kind").value==="cinema"?"تعداد بلیت را انتخاب کن و ادامه بده.":"روز، ساعت و مدت استفاده را انتخاب کن.");reveal();await refresh();}
    catch(error){if(error.status===403&&window.Eitaa?.WebApp?.initData)registration.hidden=false;message(error.message);if(error.status!==401)reveal();}finally{busy=false;sync();}
  };
  document.addEventListener("jahesh-before-account-change",event=>{
    if(busy||pending||libraryBusy){event.preventDefault();message("ابتدا نتیجه عملیات قبلی را بررسی کن؛ تغییر حساب فعلاً ممکن نیست.");}
  });
  document.addEventListener("jahesh-web-session-ready",()=>{stopRenewalTracking();invalidateList();catalog=null;libraryRevision++;renewalKeys.clear();node("library-loans").replaceChildren();});
  document.addEventListener("jahesh-resume-service",()=>{
    if(libraryResumeAfterLogin){libraryResumeAfterLogin=false;document.dispatchEvent(new CustomEvent("jahesh-library-open"));return;}
    if(selectedShowId&&!busy&&!pending)node("load").onclick();
  });
  document.addEventListener("jahesh-web-session-ended",()=>{
    stopRenewalTracking();
    invalidateList();catalog=null;form.hidden=true;node("library-loans").replaceChildren();libraryRevision++;renewalKeys.clear();
    node("library-status").textContent="برای مشاهده امانت‌های خودت وارد حساب شو.";
    node("library-load").textContent="ورود و مشاهده امانت‌های من";
  });
  document.addEventListener("jahesh-cinema-selected",event=>{
    if(busy||pending){message("ابتدا نتیجه عملیات قبلی را بررسی کن.");return;}
    selectedShowId=String(event.detail.show_id);node("kind").value="cinema";
    document.dispatchEvent(new CustomEvent("jahesh-booking-open"));
    selectStep(true);form.hidden=true;
    registration.hidden=true;
    registration.querySelector("h2").textContent="مشخصات خریدار برای «"+event.detail.title+"»";
    node("load").onclick();
  });
  registration.onsubmit=async event=>{
    event.preventDefault();if(busy)return;
    const values=new FormData(registration),button=node("register-submit");
    busy=true;button.disabled=true;sync();
    try{
      if(memberMode){
        if(!memberChallenge){
          const result=await call("member-link/start",{details:{national_id:values.get("member_national_id"),phone:values.get("member_phone"),consent:values.get("member_consent")==="on"}});
          if(!/^[A-Za-z0-9_-]{43}$/.test(result.challenge))throw new Error("پاسخ بررسی معتبر نیست.");
          memberChallenge=result.challenge;memberStep();message(result.message);return;
        }
        await call("member-link/finish",{proof:{challenge:memberChallenge,code:values.get("member_code")}});
        memberChallenge="";registration.elements.namedItem("member_code").value="";memberStep();
      }else{
        await call("register",{registration:{first_name:values.get("first_name"),last_name:values.get("last_name"),father_name:values.get("father_name"),phone:values.get("phone"),consent:values.get("consent")==="on"}});
      }
      registration.hidden=true;
      catalog=await call("catalog");form.hidden=false;selectResources();await refresh();
      message("ثبت‌نام انجام شد؛ زمان و خدمت دلخواه را انتخاب کن. ثبت رسید به‌تنهایی تأیید واریز نیست.");
    }catch(error){
      if(error.status===409&&!memberMode){
        memberMode=true;memberChallenge="";registration.elements.namedItem("member_phone").value=values.get("phone")||"";memberStep();
      }
      message(error.message);
    }finally{busy=false;button.disabled=false;sync();}
  };
  node("reconcile").onclick=async()=>{
    if(!pending||busy)return;busy=true;sync();
    try{
      const result=await call("actions/"+pending.key);
      if(result.status==="found"){pending=null;await refresh();message("عملیات قبلی ثبت شده بود؛ وضعیت تازه شد.");}
      else message("ثبت قبلی هنوز پیدا نشد. در صورت نیاز فقط دکمه تکرار امن همان عملیات را بزن؛ دوباره پرداخت نکن.");
    }catch(error){message(error.message);}finally{busy=false;sync();}
  };
  node("retry").onclick=()=>{if(pending&&!busy)execute();};
  node("kind").onchange=selectResources;
  node("resource").addEventListener("change",selectSeats);
  for(const key of ["resource","date","time","minutes","quantity"])node(key).addEventListener("change",estimate);
  for(const key of ["resource","date","minutes","search-start","search-end"])node(key).addEventListener("change",clearAvailability);
  form.onsubmit=event=>{
    event.preventDefault();const row=resource();if(!row)return;
    const booking={request_key:crypto.randomUUID(),kind:row.kind,resource_id:row.id,quantity:row.kind==="gamenet"?1:Number(node("quantity").value)};
    if(row.kind==="cinema"&&row.seat_mode==="numbered"){
      if(selectedSeats.size!==booking.quantity){message("برای هر بلیت دقیقاً یک صندلی آزاد انتخاب کن.");return;}
      booking.seat_codes=Array.from(selectedSeats);
    }
    if(row.kind!=="cinema")Object.assign(booking,{local_date:node("date").value,local_time:node("time").value,minutes:Number(node("minutes").value)});
    write("book",{booking});
  };
  const libraryPanel=document.createElement("section");
  libraryPanel.hidden=true;libraryPanel.className="reservation-panel";
  libraryPanel.innerHTML='<h3>کتابخانه شهدای محمودآباد</h3><form id="reservation-library-search"><label>عنوان کتاب، نویسنده، موضوع یا شابک<input id="reservation-library-query" type="search" maxlength="200" autocomplete="off"></label><button id="reservation-library-search-button" type="submit" class="secondary">جست‌وجوی کتاب‌های این کتابخانه</button></form><p id="reservation-library-catalog-status" role="status" aria-live="polite"></p><div id="reservation-library-books"></div><button id="reservation-library-more" type="button" class="secondary" hidden>نتایج بیشتر</button><h3>عضویت و امانت‌های من</h3><button id="reservation-library-load" type="button" class="secondary">دریافت وضعیت من</button><p id="reservation-library-status" role="status" aria-live="polite"></p><div id="reservation-library-loans"></div>';
  document.getElementById("service-dialog")?.append(libraryPanel);
  let libraryRevision=0,libraryBusy=false,libraryResumeAfterLogin=false;
  const hasLibrarySession=()=>window.JaheshPublic
    ?window.JaheshPublic.hasSession?.()===true:Boolean(window.Eitaa?.WebApp?.initData);
  const renewalTimers=new Map();
  const stopRenewalTracking=()=>{for(const timer of renewalTimers.values())clearTimeout(timer);renewalTimers.clear();};
  const watchRenewal=(renewal,target,revision,attempt=0)=>{
    const requestKey=renewal.request_key;
    if(!requestKey||revision!==libraryRevision)return;
    const previous=renewalTimers.get(requestKey);if(previous!==undefined)clearTimeout(previous);
    renewalTimers.delete(requestKey);
    if(!["pending","claimed"].includes(renewal.status)||attempt>=20)return;
    renewalTimers.set(requestKey,setTimeout(async()=>{
      renewalTimers.delete(requestKey);
      if(revision!==libraryRevision||libraryPanel.hidden)return;
      if(document.hidden||(typeof navigator!=="undefined"&&navigator.onLine===false)){
        watchRenewal(renewal,target,revision,attempt);return;
      }
      try{
        const result=await call("library/renewals/"+encodeURIComponent(requestKey)+"/status");
        if(revision!==libraryRevision)return;
        target.textContent=(result.public_reply||"تمدید هنوز تأیید نشده است.")+" · کد پیگیری: "+requestKey;
        if(result.renewal_confirmed&&result.due_date)target.textContent+=" · سررسید تازه: "+libraryDate(result.due_date);
        watchRenewal(result,target,revision,attempt+1);
      }catch(error){
        if(revision!==libraryRevision)return;
        target.textContent="پیگیری نتیجه ممکن نشد؛ تمدید دوباره درخواست نکن. "+error.message;
        if(error.status!==401&&error.status!==403&&error.status!==404)watchRenewal(renewal,target,revision,attempt+1);
      }
    },15000));
  };
  let catalogRevision=0,librarySearchBusy=false,librarySearchOffset=0,librarySearchQuery="";
  const searchBooks=async(more=false)=>{
    if(librarySearchBusy)return;
    librarySearchBusy=true;node("library-search-button").disabled=true;node("library-more").disabled=true;
    const revision=++catalogRevision;
    if(!more){librarySearchOffset=0;librarySearchQuery=node("library-query").value.trim();node("library-books").replaceChildren();}
    node("library-catalog-status").textContent="در حال جست‌وجو در فهرست همین کتابخانه…";
    node("library-more").hidden=true;
    try{
      const endpoint=await connectionEndpoint();
      if(!/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.app\.lhr\.life\/connect$/.test(endpoint))throw new Error("نشانی امن مرکز در دسترس نیست.");
      const response=await fetch(endpoint.slice(0,-8)+"/library/catalog?query="+encodeURIComponent(librarySearchQuery)+"&offset="+librarySearchOffset,{credentials:"omit",redirect:"error",cache:"no-store",...(typeof AbortSignal!=="undefined"&&AbortSignal.timeout?{signal:AbortSignal.timeout(20000)}:{})});
      if(!response.ok)throw new Error("دریافت فهرست کتابخانه ممکن نشد؛ دوباره تلاش کن.");
      const result=await response.json();if(revision!==catalogRevision)return;
      if(result.library_code!=="0048"||!Array.isArray(result.items))throw new Error("پاسخ مربوط به کتابخانه مرکز نیست.");
      node("library-catalog-status").textContent=result.notice;
      if(result.ready&&!result.items.length)text(node("library-books"),"p",result.complete?"عنوانی مطابق این عبارت در گزارش دریافتی یافت نشد.":"در بخش دریافت‌شده عنوانی یافت نشد؛ فهرست هنوز کامل نیست.");
      const labels={available:"قابل امانت در زمان گزارش",on_loan:"در امانت در زمان گزارش",unavailable:"غیرقابل امانت در زمان گزارش",unknown:"وضعیت نسخه نیازمند استعلام"};
      for(const book of result.items){
        const card=document.createElement("article");card.className="reservation-result";
        text(card,"h4",book.title);if(book.author)text(card,"p","نویسنده: "+book.author);
        if(book.category)text(card,"p","بخش: "+book.category);
        if(book.isbn)text(card,"p","شابک: "+book.isbn);
        text(card,"p",labels[book.availability]||labels.unknown);
        if(book.captured_at&&Number.isFinite(Date.parse(book.captured_at)))text(card,"p","آخرین دریافت: "+date(book.captured_at));
        node("library-books").append(card);
      }
      librarySearchOffset+=result.items.length;
      node("library-more").hidden=librarySearchOffset>=result.total;
    }catch(error){if(revision===catalogRevision)node("library-catalog-status").textContent=error.message;}
    finally{librarySearchBusy=false;node("library-search-button").disabled=false;node("library-more").disabled=false;}
  };
  node("library-search").onsubmit=event=>{event.preventDefault();return searchBooks();};
  node("library-more").onclick=()=>searchBooks(true);
  const renewalKeys=new Map();
  document.addEventListener("jahesh-service-open",event=>{
    stopRenewalTracking();
    libraryRevision++;libraryPanel.hidden=event.detail?.service!=="library";
    catalogRevision++;node("library-books").replaceChildren();node("library-more").hidden=true;
    node("library-catalog-status").textContent="جست‌وجوی کتاب بدون ورود هم ممکن است؛ فقط موجودی گزارش‌شده شهدای محمودآباد نمایش داده می‌شود.";
    document.getElementById("service-dialog")?.classList.toggle("library-service-open",!libraryPanel.hidden);
    node("library-loans").replaceChildren();node("library-status").textContent="اطلاعات فقط برای صاحب حساب معتبر و پرونده متصل کتابخانه نمایش داده می‌شود؛ ورود وب هم قابل استفاده است.";
    node("library-load").textContent=hasLibrarySession()?"تازه‌سازی عضویت و امانت‌های من":"ورود و مشاهده امانت‌های من";
    if(!libraryPanel.hidden&&hasLibrarySession())node("library-load").onclick();
  });
  document.getElementById("service-dialog")?.addEventListener("close",()=>{
    stopRenewalTracking();
    clearTicketUrls();
    libraryRevision++;node("library-loans").replaceChildren();node("library-status").textContent="";
    catalogRevision++;
  });
  node("library-load").onclick=async()=>{
    if(libraryBusy)return;
    if(!hasLibrarySession()){
      libraryResumeAfterLogin=true;
      try{identity();}catch(error){node("library-status").textContent=error.message;}
      return;
    }
    stopRenewalTracking();
    libraryBusy=true;node("library-load").disabled=true;
    const revision=++libraryRevision;
    node("library-loans").replaceChildren();node("library-status").textContent="در حال دریافت اطلاعات کتابخانه…";
    try{
      const result=await call("library/status");if(revision!==libraryRevision)return;
      const membership={active:"فعال",inactive:"غیرفعال",unknown:"نامشخص"};
      const expiry=result.membership_ends_on?libraryDate(result.membership_ends_on):"ثبت نشده";
      const captured=result.captured_at&&Number.isFinite(Date.parse(result.captured_at))?" · آخرین دریافت از شهرداری: "+date(result.captured_at):"";
      node("library-status").textContent="عضویت: "+(membership[result.membership_status]||"نامشخص")+" · اعتبار تا: "+expiry+captured+" · "+result.notice;
      const renewals=Array.isArray(result.renewals)?result.renewals:[];
      for(const renewal of renewals){
        const progress=document.createElement("article");progress.className="reservation-result";
        text(progress,"h4",renewal.renewal_confirmed?"تمدید تأیید شد":"پیگیری تمدید کتاب");
        const progressNotice=text(progress,"p",renewal.public_reply||"در انتظار بررسی رسمی");
        progressNotice.setAttribute("role","status");
        watchRenewal(renewal,progressNotice,revision);
        text(progress,"p","بارکد: "+renewal.barcode+" · کد پیگیری: "+renewal.request_key);
        if(renewal.renewal_confirmed&&renewal.due_date)text(progress,"p","سررسید تازه: "+libraryDate(renewal.due_date));
        node("library-loans").append(progress);
      }
      if(!result.fresh)return;
      if(!result.loans.length)text(node("library-loans"),"p","در آخرین اطلاعات معتبر، امانتی ثبت نشده است.");
      for(const loan of result.loans){
        const card=document.createElement("article");card.className="reservation-result";
        text(card,"h4",loan.book||"کتاب");
        if(loan.due_date)text(card,"p","سررسید: "+libraryDate(loan.due_date));
        if(loan.overdue_days)text(card,"p",number(loan.overdue_days)+" روز دیرکرد");
        if(loan.barcode&&result.membership_status==="active"){
          const pending=renewals.find(renewal=>renewal.barcode===loan.barcode&&["pending","claimed"].includes(renewal.status));
          if(pending){
            text(card,"p","درخواست این کتاب در صف است؛ برای دیدن نتیجه، وضعیت کتابخانه را تازه کن.");
            node("library-loans").append(card);continue;
          }
          const label=document.createElement("label"),consent=document.createElement("input");consent.type="checkbox";
          label.append(consent,document.createTextNode("ثبت درخواست تمدید همین کتاب در صف شهرداری را تأیید می‌کنم."));card.append(label);
          const button=document.createElement("button");button.type="button";button.className="secondary";button.textContent="درخواست تمدید";card.append(button);
          const notice=text(card,"p","");notice.setAttribute("role","status");
          const signature=loan.barcode+":"+loan.due_date;
          button.onclick=async()=>{
            if(!consent.checked){notice.textContent="ابتدا ثبت درخواست بررسی را تأیید کن.";return;}
            if(libraryBusy||revision!==libraryRevision)return;
            libraryBusy=true;button.disabled=true;
            if(!renewalKeys.has(signature))renewalKeys.set(signature,crypto.randomUUID());
            try{
              const response=await call("library/renew-request",{request_key:renewalKeys.get(signature),barcode:loan.barcode,confirm_submission:true});
              if(revision!==libraryRevision)return;
              notice.textContent=response.renewal_confirmed?"تمدید رسمی تأیید شد. کد پیگیری: "+response.request_key:
                "درخواست در صف عملیات شهرداری ثبت شد؛ تمدید هنوز تأیید نشده است. کد پیگیری: "+response.request_key;
              button.textContent="درخواست ثبت شد";
              watchRenewal({...response,status:response.status||"pending"},notice,revision);
            }catch(error){if(revision===libraryRevision){notice.textContent=error.message;button.textContent="تکرار امن همان درخواست";button.disabled=false;}}
            finally{libraryBusy=false;}
          };
        }
        node("library-loans").append(card);
      }
    }catch(error){
      if(error.status===401)libraryResumeAfterLogin=true;
      if(revision===libraryRevision)node("library-status").textContent=error.message;
    }
    finally{libraryBusy=false;node("library-load").disabled=false;}
  };
  if(typeof jalaliPickerScan==="function")jalaliPickerScan(container);
  if(selectedShowId)node("load").onclick();
})();
