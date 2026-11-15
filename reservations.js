"use strict";
(() => {
  const container=document.querySelector('[data-view="booking"]');
  if(!container)return;
  container.innerHTML=`<div class="page-heading"><span>رزرو خدمات مرکز</span><h1 id="booking-title">بازیکده، کافه و سینما</h1><p>زمان و خدمت را انتخاب کن؛ قطعی‌شدن پس از بررسی ظرفیت و پرداخت و تأیید مسئول مرکز است.</p></div>
    <section class="reservation-panel"><button id="reservation-load" class="primary" type="button">دریافت خدمات قابل رزرو و رزروهای من</button>
    <p id="reservation-status" role="status" aria-live="polite">برای رزرو این صفحه را از داخل برنامک ایتا باز کن. دریافت فهرست فقط با زدن دکمه انجام می‌شود.</p>
    <form id="reservation-form" hidden><label>بخش<select id="reservation-kind"><option value="gamenet">بازیکده</option><option value="cafe">کافه</option><option value="cinema">سینما</option></select></label>
      <label>دستگاه، میز یا سانس<select id="reservation-resource" required></select></label>
      <div id="reservation-window" class="reservation-grid"><label>روز (شمسی)<input id="reservation-date" type="date" required></label><label>ساعت محلی مرکز<input id="reservation-time" type="time" required></label><label>مدت (دقیقه)<input id="reservation-minutes" type="number" required min="1" max="1440" value="60"></label></div>
      <label id="reservation-quantity-label">تعداد مهمان یا بلیت<input id="reservation-quantity" type="number" min="1" max="100" value="1" required></label>
      <p id="reservation-estimate" class="notice"></p><label><input id="reservation-consent" type="checkbox" required> زمان، خدمت و مبلغ برآوردی را بررسی کردم. ثبت این فرم به‌تنهایی تأیید نهایی نیست.</label>
      <button type="submit" class="primary">ثبت رزرو برای تأیید</button></form>
      <button id="reservation-reconcile" class="secondary" type="button" hidden>بررسی نتیجه عملیات قبلی</button>
      <button id="reservation-retry" class="secondary" type="button" hidden>تکرار امن همان عملیات با همان شناسه</button>
      <div id="reservation-list"></div></section>`;
  const node=id=>document.getElementById("reservation-"+id);
  const form=node("form"),status=node("status");
  const labels={gamenet:"بازیکده",cafe:"کافه",cinema:"سینما"};
  const number=value=>new Intl.NumberFormat("fa-IR").format(value);
  let catalog=null,busy=false,pending=null;
  const message=text=>{status.textContent=text;};
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
    if(!response.ok)throw Object.assign(new Error(response.status===404?"رزرو واقعی هنوز روی درگاه مرکز فعال نشده است.":data.message||"درخواست پذیرفته نشد."),{unknown:response.status>=500});
    return data;
  };
  const date=value=>new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium",timeStyle:"short",timeZone:catalog?.timezone||"Asia/Tehran"}).format(new Date(value));
  const resource=()=>catalog?.resources.find(row=>row.kind===node("kind").value&&String(row.id)===node("resource").value);
  const sync=()=>{
    form.querySelectorAll("input,select,button").forEach(control=>{control.disabled=busy||Boolean(pending);});
    node("load").disabled=busy;
    node("reconcile").hidden=!pending;node("retry").hidden=!pending;
    node("reconcile").disabled=busy;node("retry").disabled=busy;
    container.querySelectorAll("[data-reservation-action]").forEach(button=>{button.disabled=busy||Boolean(pending);});
  };
  const estimate=()=>{
    const row=resource();node("consent").checked=false;
    if(!row){node("estimate").textContent="گزینه‌ای برای این بخش عرضه نشده است؛ با مرکز تماس بگیر.";return;}
    const kind=node("kind").value,timed=kind!=="cinema";
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
    node("resource").replaceChildren(...options);estimate();
    form.querySelector('[type="submit"]').hidden=!options.length;
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
      text(card,"p","مبلغ کل: "+number(item.estimate)+" · پرداخت لازم: "+number(item.amount)+" تومان");
      if(["awaiting_payment","awaiting_operator"].includes(item.status)){
        text(card,"p","مهلت بررسی: "+date(item.expires_at));
        if(item.amount>0&&!item.receipts.some(row=>["pending","confirmed"].includes(row.status))){
          text(card,"p",item.card_number?"کارت مرکز: "+item.card_number+" · "+item.card_holder:"شماره کارت مرکز تنظیم نشده؛ قبل از پرداخت با مرکز تماس بگیر.");
          const receipt=document.createElement("form");
          receipt.innerHTML='<label>مبلغ واریزی (تومان)<input name="amount" type="number" required min="1" max="1000000000"></label><label>شماره پیگیری واریز<input name="reference" minlength="3" maxlength="60" required></label><label><input type="checkbox" required> واریز را انجام داده‌ام؛ تأیید دریافت با اپراتور است.</label><button type="submit" class="secondary" data-reservation-action>ثبت اطلاعات رسید</button>';
          receipt.elements.namedItem("amount").value=item.amount;
          receipt.onsubmit=event=>{event.preventDefault();write(item.id+"/receipt",{receipt:{request_key:crypto.randomUUID(),amount:Number(receipt.elements.namedItem("amount").value),reference:receipt.elements.namedItem("reference").value.trim()}});};card.append(receipt);
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
    try{catalog=await call("catalog");form.hidden=false;selectResources();await refresh();message("خدمات و رزروها به‌روز شدند. مبلغ قطعی درخواست از مرکز محاسبه می‌شود.");}
    catch(error){message(error.message);}finally{busy=false;sync();}
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
  for(const key of ["resource","date","time","minutes","quantity"])node(key).addEventListener("change",estimate);
  form.onsubmit=event=>{
    event.preventDefault();const row=resource();if(!row)return;
    const booking={request_key:crypto.randomUUID(),kind:row.kind,resource_id:row.id,quantity:row.kind==="gamenet"?1:Number(node("quantity").value)};
    if(row.kind!=="cinema")Object.assign(booking,{local_date:node("date").value,local_time:node("time").value,minutes:Number(node("minutes").value)});
    write("book",{booking});
  };
  if(typeof jalaliPickerScan==="function")jalaliPickerScan(container);
})();
