"use strict";
(() => {
  const mount=document.getElementById("web-account");
  if(!mount)return;
  const signed=()=>window.Eitaa?.WebApp?.initData||"";
  let token="",expires="",busy=false,authMode=null,accountVisible=false;
  let memberChallenge="";
  let memberLogin=false;
  let entryMode="member",pendingProfile=null;
  let phoneChallenge="",phoneProof="",verifiedPhone="",phoneStage="start",phoneRetryAt=0;
  try{
    const saved=JSON.parse(sessionStorage.getItem("jahesh-public-session")||"null");
    if(saved&&/^[A-Za-z0-9_-]{43}$/.test(saved.token)&&Date.parse(saved.expires_at)>Date.now()){
      token=saved.token;expires=saved.expires_at;
    }
  }catch{}
  mount.innerHTML=`<button id="web-account-toggle" type="button" class="secondary">ورود / حساب من</button>
    <section id="web-account-panel" class="reservation-panel" hidden aria-label="ورود و ثبت‌نام">
    <h2>حساب من</h2><p id="web-account-intro">برای ادامه خدمات وارد حساب خودت شو یا ثبت‌نام کن.</p>
    <p id="web-account-status" role="status" aria-live="polite"></p>
    <nav id="web-entry-methods" aria-label="روش ورود"><button id="web-choose-member" type="button" class="secondary">عضو هستم؛ ورود با کد ملی و همراه</button><button id="web-choose-signup" type="button" class="secondary">عضو جدید؛ ثبت‌نام</button></nav>
    <details id="web-no-phone-panel"><summary>ثبت‌نام بدون شماره همراه (از جمله کودکان)</summary>
    <p>شماره همراه و پیامک لازم نیست؛ برای ورودهای بعد نام کاربری و رمز خودت را نگه دار. این ثبت‌نام به پرونده یا امانت‌های قبلی شخص دیگری دسترسی نمی‌دهد.</p>
    <form id="web-no-phone-form">
    <label>نام<input name="first_name" autocomplete="given-name" maxlength="80" required></label>
    <label>نام خانوادگی<input name="last_name" autocomplete="family-name" maxlength="80" required></label>
    <label>نام پدر<input name="father_name" maxlength="100" required></label>
    <label>کد ملی<input name="national_id" inputmode="numeric" minlength="10" maxlength="10" autocomplete="off" dir="ltr" required></label>
    <label>نام کاربری دلخواه (انگلیسی)<input name="username" autocomplete="username" minlength="3" maxlength="64" required dir="ltr"></label>
    <label>رمز عبور (حداقل ۱۲ نویسه)<input name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></label>
    <label><input name="consent" type="checkbox" required> ثبت مشخصات و شرایط خدمات و رزرو را می‌پذیرم؛ کد ملی خوداظهاری است و تأیید هویت مدنی محسوب نمی‌شود.</label>
    <button type="submit" class="primary">ثبت‌نام و ادامه بدون همراه</button></form></details>
    <section id="web-phone-panel" aria-label="ورود با تأیید شماره همراه">
    <h3>ثبت‌نام عضو جدید با همراه</h3>
    <p>مشخصات را وارد کن، کد پیامک را تأیید کن و خدمات را ادامه بده. پیامک دسترسی به شماره را تأیید می‌کند، نه مالکیت قانونی سیم‌کارت را.</p>
    <form id="web-phone-start-form">
    <label>نام<input name="first_name" autocomplete="given-name" maxlength="80" required></label>
    <label>نام خانوادگی<input name="last_name" autocomplete="family-name" maxlength="80" required></label>
    <label>نام پدر<input name="father_name" maxlength="100" required></label>
    <label>کد ملی<input name="national_id" inputmode="numeric" minlength="10" maxlength="10" dir="ltr" autocomplete="off" required></label>
    <label>شماره همراه<input name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" required dir="ltr"></label>
    <label><input name="consent" type="checkbox" required> دریافت کد و ذخیره شمارهٔ تأییدشده در حساب و دفتر تلفن مرکز را می‌پذیرم. این انتخاب عضویت کانال یا رضایت پیام تبلیغاتی نیست.</label>
    <button type="submit" class="primary">دریافت کد تأیید</button></form>
    <form id="web-phone-code-form" hidden><label>کد شش‌رقمی پیامک<input name="code" inputmode="numeric" autocomplete="one-time-code" minlength="6" maxlength="6" required dir="ltr"></label>
    <button type="submit" class="primary">تأیید شماره و ادامه</button></form>
    <form id="web-phone-profile-form" hidden>
    <label>نام (عضو جدید)<input name="first_name" autocomplete="given-name" maxlength="80"></label>
    <label>نام خانوادگی (عضو جدید)<input name="last_name" autocomplete="family-name" maxlength="80"></label>
    <label>نام پدر (عضو جدید)<input name="father_name" maxlength="100"></label>
    <label>کد ملی (برای اتصال به پروندهٔ قبلی)<input name="national_id" inputmode="numeric" minlength="10" maxlength="10" autocomplete="off" dir="ltr"></label>
    <p>عضو جدید: نام، نام خانوادگی و نام پدر لازم است. عضو قبلی: کد ملی ثبت‌شده‌ات را وارد کن؛ لازم نیست نام‌ها را دوباره بنویسی. مشخصات پروندهٔ قبلی بازنویسی نمی‌شود؛ تاریخ تولد و رمز لازم نیست.</p>
    <label><input name="consent" type="checkbox" required> ذخیره مشخصات و شرایط استفاده از خدمات و رزرو را می‌پذیرم.</label>
    <button type="submit" class="primary">تکمیل حساب و ادامه خدمات</button></form>
    <button id="web-phone-restart" type="button" class="secondary" hidden>اصلاح شماره / دریافت کد تازه</button>
    <p id="web-channel-invite" hidden>برای دریافت برنامه‌های مرکز، در صورت تمایل <a href="https://eitaa.com/ketabct" target="_blank" rel="noopener noreferrer">عضو کانال مجموعه شو</a>. عضویت از روی شماره تلفن قابل تأیید نیست.</p>
    </section>
    <details id="web-legacy-options"><summary>ورود با نام کاربری و رمز / اتصال پرونده قبلی</summary>
    <form id="web-login-form"><label>نام کاربری<input name="username" autocomplete="username" minlength="3" maxlength="64" required dir="ltr"></label>
    <label>رمز عبور<input name="password" type="password" autocomplete="current-password" minlength="12" maxlength="128" required></label>
    <button type="submit" class="primary">ورود</button></form>
    <button id="web-sms-login" type="button" class="secondary">ورود با کد پیامک؛ بدون نیاز به رمز</button>
    <details id="web-register-details"><summary>ساخت حساب جدید</summary>
    <form id="web-register-form"><label>نام<input name="first_name" autocomplete="given-name" maxlength="80" required></label>
    <label>نام خانوادگی<input name="last_name" autocomplete="family-name" maxlength="80" required></label>
    <label>نام پدر<input name="father_name" maxlength="100" required></label>
    <label>شماره همراه<input name="phone" type="tel" inputmode="numeric" maxlength="11" required></label>
    <label>نام کاربری دلخواه (انگلیسی)<input name="username" autocomplete="username" minlength="3" maxlength="64" required dir="ltr"></label>
    <label>رمز عبور (حداقل ۱۲ نویسه)<input name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></label>
    <label><input name="consent" type="checkbox" required> ذخیره مشخصات و شرایط رزرو را می‌پذیرم؛ شماره همراه با پیامک تأیید نشده است.</label>
    <button type="submit" class="primary">ساخت حساب و ادامه خدمات</button></form></details></details>
    <details id="web-member-details" open><summary>ورود عضو مرکز با کد ملی و شماره همراه</summary>
    <p>کد ملی و همراه ثبت‌شده بررسی می‌شوند؛ ورود با کد پیامکی است و تاریخ تولد لازم نیست. پروندهٔ قدیمیِ بدون کد ملی فقط با شمارهٔ یکتا و تأیید پیامکی متصل می‌شود؛ اطلاعات هویتی پرونده تغییر نمی‌کند.</p>
    <form id="web-member-start-form"><label hidden>نوع ورود<select name="purpose" id="web-member-purpose"><option value="login">ورود با پیامک؛ حتی برای اولین مراجعهٔ اینترنتی</option><option value="link">اتصال پرونده و ساخت نام کاربری و رمز</option></select></label><label>کد ملی<input name="national_id" inputmode="numeric" minlength="10" maxlength="10" required autocomplete="off"></label>
    <label>همراه ثبت‌شده در پرونده<input name="phone" type="tel" inputmode="numeric" maxlength="20" required autocomplete="tel"></label>
    <label><input name="consent" type="checkbox" required> تطبیق مشخصات و ارسال کد تأیید به همراه خودم را می‌پذیرم.</label>
    <button type="submit" class="primary">بررسی مشخصات و دریافت کد تأیید</button></form>
    <form id="web-member-finish-form" hidden><label>کد پیامک‌شده<input name="code" inputmode="numeric" autocomplete="one-time-code" minlength="6" maxlength="6" required></label>
    <div id="web-member-setup"><label>نام کاربری دلخواه (انگلیسی)<input name="username" autocomplete="username" minlength="3" maxlength="64" required dir="ltr"></label>
    <label>رمز عبور (حداقل ۱۲ نویسه)<input name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></label></div>
    <button type="submit" class="primary">تأیید همراه و اتصال خودکار</button></form>
    <button id="web-member-restart" type="button" class="secondary" hidden>اصلاح مشخصات / درخواست کد تازه</button></details>
    <button id="web-logout" type="button" class="secondary" hidden>خروج از حساب</button>
    <details><summary>امنیت حساب</summary><p class="notice">ورود تازه، نشست قبلی را می‌بندد. بازیابی رمز نیازمند بررسی مرکز است؛ نام یا شماره همراه به‌تنهایی مجوز دسترسی به امانت‌ها نیست.</p></details></section>`;
  const node=name=>document.getElementById("web-"+name);
  const message=text=>{node("account-status").textContent=text;};
  const clear=()=>{token="";expires="";try{sessionStorage.removeItem("jahesh-public-session");}catch{};render();};
  const render=()=>{
    const embedded=authMode!=="web"&&Boolean(signed());
    node("login-form").hidden=embedded||Boolean(token)||Boolean(node("register-details").open);node("register-details").hidden=true;node("member-details").hidden=embedded||Boolean(token)||entryMode!=="member";
    node("entry-methods").hidden=embedded||Boolean(token);
    node("legacy-options").hidden=embedded||Boolean(token);
    node("no-phone-panel").hidden=embedded||Boolean(token);
    node("phone-panel").hidden=embedded||Boolean(token)||entryMode!=="signup";
    node("phone-start-form").hidden=phoneStage!=="start";
    node("phone-code-form").hidden=phoneStage!=="code";
    node("phone-profile-form").hidden=phoneStage!=="profile";
    node("phone-restart").hidden=phoneStage==="start";
    node("channel-invite").hidden=phoneStage!=="profile";
    node("logout").hidden=!token;node("account-toggle").hidden=accountVisible||embedded;
    node("sms-login").hidden=embedded||Boolean(token);
    node("account-toggle").textContent=token?"حساب من / خروج":"ورود / ثبت‌نام";
    const homeEntry=document.getElementById("home-account-entry");if(homeEntry)homeEntry.textContent=token?"حساب من":"ورود / ثبت‌نام";
    node("account-intro").textContent=token?"وارد حساب شده‌ای؛ خدمات مرکز در دسترس توست.":embedded?"ورود شما از حساب همین برنامک انجام می‌شود؛ برای استفاده از خدمات، بخش دلخواه را انتخاب کن.":"عضو هستی؟ با کد ملی و همراه وارد شو. عضو جدیدی؟ ثبت‌نام را انتخاب کن. ثبت‌نام بدون همراه و ورود با رمز هم در همین صفحه در دسترس است.";
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
        ...(typeof AbortSignal!=="undefined"&&AbortSignal.timeout?{signal:AbortSignal.timeout(path.endsWith("/member-link/start")||path.endsWith("/phone/start")?45000:20000)}:{})});
      data=await response.json();
    }catch{throw Object.assign(new Error(account&&path.startsWith("/phone/")?"ارتباط با مرکز قطع شد؛ نتیجه این مرحله مشخص نیست. کد تازه خودکار ارسال نمی‌شود؛ پس از اتصال دوباره بررسی کن.":"ارتباط قطع شد؛ نتیجه ممکن است ثبت شده باشد. ابتدا پیگیری کن؛ دوباره پرداخت نکن."),{unknown:true});}
    if(!response.ok){
      if(response.status===401&&!account&&!raw){clear();show();}
      throw Object.assign(new Error(data.message||"درخواست پذیرفته نشد."),{status:response.status,httpStatus:response.status,unknown:response.status>=500});
    }
    return data;
  };
  window.JaheshPublic={identity,call:request};
  for(const name of ["register","member"]){node(name+"-details").ontoggle=()=>{if(node(name+"-details").open)node((name==="register"?"member":"register")+"-details").open=false;render();};}
  const acceptSession=result=>{
    if(!/^[A-Za-z0-9_-]{43}$/.test(result.token)||!(Date.parse(result.expires_at)>Date.now()))throw new Error("پاسخ ورود معتبر نیست.");
    token=result.token;expires=result.expires_at;authMode="web";memberChallenge="";
    phoneChallenge="";phoneProof="";verifiedPhone="";phoneStage="start";
    node("phone-code-form").elements.namedItem("code").value="";
    for(const name of ["first_name","last_name","father_name","national_id"])node("phone-profile-form").elements.namedItem(name).value="";
    node("member-finish-form").hidden=true;node("member-start-form").hidden=false;
    node("member-restart").hidden=true;
    try{sessionStorage.setItem("jahesh-public-session",JSON.stringify({token,expires_at:expires}));}catch{}
    pendingProfile=null;
    for(const name of ["first_name","last_name","father_name","national_id"])node("phone-start-form").elements.namedItem(name).value="";
    render();message("ورود موفق بود؛ خدمات مرکز آماده است.");
    document.dispatchEvent(new CustomEvent("jahesh-web-session-ready"));
    document.dispatchEvent(new CustomEvent("jahesh-account-return"));
  };
  node("phone-restart").onclick=()=>{
    if(busy)return;
    phoneChallenge="";phoneProof="";verifiedPhone="";phoneStage="start";pendingProfile=null;
    node("phone-code-form").elements.namedItem("code").value="";
    render();message("شماره را بررسی کن؛ درخواست دوباره کد حداقل یک دقیقه فاصله لازم دارد.");
  };
  for(const mode of ["member","signup"]){
    node("choose-"+mode).onclick=()=>{
      if(busy)return;
      entryMode=mode;
      if(mode==="member"){node("member-details").open=true;node("member-purpose").value="login";}
      render();message("");
    };
  }
  node("no-phone-form").onsubmit=async event=>{
    event.preventDefault();if(busy||!canChange())return;
    const form=node("no-phone-form"),values=new FormData(form);
    const registration={consent:values.get("consent")==="on"};
    for(const name of ["first_name","last_name","father_name","national_id"])registration[name]=values.get(name);
    busy=true;form.querySelector('button[type="submit"]').disabled=true;
    message("در حال ساخت حساب بدون شماره همراه…");
    try{
      const result=await request("/register-without-phone",{username:values.get("username"),password:values.get("password"),registration},{account:true});
      acceptSession(result);
      for(const name of ["first_name","last_name","father_name","national_id"])form.elements.namedItem(name).value="";
    }catch(error){message(error.message);}
    finally{busy=false;form.querySelector('button[type="submit"]').disabled=false;form.elements.namedItem("password").value="";}
  };
  for(const stage of ["start","code","profile"]){
    const form=node("phone-"+stage+"-form");
    form.onsubmit=async event=>{
      event.preventDefault();if(busy||!canChange())return;
      if(stage==="start"&&Date.now()<phoneRetryAt){message("برای دریافت کد تازه حداقل یک دقیقه صبر کن.");return;}
      if((stage==="code"&&!phoneChallenge)||(stage==="profile"&&!phoneProof)){message("ابتدا شماره همراه را تأیید کن.");return;}
      const values=new FormData(form);
      let payload,path;
      if(stage==="start"){
        verifiedPhone=String(values.get("phone")||"").trim();phoneChallenge="";phoneProof="";
        pendingProfile={consent:values.get("consent")==="on"};
        for(const name of ["first_name","last_name","father_name","national_id"])pendingProfile[name]=String(values.get(name)||"").trim();
        if(!pendingProfile.first_name||!pendingProfile.last_name||!pendingProfile.father_name||!pendingProfile.national_id)pendingProfile=null;
        payload={phone:verifiedPhone,consent:values.get("consent")==="on",...(pendingProfile?{profile:pendingProfile}:{})};path="start";
      }else if(stage==="code"){
        payload={phone:verifiedPhone,challenge:phoneChallenge,code:values.get("code")};path="verify";
      }else{
        payload={phone:verifiedPhone,verification:phoneProof,first_name:values.get("first_name"),last_name:values.get("last_name"),father_name:values.get("father_name"),national_id:values.get("national_id")||null,consent:values.get("consent")==="on"};path="finish";
      }
      busy=true;form.querySelector('button[type="submit"]').disabled=true;
      message(stage==="start"?"در حال ارسال کد…":stage==="code"?"در حال تأیید شماره…":"در حال تکمیل حساب…");
      try{
        const result=await request("/phone/"+path,payload,{account:true});
        if(stage==="start"){
          if(!/^[A-Za-z0-9_-]{43}$/.test(result.challenge))throw new Error("پاسخ دریافت کد معتبر نیست.");
          phoneChallenge=result.challenge;phoneRetryAt=Date.now()+60000;phoneStage="code";
        }else if(stage==="code"){
          if(result.phone_verified!==true||!/^[A-Za-z0-9_-]{43}$/.test(result.verification))throw new Error("تأیید شماره معتبر نیست.");
          phoneProof=result.verification;phoneChallenge="";phoneStage="profile";
          if(pendingProfile){
            for(const name of ["first_name","last_name","father_name","national_id"])node("phone-profile-form").elements.namedItem(name).value=pendingProfile[name];
            node("phone-profile-form").elements.namedItem("consent").checked=pendingProfile.consent;
            render();message("شماره تأیید شد؛ در حال تکمیل ثبت‌نام…");
            const completed=await request("/phone/finish",{...pendingProfile,phone:verifiedPhone,verification:phoneProof},{account:true});
            acceptSession(completed);return;
          }
        }else{acceptSession(result);return;}
        render();message(result.message);
      }catch(error){
        message(error.message);
        if(phoneStage==="profile"&&error.status===401){phoneProof="";phoneStage="start";render();}
      }finally{
        busy=false;form.querySelector('button[type="submit"]').disabled=false;
        if(stage==="code")form.elements.namedItem("code").value="";
      }
    };
  }
  node("sms-login").onclick=()=>{
    if(busy)return;
    entryMode="member";
    node("legacy-options").open=true;node("member-details").open=true;node("register-details").open=false;
    node("member-purpose").value="login";render();
  };
  node("member-restart").onclick=()=>{
    if(busy)return;
    memberChallenge="";node("member-finish-form").hidden=true;node("member-start-form").hidden=false;node("member-restart").hidden=true;
    node("member-finish-form").elements.namedItem("password").value="";
    node("member-finish-form").elements.namedItem("code").value="";
    message("مشخصات را بررسی کن؛ برای ارسال دوباره کد حداقل یک دقیقه فاصله لازم است.");
  };
  for(const stage of ["start","finish"]){
    const form=node("member-"+stage+"-form");
    form.onsubmit=async event=>{
      event.preventDefault();if(busy||!canChange())return;
      if(stage==="finish"&&!memberChallenge){message("ابتدا مشخصات پرونده را بررسی کن.");return;}
      const values=new FormData(form);
      if(stage==="start")memberLogin=values.get("purpose")==="login";
      const payload=stage==="start"?{national_id:values.get("national_id"),phone:values.get("phone"),consent:values.get("consent")==="on",purpose:memberLogin?"login":"link"}:
        memberLogin?{challenge:memberChallenge,code:values.get("code")}:
        {challenge:memberChallenge,code:values.get("code"),username:values.get("username"),password:values.get("password")};
      busy=true;form.querySelector('button[type="submit"]').disabled=true;
      message(stage==="start"?"در حال بررسی و ارسال کد…":"در حال اتصال پرونده…");
      try{
        if(stage==="start"){
          memberChallenge="";
          const result=await request("/member-link/start",payload,{account:true});
          if(!/^[A-Za-z0-9_-]{43}$/.test(result.challenge))throw new Error("پاسخ بررسی معتبر نیست.");
          memberChallenge=result.challenge;node("member-start-form").hidden=true;node("member-finish-form").hidden=false;
          node("member-setup").hidden=memberLogin;
          for(const name of ["username","password"])node("member-finish-form").elements.namedItem(name).required=!memberLogin;
          node("member-restart").hidden=false;
          message(result.message);
        }else{
          const result=await request(memberLogin?"/member-link/login":"/member-link/finish",payload,{account:true});
          acceptSession(result);
        }
      }catch(error){
        message(error.message+(error.unknown?" اگر حساب متصل شده، از فرم ورود استفاده کن؛ ارسال را بی‌بررسی تکرار نکن.":""));
        if(stage==="finish"&&error.httpStatus!==401){memberChallenge="";node("member-finish-form").hidden=true;node("member-start-form").hidden=false;node("member-restart").hidden=true;}
      }finally{
        busy=false;form.querySelector('button[type="submit"]').disabled=false;
        if(stage==="finish"){form.elements.namedItem("password").value="";form.elements.namedItem("code").value="";}
      }
    };
  }
  node("account-toggle").onclick=()=>show();
  for(const operation of ["login","register"]){
    const form=node(operation+"-form");
    form.onsubmit=async event=>{
      event.preventDefault();if(busy||!canChange())return;
      const values=new FormData(form),payload={username:values.get("username"),password:values.get("password")};
      if(operation==="register")payload.registration={first_name:values.get("first_name"),last_name:values.get("last_name"),father_name:values.get("father_name"),phone:values.get("phone"),consent:values.get("consent")==="on"};
      busy=true;form.querySelector('button[type="submit"]').disabled=true;
      message("در حال بررسی حساب…");
      try{
        const result=await request("/"+operation,payload,{account:true});
        acceptSession(result);
      }catch(error){
        if(operation==="register"&&error.status===409){
          node("register-details").open=false;node("member-details").open=true;
          node("member-start-form").elements.namedItem("phone").value=values.get("phone")||"";
          render();
        }
        message(error.message+(operation!=="login"&&error.unknown?" اگر حساب ساخته شده، از فرم ورود استفاده کن.":""));
      }
      finally{busy=false;form.elements.namedItem("password").value="";form.querySelector('button[type="submit"]').disabled=false;}
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
