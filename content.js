"use strict";
(() => {
  const host=document.querySelector('[data-view="home"]');
  if(!host)return;
  const section=document.createElement("section");section.className="reservation-panel";
  const button=document.createElement("button"),status=document.createElement("p"),shows=document.createElement("div");
  button.type="button";button.className="secondary";button.textContent="دریافت آخرین اطلاعیه‌ها و اکران‌های مرکز";
  status.setAttribute("role","status");section.append(button,status,shows);host.append(section);
  button.addEventListener("click",async()=>{
    button.disabled=true;shows.replaceChildren();
    try{
      const endpoint=await connectionEndpoint();
      if(!/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.app\.lhr\.life\/connect$/.test(endpoint))throw new Error("نشانی مرکز معتبر نیست.");
      const response=await fetch(endpoint.slice(0,-8)+"/center-content",{credentials:"omit",redirect:"error",cache:"no-store",signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw new Error("دریافت اطلاعات تازه مرکز ممکن نشد.");
      const data=await response.json();
      if(!data.sections||!Array.isArray(data.shows))throw new Error("پاسخ مرکز معتبر نیست.");
      document.dispatchEvent(new CustomEvent("jahesh-center-content",{detail:data.sections}));
      for(const show of data.shows){
        const card=document.createElement("article");card.className="public-screening";
        const title=document.createElement("h3"),description=document.createElement("p"),price=document.createElement("p");
        title.textContent=show.title;description.textContent=show.description;
        price.textContent=new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Tehran"}).format(new Date(show.starts_at))+" · "+new Intl.NumberFormat("fa-IR").format(show.price)+" تومان · ظرفیت باقی‌مانده "+show.remaining;
        card.append(title,description,price);
        if(typeof show.poster==="string"&&/^data:image\/(png|jpeg|webp);base64,/.test(show.poster)){
          const image=document.createElement("img");image.src=show.poster;image.alt=show.title;card.append(image);
        }
        if(show.booking_enabled){
          const link=document.createElement("a");link.href="?section=cinema&show="+Number(show.id);link.textContent="انتخاب صندلی و رزرو این اکران";card.append(link);
        }
        shows.append(card);
      }
      status.textContent="اطلاعات تازه دریافت شد. ظرفیت فقط هنگام ثبت دوباره بررسی و نگه داشته می‌شود.";
    }catch(error){status.textContent=error.message+" اطلاعات قبلی تضمین ظرفیت نیست.";}
    finally{button.disabled=false;}
  });
})();
