"use strict";

const jalaliPickerStates=new WeakMap();

function jalaliPickerDigits(value){
  return String(value).replace(/[۰-۹٠-٩]/g,char=>String("۰۱۲۳۴۵۶۷۸۹".includes(char)?"۰۱۲۳۴۵۶۷۸۹".indexOf(char):"٠١٢٣٤٥٦٧٨٩".indexOf(char)));
}

function jalaliPickerGregorian(year,month,day){
  if(![year,month,day].every(Number.isInteger)||year<1200||year>1599||month<1||month>12||day<1||day>31)return null;
  const lengths=[31,31,31,31,31,31,30,30,30,30,30,29],relative=year-979;
  let days=365*relative+Math.floor(relative/33)*8+Math.floor(((relative%33)+3)/4)+day-1;
  for(let index=0;index<month-1;index++)days+=lengths[index];
  days+=79;
  let gregorianYear=1600+400*Math.floor(days/146097),leap=true;
  days%=146097;
  if(days>=36525){days--;gregorianYear+=100*Math.floor(days/36524);days%=36524;if(days>=365)days++;else leap=false;}
  gregorianYear+=4*Math.floor(days/1461);days%=1461;
  if(days>=366){leap=false;days--;gregorianYear+=Math.floor(days/365);days%=365;}
  const months=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  let gregorianMonth=0;
  while(gregorianMonth<12&&days>=months[gregorianMonth]){days-=months[gregorianMonth];gregorianMonth++;}
  const result=`${gregorianYear}-${String(gregorianMonth+1).padStart(2,"0")}-${String(days+1).padStart(2,"0")}`;
  const check=calendarSolarParts(result);
  return check?.year===year&&check.month===month&&check.day===day?result:null;
}

function jalaliPickerParse(text){
  const normalized=jalaliPickerDigits(text).trim().replace(/-/g,"/");
  const parts=/^(1[2-5]\d{2})\/(\d{2})\/(\d{2})$/.exec(normalized);
  return parts?jalaliPickerGregorian(Number(parts[1]),Number(parts[2]),Number(parts[3])):null;
}

function jalaliPickerText(iso){
  const parts=calendarSolarParts(iso);
  return parts?`${parts.year}/${String(parts.month).padStart(2,"0")}/${String(parts.day).padStart(2,"0")}`:"";
}

function jalaliPickerValue(input,iso,time){
  if(!iso)return "";
  if(input.type==="date")return iso;
  const clock=time||input.value.slice(11)||"00:00";
  return `${iso}T${clock}`;
}

function calendarClockControls(input){
  const box=document.createElement("div");box.className="calendar-clock";
  const selects=[];
  for(const [title,limit] of [["ساعت",24],["دقیقه",60],["ثانیه",60]]){
    const label=document.createElement("label");label.textContent=title;
    const select=document.createElement("select");select.setAttribute("aria-label",title);
    for(let value=0;value<limit;value++){const option=document.createElement("option");option.value=String(value).padStart(2,"0");option.textContent=calendarNumber(String(value).padStart(2,"0"));select.append(option);}
    label.append(select);box.append(label);selects.push(select);
  }
  const seconds=Number(input.step||60)%60!==0;
  box.children[2].hidden=!seconds;
  const sync=()=>{
    const parts=(input.value||"00:00").split(":");
    selects.forEach((select,index)=>{select.value=(parts[index]||"00").slice(0,2);select.disabled=input.disabled||input.readOnly;});
  };
  selects.forEach(select=>select.onchange=()=>{
    if(input.disabled||input.readOnly)return;
    const fraction=input.value.split(".")[1];
    input.value=selects.slice(0,seconds||input.value.split(":").length>2?3:2).map(part=>part.value).join(":")+(fraction?"."+fraction:"");
    input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));sync();
  });
  return {box,sync};
}

function jalaliPickerEnhance(input){
  if(input.dataset.jalaliPicker||input.dataset.nativeDateOnly!==undefined||!input.parentNode)return;
  input.dataset.jalaliPicker="1";
  const endOfDay=input.dataset.clockEnd!==undefined,timeOnly=input.type==="time"||endOfDay,withTime=input.type==="datetime-local";
  const wrapper=document.createElement("div");wrapper.className="jalali-picker";
  const toggle=document.createElement("button");toggle.type="button";toggle.className="secondary jalali-toggle";
  toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-haspopup","dialog");
  const summary=document.createElement("span");summary.className="calendar-summary";summary.setAttribute("aria-live","polite");
  const panel=document.createElement("div");panel.hidden=true;panel.className="jalali-picker-panel";
  const label=input.closest("label")?.firstChild?.textContent?.trim()||(timeOnly?"ساعت":"تاریخ");
  panel.setAttribute("role","dialog");panel.setAttribute("aria-label",timeOnly?`انتخاب ساعت ${label}`:`انتخاب شمسی ${label}`);
  const dateText=document.createElement("input");dateText.type="text";dateText.inputMode="numeric";dateText.placeholder="۱۴۰۵/۰۸/۱۹";
  dateText.setAttribute("aria-label",`تاریخ شمسی ${label}؛ سال/ماه/روز`);dateText.autocomplete="off";dateText.disabled=true;dateText.hidden=timeOnly;
  const timeInput=document.createElement("input");timeInput.type="time";timeInput.dataset.nativeDateOnly="1";
  timeInput.setAttribute("aria-label","ساعت محلی");timeInput.step=input.step||"60";timeInput.hidden=true;timeInput.disabled=true;
  const clock=calendarClockControls(timeInput);clock.box.hidden=!(withTime||timeOnly);
  const header=document.createElement("div");header.className="jalali-month-controls";header.hidden=timeOnly;
  const previous=document.createElement("button");previous.type="button";previous.textContent="‹";previous.setAttribute("aria-label","ماه قبل");
  const next=document.createElement("button");next.type="button";next.textContent="›";next.setAttribute("aria-label","ماه بعد");
  const monthTitle=document.createElement("span");monthTitle.className="jalali-month-selectors";
  const monthSelect=document.createElement("select");monthSelect.setAttribute("aria-label","ماه شمسی");
  calendarMonthNames.forEach((title,index)=>{const option=document.createElement("option");option.value=String(index+1);option.textContent=title;monthSelect.append(option);});
  const yearSelect=document.createElement("select");yearSelect.setAttribute("aria-label","سال شمسی");
  for(let year=1200;year<=1599;year++){const option=document.createElement("option");option.value=String(year);option.textContent=calendarNumber(year);yearSelect.append(option);}
  monthTitle.append(monthSelect,yearSelect);header.append(previous,monthTitle,next);
  const grid=document.createElement("div");grid.className="jalali-day-grid";grid.hidden=timeOnly;
  const message=document.createElement("p");message.className="small";message.setAttribute("role","status");
  const footer=document.createElement("div");footer.className="toolbar";
  const today=document.createElement("button");today.type="button";today.textContent="امروز";today.hidden=timeOnly;
  const clear=document.createElement("button");clear.type="button";clear.textContent="پاک‌کردن";
  const close=document.createElement("button");close.type="button";close.textContent="تأیید و بستن";
  footer.append(today,clear,close);panel.append(dateText,timeInput,header,grid,message,footer,clock.box);
  let endButton=null;
  if(endOfDay){
    endButton=document.createElement("button");endButton.type="button";endButton.textContent="پایان روز — ۲۴:۰۰";
    endButton.onclick=()=>{if(!editable())return;input.value="24:00";input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));shut();};
    footer.append(endButton);
  }
  const english=document.createElement("button");english.type="button";english.className="calendar-language";english.textContent=timeOnly?"ورود مستقیم":"میلادی / EN";english.setAttribute("aria-label",timeOnly?"تغییر روش ورود ساعت":"تغییر بین تقویم شمسی و میلادی");
  wrapper.append(toggle,summary,panel,english);
  const ownerLabel=input.closest("label");
  if(ownerLabel)ownerLabel.append(wrapper);else input.after(wrapper);
  input.classList.add("calendar-canonical");input.tabIndex=-1;input.setAttribute("aria-hidden","true");
  let view=null,lastNative=null,nativeMode=false;
  const editable=()=>!input.disabled&&!input.readOnly;
  const clockValue=()=>timeOnly?input.value:input.value.slice(11);
  const editableClock=()=>clockValue()==="24:00"?"00:00":clockValue();
  const sync=()=>{
    if(lastNative!==input.value){
      lastNative=input.value;dateText.value=!timeOnly&&input.value?jalaliPickerText(input.value.slice(0,10)):"";
      timeInput.value=editableClock();dateText.setCustomValidity("");timeInput.setCustomValidity("");
      if(!panel.hidden&&!timeOnly&&input.value){view=calendarSolarParts(input.value.slice(0,10));if(view.year>=1200&&view.year<=1599)draw();}
    }
    toggle.disabled=!editable();english.disabled=!editable();toggle.setAttribute("aria-required",String(input.required));
    summary.textContent=!timeOnly&&input.value?jalaliPickerText(input.value.slice(0,10)):"";
    const display=timeOnly?calendarNumber(input.value):[calendarNumber(summary.textContent),withTime?calendarNumber(clockValue()):""].filter(Boolean).join(" — ");
    toggle.textContent=(timeOnly?"◷ ":"▦ ")+(display||(timeOnly?"انتخاب ساعت":"انتخاب تاریخ شمسی"));
    toggle.setAttribute("aria-label",`${label}؛ ${display||(timeOnly?"انتخاب ساعت":"انتخاب تاریخ شمسی")}`);
    if(panel.hidden){dateText.value=summary.textContent;timeInput.value=editableClock();}
    if(endButton)endButton.setAttribute("aria-pressed",String(input.value==="24:00"));
    clock.sync();
    if(!editable()&&!panel.hidden)shut();
  };
  const draw=()=>{
    if(timeOnly)return;
    monthSelect.value=String(view.month);yearSelect.value=String(view.year);
    previous.disabled=view.year===1200&&view.month===1;next.disabled=view.year===1599&&view.month===12;
    grid.replaceChildren();
    for(const title of ["ش","ی","د","س","چ","پ","ج"]){const item=document.createElement("span");item.textContent=title;grid.append(item);}
    const first=jalaliPickerGregorian(view.year,view.month,1);
    const offset=(new Date(`${first}T00:00:00Z`).getUTCDay()+1)%7;
    for(let index=0;index<offset;index++)grid.append(document.createElement("span"));
    for(let day=1;day<=31;day++){
      const iso=jalaliPickerGregorian(view.year,view.month,day);if(!iso)break;
      const button=document.createElement("button");button.type="button";button.textContent=calendarNumber(day);
      button.setAttribute("aria-label",`${calendarNumber(day)} ${calendarMonthNames[view.month-1]} ${calendarNumber(view.year)}`);
      button.setAttribute("aria-pressed",String(input.value.slice(0,10)===iso));
      const lower=input.min?.slice(0,10),upper=input.max?.slice(0,10);
      button.disabled=Boolean(lower&&iso<lower||upper&&iso>upper);
      button.onclick=()=>{dateText.value=jalaliPickerText(iso);commit();if(!withTime)shut();};grid.append(button);
    }
  };
  const commit=()=>{
    if(!editable())return false;
    const iso=timeOnly?"":dateText.value.trim()?jalaliPickerParse(dateText.value):"";
    const error=iso===null?"تاریخ شمسی معتبر با سال/ماه/روز وارد کنید؛ روز کبیسه نیز بررسی می‌شود.":"";
    dateText.setCustomValidity(error);message.textContent=error;if(error)return false;
    if(withTime&&iso&&timeInput.value===""){timeInput.setCustomValidity("ساعت را وارد کنید.");message.textContent="ساعت را وارد کنید.";return false;}
    timeInput.setCustomValidity("");input.value=timeOnly?timeInput.value:jalaliPickerValue(input,iso,timeInput.value);
    input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));
    if(iso){view=calendarSolarParts(iso);draw();}
    message.textContent=input.validity.valid?"انتخاب شما اعمال شد.":input.validationMessage;
    return true;
  };
  function shut(){
    panel.hidden=true;dateText.disabled=true;timeInput.disabled=true;dateText.setCustomValidity("");timeInput.setCustomValidity("");toggle.setAttribute("aria-expanded","false");sync();
  }
  function open(){
    if(!editable())return;
    document.dispatchEvent(new Event("calendar-close"));
    panel.hidden=false;dateText.disabled=timeOnly;timeInput.disabled=!(withTime||timeOnly);
    dateText.value=!timeOnly&&input.value?jalaliPickerText(input.value.slice(0,10)):"";timeInput.value=editableClock()||"00:00";
    view=calendarSolarParts(!timeOnly&&input.value?input.value.slice(0,10):calendarToday());
    if(view.year<1200||view.year>1599)view=calendarSolarParts(calendarToday());
    message.textContent=endOfDay&&input.value==="24:00"?"پایان روز (۲۴:۰۰) انتخاب شده است؛ انتخاب ساعت دیگر این مقدار را عوض می‌کند.":timeOnly?"ساعت و دقیقه را انتخاب کنید.":"روز، ماه و سال را انتخاب کنید؛ تاریخ در فرم به‌صورت شمسی نمایش داده می‌شود.";
    toggle.setAttribute("aria-expanded","true");draw();clock.sync();
    if(typeof window!=="undefined"&&window.innerWidth>540){
      const bounds=wrapper.getBoundingClientRect(),below=window.innerHeight-bounds.bottom,above=bounds.top;
      const upwards=below<panel.scrollHeight&&above>below;
      panel.classList.toggle("calendar-above",upwards);
      const centered=Math.max(above,below)<Math.min(panel.scrollHeight,420);
      panel.style.maxHeight=`${Math.max(160,Math.min(window.innerHeight*.75,centered?window.innerHeight-32:(upwards?above:below)-16))}px`;
      panel.style.position="fixed";panel.style.right="auto";
      panel.style.left=`${Math.max(12,Math.min(window.innerWidth-panel.offsetWidth-12,bounds.right-panel.offsetWidth))}px`;
      panel.style.top=centered?`${Math.max(16,(window.innerHeight-panel.offsetHeight)/2)}px`:upwards?"auto":`${bounds.bottom+6}px`;
      panel.style.bottom=centered?"auto":upwards?`${window.innerHeight-bounds.top+6}px`:"auto";
    }else if(typeof window!=="undefined"){
      for(const property of ["position","right","left","top","bottom","maxHeight"])panel.style[property]="";
    }
    if(timeOnly)clock.box.querySelector("select").focus({preventScroll:true});else dateText.focus({preventScroll:true});
  }
  toggle.onclick=()=>{if(panel.hidden)open();else shut();};
  previous.onclick=()=>{if(view.year===1200&&view.month===1)return;if(view.month===1){view.year--;view.month=12;}else view.month--;draw();};
  next.onclick=()=>{if(view.year===1599&&view.month===12)return;if(view.month===12){view.year++;view.month=1;}else view.month++;draw();};
  monthSelect.onchange=()=>{view.month=Number(monthSelect.value);draw();};
  yearSelect.onchange=()=>{view.year=Number(yearSelect.value);draw();};
  dateText.oninput=commit;timeInput.addEventListener("input",commit);timeInput.oninput=commit;
  today.onclick=()=>{dateText.value=jalaliPickerText(calendarToday());commit();};
  clear.onclick=()=>{dateText.value="";timeInput.value="";commit();};close.onclick=shut;
  english.onclick=()=>{
    if(!editable())return;
    shut();nativeMode=!nativeMode;input.classList.toggle("calendar-native-visible",nativeMode);input.tabIndex=nativeMode?0:-1;
    input.setAttribute("aria-hidden",String(!nativeMode));input.lang="en-GB";
    english.textContent=nativeMode?(timeOnly?"بازگشت به انتخاب ساعت":"بازگشت به شمسی"):timeOnly?"ورود مستقیم":"میلادی / EN";
    if(nativeMode)input.focus();
  };
  input.addEventListener("input",()=>{if(!panel.hidden){dateText.value=!timeOnly&&input.value?jalaliPickerText(input.value.slice(0,10)):"";timeInput.value=editableClock();dateText.setCustomValidity("");timeInput.setCustomValidity("");}sync();});
  input.addEventListener("change",sync);input.addEventListener("focus",sync);
  input.addEventListener("invalid",event=>{if(!nativeMode){event.preventDefault();open();message.textContent=input.validationMessage;}});
  wrapper.addEventListener("keydown",event=>{if(event.key==="Escape"){event.preventDefault();event.stopPropagation();shut();toggle.focus();}});
  jalaliPickerStates.set(input,{sync,shut,wrapper,panel});
  sync();
}

function jalaliPickerScan(root){
  if(root.nodeType!==1&&root.nodeType!==9)return;
  const selector='input[type="date"],input[type="datetime-local"],input[type="time"],input[data-clock-end]';
  if(root.matches?.(selector))jalaliPickerEnhance(root);
  root.querySelectorAll(selector).forEach(jalaliPickerEnhance);
}

document.addEventListener("DOMContentLoaded",()=>{
  jalaliPickerScan(document);
  new MutationObserver(records=>{
    for(const record of records){
      if(record.type==="attributes")jalaliPickerStates.get(record.target)?.sync();
      else for(const added of record.addedNodes)jalaliPickerScan(added);
    }
  }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["disabled","readonly","min","max","value"]});
  const all=()=>Array.from(document.querySelectorAll('input[data-jalali-picker]')).map(input=>jalaliPickerStates.get(input)).filter(Boolean);
  const refresh=()=>all().forEach(picker=>picker.sync());
  for(const name of ["change","click","focusin"])document.addEventListener(name,refresh);
  document.addEventListener("calendar-close",()=>all().forEach(picker=>picker.shut()));
  document.addEventListener("pointerdown",event=>all().forEach(picker=>{if(!picker.panel.hidden&&!picker.wrapper.contains(event.target))picker.shut();}));
  document.addEventListener("reset",event=>{const form=event.target;setTimeout(()=>form.querySelectorAll('input[data-jalali-picker]').forEach(input=>jalaliPickerStates.get(input)?.shut()),0);});
  if(typeof window!=="undefined")window.addEventListener("resize",()=>document.dispatchEvent(new Event("calendar-close")));
});
