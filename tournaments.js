"use strict";
(() => {
  const host=document.getElementById("public-tournaments-list");
  if(!host)return;
  const status=document.getElementById("public-tournaments-status");
  const refresh=document.getElementById("public-tournaments-refresh");
  const stages={registration:"ثبت‌نام و قرعه‌کشی",groups:"مرحله گروهی",knockout:"مرحله حذفی",final:"فینال",awards:"اختتامیه و جوایز"};
  let revision=0,currentId=null,loaded=false;
  const number=value=>new Intl.NumberFormat("fa-IR").format(Number(value||0));
  const element=(tag,text,className)=>{
    const node=document.createElement(tag);
    if(text!==undefined)node.textContent=String(text);
    if(className)node.className=className;
    return node;
  };
  const when=value=>new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Tehran"}).format(new Date(value));
  const account=()=>window.JaheshPublic&&window.JaheshPublic.hasSession();
  async function register(item){
    if(!account()){
      document.getElementById("web-account-toggle")?.click();
      status.textContent="ابتدا وارد حساب شوید؛ سپس ثبت‌نام مسابقه را بزنید.";
      return;
    }
    try{
      status.textContent="در حال ثبت‌نام مسابقه…";
      const result=await window.JaheshPublic.call("/tournaments/register",{event_id:item.id,confirm_submission:true,notes:"ثبت‌نام اولیه از وب‌اپ"});
      status.textContent=result.already_registered?"این پرونده قبلاً در مسابقه ثبت شده است.":"ثبت‌نام اولیه شما ثبت شد.";
      await load(item.id);
    }catch(error){status.textContent=error.message||"ثبت‌نام مسابقه انجام نشد.";}
  }
  const image=(value,title)=>{
    if(typeof value!=="string"||!/^data:image\/(?:jpeg|png|webp);base64,/.test(value))return null;
    const node=element("img");node.src=value;node.alt=title;node.loading="lazy";
    node.style.maxWidth="100%";node.style.maxHeight="320px";node.style.objectFit="contain";
    return node;
  };
  function render(items,detail){
    host.replaceChildren();
    if(detail){
      const back=element("button","همه مسابقات","secondary");back.type="button";
      back.onclick=()=>load(null);host.append(back);
    }
    for(const item of items){
      const card=element("article",undefined,"reservation-panel");
      card.append(element("h2",item.title),element("p",item.description),
        element("p",when(item.starts_at)+" تا "+when(item.ends_at)+" · "+(item.location||"مرکز")));
      const poster=image(item.poster,item.title);if(poster)card.append(poster);
      if(!detail){
        const registration=item.registration;
        if(registration){
          card.append(element("p",`${number(registration.confirmed)} نفر ثبت‌نام کرده‌اند · حدنصاب ${number(registration.minimum)} نفر · ${registration.status_label}`));
          if(registration.can_register){
            const join=element("button","ثبت‌نام اولیه در مسابقه","primary");join.type="button";join.onclick=()=>register(item);card.append(join);
          }
        }
        const open=element("button","مراحل، جدول و گزارش تصویری","primary");open.type="button";
        open.onclick=()=>load(item.id);card.append(open);host.append(card);continue;
      }
      const registration=item.registration;
      if(registration){
        card.append(element("p",`${number(registration.confirmed)} نفر ثبت‌نام کرده‌اند · حدنصاب ${number(registration.minimum)} نفر · ${registration.status_label}`));
        if(registration.can_register){const join=element("button","ثبت‌نام اولیه در مسابقه","primary");join.type="button";join.onclick=()=>register(item);card.append(join);}
      }
      card.append(element("p",item.finalized?"نتایج نهایی":"نتایج موقت؛ برگزاری یا داوری هنوز نهایی نشده است."));
      const names=new Map((item.teams||[]).map(team=>[team.id,team.name]));
      if(item.bracket){
        card.append(element("h3","جدول مسابقات"));
        for(const round of item.bracket.rounds||[]){
          card.append(element("h4","دور "+new Intl.NumberFormat("fa-IR").format(round.number)));
          for(const match of round.matches){
            const first=names.get(match.first_id)||"در انتظار تعیین تیم";
            const second=names.get(match.second_id)||"در انتظار تعیین تیم";
            const score=match.bye?"استراحت":match.score?.kind==="forfeit"?"باخت فنی":
              match.score?match.score.first_score+" — "+match.score.second_score:"در انتظار نتیجه";
            card.append(element("p",first+" / "+second+" · "+score));
          }
        }
      }
      const leaders=item.bracket?.standings?.length?item.bracket.standings:item.leaderboard||[];
      if(leaders.length){
        card.append(element("h3","رتبه‌بندی"));
        const list=element("ol");
        for(const team of leaders)list.append(element("li","رتبه "+team.rank+" · "+team.name+" · "+(team.net_points??team.points)+" امتیاز"));
        card.append(list);
      }
      card.append(element("h3","گزارش مراحل و تصاویر"));
      if(!item.reports?.length)card.append(element("p","هنوز گزارشی برای این مسابقه منتشر نشده است."));
      for(const report of item.reports||[]){
        const article=element("article",undefined,"news-card");
        article.append(element("small",(stages[report.stage]||report.stage)+" · "+when(report.created_at)),
          element("h4",report.title),element("p",report.text));
        const photo=image(report.image,report.title);if(photo)article.append(photo);
        card.append(article);
      }
      host.append(card);
    }
  }
  async function load(id){
    currentId=id;
    const request=++revision;refresh.disabled=true;
    status.textContent="در حال دریافت تازه‌ترین اطلاعات مسابقات…";
    try{
      const endpoint=await connectionEndpoint();
      if(!/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.app\.lhr\.life\/connect$/.test(endpoint))throw new Error("نشانی مرکز معتبر نیست.");
      const response=await fetch(endpoint.slice(0,-8)+"/tournaments"+(id?"?event_id="+id:""),{
        credentials:"omit",redirect:"error",cache:"no-store",signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw new Error("دریافت مسابقات ناموفق بود؛ دوباره تلاش کنید.");
      const data=await response.json();
      if(request!==revision)return;
      if(!Array.isArray(data.items))throw new Error("پاسخ مسابقات معتبر نیست.");
      render(data.items,Boolean(id));loaded=true;
      status.textContent=data.items.length?"":id?"این مسابقه منتشر نشده یا نمایش آن متوقف شده است.":"هنوز مسابقه‌ای برای نمایش عمومی منتشر نشده است.";
    }catch(error){if(request===revision){host.replaceChildren();status.textContent=error.message;loaded=false;}}
    finally{if(request===revision)refresh.disabled=false;}
  }
  refresh.onclick=()=>load(currentId);
  document.addEventListener("jahesh-view-changed",event=>{
    if(event.detail.view==="tournaments"&&!loaded)load(null);
  });
})();
