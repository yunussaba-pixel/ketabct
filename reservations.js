"use strict";
(() => {
  const container=document.querySelector('[data-view="booking"]');
  if(!container)return;
  container.innerHTML=`<div class="page-heading"><span>رزرو خدمات مرکز</span><h1 id="booking-title">بازیکده، کافه و سینما</h1><button id="reservation-back" class="secondary" type="button" hidden>بازگشت به انتخاب فیلم و سانس</button></div>
    <section class="reservation-panel"><button id="reservation-load" class="primary" type="button">دریافت خدمات قابل رزرو و رزروهای من</button>
    <p id="reservation-status" role="status" aria-live="polite" tabindex="-1">سانس دلخواه را انتخاب کن.</p>
    <form id="reservation-form" hidden><label>بخش<select id="reservation-kind"><option value="gamenet">بازیکده</option><option value="cafe">کافه</option><option value="cinema">سینما</option></select></label>
      <label>دستگاه، میز یا سانس<select id="reservation-resource" required></select></label>
      <div id="reservation-window" class="reservation-grid"><label>روز (شمسی)<input id="reservation-date" type="date" required></label><label>ساعت محلی مرکز<input id="reservation-time" type="time" required></label><label>مدت (دقیقه)<input id="reservation-minutes" type="number" required min="1" max="1440" value="60"></label></div>
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
  const number=value=>new Intl.NumberFormat("fa-IR").format(value);
  const registration=document.createElement("form");
  registration.className="reservation-panel";
  registration.hidden=true;
  registration.innerHTML=`<h2>اولین رزرو سینما؟ مشخصات خودت را ثبت کن</h2><p>یک نفر می‌تواند برای همراهانش هم بلیت بگیرد. این ثبت‌نام فقط دسترسی سینما می‌دهد؛ تأیید واریز با مسئول مرکز است.</p>
    <label>نام<input name="first_name" autocomplete="given-name" maxlength="80" required></label>
    <label>نام خانوادگی<input name="last_name" autocomplete="family-name" maxlength="80" required></label>
    <label>نام پدر<input name="father_name" maxlength="100" required></label>
    <label>شماره همراه<input name="phone" type="tel" inputmode="numeric" maxlength="11" required></label>
    <label><input name="consent" type="checkbox" required> ذخیره مشخصات برای رزرو و بررسی رسید توسط مرکز را می‌پذیرم. شماره همراه هنوز تأیید پیامکی نمی‌شود.</label>
    <button type="submit" class="primary">ثبت‌نام و ادامه رزرو سینما</button>`;
  container.insertBefore(registration,container.querySelector(".reservation-panel"));
  let catalog=null,busy=false,pending=null;
  const selectedSeats=new Set();
  const query=typeof URLSearchParams!=="undefined"?new URLSearchParams(window.location?.search||""):null;
  let selectedShowId=query?.get("show")||null;
  if(query?.get("section")==="cinema")node("kind").value="cinema";
  const message=text=>{status.textContent=text;};
  const reveal=()=>{const target=registration.hidden?status:registration;target.scrollIntoView?.({behavior:"smooth",block:"start"});if(registration.hidden)status.focus?.({preventScroll:true});};
  const selectStep=selected=>{container.classList.toggle("booking-selected",selected);node("back").hidden=!selected;node("load").hidden=selected;};
  node("back").onclick=()=>{if(busy||pending)return;selectStep(false);registration.hidden=true;form.hidden=true;};
  document.addEventListener("jahesh-program-open",()=>{if(!busy&&!pending)selectStep(false);});
  const identity=()=>{
    const raw=window.Eitaa?.WebApp?.initData;
    if(!raw)throw new Error("صفحه را از داخل برنامک ایتا باز کن؛ ورود امضاشده لازم است.");
    return raw;
  };
  const call=async(path,payload={})=>{
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
  const resource=()=>catalog?.resources.find(row=>row.kind===node("kind").value&&String(row.id)===node("resource").value);
  const sync=()=>{
    form.querySelectorAll("input,select,button").forEach(control=>{control.disabled=busy||Boolean(pending)||control.dataset.seatUnavailable==="true";});
    node("load").disabled=busy;
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
  const render=items=>{
    if(!Array.isArray(items))throw new Error("فهرست رزرو معتبر نیست.");
    node("list").replaceChildren(...items.map(item=>{
      const card=document.createElement("article");card.className="reservation-result";
      if(item.reservation_confirmed===true&&Number.isSafeInteger(item.reservation_reference))card.classList.add("reservation-confirmed");
      text(card,"strong",labels[item.kind]+" · "+item.status_label);
      text(card,"p","کد پیگیری: "+item.code+(item.reservation_confirmed?" · شماره رزرو رسمی: "+item.reservation_reference:" · هنوز قطعی نشده"));
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
          receipt.innerHTML='<label>مبلغ واریزی (تومان)<input name="amount" type="number" required min="1" max="1000000000"></label><label>تاریخ واریز<input name="payment_date" type="date" required></label><label>ساعت دقیق واریز به وقت مرکز<input name="payment_time" type="time" required></label><label>شماره پیگیری واریز<input name="reference" minlength="3" maxlength="60" required></label><label><input type="checkbox" required> واریز را انجام داده‌ام؛ تأیید دریافت با اپراتور است.</label><button type="submit" class="secondary" data-reservation-action>ثبت اطلاعات رسید</button>';
          receipt.elements.namedItem("amount").value=item.amount;
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
      return card;
    }));sync();
  };
  const refresh=async()=>render((await call("list")).items);
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
    try{catalog=await call("catalog");form.hidden=false;selectResources();message("تعداد بلیت را انتخاب کن و ادامه بده.");reveal();await refresh();}
    catch(error){if(error.status===403&&selectedShowId)registration.hidden=false;message(error.message);reveal();}finally{busy=false;sync();}
  };
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
    const values=new FormData(registration),button=registration.querySelector("button");
    busy=true;button.disabled=true;sync();
    try{
      await call("register",{registration:{first_name:values.get("first_name"),last_name:values.get("last_name"),father_name:values.get("father_name"),phone:values.get("phone"),consent:values.get("consent")==="on"}});
      registration.hidden=true;node("kind").value="cinema";
      catalog=await call("catalog");form.hidden=false;selectResources();await refresh();
      message("ثبت‌نام سینما انجام شد؛ سانس و صندلی‌ها را انتخاب کن. ثبت رسید به‌تنهایی تأیید واریز نیست.");
    }catch(error){message(error.message);}finally{busy=false;button.disabled=false;sync();}
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
  if(typeof jalaliPickerScan==="function")jalaliPickerScan(container);
  if(selectedShowId)node("load").onclick();
})();
