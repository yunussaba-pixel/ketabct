"use strict";
(() => {
  const mount=document.getElementById("web-account");
  if(!mount)return;
  const signed=()=>window.Eitaa?.WebApp?.initData||"";
  let token="",expires="",busy=false,authMode=null,accountVisible=false;
  try{
    const saved=JSON.parse(sessionStorage.getItem("jahesh-public-session")||"null");
    if(saved&&/^[A-Za-z0-9_-]{43}$/.test(saved.token)&&Date.parse(saved.expires_at)>Date.now()){
      token=saved.token;expires=saved.expires_at;
    }
  }catch{}
  mount.innerHTML=`<button id="web-account-toggle" type="button" class="secondary">ورود / حساب من</button>
    <section id="web-account-panel" class="reservation-panel" hidden aria-label="ورود و ثبت‌نام">
    <h2>حساب من</h2><p id="web-account-intro">برای ادامه خدمات وارد شو؛ اگر قبلاً عضو مرکز بوده‌ای، مسیر پرونده قبلی را انتخاب کن.</p>
    <p id="web-account-status" role="status" aria-live="polite"></p>
    <form id="web-login-form"><label>نام کاربری<input name="username" autocomplete="username" minlength="3" maxlength="64" required dir="ltr"></label>
    <label>رمز عبور<input name="password" type="password" autocomplete="current-password" minlength="12" maxlength="128" required></label>
    <button type="submit" class="primary">ورود</button></form>
    <details id="web-register-details"><summary>هنوز عضو مرکز نیستم؛ ثبت‌نام جدید</summary>
    <form id="web-register-form"><label>نام<input name="first_name" autocomplete="given-name" maxlength="80" required></label>
    <label>نام خانوادگی<input name="last_name" autocomplete="family-name" maxlength="80" required></label>
    <label>نام پدر<input name="father_name" maxlength="100" required></label>
    <label>شماره همراه<input name="phone" type="tel" inputmode="numeric" maxlength="11" required></label>
    <label>نام کاربری دلخواه (انگلیسی)<input name="username" autocomplete="username" minlength="3" maxlength="64" required dir="ltr"></label>
    <label>رمز عبور (حداقل ۱۲ نویسه)<input name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></label>
    <label><input name="consent" type="checkbox" required> ذخیره مشخصات و شرایط رزرو را می‌پذیرم؛ شماره همراه با پیامک تأیید نشده است.</label>
    <button type="submit" class="primary">ساخت حساب و ادامه خدمات</button></form></details>
    <details id="web-claim-details"><summary>قبلاً عضو کتابخانه یا بازیکده بوده‌ام</summary>
    <form id="web-claim-form"><p>کد ملی و تاریخ تولد با پرونده تطبیق داده می‌شوند. برای جلوگیری از دسترسی دیگران به پرونده شما، لینک اختصاصی مرکز هم لازم است؛ آن را برای دیگران نفرست.</p>
    <label>کد ملی<input name="national_id" inputmode="numeric" maxlength="10" required autocomplete="off"></label>
    <label>تاریخ تولد (شمسی)<input name="birth_date" type="date" required autocomplete="bday"></label>
    <label>لینک اختصاصی یا کد دعوت مرکز<input name="invitation" type="password" autocomplete="off" maxlength="2048" required dir="ltr"></label>
    <label>نام کاربری دلخواه (انگلیسی)<input name="username" autocomplete="username" minlength="3" maxlength="64" required dir="ltr"></label>
    <label>رمز عبور (حداقل ۱۲ نویسه)<input name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></label>
    <label><input name="consent" type="checkbox" required> اتصال حساب به پرونده با دعوت اختصاصی مرکز را تأیید می‌کنم.</label>
    <button type="submit" class="primary">اتصال امن به پرونده قبلی</button></form></details>
    <button id="web-logout" type="button" class="secondary" hidden>خروج از حساب</button>
    <details><summary>امنیت حساب</summary><p class="notice">ورود تازه، نشست قبلی را می‌بندد. بازیابی رمز نیازمند بررسی مرکز است؛ نام یا شماره همراه به‌تنهایی مجوز دسترسی به امانت‌ها نیست.</p></details></section>`;
  const node=name=>document.getElementById("web-"+name);
  const message=text=>{node("account-status").textContent=text;};
  const clear=()=>{token="";expires="";try{sessionStorage.removeItem("jahesh-public-session");}catch{};render();};
  const render=()=>{
    const embedded=authMode!=="web"&&Boolean(signed());
    node("login-form").hidden=embedded||Boolean(token)||Boolean(node("register-details").open)||Boolean(node("claim-details").open);node("register-details").hidden=embedded||Boolean(token);node("claim-details").hidden=embedded||Boolean(token);
    node("logout").hidden=!token;node("account-toggle").hidden=accountVisible||embedded;
    node("account-toggle").textContent=token?"حساب من / خروج":"ورود / ثبت‌نام";
    node("account-intro").textContent=embedded?"ورود شما از حساب همین برنامک انجام می‌شود؛ برای استفاده از خدمات، بخش دلخواه را انتخاب کن.":"برای ادامه خدمات وارد شو؛ اگر قبلاً عضو مرکز بوده‌ای، مسیر پرونده قبلی را انتخاب کن.";
    const connection=document.getElementById("eitaa-connection-panel");if(connection)connection.hidden=!embedded||!accountVisible;
  };
  const show=()=>{
    const dialog=document.getElementById("service-dialog");if(dialog?.open)dialog.close();
    accountVisible=true;document.dispatchEvent(new CustomEvent("jahesh-account-open"));
    render();node("account-panel").hidden=false;mount.scrollIntoView?.({behavior:"smooth",block:"start"});
  };
  const canChange=()=>document.dispatchEvent(new CustomEvent("jahesh-before-account-change",{cancelable:true}));
  const identity=()=>{
    if(authMode!=="web"&&signed()){authMode="eitaa";render();return {init_data:signed()};}
    if(token&&Date.parse(expires)>Date.now()){authMode="web";return {};}
    clear();show();throw Object.assign(new Error("برای ادامه وارد حساب خودت شو یا ثبت‌نام کن."),{status:401});
  };
  const request=async(path,payload,{account=false}={})=>{
    const raw=account?"":identity().init_data||"";
    const endpoint=await connectionEndpoint();
    if(!/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.app\.lhr\.life\/connect$/.test(endpoint))throw new Error("نشانی امن مرکز آماده نیست؛ اطلاعات ارسال نشد.");
    const body={...payload};delete body.init_data;
    if(raw)body.init_data=raw;
    const headers={"Content-Type":"application/json"};
    if(!account&&!raw)headers.Authorization="Bearer "+token;
    let response,data;
    try{
      response=await fetch(endpoint.slice(0,-8)+(raw?"":"/web")+path,{method:"POST",headers,
        body:JSON.stringify(body),credentials:"omit",redirect:"error",cache:"no-store",
        ...(typeof AbortSignal!=="undefined"&&AbortSignal.timeout?{signal:AbortSignal.timeout(20000)}:{})});
      data=await response.json();
    }catch{throw Object.assign(new Error("ارتباط قطع شد؛ نتیجه ممکن است ثبت شده باشد. ابتدا پیگیری کن؛ دوباره پرداخت نکن."),{unknown:true});}
    if(!response.ok){
      if(response.status===401&&!account&&!raw){clear();show();}
      throw Object.assign(new Error(data.message||"درخواست پذیرفته نشد."),{status:response.status,httpStatus:response.status,unknown:response.status>=500});
    }
    return data;
  };
  window.JaheshPublic={identity,call:request};
  for(const name of ["register","claim"]){node(name+"-details").ontoggle=()=>{if(node(name+"-details").open)node((name==="register"?"claim":"register")+"-details").open=false;render();};}
  node("account-toggle").onclick=()=>show();
  for(const operation of ["login","register","claim"]){
    const form=node(operation+"-form");
    form.onsubmit=async event=>{
      event.preventDefault();if(busy||!canChange())return;
      const values=new FormData(form),payload={username:values.get("username"),password:values.get("password")};
      if(operation==="register")payload.registration={first_name:values.get("first_name"),last_name:values.get("last_name"),father_name:values.get("father_name"),phone:values.get("phone"),consent:values.get("consent")==="on"};
      if(operation==="claim")Object.assign(payload,{invitation:values.get("invitation"),national_id:values.get("national_id"),birth_date:values.get("birth_date"),consent:values.get("consent")==="on"});
      busy=true;form.querySelector('button[type="submit"]').disabled=true;
      message("در حال بررسی حساب…");
      try{
        const result=await request("/"+operation,payload,{account:true});
        if(!/^[A-Za-z0-9_-]{43}$/.test(result.token)||!(Date.parse(result.expires_at)>Date.now()))throw new Error("پاسخ ورود معتبر نیست.");
        token=result.token;expires=result.expires_at;authMode="web";
        try{sessionStorage.setItem("jahesh-public-session",JSON.stringify({token,expires_at:expires}));}catch{}
        render();message("وارد شدی؛ برای ادامه به بخش دلخواه برگرد.");
        document.dispatchEvent(new CustomEvent("jahesh-web-session-ready"));
        document.dispatchEvent(new CustomEvent("jahesh-account-return"));
      }catch(error){message(error.message+(operation!=="login"&&error.unknown?" اگر حساب ساخته شده، از فرم ورود استفاده کن.":""));}
      finally{busy=false;form.elements.namedItem("password").value="";if(operation==="claim")form.elements.namedItem("invitation").value="";form.querySelector('button[type="submit"]').disabled=false;}
    };
  }
  node("logout").onclick=async()=>{
    if(busy||!canChange())return;busy=true;node("logout").disabled=true;
    try{await request("/logout",{},{account:false});clear();message("از حساب خارج شدی.");document.dispatchEvent(new CustomEvent("jahesh-web-session-ended"));}
    catch(error){message(error.message+" خروج سمت مرکز تأیید نشد؛ پس از اتصال دوباره امتحان کن.");}
    finally{busy=false;node("logout").disabled=false;}
  };
  document.addEventListener?.("jahesh-view-changed",event=>{accountVisible=event.detail.view==="account";render();if(accountVisible)node("account-panel").hidden=false;});
  render();
})();
