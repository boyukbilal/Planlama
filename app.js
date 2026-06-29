let data = JSON.parse(localStorage.getItem("bilalFinanceV6") || localStorage.getItem("bilalFinanceV5") || localStorage.getItem("bilalFinanceV3") || "null") || {
  settings:{vardiya:3000,motorGoal:250000,phoneMonths:5,startCash:0,shiftStart:""},
  records:[],
  motorFund:0,
  paid:{'Yapı Kredi':0,'Akbank':0},
  initialDebt:{'Yapı Kredi':15000,'Akbank':1500}
};

function money(n){ return new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0}).format(Number(n)||0); }
function persist(){ localStorage.setItem("bilalFinanceV6", JSON.stringify(data)); render(); }
function ensureSettings(){ 
  if(data.settings.startCash===undefined) data.settings.startCash=0;
  if(data.settings.shiftStart===undefined) data.settings.shiftStart="";
}
function currentMonthRecord(r){const d=new Date(r.date), now=new Date(); return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();}

function quickIncome(type){
  data.records.unshift({id:crypto.randomUUID(),date:new Date().toISOString(),type:"Gelir",category:type,payment:"Nakit",desc:type,amount:data.settings.vardiya});
  persist();
}
function openExpense(category, amount){document.getElementById("category").value=category;document.getElementById("amount").value=amount;document.querySelector("#expensePanel").scrollIntoView({behavior:"smooth"});}
function openExtraIncome(){document.querySelector("#cashPanel").scrollIntoView({behavior:"smooth"}); setTimeout(()=>document.getElementById("extraIncomeAmount").focus(),350);}
function addExpense(){
  const amount=Number(document.getElementById("amount").value);
  if(!amount || amount<=0){ alert("Tutar yazmalısın."); return; }
  data.records.unshift({id:crypto.randomUUID(),date:new Date().toISOString(),type:"Harcama",category:document.getElementById("category").value,payment:document.getElementById("payment").value,desc:document.getElementById("desc").value || document.getElementById("category").value,amount});
  document.getElementById("amount").value=""; document.getElementById("desc").value=""; persist();
}
function setStartCash(){
  const amount=Number(document.getElementById("startCashInput").value);
  if(amount<0 || isNaN(amount)){ alert("Geçerli bir kasa tutarı yazmalısın."); return; }
  ensureSettings(); data.settings.startCash=amount; document.getElementById("startCashInput").value=""; persist(); alert("Başlangıç kasası kaydedildi.");
}
function addExtraIncome(){
  const amount=Number(document.getElementById("extraIncomeAmount").value);
  if(!amount || amount<=0){ alert("Ekstra gelen para tutarını yazmalısın."); return; }
  data.records.unshift({id:crypto.randomUUID(),date:new Date().toISOString(),type:"Gelir",category:"Ekstra Para",payment:"Nakit",desc:document.getElementById("extraIncomeDesc").value || "Ekstra para",amount});
  document.getElementById("extraIncomeAmount").value=""; document.getElementById("extraIncomeDesc").value=""; persist();
}
function payCard(){
  const card=document.getElementById("paidCard").value, amount=Number(document.getElementById("paidAmount").value);
  if(!amount || amount<=0){ alert("Ödenen tutarı yazmalısın."); return; }
  data.paid[card]=(Number(data.paid[card])||0)+amount;
  data.records.unshift({id:crypto.randomUUID(),date:new Date().toISOString(),type:"Ödeme",category:"Kart Ödemesi",payment:card,desc:card+" kart ödemesi",amount});
  document.getElementById("paidAmount").value=""; persist();
}
function payPhone(){
  if(data.settings.phoneMonths<=0){ alert("Telefon taksiti zaten bitmiş görünüyor."); return; }
  data.settings.phoneMonths-=1;
  data.records.unshift({id:crypto.randomUUID(),date:new Date().toISOString(),type:"Harcama",category:"Telefon Taksiti",payment:"Nakit",desc:"Telefon taksiti ödendi",amount:13000});
  persist();
}
function addFund(){
  const amount=Number(document.getElementById("fundAmount").value);
  if(!amount || amount<=0){ alert("Tutar yazmalısın."); return; }
  data.motorFund+=amount;
  data.records.unshift({id:crypto.randomUUID(),date:new Date().toISOString(),type:"Birikim",category:"Motor Fonu",payment:"Nakit",desc:"Motor fonuna aktarıldı",amount});
  document.getElementById("fundAmount").value=""; persist();
}
function saveShiftStart(){
  const val=document.getElementById("shiftStartDate").value;
  if(!val){ alert("Başlangıç tarihi seçmelisin."); return; }
  ensureSettings(); data.settings.shiftStart=val; persist(); alert("Vardiya başlangıcı kaydedildi.");
}
function saveSettings(){
  const v=Number(document.getElementById("vardiyaSetting").value), g=Number(document.getElementById("goalSetting").value);
  if(v>0) data.settings.vardiya=v; if(g>0) data.settings.motorGoal=g;
  persist(); alert("Ayarlar kaydedildi.");
}
function deleteRecord(id){
  if(!confirm("Bu kaydı silmek istiyor musun?")) return;
  const r=data.records.find(x=>x.id===id);
  if(r && r.type==="Birikim" && r.category==="Motor Fonu") data.motorFund=Math.max(0,data.motorFund-Number(r.amount));
  if(r && r.category==="Telefon Taksiti") data.settings.phoneMonths+=1;
  data.records=data.records.filter(x=>x.id!==id); persist();
}
function debts(){
  let yk=data.initialDebt["Yapı Kredi"]-data.paid["Yapı Kredi"], ak=data.initialDebt["Akbank"]-data.paid["Akbank"];
  data.records.forEach(r=>{if(r.type==="Harcama"&&r.payment==="Yapı Kredi") yk+=Number(r.amount); if(r.type==="Harcama"&&r.payment==="Akbank") ak+=Number(r.amount);});
  return {"Yapı Kredi":Math.max(0,yk),"Akbank":Math.max(0,ak)};
}
function calculateCash(){
  ensureSettings();
  let cash=Number(data.settings.startCash)||0;
  data.records.forEach(r=>{
    const amount=Number(r.amount)||0;
    if(r.type==="Gelir") cash+=amount;
    if(r.type==="Harcama" && r.payment==="Nakit") cash-=amount;
    if(r.type==="Birikim") cash-=amount;
    if(r.type==="Ödeme") cash-=amount;
  });
  return cash;
}
function paymentStatus(day){const today=new Date().getDate(); if(today>day) return "Kontrol et"; if(day-today<=3) return "Yaklaşıyor"; return "Bekliyor";}
function shiftStatus(){
  ensureSettings();
  if(!data.settings.shiftStart) return {today:"Ayarlanmadı",hint:"Başlangıç vardiya tarihini gir."};
  const start=new Date(data.settings.shiftStart+"T00:00:00");
  const now=new Date(); const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const diff=Math.floor((today-start)/(1000*60*60*24));
  if(diff<0) return {today:"Bekliyor",hint:"Vardiya başlangıcı gelecek tarihte."};
  const mod=diff%3;
  if(mod===0) return {today:"Çalışma",hint:"Bugün vardiya günü. Çalıştıysan kaydet."};
  return {today:"Dinlenme",hint: mod===1 ? "Bugün dinlenme 1. gün." : "Bugün dinlenme 2. gün."};
}
function goalForecast(){
  const months={};
  data.records.forEach(r=>{
    if(r.type==="Birikim" && r.category==="Motor Fonu"){
      const d=new Date(r.date); const key=d.getFullYear()+"-"+(d.getMonth()+1);
      months[key]=(months[key]||0)+Number(r.amount);
    }
  });
  const vals=Object.values(months);
  if(vals.length===0 || data.motorFund<=0) return "Hedef tahmini için motor fonuna kayıt ekle.";
  const avg=vals.reduce((a,b)=>a+b,0)/vals.length;
  if(avg<=0) return "Hedef tahmini için düzenli birikim ekle.";
  const remain=Math.max(0,data.settings.motorGoal-data.motorFund);
  const m=Math.ceil(remain/avg);
  return `Bu hızla yaklaşık ${m} ayda motor hedefine ulaşırsın.`;
}
function exportCSV(){
  const rows=[["Tarih","Tür","Kategori","Ödeme","Açıklama","Tutar"],...data.records.map(r=>[new Date(r.date).toLocaleDateString("tr-TR"),r.type,r.category,r.payment,r.desc,r.amount])];
  const csv=rows.map(row=>row.map(x=>`"${String(x).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="bilal-finance-kayitlar.csv"; a.click();
}
function importBackup(){
  const file=document.getElementById("importFile").files[0];
  if(!file){ alert("Önce JSON yedek dosyası seç."); return; }
  const reader=new FileReader();
  reader.onload=()=>{ try{ data=JSON.parse(reader.result); persist(); alert("Yedek geri yüklendi."); }catch(e){ alert("Yedek okunamadı."); } };
  reader.readAsText(file);
}
function render(){
  ensureSettings();
  const now=new Date();
  document.getElementById("todayText").textContent=now.toLocaleDateString("tr-TR",{weekday:"long",day:"numeric",month:"long"})+" • v6";
  document.getElementById("vardiyaSetting").value=data.settings.vardiya;
  document.getElementById("goalSetting").value=data.settings.motorGoal;
  document.getElementById("phoneMonths").textContent=data.settings.phoneMonths;
  document.getElementById("startCashText").textContent=money(data.settings.startCash);
  document.getElementById("startCashInput").value=data.settings.startCash || "";
  document.getElementById("shiftStartDate").value=data.settings.shiftStart || "";

  let income=0, expense=0, cat={};
  data.records.forEach(r=>{ if(currentMonthRecord(r)){ if(r.type==="Gelir") income+=Number(r.amount); if(r.type==="Harcama"){ expense+=Number(r.amount); cat[r.category]=(cat[r.category]||0)+Number(r.amount); } }});
  const debt=debts(), totalDebt=debt["Yapı Kredi"]+debt["Akbank"];
  const currentCash=calculateCash();
  const totalWealth=currentCash+Number(data.motorFund||0);
  document.getElementById("monthIncome").textContent=money(income);
  document.getElementById("monthExpense").textContent=money(expense);
  document.getElementById("monthSaving").textContent=money(income-expense);
  document.getElementById("cardDebt").textContent=money(totalDebt);
  document.getElementById("bigCash").textContent=money(currentCash);
  document.getElementById("currentCashText").textContent=money(currentCash);
  document.getElementById("totalWealth").textContent=money(totalWealth);
  document.getElementById("cashSub").textContent=`Motor fonu dahil toplam varlık: ${money(totalWealth)}`;
  document.getElementById("ykDebt").textContent=money(debt["Yapı Kredi"]);
  document.getElementById("akDebt").textContent=money(debt["Akbank"]);
  document.getElementById("goalText").textContent=`${money(data.motorFund)} / ${money(data.settings.motorGoal)}`;
  document.getElementById("goalBar").style.width=Math.min(100,(data.motorFund/data.settings.motorGoal)*100)+"%";
  document.getElementById("goalForecast").textContent=goalForecast();

  const sh=shiftStatus();
  document.getElementById("shiftToday").textContent=sh.today;
  document.getElementById("shiftHint").textContent=sh.hint;

  let advice="Bugün kayıt ekleyerek sistemi güncel tut.";
  if(income>0){ const saveRate=(income-expense)/income; if(saveRate>=0.30) advice="Güzel gidiyorsun. Bu ay birikim oranın yüksek."; else if(saveRate>=0.10) advice="İyi gidiyorsun ama harcamaları biraz daha kontrol et."; else advice="Bu ay harcamalar gelire çok yaklaşmış. Kart harcamalarını azalt."; }
  if(totalDebt>25000) advice="Kart borçları yükselmiş. Önce kart ödemelerine odaklan.";
  if(data.settings.phoneMonths===0) advice="Telefon taksiti bitti. Artık o parayı motor fonuna aktarabilirsin.";
  if(currentCash<0) advice="Kasanda eksi görünüm var. Başlangıç kasanı veya nakit harcamalarını kontrol et.";
  if(currentCash>5000 && totalDebt>0) advice=`Kasanda ${money(currentCash)} var. Kart son ödeme günlerini aksatma.`;
  document.getElementById("dailyAdvice").textContent=advice;

  document.getElementById("paymentCalendar").innerHTML=[
    ["Telefon Taksiti","15-18",13000,data.settings.phoneMonths>0?"Bekliyor":"Bitti"],
    ["Yapı Kredi","22",debt["Yapı Kredi"],paymentStatus(22)],
    ["Akbank","25",debt["Akbank"],paymentStatus(25)],
    ["Vodafone","Ay içi","1500-2000","Bekliyor"]
  ].map(x=>`<div class="row"><b>${x[0]}</b><span class="status">${x[3]}</span><br><small>${x[1]} • ${typeof x[2]==='number'?money(x[2]):x[2]}</small></div>`).join("");

  document.getElementById("categoryReport").innerHTML=Object.entries(cat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="row"><b>${k}</b><span style="float:right">${money(v)}</span></div>`).join("") || "<p>Bu ay harcama kaydı yok.</p>";
  document.getElementById("list").innerHTML=data.records.slice(0,45).map(r=>`<div class="item"><div><b>${r.desc}</b><br><small>${new Date(r.date).toLocaleDateString("tr-TR")} • ${r.type} • ${r.category} • ${r.payment}</small></div><div><strong class="${r.type==='Gelir'?'income':'expense'}">${r.type==='Gelir'?'+':'-'}${money(r.amount)}</strong><button class="delete" onclick="deleteRecord('${r.id}')">Sil</button></div></div>`).join("") || "<p>Henüz kayıt yok.</p>";
}
document.getElementById("exportBtn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="bilal-finance-yedek.json"; a.click();});
if("serviceWorker" in navigator){ navigator.serviceWorker.register("sw.js"); }
render();
