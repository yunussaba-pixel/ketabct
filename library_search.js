"use strict";
(()=>{
  let revision=0,timer=null,controller=null;
  const node=name=>document.getElementById("reservation-library-"+name);
  const clear=()=>{revision++;clearTimeout(timer);controller?.abort();timer=null;controller=null;};
  document.addEventListener("jahesh-library-search-clear",clear);
  document.addEventListener("jahesh-library-search",async event=>{
    clear();
    const current=revision;
    const output=document.createElement("section");
    output.setAttribute("aria-label","نتایج جست‌وجوی کتاب");
    node("books").append(output);
    const status=node("catalog-status");
    status.textContent="در حال جست‌وجوی مستقیم و دریافت نتایج از شهرداری…";
    controller=new AbortController();
    const activeController=controller;
    let root="";
    const request=async(path,payload)=>{
      const timeout=setTimeout(()=>activeController.abort(),12000);
      try{
        const response=await fetch(root+path,{method:payload?"POST":"GET",credentials:"omit",cache:"no-store",redirect:"error",
          headers:payload?{"Content-Type":"application/json"}:{},body:payload?JSON.stringify(payload):undefined,signal:activeController.signal});
        const result=await response.json();
        if(!response.ok)throw new Error(result.message||"دریافت نتیجه ممکن نشد.");
        return result;
      }finally{clearTimeout(timeout);}
    };
    const failed=error=>{
      if(current!==revision)return;
      status.textContent=(error.name==="AbortError"?"پاسخ جست‌وجو در مهلت مقرر نرسید.":error.message)+" برای ادامه از لینک رسمی بالا استفاده کن؛ این وضعیت به معنی نبود کتاب نیست.";
    };
    const poll=async(identifier,attempt=0)=>{
      if(current!==revision)return;
      try{
        const result=await request("/library/search/"+identifier);
        if(current!==revision)return;
        if(result.status==="pending"){
          if(attempt>=30)throw new Error("دریافت نتیجه طول کشید.");
          timer=setTimeout(()=>poll(identifier,attempt+1),3000);return;
        }
        if(result.status!=="ready"||!Array.isArray(result.items)||!result.items.length)throw new Error(result.notice||"نتیجهٔ معتبر دریافت نشد.");
        for(const book of result.items){
          const card=document.createElement("article");card.className="reservation-result";
          const title=document.createElement("h4");title.textContent=book.title;card.append(title);
          for(const value of [book.author,book.category,book.call_number?"شماره راهنما: "+book.call_number:""]){
            if(!value)continue;
            const line=document.createElement("p");line.textContent=value;card.append(line);
          }
          if(/[\[(]ج[\])]/.test(book.call_number||"")){
            const tag=document.createElement("strong");tag.textContent="ردهٔ نوجوان";card.append(tag);
          }
          output.append(card);
        }
        status.textContent=(event.detail.scope==="all"?"همه شعب":"شهدای محمودآباد")+" · "+
          new Intl.NumberFormat("fa-IR").format(result.items.length)+" نتیجه از "+new Intl.NumberFormat("fa-IR").format(result.total)+
          " نتیجه در پایگاه "+result.database+" · "+result.notice;
      }catch(error){failed(error);}
    };
    try{
      const endpoint=await connectionEndpoint();
      if(current!==revision)return;
      if(!/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.app\.lhr\.life\/connect$/.test(endpoint))throw new Error("نشانی معتبر مرکز در دسترس نیست.");
      root=endpoint.slice(0,-8);
      const job=await request("/library/search",event.detail);
      if(current!==revision)return;
      if(!/^[a-f0-9]{48}$/.test(job.id))throw new Error("پاسخ جست‌وجو معتبر نیست.");
      await poll(job.id);
    }catch(error){failed(error);}
  });
})();
