"use strict";
(() => {
  const fields={
    brand:["نام مرکز",".brand strong"],subtitle:["نام مجموعه",".brand small"],
    eyebrow:["متن بالای عنوان",'.welcome > span'],title:["عنوان اصلی","#home-title"],
    intro:["معرفی اصلی",".welcome p"],feature_label:["نام بازیکده",".feature small"],
    feature_title:["عنوان کارت بازیکده",".feature strong"],feature_link:["متن دکمه بازیکده",".feature-link"],
    services_title:["عنوان خدمات",".section-heading h2"],services_link:["دکمه همه خدمات",".section-heading button"],
    channel_title:["عنوان کانال",".channel-card strong"],channel_intro:["توضیح کانال",".channel-card small"],
    channel_button:["دکمه کانال",".channel-card b"],account_button:["دکمه ورود","#home-account-entry"],
    notice:["توضیح پایین صفحه",'[data-view="home"] > .notice']
  };
  for(const [section,label] of Object.entries({cinema:"سینما",library:"کتابخانه",cafe:"کافه",events:"رویدادها",tournaments:"مسابقات"})){
    fields[section+"_title"]=["عنوان کارت "+label,`.tile[data-service="${section}"] strong`];
    fields[section+"_intro"]=["توضیح کارت "+label,`.tile[data-service="${section}"] small`];
  }
  const apply=values=>{
    for(const [key,value] of Object.entries(values||{})){
      if(!Object.hasOwn(fields,key)||typeof value!=="string"||value.length>2000)continue;
      const node=document.querySelector(fields[key][1]);
      if(node)node.textContent=value;
    }
  };
  window.JaheshHomeDesign=Object.freeze({fields,apply});
  document.addEventListener("jahesh-center-builder",event=>{
    apply(event.detail?.home);
    const theme=event.detail?.theme||{},root=document.documentElement;
    root.dataset.homeDesignTheme="true";
    for(const key of ["accent","background","surface","text","heading_weight","font_family"]){
      if(theme[key])root.style.setProperty("--home-"+key.replaceAll("_","-"),String(theme[key]));
      else root.style.removeProperty("--home-"+key.replaceAll("_","-"));
    }
  });
})();
