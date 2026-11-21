"use strict";
(() => {
  const services = {
    games: {title: "بازیکده جهش", theme: "games", icon: "game", intro: "هیجانِ بازی، کنار دوستانت؛ از بازی‌های حرکتی تا رقابت‌های فکری و کنسولی.", features: ["PS5، PS4، پلی‌استیشن روی پرده، Xbox و Kinect", "فوتبال‌دستی، ایرهاکی، تنیس روی میز، بیلیارد و دارت", "ترامپولین، بازی‌های فکری، مافیا و ریسنت"], state: "معرفی بازی‌هاست؛ موجودبودن دستگاه، تعرفه و زمان مراجعه را با مرکز هماهنگ کن.", booking: true},
    cinema: {title: "سینما جهش", theme: "cinema", icon: "film", intro: "لذت تماشای فیلم روی پردهٔ بزرگ، در کنار خانواده و دوستان.", features: ["اکران‌های کودک، نوجوان و بزرگسال طبق اطلاعیهٔ هر فیلم", "قیمت بلیت و شرایط ورود برای هر اکران جدا اعلام می‌شود", "انتخاب صندلی در سالن شماره‌دار، پس از دریافت فهرست زنده"], state: "درخواست و رسید به‌تنهایی رزرو قطعی نیست؛ تأیید وصول وجه و ظرفیت توسط مرکز لازم است.", booking: true},
    library: {title: "کتابخانه شهدای محمودآباد", theme: "library", icon: "book", intro: "از کتاب‌های کودک و نوجوان تا انتخاب‌های بزرگسال؛ جایی برای خواندن و کشف‌کردن.", features: ["نمایش امانت‌ها و اعتبار عضویت برای حساب متصل و احرازشده", "درخواست تمدید امانت برای بررسی مسئول کتابخانه", "معرفی کتاب، مسابقات کتابخوانی و برنامه‌های فرهنگی"], state: "اطلاعات از آخرین تصویر معتبر سامانه کتابخانه خوانده می‌شود؛ درخواست تمدید، جای تأیید رسمی تمدید را نمی‌گیرد."},
    cafe: {title: "کافه و دورهمی", theme: "cafe", icon: "cafe", intro: "یک فرصت برای مکث، گفت‌وگو و کنار هم بودن در مرکز.", features: ["هماهنگی برنامه‌های دورهمی و جشن تولد با مسئول مرکز", "امکان بررسی برنامهٔ ترکیبی کافه و بازیکده", "منو و قیمت‌های جاری از مرکز استعلام شود"], state: "رزرو تنها برای منابع و زمان‌های عرضه‌شده در فهرست زنده و پس از تأیید مرکز قطعی می‌شود.", booking: true},
    events: {title: "رویدادها و مسابقات", theme: "events", icon: "calendar", intro: "قرارهای فرهنگی، مناسبت‌ها و مسابقات کتابخوانی؛ هر برنامه با شرایط خودش.", features: ["اطلاع‌رسانی برنامه‌های مناسبتی و اکران‌های ویژه", "معرفی مسابقات کتابخوانی و گروه‌های سنی مخاطب", "شرایط هدایا و تخفیف‌ها فقط طبق اطلاعیهٔ رسمی هر طرح"], state: "ثبت‌نام و نتایج زنده هنوز به این پیش‌نمایش متصل نشده‌اند."},
    tournaments: {title: "مسابقات بازیکده", theme: "events", icon: "game", intro: "مسابقات برنامه‌ریزی‌شدهٔ بازیکده را ببین، ثبت‌نام اولیه کن و مراحل، نتایج و گزارش تصویری را دنبال کن.", features: ["نمایش مسابقات منتشرشده و وضعیت ثبت‌نام", "ثبت‌نام اولیه تا رسیدن به حدنصاب", "نمایش مراحل برگزاری، نتایج و تصاویر مسابقه"], state: "برگزاری هر مسابقه پس از رسیدن به حدنصاب و تأیید شرایط مرکز انجام می‌شود."},
    classes: {title: "کلاس‌ها و کارگاه‌ها", theme: "classes", icon: "class", intro: "یادگیری و تجربهٔ مهارت‌های تازه در کنار هم.", features: ["معرفی دوره‌ها پس از اعلام برنامهٔ قطعی مرکز", "زمان، مربی، شهریه و ظرفیت برای هر دوره جدا اعلام می‌شود", "پیش‌ثبت‌نام آنلاین دوره‌ها: به‌زودی"], state: "در حال حاضر دورهٔ قابل ثبت‌نامی در این صفحه منتشر نشده است."},
    club: {title: "باشگاه مشتریان", theme: "club", icon: "star", intro: "قرار است همراهی تو با مرکز، تجربه‌های بهتری بسازد.", features: ["معرفی طرح‌های وفاداری و مزایای ویژهٔ هر بخش", "اطلاع‌رسانی قرعه‌کشی‌ها و شرایط شرکت در هر طرح", "نمایش امتیاز، اعتبار و مزایای شخصی: به‌زودی"], state: "هیچ امتیاز یا جایزه‌ای با بازکردن این صفحه به حساب اضافه نمی‌شود."},
    space: {title: "مطالعه و فضای گروهی", theme: "library", icon: "space", intro: "برای مطالعه، اردو، برنامهٔ گروهی یا یک مناسبت ویژه با مرکز هماهنگ کن.", features: ["بررسی امکان استفاده از فضای مطالعه", "هماهنگی رزرو سالن به‌صورت گروهی یا اختصاصی", "برنامه‌های ترکیبی با کافه، سینما و بازیکده با توافق مرکز"], state: "زمان و ظرفیت سالن در این صفحه زنده نیست؛ رزرو تنها با تأیید مسئول مرکز قطعی می‌شود.", booking: true}
  };
  const views = Array.from(document.querySelectorAll("[data-view]"));
  document.addEventListener("jahesh-center-content",event=>{
    const statuses={active:"فعال",maintenance:"در حال تعمیر",unavailable:"خارج از سرویس",coming_soon:"به‌زودی"};
    for(const [key,value] of Object.entries(event.detail||{})){
      if(!services[key]||!value||!Array.isArray(value.paragraphs))continue;
      Object.assign(services[key],{title:value.title,intro:value.intro,features:value.paragraphs,state:statuses[value.status]||"وضعیت نامشخص",booking:value.status==="active"&&value.booking_enabled});
      document.querySelectorAll(`[data-service="${key}"] strong`).forEach(title=>{title.textContent=value.title;});
    }
  });
  const navigation = Array.from(document.querySelectorAll("[data-go]"));
  const dialog = document.getElementById("service-dialog");
  let dialogTrigger = null;
  let returnView = "home";
  const showView = name => {
    if (!views.some(view => view.dataset.view === name)) return;
    if(name==="account")returnView=views.find(view=>!view.hidden&&view.dataset.view!=="account")?.dataset.view||returnView;
    views.forEach(view => {view.hidden = view.dataset.view !== name;});
    navigation.forEach(button => {
      if (button.dataset.go === name) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    document.getElementById("main").focus({preventScroll: true});
    window.scrollTo({top: 0, behavior: "instant"});
    document.dispatchEvent(new CustomEvent("jahesh-view-changed",{detail:{view:name}}));
    const requests=document.getElementById("service-requests-panel");
    if(requests){requests.hidden=name!=="booking";if(name==="booking")views.find(view=>view.dataset.view==="booking")?.append(requests);}
  };
  const openService = (key, trigger) => {
    if(document.dispatchEvent(new CustomEvent("jahesh-before-service-change",{cancelable:true}))===false)return;
    const kinds={cinema:"cinema",games:"gamenet",cafe:"cafe"};
    if(key==="tournaments"){
      showView("tournaments");
      document.dispatchEvent(new CustomEvent("jahesh-tournaments-open"));
      return;
    }
    if(kinds[key]){
      showView("booking");
      const requestSection=document.getElementById("request-section");if(requestSection){requestSection.value=key;requestSection.disabled=true;}
      document.dispatchEvent(new CustomEvent("jahesh-booking-section",{detail:{kind:kinds[key],title:services[key].title}}));
      if(key==="cinema")document.dispatchEvent(new CustomEvent("jahesh-program-open"));
      return;
    }
    const service = services[key];
    if (!service) return;
    dialogTrigger = trigger;
    document.getElementById("dialog-title").textContent = service.title;
    document.getElementById("dialog-description").textContent = service.intro;
    document.getElementById("dialog-state").textContent = service.state;
    document.getElementById("dialog-symbol").setAttribute("href", "#" + service.icon);
    document.getElementById("dialog-art").className = service.theme;
    document.getElementById("dialog-booking").hidden = !service.booking;
    document.getElementById("dialog-features").replaceChildren(...service.features.map(text => {
      const item = document.createElement("li");
      item.textContent = text;
      return item;
    }));
    dialog.showModal();
    const requests=document.getElementById("service-requests-panel");if(requests){dialog.append(requests);requests.hidden=false;}
    const requestSection=document.getElementById("request-section");if(requestSection){requestSection.value=key;requestSection.disabled=true;}
    document.dispatchEvent(new CustomEvent("jahesh-service-open",{detail:{service:key}}));
  };
  const list = document.getElementById("all-services");
  Object.entries(services).forEach(([key, service]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "service-row " + service.theme;
    button.dataset.service = key;
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#" + service.icon);
    icon.append(use);
    const text = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = service.title;
    const subtitle = document.createElement("small");
    subtitle.textContent = "معرفی و وضعیت خدمات";
    text.append(title, subtitle);
    button.append(icon, text);
    list.append(button);
  });
  document.querySelectorAll("[data-service]").forEach(button => {
    button.addEventListener("click", () => openService(button.dataset.service, button));
  });
  document.addEventListener("jahesh-booking-service",event=>openService(event.detail.key,event.detail.trigger));
  navigation.forEach(button => button.addEventListener("click", () => {
    if(button.dataset.go!=="booking"){showView(button.dataset.go);return;}
    if(document.dispatchEvent(new CustomEvent("jahesh-before-service-change",{cancelable:true}))===false)return;
    if(dialog.open)dialog.close();
    showView("booking");
    const selector=document.getElementById("request-section");if(selector)selector.disabled=false;
    document.dispatchEvent(new CustomEvent("jahesh-booking-section",{detail:{kind:null,title:"برای وقتت برنامه بچین"}}));
  }));
  document.addEventListener("jahesh-booking-open",()=>showView("booking"));
  document.addEventListener("jahesh-my-reservations-open",()=>{
    if(document.dispatchEvent(new CustomEvent("jahesh-before-service-change",{cancelable:true}))===false)return;
    if(dialog.open)dialog.close();
    showView("booking");
    document.dispatchEvent(new CustomEvent("jahesh-booking-section",{detail:{kind:null,title:"رزروها، پرداخت‌ها و بلیت‌های من",tracking:true}}));
  });
  document.addEventListener("jahesh-library-open",()=>openService("library",document.querySelector('[data-service="library"]')));
  document.addEventListener("jahesh-account-open",()=>showView("account"));
  document.addEventListener("jahesh-account-return",()=>{showView(returnView==="home"?"services":returnView);document.dispatchEvent(new CustomEvent("jahesh-resume-service"));});
  document.querySelector(".brand").addEventListener("click", event => {event.preventDefault(); showView("home");});
  document.getElementById("close-dialog").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => dialogTrigger?.focus());
  document.getElementById("dialog-booking").addEventListener("click", () => {document.getElementById("service-requests-panel").open=true;});
  const feedback = document.getElementById("feedback-text");
  const result = document.getElementById("feedback-result");
  const prepared = document.getElementById("feedback-prepared");
  const status = document.getElementById("feedback-status");
  document.getElementById("feedback-form").addEventListener("submit", event => {
    event.preventDefault();
    if(window.JaheshFeedback){window.JaheshFeedback.submit();return;}
    const text = feedback.value.trim();
    if (!text || text.length > 1000) {
      result.hidden = true;
      status.textContent = "لطفاً یک نظر تا ۱۰۰۰ نویسه بنویس.";
      feedback.focus();
      return;
    }
    const rating = document.getElementById("feedback-rating").value;
    prepared.value = "نظر دربارهٔ خدمات جهش\nبخش: " + document.getElementById("feedback-section").value +
      (rating ? "\nامتیاز: " + rating : "") + "\n" + text;
    result.hidden = false;
    status.textContent = "متن آماده است؛ هنوز ارسال نشده. آن را کپی و در گفت‌وگوی مرکز ارسال کن.";
  });
  [feedback, document.getElementById("feedback-section"), document.getElementById("feedback-rating")].forEach(control => {
    control.addEventListener("input", () => {result.hidden = true; prepared.value = ""; status.textContent = "";});
  });
  document.getElementById("copy-feedback").addEventListener("click", async () => {
    if (!prepared.value) return;
    try {
      await navigator.clipboard.writeText(prepared.value);
      status.textContent = "متن کپی شد؛ خودت در گفت‌وگوی مرکز بچسبان و ارسال کن.";
    } catch {
      prepared.focus();
      prepared.select();
      status.textContent = "کپی خودکار در دسترس نیست؛ متن انتخاب‌شده را دستی کپی کن. چیزی ارسال نشده است.";
    }
  });
  if(typeof URLSearchParams!=="undefined"){
    const section=new URLSearchParams(window.location?.search||"").get("section");
    if(["cinema","games","gamenet","cafe"].includes(section)){showView("booking");const selector=document.getElementById("request-section");if(selector){selector.value=section==="gamenet"?"games":section;selector.disabled=true;}}
  }
})();
