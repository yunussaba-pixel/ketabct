"use strict";

const calendarMonthNames=["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
function calendarNumber(value){return String(value).replace(/[0-9]/g,digit=>"۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);}
function calendarSolarParts(iso){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(iso||""))return null;
  const value=new Date(`${iso}T00:00:00Z`);
  if(Number.isNaN(value.getTime())||value.toISOString().slice(0,10)!==iso)return null;
  if(typeof toJalali==="function")return toJalali(iso);
  const parts=new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn",{year:"numeric",month:"numeric",day:"numeric",timeZone:"UTC"}).formatToParts(value);
  return Object.fromEntries(parts.filter(part=>["year","month","day"].includes(part.type)).map(part=>[part.type,Number(part.value)]));
}
function calendarToday(){
  const options={year:"numeric",month:"2-digit",day:"2-digit",timeZone:typeof state!=="undefined"?state.settings?.timezone||"Asia/Tehran":typeof portalState!=="undefined"?portalState.catalog?.timezone||"Asia/Tehran":"Asia/Tehran"};
  let formatter;
  try{formatter=new Intl.DateTimeFormat("en-CA",options);}catch{formatter=new Intl.DateTimeFormat("en-CA",{...options,timeZone:"Asia/Tehran"});}
  const parts=formatter.formatToParts(new Date());
  const values=Object.fromEntries(parts.map(part=>[part.type,part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function calendarIsoInput(value){
  const text=String(value||"").replace(/[۰-۹٠-٩]/g,digit=>String("۰۱۲۳۴۵۶۷۸۹".includes(digit)?"۰۱۲۳۴۵۶۷۸۹".indexOf(digit):"٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  if(/^\d{4}-\d{2}-\d{2}$/.test(text)&&Number(text.slice(0,4))>=1700)return calendarSolarParts(text)?text:"";
  const digits=text.replace(/\D/g,"");
  return digits.length===8?jalaliPickerGregorian(Number(digits.slice(0,4)),Number(digits.slice(4,6)),Number(digits.slice(6)))||"":"";
}
function calendarDateLabel(value){
  const iso=calendarIsoInput(value),parts=iso?calendarSolarParts(iso):null;
  return parts?calendarNumber(`${parts.day} ${calendarMonthNames[parts.month-1]} ${parts.year}`):"—";
}
function calendarFieldConfig(label,name,value,type,extra){
  if(type==="text"&&["birth_date","date_from","date_to","journal_from","journal_to","due_date","day","valid_from","valid_until","audience_from","audience_to","cash_from","cash_to","start_date","shift_from","shift_to","fund_from","fund_to"].includes(name)){
    value=calendarIsoInput(value);type="date";
    if(name==="birth_date"){label="تاریخ تولد";extra=String(extra||"").replace(/\bmax="[^"]*"/g,"")+` max="${calendarToday()}"`;}
  }
  return {label,value,type,extra};
}
