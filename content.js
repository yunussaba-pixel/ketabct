"use strict";
(() => {
  const host=document.querySelector('[data-view="booking"]');
  if(!host)return;
  const section=document.createElement("section");section.className="reservation-panel";
  const button=document.createElement("button"),status=document.createElement("p"),shows=document.createElement("div");
  const heading=document.createElement("h2");heading.textContent="فیلم‌ها و سانس‌های سینما جهش";
  button.type="button";button.className="secondary";button.textContent="به‌روزرسانی فیلم‌ها و سانس‌ها";
  status.setAttribute("role","status");shows.className="public-films";section.classList.add("cinema-program");
  section.append(heading,button,status,shows);host.prepend(section);
  const home=document.querySelector('[data-view="home"]');
  const directCinema=typeof URLSearchParams!=="undefined"&&new URLSearchParams(window.location?.search||"").get("section")==="cinema";
  if(home&&!directCinema)home.prepend(section);
  document.addEventListener("jahesh-view-changed",event=>{
    if(event.detail.view==="booking")host.prepend(section);
    else if(event.detail.view==="home"&&home)home.prepend(section);
  });
  const load=async()=>{
    if(button.disabled)return;
    button.disabled=true;shows.replaceChildren();
    status.textContent="در حال دریافت برنامه اکران…";
    try{
      const endpoint=await connectionEndpoint();
      if(!/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.app\.lhr\.life\/connect$/.test(endpoint))throw new Error("نشانی مرکز معتبر نیست.");
      const response=await fetch(endpoint.slice(0,-8)+"/center-content",{credentials:"omit",redirect:"error",cache:"no-store",signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw new Error("دریافت اطلاعات تازه مرکز ممکن نشد.");
      const data=await response.json();
      if(!data.sections||!Array.isArray(data.shows))throw new Error("پاسخ مرکز معتبر نیست.");
      document.dispatchEvent(new CustomEvent("jahesh-center-content",{detail:data.sections}));
      const films=new Map();
      for(const show of data.shows){
        if(!Number.isSafeInteger(show.id)||!Number.isFinite(Date.parse(show.starts_at)))continue;
        const key=show.film_id||show.id;
        if(!films.has(key))films.set(key,[]);
        films.get(key).push(show);
      }
      for(const screenings of films.values()){
        screenings.sort((first,second)=>Date.parse(first.starts_at)-Date.parse(second.starts_at));
        const show=screenings[0];
        const card=document.createElement("article");card.className="public-screening";
        const title=document.createElement("h3"),description=document.createElement("p"),price=document.createElement("p");
        title.textContent=show.title;description.textContent=show.description;
        price.textContent=show.duration_minutes?new Intl.NumberFormat("fa-IR").format(show.duration_minutes)+" دقیقه":"سانس‌های قابل انتخاب";
        card.append(title,description,price);
        if(typeof show.poster==="string"&&/^data:image\/(png|jpeg|webp);base64,/.test(show.poster)){
          const image=document.createElement("img");image.src=show.poster;image.alt=show.title;image.width=112;image.height=160;image.decoding="async";card.append(image);
        }
        const slots=document.createElement("div");slots.className="public-showtimes";
        for(const screening of screenings){
          const row=document.createElement("div");row.className="public-showtime";
          const label=document.createElement("p");
          label.textContent=new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Tehran"}).format(new Date(screening.starts_at))+" · "+(screening.hall||"سالن مرکز")+" · "+new Intl.NumberFormat("fa-IR").format(screening.price)+" تومان · ظرفیت باقی‌مانده "+new Intl.NumberFormat("fa-IR").format(screening.remaining);
          const select=document.createElement("button");select.type="button";select.className="primary";
          select.disabled=!screening.booking_enabled||screening.remaining<=0;
          select.textContent=screening.remaining<=0?"ظرفیت تکمیل":screening.booking_enabled?"انتخاب این سانس و ادامه رزرو":"رزرو این سانس فعال نیست";
          select.addEventListener("click",()=>document.dispatchEvent(new CustomEvent("jahesh-cinema-selected",{detail:{show_id:screening.id,title:screening.title}})));
          row.append(label,select);slots.append(row);
        }
        card.append(slots);
        shows.append(card);
      }
      status.textContent=films.size?"":"فعلاً فیلم و سانسی برای رزرو عمومی منتشر نشده است؛ پس از انتشار برنامه توسط مرکز همین‌جا نمایش داده می‌شود.";
    }catch(error){shows.replaceChildren();status.textContent=error.message+" دریافت برنامه ناموفق بود؛ این خطا به معنی نبودن اکران نیست.";}
    finally{button.disabled=false;}
  };
  button.addEventListener("click",load);
  load();
})();
