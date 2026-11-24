"use strict";
(() => {
  let revision=0,busy=false,welcomeLoaded=false,approval="";
  const host=()=>window.JaheshHost;
  const active=()=>window.JaheshPublic?.hasSession?.()===true;
  const call=(path,payload={})=>window.JaheshPublic.call("/assistant/"+path,payload);
  const receive=async(path,payload,renderResult)=>{const current=revision;const data=await call(path,payload);if(current===revision&&active())renderResult(data);};
  const number=value=>Number(value||0).toLocaleString("fa-IR");
  const moment=value=>{
    if(!value)return "نامشخص";
    if(!/^\d{4}-\d\d-\d\d/.test(value)||Number(value.slice(0,4))<1900)return String(value);
    const parsed=new Date(value.length===10?value+"T12:00:00+03:30":value);
    return Number.isNaN(parsed.getTime())?"نامشخص":parsed.toLocaleString("fa-IR",{timeZone:"Asia/Tehran",dateStyle:"medium",...(value.length===10?{}:{timeStyle:"short"})});
  };
  const text=(parent,tag,value)=>{const element=document.createElement(tag);element.textContent=value;parent.append(element);return element;};
  const button=(parent,label,action)=>{const element=text(parent,"button",label);element.type="button";element.onclick=()=>perform(action,element);return element;};
  const card=()=>{const element=document.createElement("section");element.className="host-service-card";host().messages.append(element);while(host().messages.children.length>20)host().messages.firstElementChild.remove();return element;};
  async function perform(action,trigger){
    if(busy||!active())return;
    busy=true;trigger.disabled=true;
    try{await action();}catch(error){host().status.textContent=error.message||"دریافت نتیجه ممکن نشد؛ پیش از تکرار، رزروهای من را بررسی کن.";}
    finally{busy=false;trigger.disabled=false;}
  }
  const labelInput=(parent,label,type,value="")=>{
    const wrapper=text(parent,"label",label),input=document.createElement("input");input.type=type;input.value=value;wrapper.append(input);return input;
  };
  const services=()=>document.dispatchEvent(new CustomEvent("jahesh-my-reservations-open"));
  function renderOverview(data){
    const parent=card();text(parent,"h3",data.answer);
    const balance=data.activity?.balance;
    if(balance)text(parent,"p",`بدهی: ${number(balance.debt)} تومان · اعتبار: ${number(balance.credit)} تومان · امتیاز: ${number(balance.points)} · سطح: ${balance.tier}`);
    const library=data.library||{};
    if(library.fresh){
      text(parent,"p",`${library.membership_status_label} · اعتبار تا ${moment(library.membership_ends_on)} · ${number(library.loans.length)} کتاب امانت`);
      if(data.membership_elapsed_days_local!==null)text(parent,"p",`${number(data.membership_elapsed_days_local)} روز از شروع عضویت ثبت‌شده در جهش گذشته است (اطلاعات محلی).`);
      for(const loan of library.loans){
        const row=text(parent,"div",`${loan.book} · سررسید: ${moment(loan.due_date)}${loan.overdue_days?" · "+number(loan.overdue_days)+" روز دیرکرد":""}`);
        if(library.can_request_renewal)button(row,"درخواست تمدید همین کتاب",()=>receive("renewal-preview",{barcode:loan.barcode},showPreview));
      }
    }
    text(parent,"p",library.notice||"وضعیت کتابخانه هنوز تأیید نشده است.");
    for(const item of data.activity?.game_reservations||[])text(parent,"p",`${item.device} · ${moment(item.starts_at)} · ${item.status==="confirmed"?"تأییدشده":"برای وضعیت دقیق، رزروهای من را بررسی کن"}`);
    text(parent,"small","زمان دریافت: "+moment(data.as_of));
    button(parent,"رزروها، رسید پرداخت و بلیت‌های من",services);
  }
  function showPreview(data){
    approval=data.approval;
    const parent=card();text(parent,"h3",data.title);
    if(data.total!==undefined)text(parent,"p",`هزینه کل: ${number(data.total)} تومان · مبلغ این مرحله: ${number(data.amount)} تومان`);
    if(data.starts_at)text(parent,"p",moment(data.starts_at));
    if(data.local_date)text(parent,"p",moment(data.local_date)+" · "+data.local_time);
    if(data.seat_codes?.length)text(parent,"p","صندلی‌ها: "+data.seat_codes.join("، "));
    text(parent,"p",data.notice);
    const accepted=labelInput(parent,"جزئیات و شرایط بالا را خواندم و همین درخواست را تأیید می‌کنم.","checkbox");
    const current=revision;
    button(parent,"تأیید و ثبت همین درخواست",async()=>{
      if(!accepted.checked)throw new Error("برای ثبت، تأیید همین پیش‌نمایش را انتخاب کن.");
      const result=await call("confirm",{approval:data.approval,confirm_submission:true});
      if(current!==revision||!active())return;
      approval="";accepted.disabled=true;
      parent.querySelectorAll("button").forEach(item=>{item.onclick=null;item.disabled=true;});
      const row=result.result;
      text(parent,"p",result.operation==="renew"?row.notice||row.message||"درخواست تمدید ثبت شد؛ سررسید رسمی را در بخش کتابخانه پیگیری کن.":`${row.reservation_confirmed?"رزرو قطعی تأیید شد":"درخواست ثبت شد؛ هنوز رزرو قطعی نیست"} · کد پیگیری: ${row.code} · ${row.status_label}`);
      if(row.payment_authorized&&row.amount>0){
        text(parent,"p",`مبلغ قابل پرداخت: ${number(row.amount)} تومان · مهلت: ${moment(row.expires_at)}`);
        if(row.card_number){
          const copy=button(parent,row.card_number,async()=>{
            try{await navigator.clipboard.writeText(row.card_number);host().status.textContent="شماره کارت کپی شد.";}
            catch{host().status.textContent="کپی خودکار ممکن نشد؛ شماره کارت بالا را انتخاب و کپی کن.";}
          });copy.className="host-payment-card";copy.title="لمس برای کپی شماره کارت";
          text(parent,"p",row.card_holder||"");
        }
        text(parent,"p","پس از واریز، در «رزروهای من» تاریخ، ساعت دقیق و شماره پیگیری رسید را ثبت کن. ثبت رسید به معنی تأیید پرداخت نیست؛ وضعیت قطعی و بلیت را همان‌جا ببین.");
      }else if(result.operation==="book")text(parent,"p","تا وقتی مجوز پرداخت و اطلاعات کارت در رزروهای من دیده نشده، واریز نکن.");
      button(parent,result.operation==="renew"?"پیگیری سررسید و تمدید":"پیگیری، ثبت رسید و دریافت بلیت",()=>result.operation==="renew"?document.dispatchEvent(new CustomEvent("jahesh-library-open")):services());
    });
    button(parent,"انصراف از این پیش‌نمایش",()=>{approval="";parent.remove();});
  }
  function renderCatalog(data){
    const parent=card();text(parent,"p",data.answer);
    for(const resource of data.resources.slice(0,30)){
      const item=text(parent,"div","");item.className="host-offering";
      text(item,"h3",resource.label);
      if(resource.kind==="cinema"){
        text(item,"p",`${moment(resource.starts_at)} · ${number(resource.price)} تومان · ${number(resource.remaining)} جای خالی`);
        if(resource.description)text(item,"p",resource.description);
        const quantity=labelInput(item,"تعداد بلیت","number","1");quantity.min="1";quantity.max=String(resource.remaining);
        const selected=[];
        if(resource.seat_mode==="numbered"){
          const seats=text(item,"fieldset","");text(seats,"legend","انتخاب صندلی‌های آزاد");
          for(const seat of resource.seats.filter(seat=>seat.available)){
            const check=labelInput(seats,seat.code,"checkbox");selected.push([seat.code,check]);
          }
        }
        button(item,"بررسی مبلغ و پیش‌نمایش رزرو",()=>receive("preview",{booking:{
          request_key:crypto.randomUUID(),kind:"cinema",resource_id:resource.id,quantity:Number(quantity.value),
          seat_codes:selected.filter(([,check])=>check.checked).map(([code])=>code)}},showPreview));
      }else{
        text(item,"p",`تعرفه یک ساعت: ${number(resource.hourly_rate)} تومان`);
        const day=labelInput(item,"روز رزرو (شمسی)","date",data.local_date);
        const consent=labelInput(item,"اگر پرونده من بانو است، با حضور در سانس آقایان برای همین درخواست رضایت دارم.","checkbox");
        const slots=text(item,"div","");
        button(item,"دیدن سانس‌های مجاز و بدون تداخل",async()=>{
          const current=revision;
          const result=await call("chat",{message:"سانس بازی",resource_id:resource.id,local_date:day.value,audience_consent:consent.checked});
          if(current!==revision||!active())return;
          slots.replaceChildren();text(slots,"p",result.availability.notice);
          if(result.availability.live_session_notice)text(slots,"p",result.availability.live_session_notice);
          if(!result.availability.items.length)text(slots,"p","در این بازه، سانس مجاز و بدون تداخل پیدا نشد.");
          for(const slot of result.availability.items)button(slots,slot.local_time,()=>receive("preview",{booking:{
            request_key:crypto.randomUUID(),kind:"gamenet",resource_id:resource.id,local_date:result.availability.local_date,
            local_time:slot.local_time,minutes:60,audience_consent:consent.checked}},showPreview));
        });
        if(typeof jalaliPickerScan==="function")jalaliPickerScan(item);
      }
    }
    if(!data.resources.length)text(parent,"p","گزینه قابل رزرو منتشر نشده است.");
  }
  function render(data){
    if(data.kind==="overview"||data.profile){renderOverview(data);return;}
    if(data.kind==="catalog"){renderCatalog(data);return;}
    const parent=card();text(parent,"p",data.answer);
    if(data.kind==="search"||data.kind==="books"){
      const query=labelInput(parent,"موضوع، عنوان یا نویسنده","text");query.maxLength=200;
      button(parent,"جست‌وجو در فهرست دریافت‌شده مرکز",()=>receive("chat",{message:"جستجوی کتاب",query:query.value},render));
      for(const book of data.books?.items||[])text(parent,"p",`${book.title} · ${book.author||"نویسنده نامشخص"} · ${book.fresh?"وضعیت در زمان دریافت گزارش":"اطلاعات قدیمی؛ موجودی تأیید نشده"}`);
      button(parent,"جست‌وجوی زنده سامانه کتابخانه مرکزی اصفهان و همه شعب",()=>document.dispatchEvent(new CustomEvent("jahesh-library-open")));
    }
    if(data.kind==="hours"){
      const labels={games:"بازیکده",cinema:"سینما",library:"کتابخانه",cafe:"کافه",classes:"کلاس‌ها",events:"رویدادها",club:"باشگاه",space:"سالن"};
      for(const [key,value] of Object.entries(data.hours||{}))text(parent,"p",labels[key]+": "+value);
      const weekdays=["دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه","شنبه","یکشنبه"];
      for(const window of data.game_windows||[])text(parent,"p",`${weekdays[window.weekday]} ${window.starts.slice(0,5)}–${window.ends.slice(0,5)} · ${{all:"عمومی",female:"بانوان",male:"آقایان"}[window.audience]}`);
    }
  }
  async function welcome(){
    if(!active()||!host()||welcomeLoaded)return;
    welcomeLoaded=true;const current=revision;
    try{const data=await call("overview");if(current===revision&&active())renderOverview(data);}
    catch{if(current===revision)welcomeLoaded=false;}
  }
  window.JaheshMemberAssistant={
    async ask(message){
      if(!active()||!host())return false;
      if(busy)throw new Error("ابتدا منتظر نتیجه درخواست قبلی بمان.");
      busy=true;const current=revision;
      try{const data=await call("chat",{message});if(data.kind==="guide")return false;if(current===revision&&active()){host().append(message,true);render(data);host().status.textContent="اطلاعات پرونده فقط در مرکز پردازش شد؛ نتیجه عملیات را در حساب خودت پیگیری کن.";}return true;}
      finally{busy=false;}
    },welcome
  };
  document.addEventListener("jahesh-profile-ready",welcome);
  document.addEventListener("jahesh-web-session-ready",()=>{revision++;welcomeLoaded=false;approval="";host()?.messages.replaceChildren();welcome();});
  document.addEventListener("jahesh-web-session-ended",()=>{revision++;welcomeLoaded=false;approval="";host()?.messages.replaceChildren();});
  document.addEventListener("jahesh-member-session-reset",()=>{revision++;welcomeLoaded=false;approval="";host()?.messages.replaceChildren();});
  document.addEventListener("jahesh-before-account-change",event=>{if(busy){event.preventDefault();host().status.textContent="ابتدا نتیجه عملیات دستیار را بررسی کن.";}});
  welcome();
})();
