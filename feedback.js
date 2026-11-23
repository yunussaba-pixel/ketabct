"use strict";
(() => {
  const node=id=>document.getElementById(id);
  const form=node("feedback-form");
  if(!form)return;
  const button=form.querySelector('button[type="submit"]');
  const status=node("feedback-status");
  const controls=[node("feedback-text"),node("feedback-section"),node("feedback-rating")];
  let pending=null,busy=false,retryAllowed=false,generation=0;
  const sections={"کل برنامک":"club","بازیکده":"games","سینما":"cinema","کتابخانه":"library","کافه":"cafe","رویدادها":"events"};
  const freeze=locked=>controls.forEach(control=>control.disabled=locked);
  const recover=document.createElement("button");
  recover.type="button";recover.className="secondary";recover.hidden=true;recover.textContent="استعلام نتیجه ثبت نظر";
  form.append(recover);
  const followup=document.createElement("button");
  followup.type="button";followup.className="secondary";followup.textContent="نظرهای من و پاسخ مرکز";
  const history=document.createElement("div");history.setAttribute("aria-live","polite");
  form.append(followup,history);
  const call=(path,payload)=>{
    if(!window.JaheshPublic)throw new Error("اتصال حساب آماده نیست؛ صفحه را تازه کن.");
    return window.JaheshPublic.call(path,payload);
  };
  const valid=item=>item&&item.request_key===pending?.request_key&&item.kind==="feedback"&&typeof item.version==="number";
  const success=item=>{
    if(!valid(item))throw new Error("نتیجه قابل بررسی نیست؛ ابتدا استعلام بگیر.");
    status.textContent="نظر برای مرکز ثبت شد. شناسه پیگیری: "+item.request_key;
    pending=null;retryAllowed=false;recover.hidden=true;button.disabled=false;freeze(false);
    node("feedback-text").value="";
  };
  window.JaheshFeedback={submit:async()=>{
    if(busy||(pending&&!retryAllowed))return;
    const epoch=generation;
    const text=node("feedback-text").value.trim();
    if(text.length<5||text.length>900){status.textContent="لطفاً نظر را بین ۵ تا ۹۰۰ نویسه بنویس.";return;}
    if(!window.JaheshPublic){status.textContent="اتصال حساب آماده نیست؛ صفحه را تازه کن.";return;}
    try{window.JaheshPublic.identity();}catch(error){status.textContent=error.message;return;}
    const section=sections[node("feedback-section").value]||"club",rating=node("feedback-rating").value;
    if(!pending){
      const key=window.crypto?.randomUUID?.();
      if(!key){status.textContent="شناسه امن آماده نیست؛ صفحه را در مرورگر به‌روز و اتصال امن باز کن.";return;}
      pending={request_key:key,section,kind:"feedback",text:(rating?"امتیاز: "+rating+"\n":"")+text,confirm_submission:true};
    }
    retryAllowed=false;
    busy=true;freeze(true);button.disabled=true;node("feedback-result").hidden=true;
    status.textContent="در حال ثبت نظر…";
    try{const result=await call("/service-requests",pending);if(epoch===generation)success(result);}
    catch(error){
      if(epoch!==generation)return;
      if([401,403,422,429].includes(error.httpStatus||error.status)){
        pending=null;freeze(false);button.disabled=false;status.textContent=error.message;
      }else{recover.hidden=false;status.textContent="نتیجه ثبت مشخص نیست؛ نظر را دوباره نفرست. ابتدا استعلام بگیر. شناسه: "+pending.request_key;}
    }finally{if(epoch===generation)busy=false;}
  }};
  recover.onclick=async()=>{
    if(busy||!pending)return;
    const epoch=generation;
    busy=true;recover.disabled=true;
    try{const result=await call("/service-requests/"+pending.request_key+"/status",{});if(epoch===generation)success(result);}
    catch(error){
      if(epoch!==generation)return;
      if(error.httpStatus===404){retryAllowed=true;button.disabled=false;status.textContent="هنوز نظری با این شناسه پیدا نشد؛ می‌توانی با دکمه ثبت، فقط همین نظر را با همان شناسه دوباره پیگیری و ثبت کنی.";}
      else status.textContent=error.message+" شناسه پیگیری: "+pending.request_key;
    }finally{if(epoch===generation){busy=false;recover.disabled=false;}}
  };
  followup.onclick=async()=>{
    if(busy)return;
    const epoch=generation;
    busy=true;followup.disabled=true;
    try{
      const result=await call("/service-requests/list",{});
      if(epoch!==generation)return;
      const cards=result.items.filter(item=>item.kind==="feedback").map(item=>{
        const card=document.createElement("article"),text=document.createElement("p"),reply=document.createElement("p");
        text.textContent=item.text;reply.textContent="پاسخ مرکز: "+(item.public_reply||"هنوز پاسخی ثبت نشده است.");card.append(text,reply);return card;
      });
      history.replaceChildren(...cards);
      if(!cards.length)history.textContent="هنوز نظری در این حساب ثبت نشده است.";
    }catch(error){if(epoch===generation)status.textContent=error.message;}finally{if(epoch===generation){busy=false;followup.disabled=false;}}
  };
  document.addEventListener("jahesh-before-account-change",event=>{
    if(busy||pending){event.preventDefault();status.textContent="ابتدا نتیجه ثبت نظر قبلی را استعلام بگیر.";}
  });
  for(const event of ["jahesh-web-session-ready","jahesh-web-session-ended"]){
    document.addEventListener(event,()=>{
      generation++;pending=null;busy=false;retryAllowed=false;freeze(false);button.disabled=false;
      recover.hidden=true;recover.disabled=false;followup.disabled=false;
      node("feedback-text").value="";node("feedback-section").selectedIndex=0;node("feedback-rating").selectedIndex=0;
      history.replaceChildren();status.textContent="";node("feedback-result").hidden=true;
    });
  }
})();
