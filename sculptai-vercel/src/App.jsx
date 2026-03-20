import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

/* ─── SUPABASE ───────────────────────────────────────────────────────────── */
const sb = createClient(
  "https://ndabbbnrlgtwparpivim.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kYWJiYm5ybGd0d3BhcnBpdmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTQ2NDAsImV4cCI6MjA4OTM5MDY0MH0.g9ZUYqFw00IE_aIVNumcGyGHi1lbrurSiPXnI5PzQJo"
);

/* ─── ŞİFRELEME — AES-GCM ────────────────────────────────────────────────── */
async function getKey(doctorId){
  const raw=new TextEncoder().encode(doctorId.padEnd(16,"0").slice(0,16));
  return crypto.subtle.importKey("raw",raw,{name:"AES-GCM"},false,["encrypt","decrypt"]);
}
async function encryptName(name,doctorId){
  if(!name||!doctorId) return name||"";
  try{
    const key=await getKey(doctorId);
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const enc=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(name));
    const buf=new Uint8Array([...iv,...new Uint8Array(enc)]);
    return btoa(String.fromCharCode(...buf));
  }catch{return name;}
}
async function decryptName(cipher,doctorId){
  if(!cipher||!doctorId) return cipher||"";
  try{
    const buf=Uint8Array.from(atob(cipher),c=>c.charCodeAt(0));
    const iv=buf.slice(0,12);
    const data=buf.slice(12);
    const key=await getKey(doctorId);
    const dec=await crypto.subtle.decrypt({name:"AES-GCM",iv},key,data);
    return new TextDecoder().decode(dec);
  }catch{return cipher;} // şifre çözülemezse olduğu gibi göster
}

/* ─── FONTS & STYLES ─────────────────────────────────────────────────────── */
const FL = document.createElement("link");
FL.rel = "stylesheet";
FL.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500&display=swap";
document.head.appendChild(FL);
const SE = document.createElement("style");
SE.textContent = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:#f5f0e8;color:#1a1510;font-size:13px;line-height:1.5}input,button,select{font-family:'Inter',sans-serif}button{cursor:pointer}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#d4cabf;border-radius:2px}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}.f1{animation:fadeUp 0.35s ease 0.05s both}.f2{animation:fadeUp 0.35s ease 0.12s both}.f3{animation:fadeUp 0.35s ease 0.19s both}.f4{animation:fadeUp 0.35s ease 0.26s both}.f5{animation:fadeUp 0.35s ease 0.33s both}`;
document.head.appendChild(SE);

/* ─── TRAINING DATA ──────────────────────────────────────────────────────── */
const REAL_DATA = [{"f":[0,0.5,0.4,0.1,0.45,0.4,0.05,0.05,0.05,0.35,0.4,0.44],"r":0.35},{"f":[0.3684,0.35,0.2,0.1,0.45,0.4,0.05,0.05,0.6,0.35,0.4,0.26],"r":0.5},{"f":[0.5789,0.1,0.2,0.7,0.45,0.4,0.6,0.45,0.95,0.35,0.4,0.16],"r":0.9},{"f":[0.7018,0.1,0.2,0.1,0.1,0.4,0.6,0.45,0.6,0.35,0.1,0.16],"r":0.15},{"f":[0.1228,0.1,0.2,0.1,0.45,0.05,0.05,0.05,0.6,0.05,0.75,0.16],"r":0.4},{"f":[0.2632,0.1,0.2,0.15,0.45,0.4,0.05,0.05,0.05,0.05,0.4,0.16],"r":0.7},{"f":[0.386,0.1,0.2,0.1,0.85,0.4,0.05,0.05,0.6,0.05,0.75,0.16],"r":0.7},{"f":[0.4561,0.1,0.2,0.15,0.1,0.9,0.05,0.05,0.6,0.05,0.4,0.16],"r":1.0},{"f":[0.4912,0.1,0.2,0.1,0.45,0.4,0.05,0.05,0.05,0.05,0.75,0.16],"r":0.15},{"f":[0,0.1,0.65,0.1,0.1,0.4,0.6,0.05,0.6,0.35,0.4,0.43],"r":1.0},{"f":[0.2807,0.1,0.2,0.15,0.45,0.05,0.05,0.05,0.05,0.05,0.4,0.16],"r":0.6},{"f":[0.1754,0.1,0.2,0.1,0.1,0.9,0.05,0.7,0.6,0.05,0.4,0.16],"r":0.5},{"f":[0.7018,0.1,0.05,0.1,0.1,0.4,0.05,0.05,0.05,0.35,0.4,0.07],"r":0.05},{"f":[0.1754,0.1,0.2,0.1,0.1,0.4,0.05,0.05,0.05,0.05,0.1,0.16],"r":0.15},{"f":[0.3509,0.1,0.2,0.1,0.45,0.9,0.05,0.05,0.05,0.35,0.4,0.16],"r":0.5},{"f":[0.3509,0.1,0.2,0.1,0.1,0.4,0.05,0.05,0.05,0.05,0.4,0.16],"r":0.5},{"f":[0.193,0.1,0.2,0.1,0.45,0.4,0.05,0.45,0.6,0.05,0.4,0.16],"r":0.5},{"f":[0.0526,0.1,0.2,0.1,0.45,0.4,0.05,0.8,0.6,0.05,0.4,0.16],"r":0.5},{"f":[0.5439,0.8,0.2,0.1,0.45,0.4,0.05,0.45,0.6,0.35,0.4,0.44],"r":0.5},{"f":[0.6316,0.1,0.2,0.1,0.1,0.4,0.05,0.05,0.05,0.05,0.75,0.16],"r":0.5},{"f":[0.1404,0.1,0.2,0.7,0.1,0.4,0.05,0.05,0.05,0.05,0.4,0.16],"r":0.5},{"f":[0.1053,0.1,0.2,0.1,0.1,0.05,0.05,0.7,0.6,0.05,0.4,0.16],"r":0.5},{"f":[0.4035,0.1,0.65,0.15,0.1,0.4,0.05,0.05,0.05,0.05,0.75,0.43],"r":0.5},{"f":[0.4561,0.1,0.65,0.1,0.1,0.9,0.05,0.05,0.95,0.05,0.4,0.43],"r":0.5},{"f":[0.2632,0.1,0.2,0.15,0.45,0.4,0.05,0.05,0.05,0.05,0.4,0.16],"r":0.5},{"f":[0.3158,0.1,0.65,0.1,0.45,0.4,0.05,0.05,0.95,0.05,0.4,0.43],"r":0.5},{"f":[0.0702,0.1,0.2,0.1,0.1,0.4,0.6,0.05,0.6,0.35,0.4,0.16],"r":0.5},{"f":[0.2281,0.1,0.2,0.1,0.45,0.4,0.05,0.05,0.6,0.05,0.1,0.16],"r":0.5},{"f":[0.7544,0.1,0.2,0.1,0.45,0.4,0.05,0.05,0.05,0.05,0.4,0.16],"r":0.5},{"f":[0.386,0.1,0.65,0.15,0.45,0.4,0.95,0.7,0.95,0.35,0.75,0.43],"r":0.5},{"f":[0.2982,0.1,0.2,0.1,0.45,0.4,0.05,0.05,0.05,0.05,0.4,0.16],"r":0.5},{"f":[0.4035,0.1,0.2,0.95,0.45,0.4,0.05,0.05,0.05,0.05,0.4,0.16],"r":0.65},{"f":[0.2982,0.1,0.2,0.1,0.1,0.4,0.05,0.05,0.6,0.05,0.4,0.16],"r":0.35},{"f":[0.3158,0.1,0.2,0.1,0.1,0.4,0.05,0.05,0.6,0.05,0.4,0.16],"r":0.35},{"f":[0.1754,0.8,0.95,0.1,0.85,0.4,0.05,0.05,0.05,0.05,0.75,0.89],"r":0.5},{"f":[0.4737,0.1,0.2,0.1,0.1,0.4,0.05,0.05,0.6,0.05,0.4,0.16],"r":0.5},{"f":[0.3158,0.1,0.95,0.1,0.1,0.4,0.6,0.05,0.6,0.05,0.75,0.61],"r":0.6},{"f":[0.3684,0.1,0.2,0.1,0.45,0.4,0.05,0.05,0.05,0.05,0.4,0.16],"r":0.5},{"f":[0.7719,0.1,0.2,0.15,0.1,0.05,0.05,0.05,0.05,0.35,0.4,0.16],"r":0.5},{"f":[0.0702,0.1,0.2,0.1,0.1,0.9,0.05,0.05,0.05,0.05,0.4,0.16],"r":0.5},{"f":[0.2807,0.35,0.2,0.1,0.1,0.9,0.05,0.7,0.95,0.05,0.4,0.26],"r":0.5},{"f":[0.0877,0.1,0.2,0.1,0.1,0.4,0.05,0.05,0.05,0.05,0.75,0.16],"r":0.5},{"f":[0.0877,0.9,0.2,0.1,0.1,0.4,0.6,0.8,0.6,0.05,0.75,0.48],"r":0.5},{"f":[0.2632,0.1,0.2,0.1,0.1,0.9,0.05,0.05,0.6,0.05,0.4,0.16],"r":0.5},{"f":[0.193,0.35,0.2,0.1,0.85,0.4,0.05,0.05,0.05,0.05,0.4,0.26],"r":0.5},{"f":[0.3684,0.35,0.2,0.1,0.45,0.4,0.05,0.05,0.6,0.05,0.1,0.26],"r":0.5},{"f":[0.4912,0.1,0.2,0.1,0.1,0.9,0.05,0.7,0.95,0.05,0.4,0.16],"r":0.5},{"f":[0.386,0.35,0.2,0.1,0.1,0.05,0.05,0.05,0.6,0.05,0.75,0.26],"r":0.65},{"f":[0.0526,0.35,0.2,0.1,0.1,0.4,0.05,0.05,0.6,0.05,0.75,0.26],"r":0.5},{"f":[0.7719,0.1,0.2,0.1,0.1,0.9,0.05,0.05,0.05,0.05,0.4,0.16],"r":0.5},{"f":[0.1754,0.1,0.2,0.15,0.1,0.4,0.05,0.05,0.05,0.05,0.4,0.16],"r":0.5},{"f":[0.7544,0.1,0.05,0.1,0.45,0.4,0.05,0.05,0.6,0.05,0.4,0.07],"r":0.5},{"f":[0.0526,0.9,0.2,0.1,0.85,0.05,0.05,0.05,0.6,0.05,0.4,0.48],"r":0.5},{"f":[0.5614,0.1,0.2,0.1,0.45,0.4,0.05,0.05,0.05,0.05,0.75,0.16],"r":0.15},{"f":[0.5789,0.9,0.2,0.95,0.1,0.9,0.05,0.05,0.05,0.05,0.4,0.48],"r":0.5},{"f":[0.4035,0.1,0.2,0.1,0.1,0.9,0.05,0.05,0.6,0.05,0.4,0.16],"r":0.5},{"f":[0.5088,0.1,0.5,0.1,0.1,0.05,0.05,0.05,0.3,0.05,0.75,0.34],"r":0.5},{"f":[0.5088,0.1,0.2,0.1,0.1,0.4,0.05,0.05,0.6,0.05,0.4,0.16],"r":0.5},{"f":[0.6842,0.1,0.2,0.1,0.45,0.4,0.05,0.05,0.95,0.05,0.1,0.16],"r":0.5},{"f":[0.386,0.1,0.2,0.1,0.1,0.4,0.05,0.05,0.95,0.05,0.4,0.16],"r":0.5},{"f":[0.4211,0.1,0.2,0.15,0.1,0.9,0.05,0.45,0.05,0.05,0.4,0.16],"r":0.5},{"f":[0.2807,0.1,0.2,0.15,0.1,0.4,0.05,0.05,0.05,0.35,0.4,0.16],"r":0.5},{"f":[0,0.35,0.65,0.1,0.1,0.4,0.05,0.05,0.6,0.05,0.4,0.53],"r":0.5},{"f":[0.1754,0.1,0.2,0.15,0.1,0.4,0.05,0.05,0.6,0.35,0.4,0.16],"r":0.5},{"f":[0.2105,0.1,0.2,0.1,0.1,0.05,0.05,0.05,0.05,0.05,0.4,0.16],"r":0.5},{"f":[0.1228,0.1,0.2,0.1,0.45,0.05,0.05,0.05,0.95,0.05,0.4,0.16],"r":0.5},{"f":[0.0702,0.1,0.2,0.1,0.85,0.9,0.05,0.45,0.6,0.05,0.4,0.16],"r":0.5},{"f":[0.0702,0.1,0.2,0.1,0.45,0.4,0.95,0.45,0.6,0.05,0.4,0.16],"r":0.5},{"f":[0.8246,0.1,0.2,0.1,0.1,0.9,0.05,0.05,0.6,0.05,0.4,0.16],"r":0.5},{"f":[0.5965,0.1,0.2,0.1,0.1,0.05,0.05,0.05,0.6,0.05,0.4,0.16],"r":0.5},{"f":[0.0702,0.1,0.2,0.1,0.85,0.9,0.05,0.45,0.6,0.05,0.4,0.16],"r":0.5}];

/* ─── NEURAL NETWORK ─────────────────────────────────────────────────────── */
class NN {
  constructor(i,h,o){this.w1=this.rm(i,h);this.b1=Array(h).fill(0);this.w2=this.rm(h,o);this.b2=Array(o).fill(0);this.lr=0.02;}
  rm(r,c){return Array.from({length:r},()=>Array.from({length:c},()=>(Math.random()-0.5)*0.5));}
  s(x){return 1/(1+Math.exp(-Math.max(-20,Math.min(20,x))));}
  sd(x){const s=this.s(x);return s*(1-s);}
  forward(inp){
    this.inp=inp;
    this.z1=this.b1.map((b,j)=>b+inp.reduce((s,x,i)=>s+x*this.w1[i][j],0));
    this.a1=this.z1.map(z=>this.s(z));
    this.z2=this.b2.map((b,j)=>b+this.a1.reduce((s,x,i)=>s+x*this.w2[i][j],0));
    this.a2=this.z2.map(z=>this.s(z));
    return this.a2[0];
  }
  train(inp,t){
    const p=this.forward(inp),e=p-t,d2=[e*this.sd(this.z2[0])];
    for(let i=0;i<this.w2.length;i++)for(let j=0;j<this.w2[0].length;j++)this.w2[i][j]-=this.lr*d2[j]*this.a1[i];
    this.b2=this.b2.map((b,j)=>b-this.lr*d2[j]);
    const d1=this.b1.map((_,j)=>d2.reduce((s,d,k)=>s+d*this.w2[j][k],0)*this.sd(this.z1[j]));
    for(let i=0;i<this.w1.length;i++)for(let j=0;j<this.w1[0].length;j++)this.w1[i][j]-=this.lr*d1[j]*this.inp[i];
    this.b1=this.b1.map((b,j)=>b-this.lr*d1[j]);
  }
}

/* ─── FEATURE EXTRACTION ─────────────────────────────────────────────────── */
function extractFeatures(a){
  const age=Math.min(1,Math.max(0,((parseFloat(a.age)||35)-18)/57));
  const mot={"Görünümümü iyileştirmek istiyorum":0.1,"Sosyal özgüvenimi artırmak istiyorum":0.35,"Başka insanların yorumları beni kötü etkiliyor":0.8,"Hayatımda büyük bir değişime ihtiyacım var":0.9}[a.motivation]??0.5;
  const exp={"Küçük iyileştirmeler yeterli":0.05,"Doğal ve dengeli bir sonuç bekliyorum":0.2,"Belirgin bir değişim bekliyorum, işlem yaptırdığım belli olmalı":0.65,"Tamamen farklı görünmek istiyorum":0.95}[a.expectation]??0.5;
  const prev={"Hayır":0.1,"Evet ve memnunum":0.15,"Evet ama beklentimi karşılamadı":0.7,"Evet ve hiç memnun değilim":0.95}[a.prevSurgery]??0.1;
  const doc={"Hayır":0.1,"1-2 doktora danıştım":0.45,"Birçok doktora danıştım":0.85}[a.multiDoctor]??0.3;
  const rk={"Detaylı araştırdım ve biliyorum":0.05,"Genel olarak bilgi sahibiyim":0.4,"Hiçbir bilgim yok":0.9}[a.riskKnowledge]??0.5;
  const imp={"Evet":0.05,"Sabırlı olmakta zorlanabilirim":0.6,"Hızlı sonuç görmek istiyorum":0.95}[a.patience]??0.5;
  const sup={"Evet":0.05,"Kararsızlar":0.45,"Bu işleme karşılar":0.8,"Kimseye söylemedim":0.7}[a.support]??0.3;
  const rev={"Evet, ve olası revizyonu normal kabul ederim":0.05,"Revizyon ihtimali beni çok endişelendiriyor":0.6,"Kusursuz sonuç bekliyorum":0.95}[a.revision]??0.3;
  const com={"Titizlikle tüm önerilere uyarım":0.05,"Büyük ölçüde uyarım":0.35,"Kendi yöntemlerimi uygulamayı tercih ederim":0.9}[a.compliance]??0.3;
  const pri={"Kalite için daha fazla öderim":0.1,"Dengeli fiyat/kalite isterim":0.4,"En uygun fiyatı tercih ederim":0.75}[a.price]??0.4;
  return [age,mot,exp,prev,doc,rk,imp,sup,rev,com,pri,exp*0.6+mot*0.4];
}

function classify(score,a){
  // Paylaşım sinyalleri — tüm olası cevap metinlerini yakala
  const sf=["Evet, açıkça paylaşırım","Evet paylaşırım","Sık paylaşırım"].some(x=>a.sharing===x);
  const rec=["Evet, sık sık öneririm","Evet, sık öneririm"].some(x=>a.recommends===x);
  const inf=a.socialMedia==="Sık paylaşırım";
  const socialActive=(sf&&rec)||(sf&&inf)||(rec&&inf);

  // Risk sinyalleri
  const bddRisk=a.bodyFocus==="Neredeyse her gün, bazen işimi gücümü etkiliyor"||a.avoidance==="Günlük hayatımı önemli ölçüde kısıtlıyor";
  const highExp=a.expectation?.includes("Tamamen farklı");
  const extMotiv=["Yakınlarımın yorumları etkili oldu","Başka insanların yorumları beni kötü etkiliyor"].some(x=>a.motivation===x);
  const manyDocs=a.multiDoctor==="Birçok doktora danıştım";
  const noSupport=["Kimseye söylemedim","Bu işleme karşılar"].some(x=>a.support===x);
  const unrealistic=a.revision==="Kusursuz sonuç bekliyorum";
  const worstBad=a.worstCase?.includes("düşünmek istemiyorum");
  const riskFactors=[bddRisk,highExp&&extMotiv,manyDocs,unrealistic,worstBad].filter(Boolean).length;

  // Elçi — gevşetilmiş eşik: score<45, iki sosyal sinyal yeterli
  if(socialActive&&score<45&&riskFactors===0)
    return{cat:"ambassador",label:"Marka Elçisi",icon:"🌟",color:"#7c3aed",bg:"#faf5ff",border:"#ddd6fe",textColor:"#5b21b6",obs:"Randevuya hazır · Referans potansiyeli yüksek",obsBody:"Düşük risk, içsel motivasyon, aktif sosyal profil. Konsültasyon standart ilerleyebilir. Referans programını aktive edin.",ambassador:true};

  // Kırmızı
  if(score>=72||riskFactors>=3||bddRisk)
    return{cat:"red",label:"Konsültasyon Kritik",icon:"🔴",color:"#dc2626",bg:"#fef2f2",border:"#fecaca",textColor:"#991b1b",obs:"Beklenti yönetimi öncelikli",obsBody:"Yüksek risk sinyalleri saptandı. Gerçekçi beklenti çerçevesi çizmeden randevu verilmemesi önerilir.",ambassador:false};

  // Amber
  if(score>=52||riskFactors>=2||(highExp&&noSupport)||(extMotiv&&manyDocs))
    return{cat:"amber",label:"Dikkatli Değerlendir",icon:"🟡",color:"#d97706",bg:"#fffbeb",border:"#fde68a",textColor:"#92400e",obs:"Bazı sinyaller dikkat gerektiriyor",obsBody:"Konsültasyonda beklenti ve motivasyon konuları açılmalı. Randevu verilebilir ancak hazırlıklı girilmeli.",ambassador:false};

  // Yeşil
  return{cat:"green",label:"Randevuya Hazır",icon:"🟢",color:"#059669",bg:"#ecfdf5",border:"#a7f3d0",textColor:"#047857",obs:"Profil uygun görünüyor",obsBody:"İçsel motivasyon, gerçekçi beklenti ve süreç farkındalığı saptandı. Standart konsültasyon yeterli.",ambassador:false};
}

const QUESTIONS=[
  {id:"name",section:"Kişisel Bilgiler",label:"İsminiz ve Soyisminiz",type:"text",placeholder:"Ad Soyad"},
  {id:"age",section:"Kişisel Bilgiler",label:"Kaç yaşındasınız?",type:"number",placeholder:"örn. 34"},
  {id:"gender",section:"Kişisel Bilgiler",label:"Cinsiyetiniz nedir?",type:"radio",options:["Kadın","Erkek","Belirtmek istemiyorum"]},
  {id:"procedure",section:"İşlem Bilgisi",label:"Hangi işlemi yaptırmak istiyorsunuz?",type:"radio",options:["Meme Küçültme","Meme Büyütme (Silikon Protez ile)","Meme Dikleştirme","Meme Asimetrisinin Giderilmesi","Meme Onarımı (Kanser sonrası)","Doğumsal Meme Anomalisinin Düzeltilmesi","Jinekomasti","Burun Estetiği","Yüz Germe","Üst Göz Kapağı Estetiği","Alt Göz Kapağı Estetiği","Botoks Uygulaması","Dolgu Uygulaması","Karın Germe","Liposuction","Uyluk veya Kol germe","Popo estetiği"]},

  /* ── Cross-sell sinyalleri ── */
  {id:"otherAreas",section:"İşlem Bilgisi",label:"Bunun dışında vücudunuzda rahatsız olduğunuz başka bir bölge var mı?",type:"radio",options:["Hayır, sadece bu bölge","Evet, 1-2 bölge daha var ama önceliğim bu","Evet, birkaç bölge var, hepsini konuşmak isterim","Henüz bilmiyorum, doktorun önerilerine açığım"]},
  {id:"otherConsidered",section:"İşlem Bilgisi",label:"Bu işlem dışında daha önce başka bir estetik işlem aklınızdan geçti mi?",type:"radio",options:["Hayır","Evet, düşündüm ama erteledim","Evet, bu işlemle aynı anda değerlendiriyorum","Evet, gelecekte yapmayı planlıyorum"]},

  /* ── BDD Taraması ── */
  {id:"bodyFocus",section:"Motivasyon & Beklenti",label:"Bu bölgenizi günlük hayatınızda ne sıklıkla düşünürsünüz?",type:"radio",options:["Nadiren aklıma gelir","Zaman zaman düşünürüm","Sık sık düşünürüm, ama kontrol altında","Neredeyse her gün, bazen işimi gücümü etkiliyor"]},
  {id:"avoidance",section:"Motivasyon & Beklenti",label:"Bu konudan ötürü kaçındığınız durumlar oluyor mu?",type:"radio",options:["Hayır, hayatımı etkilemiyor","Bazen dikkatimi dağıtıyor","Bazı sosyal ortamlardan kaçınıyorum","Günlük hayatımı önemli ölçüde kısıtlıyor"]},
  {id:"motivation",section:"Motivasyon & Beklenti",label:"Bu kararı almanızda en belirleyici olan nedir?",type:"radio",options:["Kendim için daha iyi hissetmek istiyorum","Özgüvenimi artırmak istiyorum","Yakınlarımın yorumları etkili oldu","Hayatımın daha iyi gideceğini düşünüyorum"]},
  {id:"expectation",section:"Motivasyon & Beklenti",label:"İşlem sonucunda nasıl bir değişim bekliyorsunuz?",type:"radio",options:["Küçük, doğal bir iyileştirme yeterli","Dengeli ve orantılı bir sonuç bekliyorum","Belirgin bir fark olmasını istiyorum","Tamamen farklı bir görünüm istiyorum"]},

  /* ── Benlik saygısı ── */
  {id:"selfEsteem",section:"Kendinizi Tanıyın",label:"Genel olarak kendinizden memnun musunuz?",type:"radio",options:["Evet, kendimden genel olarak memnunum","Çoğunlukla memnunum, bazı konularda değil","Kendimden pek memnun değilim","Hayır, kendimle barışık değilim"]},

  /* ── Karar Kalitesi ── */
  {id:"imagineAfter",section:"Karar Süreci",label:"Bu işlem sonrasını hayal ettiğinizde ne görüyorsunuz?",type:"radio",options:["Kendimi daha özgüvenli ve hafif hayal ediyorum","Belirli bir fiziksel değişikliği hayal ediyorum","Hayatımın daha iyi gideceğini hayal ediyorum","Çevremin tepkisini ve beğenisini hayal ediyorum"]},
  {id:"worstCase",section:"Karar Süreci",label:"En kötü ihtimalde sonuç beklediğiniz gibi olmazsa ne yaparsınız?",type:"radio",options:["Doktorumla konuşur, birlikte değerlendiririm","Revizyon seçeneğini değerlendiririm","Çok üzülürüm ama kabullenirim","Bu ihtimali düşünmek istemiyorum"]},
  {id:"prevSurgery",section:"Geçmiş Deneyimler",label:"Daha önce estetik bir işlem yaptırdınız mı?",type:"radio",options:["Hayır","Evet ve memnunum","Evet ama beklentimi karşılamadı","Evet ve hiç memnun değilim"]},
  {id:"multiDoctor",section:"Geçmiş Deneyimler",label:"Bu konuyu daha önce başka doktorlarla görüştünüz mü?",type:"radio",options:["Hayır","1-2 doktorla görüştüm","Birçok doktorla görüştüm"]},

  /* ── Süreç Farkındalığı ── */
  {id:"riskKnowledge",section:"Süreç Farkındalığı",label:"Bu işlemin riskleri ve iyileşme süreci hakkında bilginiz ne düzeyde?",type:"radio",options:["Hiçbir bilgim yok","Genel olarak bilgi sahibiyim","Detaylı araştırdım ve biliyorum"]},
  {id:"patience",section:"Süreç Farkındalığı",label:"İyileşme sürecinde sabırlı olabileceğinizi düşünüyor musunuz?",type:"radio",options:["Evet, sabırlıyım","Zorlanabilirim ama başarırım","Hızlı sonuç görmek istiyorum"]},
  {id:"support",section:"Süreç Farkındalığı",label:"Yakın çevreniz bu kararınızı biliyor mu ve destekliyor mu?",type:"radio",options:["Evet, destekliyorlar","Biliyorlar ama kararsızlar","Karşılar","Kimseye söylemedim"]},
  {id:"revision",section:"Süreç Farkındalığı",label:"Revizyon ihtimali olabileceğini biliyor musunuz?",type:"radio",options:["Evet, olası revizyonu normal karşılarım","Revizyon beni endişelendiriyor","Kusursuz sonuç bekliyorum"]},

  /* ── Sosyal Profil ── */
  {id:"sharing",section:"Hasta Profili",label:"Yaptırdığınız işlemleri çevrenizle paylaşır mısınız?",type:"radio",options:["Evet, açıkça paylaşırım","Sadece çok yakınlarımla","Hayır, paylaşmam"]},
  {id:"recommends",section:"Hasta Profili",label:"Memnun kaldığınız bir deneyimi aktif olarak başkalarına önerir misiniz?",type:"radio",options:["Evet, sık sık öneririm","Bazen","Önermem"]},
  {id:"socialMedia",section:"Hasta Profili",label:"Sosyal medyada kişisel deneyimlerinizi paylaşma sıklığınız nedir?",type:"radio",options:["Sık paylaşırım","Ara sıra","Genelde paylaşmam"]},

  /* ── Açık Uçlu ── */
  {id:"openStory",section:"Size Bir Sorum Var",label:"Bu formu doldurmadan önce bugün sabah aynaya baktığınızda ne hissettiniz?",type:"text",placeholder:"İstediğiniz kadar az veya çok yazabilirsiniz...",optional:true},
];
const SECTIONS=[...new Set(QUESTIONS.map(q=>q.section))];

function getFlags(a,cat){
  const flags=[];
  if(["Başka insanların yorumları beni kötü etkiliyor","Hayatımda büyük bir değişime ihtiyacım var"].includes(a.motivation)) flags.push("Dış kaynaklı motivasyon");
  if(a.expectation==="Tamamen farklı görünmek istiyorum") flags.push("Yüksek beklenti düzeyi");
  if(a.multiDoctor==="Birçok doktora danıştım") flags.push("Birden fazla doktor görüşmesi");
  if(a.patience==="Hızlı sonuç görmek istiyorum") flags.push("Hızlı sonuç beklentisi");
  if(["Bu işleme karşılar","Kimseye söylemedim"].includes(a.support)) flags.push("Sosyal destek belirsiz");
  if(a.revision==="Kusursuz sonuç bekliyorum") flags.push("Kusursuz sonuç beklentisi");
  if(cat==="green"||cat==="ambassador"){
    if(a.motivation==="Görünümümü iyileştirmek istiyorum") flags.push("İçsel motivasyon");
    if(["Doğal ve dengeli bir sonuç bekliyorum","Küçük iyileştirmeler yeterli"].includes(a.expectation)) flags.push("Gerçekçi beklentiler");
    if(a.support==="Evet") flags.push("Ailesi destekliyor");
  }
  if(cat==="ambassador"){
    if(a.socialMedia==="Sık paylaşırım") flags.push("Yüksek sosyal etki potansiyeli");
    if(a.recommends==="Evet, sık öneririm") flags.push("Aktif tavsiye eğilimi");
  }
  return flags.slice(0,2);
}

function getSignals(a,cat){
  if(cat==="red"||cat==="amber") return [
    {label:"Motivasyon",val:a.motivation?.split(" ").slice(0,3).join(" ")||"—"},
    {label:"Beklenti",val:a.expectation?.split(" ").slice(0,3).join(" ")||"—"},
    {label:"Önceki Danışma",val:a.multiDoctor||"—"},
  ];
  if(cat==="ambassador") return [
    {label:"Sosyal Medya",val:a.socialMedia||"—"},
    {label:"Tavsiye Eğilimi",val:a.recommends||"—"},
    {label:"Ek Prosedür",val:a.crossSell||"—"},
  ];
  return [
    {label:"Motivasyon",val:a.motivation?.split(" ").slice(0,3).join(" ")||"—"},
    {label:"Beklenti",val:a.expectation?.split(" ").slice(0,3).join(" ")||"—"},
    {label:"Sosyal Destek",val:a.support||"—"},
  ];
}

function exportCSV(records){
  const H=["Tarih","İsim","Yaş","Cinsiyet","İşlem","Kaynak","Motivasyon","Beklenti","Önceki İşlem","Çok Doktor","Risk Bilgisi","Sabır","Destek","Revizyon","Uyum","Fiyat","Paylaşım","Çapraz Satış","Sosyal Etki","Tavsiye","Sosyal Medya","Risk Skoru","Segment"];
  const R=records.map(p=>[p.date,p.answers?.name||"",p.answers?.age||"",p.answers?.gender||"",p.answers?.procedure||"",p.answers?.source||"",p.answers?.motivation||"",p.answers?.expectation||"",p.answers?.prevSurgery||"",p.answers?.multiDoctor||"",p.answers?.riskKnowledge||"",p.answers?.patience||"",p.answers?.support||"",p.answers?.revision||"",p.answers?.compliance||"",p.answers?.price||"",p.answers?.sharing||"",p.answers?.crossSell||"",p.answers?.socialInfluence||"",p.answers?.recommends||"",p.answers?.socialMedia||"",p.risk_score,p.segment]);
  const csv=[H,...R].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}));
  a.download=`SculptAI_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

/* ─── SIDEBAR ────────────────────────────────────────────────────────────── */
function Sidebar({tab,setTab}){
  const items=[
    {id:"patients",icon:(on)=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={on?"#f5f0e8":"rgba(255,255,255,0.2)"} strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>},
    {id:"analytics",icon:(on)=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={on?"#f5f0e8":"rgba(255,255,255,0.2)"} strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>},
    {id:"value",icon:(on)=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={on?"#f5f0e8":"rgba(255,255,255,0.2)"} strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>},
    {id:"settings",icon:(on)=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={on?"#f5f0e8":"rgba(255,255,255,0.2)"} strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>},
  ];
  return(
    <aside style={{width:52,background:"#1a1510",display:"flex",flexDirection:"column",alignItems:"center",padding:"18px 0",gap:4,flexShrink:0}}>
      <div style={{width:22,height:22,border:"1px solid rgba(255,255,255,0.12)",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:18}}>
        <div style={{width:7,height:7,background:"#4a1520",borderRadius:"50%",boxShadow:"0 0 8px rgba(74,21,32,0.8)"}}/>
      </div>
      {items.map(({id,icon})=>(
        <div key={id} onClick={()=>setTab(id)} style={{width:36,height:36,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:tab===id?"rgba(245,240,232,0.08)":"transparent",transition:"background 0.15s"}}>
          {icon(tab===id)}
        </div>
      ))}
      <div style={{flex:1}}/>
      <div style={{width:36,height:36,borderRadius:"50%",background:"#2a2018",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:500,color:"#f5f0e8",letterSpacing:"0.04em",marginBottom:6,cursor:"pointer"}}>
        AK
      </div>
    </aside>
  );
}

/* ─── PATIENT CARD ───────────────────────────────────────────────────────── */
function PatientCard({patient,onDelete}){
  const [open,setOpen]=useState(false);
  const [confirm,setConfirm]=useState(false);
  const [showOutcome,setShowOutcome]=useState(false);
  const [showAmbassador,setShowAmbassador]=useState(false);
  const [outcomeProcedures,setOutcomeProcedures]=useState(patient.outcome_procedures||[]);
  const [noAppointment,setNoAppointment]=useState(patient.no_appointment||false);
  const [ambassadorSent,setAmbassadorSent]=useState(patient.ambassador_sent||false);
  const a=patient.answers||{};
  const score=patient.risk_score||0;
  const cls=classify(score,a);
  const flags=getFlags(a,cls.cat);
  const signals=getSignals(a,cls.cat);

  const ALL_PROCS=["Burun Estetiği","Meme Küçültme","Meme Büyütme","Meme Dikleştirme","Karın Germe","Liposuction","Üst Göz Kapağı","Alt Göz Kapağı","Botoks","Dolgu","Kol Germe","Yüz Germe","Uyluk Germe","Popo Estetiği","Jinekomasti"];

  async function saveOutcome(){
    await sb.from("patients").update({outcome_procedures:outcomeProcedures,no_appointment:false}).eq("id",patient.id);
    setNoAppointment(false);
    setShowOutcome(false);
  }

  async function markNoAppointment(){
    await sb.from("patients").update({no_appointment:true,outcome_procedures:[]}).eq("id",patient.id);
    setNoAppointment(true);
    setOutcomeProcedures([]);
  }

  async function sendAmbassador(){
    const code="REF-"+Math.random().toString(36).substr(2,4).toUpperCase();
    await sb.from("patients").update({ambassador_sent:true,ambassador_code:code}).eq("id",patient.id);
    setAmbassadorSent(true);
    setShowAmbassador(false);
    alert(`Referans kodu: ${code}\nBu kodu hastaya paylaşın.`);
  }

  const formProc=a.procedure||"";
  const crossSellDetected=outcomeProcedures.length>0&&!outcomeProcedures.every(p=>p===formProc);

  return(
    <div style={{background:"#f5f0e8",borderRadius:10,border:`1px solid ${open?"#1a1510":"#d4cabf"}`,marginBottom:8,overflow:"hidden",cursor:"pointer",transition:"border-color 0.15s"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:noAppointment?"#fff5f5":"transparent",minWidth:0,overflow:"hidden"}} onClick={()=>setOpen(o=>!o)}>
        {/* Left accent */}
        <div style={{width:2,height:36,borderRadius:1,background:noAppointment?"#fca5a5":cls.color,flexShrink:0}}/>
        {/* Segment pill — kısa label */}
        <div style={{padding:"2px 6px",borderRadius:20,background:cls.bg,border:`1px solid ${cls.border}`,flexShrink:0,maxWidth:60}}>
          <div style={{fontSize:8,fontWeight:500,textTransform:"uppercase",color:cls.textColor,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{cls.icon}</div>
        </div>
        {/* Name + procedure — flex:1 minWidth:0 kritik */}
        <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontWeight:400,color:"#1a1510",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name||"İsimsiz Hasta"}</div>
          <div style={{fontSize:10,color:"#b0a898",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.age?`${a.age} yaş · `:""}{a.procedure}</div>
          {noAppointment&&<div style={{fontSize:8,color:"#dc2626",fontWeight:500,marginTop:1,whiteSpace:"nowrap"}}>✕ Randevu Yok</div>}
        </div>
        {/* Tarih + chevron — sabit genişlik */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3,flexShrink:0,width:40}}>
          <div style={{fontSize:9,color:"#b0a898",whiteSpace:"nowrap"}}>{patient.created_at?new Date(patient.created_at).toLocaleDateString("tr-TR",{day:"numeric",month:"short"}):""}</div>
          <div style={{fontSize:13,color:"#b0a898",transform:open?"rotate(90deg)":"none",transition:"transform 0.2s"}}>›</div>
        </div>
      </div>
        {/* No appointment badge — kart kapalıyken de görünsün */}
        {noAppointment&&(
          <div onClick={e=>e.stopPropagation()} style={{padding:"5px 18px",background:"#fef2f2",borderTop:"1px solid #fecaca",display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontSize:10,color:"#dc2626",fontWeight:500}}>✕ Randevu Alınmadı</div>
            <button onClick={async e=>{e.stopPropagation();await sb.from("patients").update({no_appointment:false}).eq("id",patient.id);setNoAppointment(false);}} style={{fontSize:9,color:"#b0a898",background:"transparent",border:"none",cursor:"pointer",textDecoration:"underline"}}>Geri Al</button>
          </div>
        )}
      {open&&(
        <div style={{borderTop:"1px solid #d4cabf",animation:"fadeUp 0.18s ease"}}>
          {/* Observation strip */}
          <div style={{padding:"12px 18px",background:cls.bg,borderBottom:`1px solid ${cls.border}`,display:"flex",alignItems:"flex-start",gap:10}}>
            <div style={{fontSize:14,flexShrink:0,marginTop:1}}>{cls.icon}</div>
            <div>
              <div style={{fontSize:11,fontWeight:500,color:cls.textColor,marginBottom:2}}>{cls.obs}</div>
              <div style={{fontSize:11,lineHeight:1.65,color:cls.textColor,opacity:0.8}}>{cls.obsBody}</div>
            </div>
          </div>
          {/* Signal boxes */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",borderBottom:"1px solid #d4cabf"}}>
            {signals.map((s,i)=>(
              <div key={i} style={{padding:"10px 16px",borderRight:i<2?"1px solid #d4cabf":"none"}}>
                <div style={{fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:"#b0a898",marginBottom:3}}>{s.label}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:"#1a1510"}}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* AÇIK UÇLU SORU — Ayna */}
          {a.openStory&&(
            <div style={{padding:"12px 18px",borderBottom:"1px solid #d4cabf",background:"#ece7db"}}>
              <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:"#4a1520",marginBottom:6,fontWeight:500}}>Sabah Aynaya Bakış — Kendi Sözleriyle</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontWeight:300,color:"#1a1510",lineHeight:1.8,fontStyle:"italic"}}>"{a.openStory}"</div>
            </div>
          )}

          {/* TIMING — Soru Davranışı */}
          {patient.question_times&&Object.keys(patient.question_times.questionTimes||{}).length>0&&(()=>{
            const qt=patient.question_times.questionTimes||{};
            const qc=patient.question_times.questionChanges||{};
            const slowQ=Object.entries(qt).filter(([,s])=>s>30);
            const changedQ=Object.entries(qc).filter(([,c])=>c>0);
            if(slowQ.length===0&&changedQ.length===0) return null;
            const qLabels={motivation:"Motivasyon",expectation:"Beklenti",bodyFocus:"Bölge odağı",avoidance:"Kaçınma",selfEsteem:"Özgüven",worstCase:"En kötü ihtimal",imagineAfter:"Hayal",decisionAge:"Karar süresi",support:"Destek"};
            return(
              <div style={{padding:"12px 18px",borderBottom:"1px solid #d4cabf",background:"#f5f0e8"}}>
                <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:"#b0a898",marginBottom:8,fontWeight:500}}>Soru Davranışı</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {slowQ.map(([id,sec])=>(
                    <div key={id} style={{fontSize:9,padding:"3px 9px",borderRadius:10,background:"#fef2f2",border:"1px solid #fecaca",color:"#991b1b"}}>
                      ⏱ {qLabels[id]||id}: {sec}sn
                    </div>
                  ))}
                  {changedQ.map(([id,cnt])=>(
                    <div key={id} style={{fontSize:9,padding:"3px 9px",borderRadius:10,background:"#fffbeb",border:"1px solid #fde68a",color:"#92400e"}}>
                      ↺ {qLabels[id]||id}: {cnt}x değişti
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
            <div style={{borderTop:"1px solid #e0d9cc",padding:"12px 16px",background:"#f5f0e8"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
                <div style={{width:18,height:18,background:"#1a1510",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#f5f0e8",flexShrink:0}}>✦</div>
                <div style={{fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:"#1a1510",fontWeight:600}}>Sistem Gözlemi</div>
                {patient.ai_loading&&<div style={{fontSize:10,color:"#b0a898",animation:"pulse 1.5s infinite"}}>Claude analizi hazırlanıyor...</div>}
              </div>

              {/* AUTO SUMMARY — hasta spesifik */}
              {(()=>{
                const a=patient.answers||{};
                const s=patient.risk_score||0;
                const name=a.name?.split(" ")[0]||"Hasta";
                const proc=a.procedure||"işlem";
                const risks=[];
                const comms=[];

                // ── RİSK FAKTÖRLERİ — spesifik ──
                if(a.motivation?.includes("Yakınlarımın yorumları")||a.motivation?.includes("Başka insanların")) risks.push(`${name} dışsal baskıyla karar veriyor — kendi isteği mi yoksa çevre baskısı mı netleştirin`);
                if(a.expectation?.includes("Tamamen farklı")) risks.push(`"Tamamen farklı görünmek" beklentisi ${proc} ile karşılanamayabilir — fotoğraflarla sınır çizin`);
                if(a.multiDoctor?.includes("Birçok")) risks.push(`Birden fazla doktora danışmış — önceki konsültasyonlarda ne duyduğunu sorun, neden ikna olmadığını anlayın`);
                if(a.support?.includes("Kimseye söylemedim")) risks.push(`${name} bu kararı tek başına veriyor, sosyal desteği yok — iyileşme sürecinde yalnız kalma riski`);
                if(a.revision?.includes("Kusursuz")) risks.push(`Revizyon ihtimalini kabul etmiyor — kusursuz sonuç beklentisi var, bunu mutlaka konuşun`);
                if(a.worstCase?.includes("düşünmek istemiyorum")) risks.push(`En kötü senaryoyu düşünmekten kaçınıyor — gerçekçi risk konuşması dirençle karşılaşabilir`);
                if(a.bodyFocus?.includes("işimi gücümü etkiliyor")) risks.push(`Bu bölge günlük işleyişini etkiliyor — BDD değerlendirmesi düşünülebilir`);
                if(a.prevSurgery?.includes("beklentimi karşılamadı")||a.prevSurgery?.includes("hiç memnun değilim")) risks.push(`Önceki işlemden memnun kalmamış — bu sefer beklentisi daha yüksek olabilir, geçmiş deneyimi derinleştirin`);
                if(a.selfEsteem?.includes("barışık değilim")) risks.push(`Benlik saygısı düşük — işlem sonrası psikolojik iyileşme yavaş olabilir`);
                if(risks.length===0) risks.push(`${name} için belirgin risk sinyali saptanmadı — standart konsültasyon yeterli`);

                // ── İLETİŞİM TARZI — spesifik ──
                const isAnalyst=a.riskKnowledge?.includes("Detaylı");
                const isSocial=(a.sharing?.includes("açıkça")||a.sharing?.includes("Evet"))&&a.recommends?.includes("sık");
                const isPragmatic=a.patience?.includes("Hızlı");
                const isTrustSeeker=a.riskKnowledge?.includes("Hiçbir")||a.support?.includes("Kimseye");

                if(isAnalyst){
                  comms.push(`${name} araştırmacı profil — teknik detayları paylaşmaktan çekinmeyin, boş konuşmayı sevmez`);
                  comms.push(`Kullandığınız tekniği ve neden seçtiğinizi açıklayın — bu onu güvende hissettirir`);
                } else if(isPragmatic){
                  comms.push(`${name} hızlı karar veriyor — uzun açıklamalar yerine net takvim ve 3 kritik kural yeterli`);
                  comms.push(`"İyileşme ${a.procedure?.includes("Botoks")||a.procedure?.includes("Dolgu")?"hemen başlar":"2 haftada normale döner"}" gibi net zaman çerçeveleri verin`);
                } else if(isTrustSeeker){
                  comms.push(`${name} bilgi düzeyi düşük ve muhtemelen endişeli — yargılamadan, sıcak bir ton kullanın`);
                  comms.push(`"Tüm sorularınız normal, herkes bunları merak eder" gibi normalleştirici cümleler kurun`);
                } else if(isSocial){
                  comms.push(`${name} sosyal profil güçlü — konsültasyonu olumlu geçerse çevresine anlatacak, bunu aklınızda tutun`);
                  comms.push(`Sonuç fotoğraflarını paylaşmaya teşvik edin — doğal referans kaynağı olabilir`);
                } else {
                  comms.push(`${name} ${a.decisionAge?.includes("1 yıldan") ? "uzun süredir" : "yakın zamanda"} bu kararı düşünüyor — motivasyonunu dinleyin, süreci güvenli hissettirin`);
                  if(a.imagineAfter?.includes("hayatımın daha iyi")||a.imagineAfter?.includes("Hayatımın")) comms.push(`İşlemden hayatının daha iyi gideceğini umuyor — bu beklentiyi gerçekçi çerçeveleyin`);
                }

                return(
                  <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:patient.ai_text?10:0}}>
                    <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:9,padding:"10px 13px"}}>
                      <div style={{fontSize:9,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#991b1b",marginBottom:7}}>⚠ Risk Faktörleri</div>
                      <div style={{display:"flex",flexDirection:"column",gap:5}}>
                        {risks.map((r,i)=>(
                          <div key={i} style={{fontSize:11,color:"#7f1d1d",display:"flex",gap:6,lineHeight:1.55}}>
                            <span style={{flexShrink:0,marginTop:1}}>·</span>{r}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{background:"#f0f9f4",border:"1px solid #a7f3d0",borderRadius:9,padding:"10px 13px"}}>
                      <div style={{fontSize:9,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#065f46",marginBottom:7}}>💬 Konsültasyon Notu</div>
                      <div style={{display:"flex",flexDirection:"column",gap:5}}>
                        {comms.map((c,i)=>(
                          <div key={i} style={{fontSize:11,color:"#064e3b",display:"flex",gap:6,lineHeight:1.55}}>
                            <span style={{flexShrink:0,marginTop:1}}>→</span>{c}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* CLAUDE DEEP ANALYSIS */}
              {patient.ai_text&&!patient.ai_text.includes("kullanılamıyor")&&(
                <div style={{background:"#f0f7ff",border:"1px solid #d4cabf",borderRadius:9,padding:"9px 12px"}}>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#1e40af",marginBottom:5}}>🤖 Claude Derinlemeli Analiz</div>
                  <div style={{fontSize:12,color:"#1e3a5f",lineHeight:1.75}}>{patient.ai_text}</div>
                </div>
              )}
              {patient.ai_loading&&(
                <div style={{background:"#f0f7ff",border:"1px dashed #d4cabf",borderRadius:9,padding:"9px 12px",textAlign:"center"}}>
                  <div style={{fontSize:11,color:"#93c5fd",animation:"pulse 1.5s infinite"}}>✦ Claude analizi yükleniyor...</div>
                </div>
              )}
            </div>
            {/* Cross-sell badge */}
            {crossSellDetected&&(
              <div style={{padding:"6px 16px",background:"#f0fdf4",borderTop:"1px solid #a7f3d0",display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontSize:10,color:"#059669",fontWeight:500}}>↗ Cross-sell tespit edildi</div>
                <div style={{fontSize:10,color:"#b0a898"}}>{outcomeProcedures.filter(p=>p!==formProc).join(", ")} eklendi</div>
              </div>
            )}
            {/* Referral badge */}
            {a.referralCode&&(
              <div style={{padding:"6px 16px",background:"#f5f3ff",borderTop:"1px solid #ddd6fe",display:"flex",alignItems:"center",gap:6}}>
                <div style={{fontSize:10,color:"#7c3aed",fontWeight:500}}>🔗 Referans kodu: {a.referralCode}</div>
              </div>
            )}

            <div style={{borderTop:"1px solid #d4cabf",padding:"10px 16px",display:"flex",gap:7,background:"#f5f0e8"}}>
              <button onClick={e=>{e.stopPropagation();setShowOutcome(v=>!v);}} style={{flex:1,padding:"8px",borderRadius:7,fontSize:11,fontWeight:400,border:`1px solid ${outcomeProcedures.length>0?"#059669":"#d4cabf"}`,background:"transparent",color:outcomeProcedures.length>0?"#059669":"#8a7a68",letterSpacing:"0.03em"}}>
                {outcomeProcedures.length>0?"✓ Randevu Girildi":"Randevu Sonucu"}
              </button>
              {!noAppointment&&(
                <button onClick={e=>{e.stopPropagation();markNoAppointment();}} style={{padding:"8px 10px",borderRadius:7,fontSize:11,fontWeight:400,border:"1px solid #fecaca",background:"transparent",color:"#dc2626",letterSpacing:"0.02em",flexShrink:0}}>
                  Randevu Yok
                </button>
              )}
              {cls.ambassador&&!ambassadorSent&&(
                <button onClick={e=>{e.stopPropagation();setShowAmbassador(v=>!v);}} style={{flex:1,padding:"8px",borderRadius:7,fontSize:11,fontWeight:400,border:"1px solid #ddd6fe",background:"transparent",color:"#7c3aed",letterSpacing:"0.03em"}}>🌟 Elçi Paketi</button>
              )}
              {cls.ambassador&&ambassadorSent&&(
                <div style={{flex:1,padding:"8px",borderRadius:7,fontSize:11,textAlign:"center",background:"#f5f3ff",color:"#7c3aed",border:"1px solid #ddd6fe"}}>✓ Elçi Gönderildi</div>
              )}
              <button onClick={e=>{e.stopPropagation();}} style={{flex:1,padding:"8px",borderRadius:7,fontSize:11,fontWeight:500,border:"none",background:"#1a1510",color:"#f5f0e8",letterSpacing:"0.04em"}}>Görüşmeye Hazır</button>
              {!confirm
                ?<button onClick={e=>{e.stopPropagation();setConfirm(true);}} style={{padding:"8px 12px",borderRadius:7,fontSize:11,border:"1px solid #d4cabf",background:"transparent",color:"#b0a898"}}>Sil</button>
                :<button onClick={e=>{e.stopPropagation();onDelete(patient.id);}} style={{padding:"8px 12px",borderRadius:7,fontSize:11,border:"none",background:"#ef4444",color:"white",fontWeight:500}}>Emin misin?</button>
              }
            </div>

            {/* SEKRETER MODALI */}
            {showOutcome&&(
              <div onClick={e=>e.stopPropagation()} style={{borderTop:"1px solid #d4cabf",padding:"16px",background:"#ece7db"}}>
                <div style={{fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:"#b0a898",marginBottom:8}}>Randevu Sonucu — Hangi prosedürler planlandı?</div>
                <div style={{fontSize:11,color:"#8a7a68",marginBottom:10}}>Form prosedürü: <strong style={{color:"#1a1510"}}>{formProc}</strong></div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                  {ALL_PROCS.map(p=>{
                    const sel=outcomeProcedures.includes(p);
                    return(
                      <button key={p} onClick={()=>setOutcomeProcedures(prev=>sel?prev.filter(x=>x!==p):[...prev,p])}
                        style={{padding:"5px 11px",borderRadius:20,fontSize:10,border:`1px solid ${sel?"#1a1510":"#d4cabf"}`,background:sel?"#1a1510":"transparent",color:sel?"#f5f0e8":"#8a7a68",cursor:"pointer"}}>
                        {p}{p===formProc?" ✓":""}
                      </button>
                    );
                  })}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={saveOutcome} style={{padding:"9px 20px",background:"#1a1510",border:"none",borderRadius:7,color:"#f5f0e8",fontSize:11,fontWeight:500,cursor:"pointer"}}>Kaydet</button>
                  <button onClick={()=>setShowOutcome(false)} style={{padding:"9px 14px",background:"transparent",border:"1px solid #d4cabf",borderRadius:7,color:"#8a7a68",fontSize:11,cursor:"pointer"}}>İptal</button>
                </div>
              </div>
            )}

            {/* MARKA ELÇİSİ MODALI */}
            {showAmbassador&&(
              <div onClick={e=>e.stopPropagation()} style={{borderTop:"1px solid #ddd6fe",padding:"16px",background:"#faf5ff"}}>
                <div style={{fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:"#7c3aed",marginBottom:10}}>Marka Elçisi Paketi</div>
                <div style={{fontSize:12,color:"#5b21b6",marginBottom:12,lineHeight:1.6}}>
                  <strong>{a.name}</strong> marka elçisi profiline sahip. Referans kodu oluşturulacak ve hastaya iletilecek.
                </div>
                <div style={{background:"#ede9fe",border:"1px solid #ddd6fe",borderRadius:8,padding:"10px 12px",marginBottom:14}}>
                  <div style={{fontSize:10,color:"#7c3aed",marginBottom:5,fontWeight:500}}>Pakete dahil:</div>
                  <div style={{fontSize:11,color:"#5b21b6",lineHeight:1.7}}>✓ Kişisel referans kodu<br/>✓ Getirdiği her hasta için klinik avantajı<br/>✓ VIP konsültasyon önceliği</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={sendAmbassador} style={{padding:"9px 20px",background:"#7c3aed",border:"none",borderRadius:7,color:"white",fontSize:11,fontWeight:500,cursor:"pointer"}}>Kodu Oluştur ve Gönder</button>
                  <button onClick={()=>setShowAmbassador(false)} style={{padding:"9px 14px",background:"transparent",border:"1px solid #ddd6fe",borderRadius:7,color:"#7c3aed",fontSize:11,cursor:"pointer"}}>İptal</button>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

/* ─── VALUE SCREEN ───────────────────────────────────────────────────────── */
function ValueScreen({patients,doctor}){
  const total=patients.length;
  const crossSells=patients.filter(p=>p.outcome_procedures&&p.outcome_procedures.length>0&&p.outcome_procedures.some(x=>x!==(p.answers?.procedure||""))).length;
  const noAppt=patients.filter(p=>p.no_appointment).length;
  const ambassadors=patients.filter(p=>p.ambassador_code&&p.ambassador_code!=="").length;
  const avgProc=22000;
  const timeSaved=total*13;
  const C={border:"#d4cabf",muted:"#b0a898"};
  const cardS={background:"#ece7db",border:"1px solid #d4cabf",borderRadius:10,padding:"16px 20px"};
  return(
    <div style={{flex:1,overflowY:"auto",padding:"24px 32px"}}>
      <div style={{marginBottom:24}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:300,color:"#1a1510",letterSpacing:"-0.01em",marginBottom:4}}>SculptAI'ın <em>Katkısı</em></div>
        <div style={{fontSize:11,color:C.muted}}>Bu ay · {total} hasta · Piyasa ortalamalarına göre tahmini</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        {[
          {accent:"#059669",icon:"↗",title:"Cross-Sell",sub:"Ek prosedür randevusu",val:crossSells,unit:" hasta",note:`Tahmini +₺${Math.round(crossSells*avgProc*0.4/1000)}K`,color:"#059669"},
          {accent:"#4a1520",icon:"🛡",title:"Risk Filtresi",sub:"Randevu alınmadı",val:noAppt,unit:" hasta",note:"Revizyon riski önlendi",color:"#4a1520"},
          {accent:"#1a1510",icon:"⏱",title:"Zaman Tasarrufu",sub:"Toplam kazanılan",val:timeSaved,unit:" dk",note:`${total} konsültasyon × 13dk`,color:"#1a1510"},
        ].map((k,i)=>(
          <div key={i} style={{...cardS,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.accent}}/>
            <div style={{fontSize:16,marginBottom:8}}>{k.icon}</div>
            <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:C.muted,marginBottom:4,fontWeight:500}}>{k.title}</div>
            <div style={{fontSize:10,color:C.muted,marginBottom:10}}>{k.sub}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:38,fontWeight:300,color:k.color,lineHeight:1,letterSpacing:"-0.02em",marginBottom:2}}>{k.val}<span style={{fontSize:16}}>{k.unit}</span></div>
            <div style={{fontSize:10,fontWeight:500,color:k.color,marginTop:4}}>{k.note}</div>
          </div>
        ))}
      </div>
      {crossSells>0&&(
        <div style={{...cardS,marginBottom:12}}>
          <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:C.muted,marginBottom:12,fontWeight:500}}>Cross-Sell Detayı</div>
          {patients.filter(p=>p.outcome_procedures?.length>0&&p.outcome_procedures.some(x=>x!==(p.answers?.procedure||""))).slice(0,5).map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,paddingBottom:10,marginBottom:10,borderBottom:"1px solid #d4cabf"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:"#1a1510",flex:1}}>{p.answers?.name||"Hasta"}</div>
              <div style={{fontSize:10,color:C.muted,flex:1}}>{p.answers?.procedure} →</div>
              <div style={{fontSize:10,color:"#059669",flex:1}}>{p.outcome_procedures.filter(x=>x!==p.answers?.procedure).join(", ")}</div>
              <div style={{fontSize:12,color:"#059669",fontFamily:"'Cormorant Garamond',serif"}}>+₺{Math.round(avgProc*0.4/1000)}K tahmini</div>
            </div>
          ))}
        </div>
      )}
      <div style={cardS}>
        <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:C.muted,marginBottom:10,fontWeight:500}}>Marka Elçisi Programı</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[["Aktif Elçi",ambassadors],["Kod Gönderildi",patients.filter(p=>p.ambassador_sent).length],["Referansla Gelen",patients.filter(p=>p.answers?.referralCode).length]].map(([lbl,val])=>(
            <div key={lbl} style={{background:"#f5f0e8",borderRadius:8,padding:"12px 14px",textAlign:"center"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:"#7c3aed",lineHeight:1,marginBottom:3}}>{val}</div>
              <div style={{fontSize:9,color:C.muted}}>{lbl}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:10,padding:"9px 11px",background:"#f5f0e8",borderRadius:7,fontSize:10,color:C.muted,fontStyle:"italic"}}>Rakamlar piyasa ortalamalarına göre tahminidir.</div>
      </div>
    </div>
  );
}

/* ─── SETTINGS SCREEN ────────────────────────────────────────────────────── */
function SettingsScreen({doctor,onLogout,newU,setNewU,newP,setNewP,newP2,setNewP2,pwErr,setPwErr,saveNewCreds,confirmClear,setConfirmClear,clearAll}){
  const C={border:"#d4cabf",muted:"#b0a898"};
  const cardS={background:"#ece7db",border:"1px solid #d4cabf",borderRadius:10,padding:"18px 20px",marginBottom:12};
  return(
    <div style={{flex:1,overflowY:"auto",padding:"24px 32px",maxWidth:520}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:300,color:"#1a1510",marginBottom:24,letterSpacing:"-0.01em"}}>Ayarlar</div>
      <div style={cardS}>
        <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:C.muted,marginBottom:12,fontWeight:500}}>Klinik Bilgileri</div>
        {[["Doktor",doctor.name],["Kullanıcı Adı",doctor.username],["Klinik",doctor.clinic_name||"—"]].map(([lbl,val])=>(
          <div key={lbl} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #d4cabf"}}>
            <div style={{fontSize:11,color:C.muted}}>{lbl}</div>
            <div style={{fontSize:11,color:"#1a1510",fontWeight:500}}>{val}</div>
          </div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0"}}>
          <div style={{fontSize:11,color:C.muted}}>Form Linki</div>
          <button onClick={()=>navigator.clipboard?.writeText(`${window.location.origin}/form/${doctor.id}`)} style={{fontSize:10,color:"#4a1520",border:"none",background:"transparent",cursor:"pointer",textDecoration:"underline"}}>Kopyala</button>
        </div>
      </div>
      <div style={cardS}>
        <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:C.muted,marginBottom:12,fontWeight:500}}>Şifre Değiştir</div>
        {[["Yeni Kullanıcı Adı",newU,setNewU,"text"],["Yeni Şifre",newP,setNewP,"password"],["Şifre Tekrar",newP2,setNewP2,"password"]].map(([lbl,val,set,type])=>(
          <div key={lbl} style={{marginBottom:10}}>
            <div style={{fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:C.muted,marginBottom:5}}>{lbl}</div>
            <input type={type} value={val} onChange={e=>set(e.target.value)} style={{width:"100%",padding:"10px 12px",background:"#f5f0e8",border:"1px solid #d4cabf",borderRadius:7,fontSize:12,color:"#1a1510",outline:"none"}}/>
          </div>
        ))}
        {pwErr&&<div style={{fontSize:11,color:"#dc2626",marginBottom:8}}>{pwErr}</div>}
        <button onClick={saveNewCreds} style={{padding:"9px 20px",background:"#1a1510",border:"none",borderRadius:7,color:"#f5f0e8",fontSize:11,fontWeight:500,cursor:"pointer",letterSpacing:"0.05em"}}>Kaydet</button>
      </div>
      <div style={{...cardS,border:"1px solid #fecaca"}}>
        <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:"#dc2626",marginBottom:12,fontWeight:500}}>Tehlikeli Alan</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontSize:11,color:C.muted}}>Tüm hasta verilerini sil</div>
          {!confirmClear
            ?<button onClick={()=>setConfirmClear(true)} style={{padding:"7px 14px",border:"1px solid #fecaca",borderRadius:7,fontSize:11,color:"#dc2626",background:"transparent",cursor:"pointer"}}>Verileri Temizle</button>
            :<div style={{display:"flex",gap:8}}>
              <button onClick={clearAll} style={{padding:"7px 14px",background:"#dc2626",border:"none",borderRadius:7,fontSize:11,color:"white",cursor:"pointer",fontWeight:500}}>Evet, sil</button>
              <button onClick={()=>setConfirmClear(false)} style={{padding:"7px 14px",border:"1px solid #d4cabf",borderRadius:7,fontSize:11,color:C.muted,background:"transparent",cursor:"pointer"}}>İptal</button>
            </div>
          }
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:11,color:C.muted}}>Oturumu kapat</div>
          <button onClick={onLogout} style={{padding:"7px 14px",border:"1px solid #d4cabf",borderRadius:7,fontSize:11,color:C.muted,background:"transparent",cursor:"pointer"}}>Çıkış Yap</button>
        </div>
      </div>
    </div>
  );
}

/* ─── DOCTOR PANEL ───────────────────────────────────────────────────────── */
function Analytics({patients}){
  const total=patients.length;
  if(total===0) return(
    <div style={{textAlign:"center",padding:"60px 20px",color:"#b0a898"}}>
      <div style={{fontSize:40,marginBottom:14}}>📊</div>
      <div style={{fontSize:15,color:"#2a2018",marginBottom:8}}>Henüz veri yok</div>
      <div style={{fontSize:13}}>İlk hasta formu doldurulunca istatistikler burada görünecek</div>
    </div>
  );

  // Compute stats
  const red=patients.filter(p=>(p.risk_score||0)>=68).length;
  const amber=patients.filter(p=>{const s=p.risk_score||0;return s>=48&&s<68;}).length;
  const green=patients.filter(p=>{const s=p.risk_score||0;const a=p.answers||{};const amb=a.sharing==="Evet paylaşırım"&&a.recommends==="Evet, sık öneririm"&&a.socialMedia==="Sık paylaşırım"&&s<35;return !amb&&s<48;}).length;
  const amb=patients.filter(p=>{const s=p.risk_score||0;const a=p.answers||{};return a.sharing==="Evet paylaşırım"&&a.recommends==="Evet, sık öneririm"&&a.socialMedia==="Sık paylaşırım"&&s<35;}).length;
  const avgRisk=total?Math.round(patients.reduce((s,p)=>s+(p.risk_score||0),0)/total):0;
  const fitRate=total?Math.round((green+amb)/total*100):0;

  // Procedure counts
  const procMap={};
  patients.forEach(p=>{const pr=p.answers?.procedure||"Diğer";procMap[pr]=(procMap[pr]||0)+1;});
  const procs=Object.entries(procMap).sort((a,b)=>b[1]-a[1]).slice(0,6);

  // Source counts
  const srcMap={};
  patients.forEach(p=>{
    const s=p.answers?.source||"Diğer";
    const short=s.includes("tavsiye")?"Hasta tavsiyesi":s.includes("Hacettepe")?"Hacettepe itibarı":s.includes("Google")?"Google":s.includes("Instagram")?"Instagram":"Diğer";
    srcMap[short]=(srcMap[short]||0)+1;
  });
  const sources=Object.entries(srcMap).sort((a,b)=>b[1]-a[1]);

  // Weekly bins (last 7 days)
  const now=Date.now();
  const dayMs=86400000;
  const bins=Array(7).fill(0);
  patients.forEach(p=>{
    const d=now-(new Date(p.created_at||now).getTime());
    const idx=Math.floor(d/dayMs);
    if(idx>=0&&idx<7) bins[6-idx]++;
  });
  const maxBin=Math.max(...bins,1);

  // Auto insights
  const insights=[];
  if(fitRate>=70) insights.push({type:"green",title:"Uygun profil oranı yüksek",body:`Hastaların %${fitRate}'i uygun veya marka elçisi profilinde. Klinik hasta seçimi başarılı.`});
  if(red/total>0.2) insights.push({type:"warn",title:"Yüksek risk oranı dikkat çekiyor",body:`Hastaların %${Math.round(red/total*100)}'i dikkat gerektiriyor. Konsültasyon öncesi ek değerlendirme faydalı olabilir.`});
  if(amb>0) insights.push({type:"info",title:`${amb} marka elçisi adayı`,body:"Bu hastaları sadakat programına davet ederek organik büyümeye katkı sağlayabilirsiniz."});
  const topProc=procs[0];
  if(topProc&&topProc[1]/total>0.25) insights.push({type:"info",title:`${topProc[0]} en sık prosedür`,body:`Toplam hastaların %${Math.round(topProc[1]/total*100)}'i bu prosedür için başvuruyor.`});

  const days=["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];
  const today=new Date().getDay();
  const dayLabels=Array(7).fill(0).map((_,i)=>days[(today-6+i+7)%7]);

  const C={card:"#f5f0e8",border:"#f1f3f5",muted:"#b0a898",navy:"#1a1510"};
  const card=(extra={})=>({background:C.card,border:`1.5px solid ${C.border}`,borderRadius:12,padding:16,...extra});

  return(
    <div style={{padding:"20px 28px 24px",overflowY:"auto",flex:1}}>

      {/* KPI ROW */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:18}}>
        {[
          {val:total,lbl:"Toplam Hasta",color:"#1a1510",grad:"linear-gradient(90deg,#1a1510,#2a2018)",note:`Ort. risk: ${avgRisk}`},
          {val:fitRate+"%",lbl:"Uygun Profil Oranı",color:"#10b981",grad:"linear-gradient(90deg,#10b981,#2a2018)",note:`${green+amb} hasta`},
          {val:red,lbl:"Dikkat Gerektiren",color:"#ef4444",grad:"linear-gradient(90deg,#ef4444,#f97316)",note:`%${Math.round(red/total*100)} oranında`},
          {val:amb,lbl:"Marka Elçisi Adayı",color:"#8b5cf6",grad:"linear-gradient(90deg,#8b5cf6,#a78bfa)",note:"Referans potansiyeli"},
        ].map(k=>(
          <div key={k.lbl} style={{...card(),position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:k.grad}}/>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,lineHeight:1,marginBottom:3,color:k.color}}>{k.val}</div>
            <div style={{fontSize:10,color:C.muted,marginBottom:4}}>{k.lbl}</div>
            <div style={{fontSize:11,fontWeight:500,color:k.color}}>{k.note}</div>
          </div>
        ))}
      </div>

      {/* TREND + SEGMENT */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>

        {/* Weekly trend */}
        <div style={card()}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"#2a2018",marginBottom:12}}>Son 7 Gün</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:6,height:70,marginBottom:6}}>
            {bins.map((v,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{fontSize:9,color:C.muted,fontWeight:500}}>{v||""}</div>
                <div style={{width:"100%",borderRadius:4,background:v>0?"#1a1510":"#e0d9cc",height:`${Math.max(4,Math.round(v/maxBin*52))}px`,transition:"height 0.4s ease"}}/>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:6}}>
            {dayLabels.map((d,i)=><div key={i} style={{flex:1,textAlign:"center",fontSize:9,color:C.muted}}>{d}</div>)}
          </div>
        </div>

        {/* Segment dist */}
        <div style={card()}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"#2a2018",marginBottom:12}}>Segment Dağılımı</div>
          {[
            {label:"🟢 Uygun Görünüyor",count:green,color:"#10b981"},
            {label:"🟡 Değerlendirme",count:amber,color:"#f59e0b"},
            {label:"🔴 Dikkat",count:red,color:"#ef4444"},
            {label:"🌟 Marka Elçisi",count:amb,color:"#8b5cf6"},
          ].map(s=>(
            <div key={s.label} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
              <div style={{fontSize:11,color:"#2a2018",width:130,flexShrink:0}}>{s.label}</div>
              <div style={{flex:1,height:7,background:"#e0d9cc",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:4,background:s.color,width:`${total?Math.round(s.count/total*100):0}%`,transition:"width 0.8s ease"}}/>
              </div>
              <div style={{fontSize:11,fontWeight:600,color:s.color,minWidth:22,textAlign:"right"}}>{s.count}</div>
              <div style={{fontSize:10,color:C.muted,minWidth:28,textAlign:"right"}}>{total?Math.round(s.count/total*100):0}%</div>
            </div>
          ))}
          {/* Color bar */}
          <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",marginTop:8}}>
            {[{c:"#10b981",n:green},{c:"#f59e0b",n:amber},{c:"#ef4444",n:red},{c:"#8b5cf6",n:amb}].map((s,i)=>(
              <div key={i} style={{flex:s.n,background:s.c,minWidth:s.n?2:0}}/>
            ))}
          </div>
        </div>
      </div>

      {/* PROCS + INSIGHTS */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>

        {/* Procedures */}
        <div style={card()}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"#2a2018",marginBottom:12}}>En Sık Prosedürler</div>
          {procs.map(([name,count])=>(
            <div key={name} style={{display:"flex",alignItems:"center",gap:8,paddingBottom:7,borderBottom:"1px solid #ece7db",marginBottom:7}}>
              <div style={{flex:1,fontSize:12,color:"#2a2018",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{name}</div>
              <div style={{width:70,height:5,background:"#e0d9cc",borderRadius:3,overflow:"hidden",flexShrink:0}}>
                <div style={{height:"100%",borderRadius:3,background:"linear-gradient(90deg,#1a1510,#2a2018)",width:`${Math.round(count/procs[0][1]*100)}%`}}/>
              </div>
              <div style={{fontSize:12,fontWeight:600,color:C.navy,minWidth:20,textAlign:"right"}}>{count}</div>
              <div style={{fontSize:10,color:C.muted,minWidth:28,textAlign:"right"}}>{Math.round(count/total*100)}%</div>
            </div>
          ))}
        </div>

        {/* Auto insights */}
        <div style={card()}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"#2a2018",marginBottom:12}}>Sistem İçgörüleri</div>
          {insights.length===0&&<div style={{fontSize:12,color:C.muted}}>Daha fazla veri geldikçe içgörüler burada görünecek.</div>}
          {insights.map((ins,i)=>{
            const colors={green:{bg:"#f0fdf4",border:"#a7f3d0",title:"#065f46",body:"#047857"},warn:{bg:"#fffbeb",border:"#fde68a",title:"#92400e",body:"#b45309"},info:{bg:"#ece7db",border:"#d4cabf",title:"#1e40af",body:"#2563eb"}};
            const c=colors[ins.type]||colors.info;
            return(
              <div key={i} style={{background:c.bg,border:`1.5px solid ${c.border}`,borderRadius:10,padding:"10px 12px",marginBottom:8}}>
                <div style={{fontSize:12,fontWeight:600,color:c.title,marginBottom:3}}>{ins.title}</div>
                <div style={{fontSize:11,color:c.body,lineHeight:1.55}}>{ins.body}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SOURCE */}
      <div style={card()}>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"#2a2018",marginBottom:12}}>Hasta Kaynakları</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {sources.map(([src,cnt])=>(
            <div key={src} style={{background:"#ece7db",border:"1.5px solid #e0d9cc",borderRadius:10,padding:"10px 14px",textAlign:"center",minWidth:90}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:C.navy,lineHeight:1}}>{cnt}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:3}}>{src}</div>
              <div style={{fontSize:10,fontWeight:600,color:"#1a1510",marginTop:2}}>{Math.round(cnt/total*100)}%</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function DoctorPanel({doctor,onLogout}){
  const [patients,setPatients]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState("all");
  const [tab,setTab]=useState("patients"); // patients | analytics | value | settings
  const [isMobile,setIsMobile]=useState(window.innerWidth<768);
  const [mobileMenuOpen,setMobileMenuOpen]=useState(false);
  useEffect(()=>{
    const fn=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener("resize",fn);
    return()=>window.removeEventListener("resize",fn);
  },[]);
  const [showPw,setShowPw]=useState(false);
  const [newU,setNewU]=useState("");const [newP,setNewP]=useState("");const [newP2,setNewP2]=useState("");const [pwErr,setPwErr]=useState("");
  const [confirmClear,setConfirmClear]=useState(false);

  useEffect(()=>{loadPatients();},[]);

  async function loadPatients(){
    setLoading(true);
    const {data}=await sb.from("patients").select("*").eq("doctor_id",doctor.id).order("created_at",{ascending:false});
    if(data){
      const decrypted=await Promise.all(data.map(async p=>{
        if(p.answers?.name){
          const realName=await decryptName(p.answers.name,doctor.id);
          return{...p,answers:{...p.answers,name:realName}};
        }
        return p;
      }));
      setPatients(decrypted);
    }else{setPatients([]);}
    setLoading(false);
  }

  async function deletePatient(id){
    await sb.from("patients").delete().eq("id",id);
    setPatients(p=>p.filter(x=>x.id!==id));
  }

  async function clearAll(){
    await sb.from("patients").delete().eq("doctor_id",doctor.id);
    setPatients([]);setConfirmClear(false);
  }

  async function saveNewCreds(){
    if(!newU.trim()||!newP.trim()){setPwErr("Tüm alanları doldurun.");return;}
    if(newP!==newP2){setPwErr("Şifreler eşleşmiyor.");return;}
    await sb.from("doctors").update({username:newU.trim(),password_hash:newP}).eq("id",doctor.id);
    setShowPw(false);setNewU("");setNewP("");setNewP2("");setPwErr("");
  }

  const today=new Date().toLocaleDateString("tr-TR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const redCount=patients.filter(p=>p.risk_score>=68).length;
  const convRate=patients.length?Math.round((patients.filter(p=>p.risk_score<68).length/patients.length)*100):0;

  const displayed=filter==="all"?patients:patients.filter(p=>{
    const cls=classify(p.risk_score||0,p.answers||{});
    return cls.cat===filter;
  });
  const clinical=displayed.filter(p=>!classify(p.risk_score||0,p.answers||{}).ambassador);
  const ambassadors=displayed.filter(p=>classify(p.risk_score||0,p.answers||{}).ambassador);

  return(
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",height:"100vh",overflow:"hidden",fontFamily:"'Inter',sans-serif"}}>

      {/* DESKTOP: Sol sidebar / MOBİL: Alt nav */}
      {!isMobile&&<Sidebar tab={tab} setTab={setTab}/>}

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"#f5f0e8"}}>
        <div style={{padding:isMobile?"12px 16px":"14px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:"#f5f0e8",borderBottom:"1px solid #d4cabf"}} className="f1">
          {/* Logo + Karşılama */}
          <div style={{display:"flex",alignItems:"center",gap:isMobile?10:16}}>
            <div style={{display:"flex",alignItems:"center",gap:7,paddingRight:isMobile?10:16,borderRight:"1px solid #d4cabf"}}>
              <div style={{width:20,height:20,border:"1px solid #c8bfb0",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:6,height:6,background:"#1a1510",borderRadius:"50%"}}/>
              </div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:"#1a1510",fontWeight:400}}>SculptAI</div>
            </div>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?17:22,color:"#1a1510",fontWeight:300,letterSpacing:"-0.01em"}}>Günaydın, <em>Dr. {doctor.name.split(" ").slice(-1)[0]}</em></div>
              {!isMobile&&<div style={{fontSize:10,color:"#b0a898",marginTop:1,letterSpacing:"0.03em"}}>{today}</div>}
            </div>
          </div>
          {/* Sağ butonlar */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {!isMobile&&<button onClick={()=>setTab("settings")} style={{padding:"6px 13px",borderRadius:7,fontSize:11,border:"1px solid #d4cabf",background:"transparent",color:"#8a7a68",letterSpacing:"0.03em"}}>Ayarlar</button>}
            <div style={{width:32,height:32,borderRadius:"50%",background:"#1a1510",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:500,color:"#f5f0e8",letterSpacing:"0.04em"}}>{doctor.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>
          </div>
        </div>

        {/* TAB NAV — Desktop */}
        {!isMobile&&<div style={{display:"flex",gap:0,padding:"0 28px",background:"#f5f0e8",borderBottom:"1px solid #d4cabf",flexShrink:0}}>
          {[["patients","Hastalar"],["analytics","Analitik"]].map(([v,l])=>(
            <button key={v} onClick={()=>setTab(v)} style={{padding:"11px 18px",fontSize:11,fontWeight:500,letterSpacing:"0.06em",border:"none",background:"transparent",color:tab===v?"#1a1510":"#b0a898",borderBottom:tab===v?"1px solid #1a1510":"1px solid transparent",cursor:"pointer",transition:"all 0.15s",textTransform:"uppercase"}}>{l}</button>
          ))}
        </div>}

        {tab==="analytics"&&<Analytics patients={patients}/>}
        {tab==="value"&&<ValueScreen patients={patients} doctor={doctor}/>}
        {tab==="settings"&&<SettingsScreen doctor={doctor} onLogout={onLogout} showPw={showPw} setShowPw={setShowPw} newU={newU} setNewU={setNewU} newP={newP} setNewP={setNewP} newP2={newP2} setNewP2={setNewP2} pwErr={pwErr} setPwErr={setPwErr} saveNewCreds={saveNewCreds} confirmClear={confirmClear} setConfirmClear={setConfirmClear} clearAll={clearAll}/>}
        {tab==="patients"&&<div style={{flex:1,overflowY:"auto",padding:isMobile?"12px 12px 24px":"20px 28px 24px"}}>
          {showPw&&(
            <div style={{background:"#f5f0e8",border:"1px solid #e0d9cc",borderRadius:12,padding:"16px 20px",marginBottom:18,animation:"fadeUp 0.25s ease"}}>
              <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#2a2018",marginBottom:12}}>Giriş Bilgilerini Değiştir</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[["Yeni kullanıcı adı",newU,setNewU,"text"],["Yeni şifre",newP,setNewP,"password"],["Şifre tekrar",newP2,setNewP2,"password"]].map(([ph,val,set,type])=>(
                  <input key={ph} type={type} placeholder={ph} value={val} onChange={e=>set(e.target.value)} style={{flex:1,minWidth:130,padding:"9px 12px",background:"#ece7db",border:"1.5px solid #e0d9cc",borderRadius:9,color:"#1a1510",fontSize:13,outline:"none"}}/>
                ))}
                <button onClick={saveNewCreds} style={{padding:"9px 18px",background:"#1a1510",border:"none",borderRadius:9,color:"#f5f0e8",fontSize:13,fontWeight:600}}>Kaydet</button>
              </div>
              {pwErr&&<div style={{fontSize:12,color:"#ef4444",marginTop:8}}>{pwErr}</div>}
            </div>
          )}

          {/* KPI */}
          <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(3,1fr)":"repeat(3,1fr)",gap:isMobile?8:12,marginBottom:isMobile?16:24}} className="f2">
            {[
              {val:redCount,label:"Dikkat",note:"Riskli",color:"#dc2626",grad:"linear-gradient(90deg,#4a1520,#7a2535)"},
              {val:convRate+"%",label:"Uygun",note:"Profil",color:"#059669",grad:"linear-gradient(90deg,#059669,#0a6640)"},
              {val:patients.length,label:"Toplam",note:"Hasta",color:"#1a1510",grad:"linear-gradient(90deg,#1a1510,#2a2018)"},
            ].map(k=>(
              <div key={k.label} style={{background:"#f5f0e8",border:"1px solid #d4cabf",borderRadius:10,padding:isMobile?"12px 10px":"18px 20px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.grad}}/>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?28:36,lineHeight:1,marginBottom:3,color:k.color}}>{k.val}</div>
                <div style={{fontSize:isMobile?9:11,color:"#b0a898"}}>{k.label}</div>
                <div style={{fontSize:isMobile?9:10,fontWeight:500,color:k.color}}>{k.note}</div>
              </div>
            ))}
          </div>

          {/* LIST HEADER */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}} className="f3">
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#2a2018"}}>Hasta Listesi</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[["all","Tümü"],["red","🔴 Dikkat"],["amber","🟡 Değerlendirme"],["green","🟢 Uygun"],["ambassador","🌟 Elçi"]].map(([v,l])=>(
                <button key={v} onClick={()=>setFilter(v)} style={{padding:"5px 13px",borderRadius:20,fontSize:11,fontWeight:500,border:`1.5px solid ${filter===v?"#1a1510":"#e0d9cc"}`,background:filter===v?"#1a1510":"#f5f0e8",color:filter===v?"#f5f0e8":"#8a7a68",transition:"all 0.15s"}}>{l}</button>
              ))}
              <button onClick={()=>exportCSV(patients)} style={{padding:"5px 13px",borderRadius:20,fontSize:11,fontWeight:500,border:"1.5px solid #d4cabf",background:"#ece7db",color:"#2563eb"}}>📊 CSV</button>
              <button onClick={loadPatients} style={{padding:"5px 13px",borderRadius:20,fontSize:11,fontWeight:500,border:"1.5px solid #e0d9cc",background:"#f5f0e8",color:"#8a7a68"}}>↻ Yenile</button>
            </div>
          </div>

          {loading&&<div style={{textAlign:"center",padding:"40px",color:"#b0a898"}}>Yükleniyor...</div>}

          {!loading&&clinical.length===0&&ambassadors.length===0&&(
            <div style={{textAlign:"center",padding:"60px 20px",color:"#b0a898"}}>
              <div style={{fontSize:40,marginBottom:14}}>📋</div>
              <div style={{fontSize:15,color:"#2a2018",marginBottom:8}}>Henüz kayıt yok</div>
              <div style={{fontSize:13}}>Hastalar <strong>sculptai-brown.vercel.app/form/{doctor.id}</strong> linkinden formu doldurunca burada görünecek</div>
            </div>
          )}

          <div className="f4">{clinical.map(p=><PatientCard key={p.id} patient={p} onDelete={deletePatient}/>)}</div>

          {ambassadors.length>0&&(
            <div className="f5">
              <div style={{display:"flex",alignItems:"center",gap:10,margin:"18px 0 12px"}}>
                <div style={{flex:1,height:1,background:"#f1f3f5"}}/>
                <div style={{fontSize:10,color:"#a78bfa",background:"#faf5ff",padding:"2px 10px",borderRadius:10,border:"1px solid #ede9fe",letterSpacing:"0.08em",fontWeight:500}}>Ticari Fırsat</div>
                <div style={{flex:1,height:1,background:"#f1f3f5"}}/>
              </div>
              {ambassadors.map(p=><PatientCard key={p.id} patient={p} onDelete={deletePatient}/>)}
            </div>
          )}

          {patients.length>0&&(
            <div style={{marginTop:20,textAlign:"center"}}>
              {!confirmClear
                ?<button onClick={()=>setConfirmClear(true)} style={{padding:"6px 16px",background:"transparent",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,color:"rgba(239,68,68,0.5)",fontSize:11}}>Tüm kayıtları sil</button>
                :<div style={{display:"flex",gap:9,justifyContent:"center",alignItems:"center"}}>
                  <span style={{fontSize:12,color:"#ef4444"}}>Emin misiniz?</span>
                  <button onClick={clearAll} style={{padding:"6px 14px",background:"#ef4444",border:"none",borderRadius:8,color:"#f5f0e8",fontSize:12,fontWeight:600}}>Evet</button>
                  <button onClick={()=>setConfirmClear(false)} style={{padding:"6px 14px",background:"#f5f0e8",border:"1.5px solid #e0d9cc",borderRadius:8,color:"#8a7a68",fontSize:12}}>İptal</button>
                </div>
              }
            </div>
          )}
        </div>}

        {/* MOBİL — Alt Navigasyon */}
        {isMobile&&(
          <div style={{display:"flex",borderTop:"1px solid #d4cabf",background:"#f5f0e8",flexShrink:0}}>
            {[
              {id:"patients",label:"Hastalar",icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>},
              {id:"analytics",label:"Analitik",icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>},
              {id:"value",label:"Kazanç",icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>},
              {id:"settings",label:"Ayarlar",icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>},
            ].map(({id,label,icon})=>(
              <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"10px 0 8px",border:"none",background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",color:tab===id?"#4a1520":"#b0a898"}}>
                {icon}
                <span style={{fontSize:9,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:tab===id?500:400}}>{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── PATIENT FORM ───────────────────────────────────────────────────────── */
/* ─── KİŞİLİK PROFİLİ ───────────────────────────────────────────────────── */
function detectProfile(answers){
  const knowledge=answers.riskKnowledge||"";
  const motivation=answers.motivation||"";
  const sharing=answers.sharing||"";
  const recommends=answers.recommends||"";
  const patience=answers.patience||"";

  const isAnalyst=knowledge.includes("Detaylı")&&(motivation.includes("iyileştirmek")||motivation.includes("özgüven"));
  const isSocial=(sharing.includes("Sık")||sharing.includes("sık"))&&(recommends.includes("sık")||recommends.includes("Sık"));
  const isPragmatic=patience.includes("Hızlı")&&!knowledge.includes("Detaylı");
  const isTrustSeeker=knowledge.includes("Hiçbir")||knowledge.includes("Genel");

  if(isAnalyst) return "analyst";
  if(isSocial) return "social";
  if(isPragmatic) return "pragmatic";
  return "trustseeker";
}

const PROFILE_CONTENT={
  analyst:{
    welcome:"Araştırmanız bize de gösteriyor. Aşağıdaki bilgiler klinik verilerle desteklenmiştir — konsültasyonda detayları doktorunuzla birlikte değerlendirebilirsiniz.",
    recoveryIntro:"İyileşme süreci, kullanılan teknik ve yapısal faktörlere göre değişkenlik gösterir. Aşağıda aşama aşama ne bekleyebileceğinizi bulabilirsiniz.",
    riskIntro:"Her cerrahi girişimde görülme sıklığı istatistiksel olarak düşük olan riskler mevcuttur. Bunları bilmek, süreçte daha bilinçli kararlar almanızı sağlar.",
    ambassadorMsg:"Veriye dayalı bir karar aldınız. Çevrenizde benzer titizlikle araştırma yapan biri varsa, SculptAI değerlendirme formunu önererek doğru kanaldan başlamalarına yardımcı olabilirsiniz.",
    ambassadorCTA:"Araştırmacı birine önerin",
  },
  trustseeker:{
    welcome:"Bu kararı vermek cesaret ister. Sorularınız, endişeleriniz, hatta bilmediğinizi düşündüğünüz şeyler — konsültasyonun tam da bunlar için olduğunu bilmenizi isteriz.",
    recoveryIntro:"İyileşme süreci adım adım ilerler. Her aşamada ne hissedeceğinizi ve ne yapmanız gerektiğini önceden bilmek süreci çok kolaylaştırır.",
    riskIntro:"Her ameliyatta bazı beklenmedik durumlar yaşanabilir — ama bunların büyük çoğunluğu geçicidir ve tedavi edilebilir. Doktorunuz her adımda yanınızda olacak.",
    ambassadorMsg:"Çevrenizdeki biri bu kararı vermeye çalışıyorsa, deneyiminizi paylaşmak ona büyük destek olabilir. Referans kodunuzla gelen her kişi için size özel bir teşekkür hazırladık.",
    ambassadorCTA:"Desteğe ihtiyacı olana önerin",
  },
  social:{
    welcome:"Çevrenizde estetik kararlarda başvurulan biri olduğunuzu görüyoruz. Bu deneyimi yaşarken yakın çevrenizi de doğru yönlendirme fırsatınız olacak.",
    recoveryIntro:"Süreçte nasıl görüneceğinizi ve ne zaman sosyal hayata döneceğinizi merak ediyorsanız — aşağıdaki takvim tam size göre.",
    riskIntro:"Süreç hakkında çevrenizle konuşurken doğru bilgiye sahip olmak önemli. İşte bilmeniz ve paylaşabilmeniz gerekenler.",
    ambassadorMsg:"Marka Elçisi programımıza hoş geldiniz. Kodunuzu paylaştığınızda getirdiğiniz her hasta için VIP konsültasyon önceliği, özel kontrol muayenesi ve klinik avantajları kazanırsınız.",
    ambassadorCTA:"Özel avantajları görün",
  },
  pragmatic:{
    welcome:"Süreç net ve öngörülebilir. İşte bilmeniz gereken her şey — kısa ve öz.",
    recoveryIntro:"Takvim: ne zaman ne olur, ne zaman işe dönersiniz.",
    riskIntro:"Dikkat etmeniz gereken 3 durum:",
    ambassadorMsg:"Referans kodunuzu paylaşırsanız getirdiğiniz kişi başına avantaj kazanırsınız.",
    ambassadorCTA:"Hızlıca paylaşın",
  },
};

const PROCEDURE_RECOVERY={
  "Burun Estetiği":{
    analyst:{
      recovery:"Ameliyat 1,5-2 saat sürer. Postoperatif dönemde alçı kalıp ve nazal tampon uygulanır; tamponlar 24-48 saat içinde, alçı 7-14. günde çıkarılır. İlk 48 saatte supine pozisyondan kaçınılmalı, soğuk kompres ödemi minimize eder. 3. günden itibaren ekimoz geriler. Dorsal ödem 6-12 ay içinde tamamen çözülür; nihai sonuç için bu süreyi hesaba katmak gerekir.",
      risks:"Erken dönem: nazal sızıntı (ilk 24-48 saat normaldir), bulantı, tampon hissi (geçici). Geç dönem: %5-10 revizyon ihtimali (yapısal sınırlamalar nedeniyle), nadir solunum değişiklikleri. Enfeksiyon oranı antibiyotik profilaksisi ile belirgin şekilde düşüktür.",
    },
    trustseeker:{
      recovery:"Ameliyattan uyandığınızda burnunuzda alçı ve tampon olacak — bu çok normal. Tamponlar genellikle 1-2. günde alınır, rahatlamış hissedersiniz. İlk 3 gün en zor dönem ama ağrı kesicilerle geçer. 3. günden itibaren şişlik hızla azalmaya başlar, 1-2. haftada alçı çıkar ve burunun genel şeklini görmeye başlarsınız. Son halini görmek için sabırlı olun — 6 aya kadar sürebilir ama her hafta biraz daha iyi görünecek.",
      risks:"Bilmeniz gereken birkaç şey var ama hepsi yönetilebilir: İlk günlerde burundan hafif sızıntı olabilir — bu normal. Hapşırma hissi tampona bağlı, alınınca geçer. Nadiren ek dokunuş gerekebilir ama bu kötü bir sonuç değil, doktorunuzla konuşabileceğiniz bir durum.",
    },
    social:{
      recovery:"Sosyal hayata ne zaman dönersiniz: Alçı çıkınca (1-2. hafta) hafif makyajla dışarı çıkabilirsiniz. Morluklar büyük çoğunlukla 2. haftada geçer. 1. ayda %80 çevreniz fark etmez. Final sonuç 6. ayda — ve o an paylaşmak için doğru zaman.",
      risks:"İlk 2 haftada güneş gözlüğü takmamanız gerekiyor — bu önemli. 8 haftaya kadar vücut teması sporlarından kaçının. Bunlar dışında günlük hayatınıza neredeyse hemen dönebilirsiniz.",
    },
    pragmatic:{
      recovery:"Gün 1-2: alçı + tampon, evde dinlenme. Gün 3-7: morluklar azalır, hafif aktivite. Hafta 2: alçı çıkar, işe dönüş. Ay 1-3: sosyal hayat normal. Ay 6: final sonuç.",
      risks:"3 kritik kural: 8 hafta gözlük yok, 8 hafta güneş yok, 2 hafta spor yok. Gerisini doktorunuz yönetir.",
    },
  },
  "Karın Germe":{
    analyst:{
      recovery:"Abdominoplasti 2-5 saat sürer; genel anestezi uygulanır. Postoperatif dönemde dren sistemi 1-3 gün kalır, eriyemeyen dikişler 1-3. haftada alınır. V pozisyonu ödemi azaltır, emboli profilaksisi için bacak hareketleri kritiktir. 2-3 gece hastane yatışı sonrası 1 hafta ev istirahati önerilir. 6 hafta boyunca ağır fiziksel aktivite kısıtlanır; kesi izi 6. aydan sonra solmaya başlar, 2 yıla kadar gelişir.",
      risks:"En kritik risk: tromboemboli (pulmoner emboli). Profilaksi için antikoagülan ve varis çorabı uygulanır. Seroma oluşumu (%5-10) drenajla yönetilir. Kesi hattında gecikmiş iyileşme sigara kullanımıyla koreledir. Kalıcı hipoestezi nadir görülür.",
    },
    trustseeker:{
      recovery:"Ameliyat sonrası ilk gün en zorlu dönem ama yalnız değilsiniz — ağrı kesiciler ve gerekirse uyku ilaçları kullanılıyor. İlk kalkışta baş dönmesi normal, yavaşça kalkın. 3. günden itibaren hareketler kolaylaşır. 2. haftadan itibaren sosyal hayata dönebilirsiniz. Dikişler 1-3 haftada alınır. 6 hafta sonra neredeyse her şeyi yapabilirsiniz.",
      risks:"En önemli şey: bacaklarınızı hareket ettirmek. Bu kan pıhtısı oluşumunu önler — ekibiniz size bunu hatırlatacak ama siz de bilseniz iyi. Bunun dışında şişlik, hafif ağrı ve kesi hattında kaşıntı ilk aylarda normal — zamanla geçer.",
    },
    social:{
      recovery:"Ne zaman ne yapabilirsiniz: 2. haftada sosyal hayata dönüş, 4. haftada tam duş, 6. haftada spor. Kesi izi bikini çizgisi içinde kalacak şekilde planlanıyor. 6. aydan sonra iz belirgin şekilde solur.",
      risks:"İlk 6 hafta sauna ve solaryum yok — cildinizi korumak için. Sigara iyileşmeyi yavaşlatıyor, bu dönemde bırakmak çok önemli.",
    },
    pragmatic:{
      recovery:"Hastane: 2-3 gece. Ev istirahati: 1 hafta. Sosyal hayat: 2. haftada. Spor: 6. haftada. Dikişler: 1-3 haftada alınır.",
      risks:"Emboli için bacak hareketi şart. 6 hafta ağır iş yok, sauna yok, güneş yok.",
    },
  },
  "Liposuction":{
    analyst:{
      recovery:"Liposuction lokal/genel anestezi ile uygulanır; kompresyon giysi postoperatif kontür için kritiktir. İlk 48 saatte belirgin ödem beklenir; 3-6 ay içinde final kontur oluşur. Teknik seçimi (tumescent, VASER vb.) doktor tarafından kişiselleştirilir. Eğer cilt elastikiyeti yetersizse ek rezeksiyon gerekebilir.",
      risks:"Kontur düzensizliği, seroma, cilt duyusunda geçici değişiklik. Nadir: yağ embolisi (çok geniş alan + tek seans kombinasyonunda risk artar). Cilt kalitesi sonucu doğrudan etkiler.",
    },
    trustseeker:{
      recovery:"İlk 2-3 gün ödemli geçer, normal. Kompresyon giysiyi giymek önemli — şekillenmesine yardımcı oluyor. 2. haftadan itibaren günlük hayat normale döner. Son şeklini görmek için 3-6 ay bekleyin ama her ay biraz daha iyi görünecek.",
      risks:"Bölgede geçici uyuşukluk olabilir, zamanla geçer. Ciltte hafif düzensizlik nadiren olabilir. Bunlar doktorunuzla konuşabileceğiniz, yönetilebilir durumlar.",
    },
    social:{
      recovery:"2. haftada sosyal hayat, 4. haftada havuz. 3. ayda kontur netleşmeye başlar. 6. ayda paylaşmak için doğru zaman.",
      risks:"Kompresyon giysiyi aksatmayın — bu sonucu doğrudan etkiler. 6 hafta güneş ve sauna yok.",
    },
    pragmatic:{
      recovery:"İlk hafta: dinlenme. 2. hafta: iş. 3-6 ay: final kontur. Kompresyon giysi şart.",
      risks:"3 kural: Kompresyon giysi her gün, 6 hafta güneş yok, aşırı tuz yok (ödem yapar).",
    },
  },
};

// Diğer prosedürler için default profil içeriği
function getPersonalizedContent(proc,profile,section){
  const procData=PROCEDURE_RECOVERY[proc]?.[profile];
  if(procData&&procData[section]) return procData[section];
  const fallbacks={
    analyst:{
      recovery:`${proc} sonrası iyileşme süreci, kullanılan teknik ve bireysel faktörlere bağlı değişkenlik gösterir. Erken dönem ödem ve ekimoz beklenen bulgulardır; doktorunuz size özel takvimi konsültasyonda paylaşacaktır.`,
      risks:`${proc} ameliyatında komplikasyonlar ameliyat öncesi değerlendirmede kapsamlı biçimde ele alınacaktır. Kişisel risk profili sağlık durumunuza göre değerlendirilebilir.`,
    },
    trustseeker:{
      recovery:`${proc} ameliyatından sonra her adımda ne olacağını bilerek sürece gireceksiniz. İlk günler en zorlu dönem olabilir ama ağrı yönetimi ve ekibimizin desteğiyle rahat geçirilir. Şişlik zamanla azalır, kendinizi her geçen gün daha iyi hissedersiniz.`,
      risks:`${proc} sonrasında yaşanabilecek durumların büyük çoğunluğu geçici ve yönetilebilir. Bir şey fark ettiğinizde doktorunuzu aramaktan çekinmeyin — ekibimiz her adımda yanınızda.`,
    },
    social:{
      recovery:`${proc} sonrası sosyal hayata dönüş takvimi konsültasyonda netleşecek. Çevrenizin fark etmemeye başladığı an iyileşmenin büyük ölçüde tamamlandığının işaretidir.`,
      risks:`${proc} hakkında çevrenizle konuşurken doğru bilgiye sahip olmak önemli. Doktorunuz süreçle ilgili paylaşabileceğiniz güvenilir bilgileri sizinle paylaşacak.`,
    },
    pragmatic:{
      recovery:`${proc}: Konsültasyonda takvim net olarak paylaşılacak. Kritik kısıtlamalar ve işe dönüş süresi doktorunuz tarafından özetlenecek.`,
      risks:`Dikkat edilmesi gereken kritik noktalar konsültasyonda paylaşılacak. Gerisini doktorunuz yönetir.`,
    },
  };
  return fallbacks[profile]?.[section]||"";
}


const PROCEDURE_INFO = {
  "default":{category:"Estetik Cerrahi",desc:"Uzman ekibimiz size özel bir plan hazırlayacak.",stats:[{val:"Değişken",lbl:"Süre"},{val:"Değişken",lbl:"İyileşme"},{val:"6-12 ay",lbl:"Sonuç"}],process:"İşlem sonrası süreç prosedürünüze göre değişir. Doktorunuz konsültasyonda detayları sizinle paylaşacak.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"Ameliyat & Uyanış",desc:"Ekibimiz sizi süreç boyunca bilgilendirecek."},{time:"İlk hafta",emoji:"🌤",color:"#0891b2",title:"İyileşme başlar",desc:"Dinlenme ve doktor önerilerine uyum bu dönemde kritik."},{time:"6-12 ay",emoji:"✨",color:"#10b981",title:"Nihai sonuç",desc:"Son şekil zamanla ortaya çıkar."}],prep:["Ameliyat öncesi 6-8 saat aç kalmanız gerekecek","Kullandığınız tüm ilaçları doktorunuza bildirin","Sorularınızı konsültasyon için not edin"],normal:["İlk günlerde hafif şişlik ve ağrı olabilir","3. günden itibaren şişlik azalmaya başlar"],followup:"Kontrol randevularınız"},

  "Burun Estetiği":{category:"Estetik Cerrahi",desc:"Burunun boyutu ve şekli düzeltilerek hem görünüm hem de solunum sorunları giderilebilir.",stats:[{val:"1,5–2 saat",lbl:"Süre"},{val:"1–2 hafta",lbl:"İyileşme"},{val:"6–12 ay",lbl:"Sonuç"}],process:"Ameliyat sonrası burnunuzda alçı kalıp ve tampon bulunacak. Tamponlar 1–2. günde alınır. İlk 48 saatte soğuk uygulama şişliği azaltır. 3. günden itibaren şişlikler azalmaya başlar. 1–2 hafta sonra alçı kalıp alınır.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"Ameliyat & Uyanış",desc:"1,5–2 saatlik işlem. Burnunuzda alçı kalıp ve tampon olacak."},{time:"1–2. gün",emoji:"❄️",color:"#6d28d9",title:"Dinlenme & Soğuk Uygulama",desc:"2 saatte bir 15 dk. soğuk uygulama şişliği azaltır. Tamponlar bu dönemde alınır."},{time:"3–7. gün",emoji:"🌤",color:"#0891b2",title:"Morluklar Geçmeye Başlar",desc:"Şişlik ve morluklar hızla azalır. Günlük aktivitelere yavaşça dönülebilir."},{time:"1–2. hafta",emoji:"🩹",color:"#059669",title:"Alçı Alınır",desc:"Alçı kalıp alınır, ince bant ~1 hafta daha uygulanır. Burunun genel şekli görünür."},{time:"6–12. ay",emoji:"✨",color:"#10b981",title:"Nihai Sonuç",desc:"Burun son şeklini alır. Ameliyat öncesi/sonrası karşılaştırmaları yapılır."}],prep:["Ameliyat öncesi 6–8 saat aç kalmanız gerekecek","İlk 2 haftada vücut teması sporları ve gözlük kullanmayın","8 hafta boyunca sauna, solaryum ve güneş banyosundan kaçının","2. haftadan itibaren yüzme ve bireysel sporlar yapılabilir","Sorularınızı konsültasyon için not alın"],normal:["İlk günlerde hafif bulantı ve baş dönmesi olabilir","Burun deliğinden sızıntı ilk 24–48 saatte normaldir","Sabahları burun daha şiş olabilir, gün içinde azalır","Burun ucunda aylarca sürebilen hafif uyuşukluk olabilir"],followup:"1., 3., 6. ve 12. aylarda kontrol"},

  "Karın Germe":{category:"Vücut Şekillendirme",desc:"Orta ve alt karın bölgesindeki yağ ve sarkık derinin alınarak karın kaslarının gerilerek sağlamlaştırıldığı bir cerrahi girişimdir.",stats:[{val:"2–5 saat",lbl:"Süre"},{val:"2–3 gece",lbl:"Hastane"},{val:"6 hafta",lbl:"İyileşme"}],process:"Ameliyat sonrası V pozisyonunda yatmanız sağlanacak. Karın korsesi uygulanacak. İlk iki gün en zor dönem. 3. günden itibaren şişlik azalır. Drenler 1–3 günde alınır. 2. haftadan itibaren sosyal hayata dönüş.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"2–5 saat. Dren takılır, karın korsesi uygulanır."},{time:"1–2. gün",emoji:"💊",color:"#6d28d9",title:"En Yoğun Dönem",desc:"Ağrı kesici desteği. V pozisyonunda dinlenme. Bacak egzersizleri önemli."},{time:"3–7. gün",emoji:"🌤",color:"#0891b2",title:"Şişlik Azalır",desc:"Drenler alınır. Hareketler kolaylaşır. Sıvı gıdadan normale geçiş."},{time:"2–6. hafta",emoji:"🚶",color:"#059669",title:"Sosyal Hayata Dönüş",desc:"2. haftadan itibaren sosyal aktiviteler. 6 hafta ağır iş yasak."},{time:"6+ ay",emoji:"✨",color:"#10b981",title:"Nihai Sonuç",desc:"Kesi izi 6. aydan itibaren solmaya başlar. 2 yıla kadar iyileşir."}],prep:["Ameliyat öncesi 6–8 saat aç kalmanız gerekecek","Sigara içiyorsanız ameliyattan 2 hafta önce bırakın","E vitamini kullanıyorsanız bu dönemde ara verin","4 hafta boyunca havuz ve denize girmeyin","6 hafta sauna, solaryum ve güneş banyosundan kaçının"],normal:["İlk 2 gün vücut su toplar, hareketler zorlaşabilir","İlk kalkmada baş dönmesi olabilir — yavaş kalkın","Dikiş hattı ilk 3–4 ay kırmızı ve kaşıntılı olabilir","Göbek altı bölgesinde geçici uyuşukluk olabilir"],followup:"1., 3., 6. ve 12. aylarda kontrol"},

  "Üst Göz Kapağı Estetiği":{category:"Yüz Estetiği",desc:"Sarkık ve gevşek üst göz kapağı cildinin düzeltilerek daha genç ve dinç bir görünüm elde edilmesi.",stats:[{val:"Sedasyon",lbl:"Anestezi"},{val:"3–4. gün",lbl:"Bantlar Alınır"},{val:"6 hafta",lbl:"İyileşme"}],process:"İşlem sonrası göz kapağında bantlar olacak. Soğuk uygulama ilk gün saat başı 20 dk, 2. gün 2 saatte bir 20 dk yapılmalı. 3. günden şişlik azalır. 4. günde bantlar alınır.",timeline:[{time:"İşlem günü",emoji:"🏥",color:"#7c3aed",title:"İşlem & Uyanış",desc:"Sedasyon veya genel anestezi. Göz kapağında bantlar olacak. Eve aynı gün çıkılabilir."},{time:"1–2. gün",emoji:"❄️",color:"#6d28d9",title:"Soğuk Uygulama",desc:"Saat başı 20 dakika soğuk uygulama. Baş yüksek tutularak dinlenin."},{time:"3–4. gün",emoji:"🩹",color:"#0891b2",title:"Bantlar Alınır",desc:"Şişlik azalmaya başlar. 4. günde bantlar alınır. Göz çevresi yıkanabilir."},{time:"2–4. hafta",emoji:"🌤",color:"#059669",title:"Normalleşme",desc:"Morluklar geçer. Gözler açılmaya başlar. Hafif makyaj yapılabilir."},{time:"6+ hafta",emoji:"✨",color:"#10b981",title:"Nihai Görünüm",desc:"6 haftadan sonra son sonuç ortaya çıkar."}],prep:["İşlemden 5 saat önce yemek yemeyin, 4 saat önce sıvı almayın","İşlem sonrası 4 saat yatmayın ve yorucu aktivitelerden kaçının","Güneş gözlüğü kullanın","6 hafta boyunca sauna ve solaryumdan kaçının"],normal:["Göz çevresinde şişlik ve morluk ilk 2–3 gün artabilir","Sabahları gözler daha şişik olabilir, gün içinde azalır","İlk haftalarda rüzgar ve güneşe maruz kalınca gözde gerginlik hissedilebilir","Göz köşesinde hafif çekilme ilk hafta daha belirgin olabilir"],followup:"İşlem sonrası 15. günde kontrol"},

  "Alt Göz Kapağı Estetiği":{category:"Yüz Estetiği",desc:"Alt göz kapağındaki yağ birikimi ve sarkıklığın düzeltilerek daha dinç ve genç bir görünüm elde edilmesi.",stats:[{val:"Sedasyon",lbl:"Anestezi"},{val:"3–4. gün",lbl:"Bantlar Alınır"},{val:"6 hafta",lbl:"İyileşme"}],process:"Alt göz kapağı ameliyatı üst ile benzer süreç izler. İşlem sonrası soğuk uygulama ve dinlenme kritik. 3. günden itibaren şişlik azalır.",timeline:[{time:"İşlem günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Sedasyon altında yapılır. Eve aynı gün çıkılabilir."},{time:"1–3. gün",emoji:"❄️",color:"#6d28d9",title:"Soğuk Uygulama",desc:"Düzenli soğuk uygulama şişliği kontrol altında tutar."},{time:"4–7. gün",emoji:"🩹",color:"#0891b2",title:"Bantlar Alınır",desc:"Şişlik belirgin şekilde azalır. Günlük aktivitelere dönüş başlar."},{time:"6 hafta",emoji:"✨",color:"#10b981",title:"Nihai Görünüm",desc:"Son sonuç ortaya çıkar."}],prep:["İşlemden 5 saat önce yemek yemeyin","İşlem sonrası 4 saat yatmayın","6 hafta sauna ve solaryumdan kaçının","Güneş gözlüğü kullanın"],normal:["Şişlik ve morluk ilk 2–3 gün artabilir","Sabahları gözler daha şişik olabilir","İlk haftalarda göz çevresinde gerginlik hissedilebilir"],followup:"İşlem sonrası 15. günde kontrol"},

  "Botoks Uygulaması":{category:"Medikal Estetik",desc:"Mimik kaslarını geçici olarak gevşeterek kırışıklıkları azaltan, cerrahi gerektirmeyen hızlı bir uygulama.",stats:[{val:"10–15 dk",lbl:"Süre"},{val:"3–7 gün",lbl:"Etki Başlar"},{val:"3–4 ay",lbl:"Etki Süresi"}],process:"Uygulama sonrası hemen eve gidebilirsiniz. 4 saat mimiklerinizi kullanmayın ve yatmayın. Yüzünüzü yıkayabilir, makyaj yapabilirsiniz.",timeline:[{time:"Uygulama günü",emoji:"💉",color:"#7c3aed",title:"Uygulama",desc:"10–15 dakika. Ağrısız. Eve aynı gün çıkılır."},{time:"3–7. gün",emoji:"🌱",color:"#0891b2",title:"Etki Başlar",desc:"Kırışıklıklar azalmaya başlar. Mimik kasları yavaşça gevşer."},{time:"2–4 hafta",emoji:"✨",color:"#059669",title:"Tam Etki",desc:"Botoxun tam etkisi 2–4. haftada görülür."},{time:"3–4 ay",emoji:"🔄",color:"#d97706",title:"Tekrar Zamanı",desc:"Etki yavaşça azalır. Tekrarlanan uygulamalarla etki 12 aya kadar uzayabilir."}],prep:["Uygulamadan sonra 4 saat mimiklerinizi kullanmayın","Uygulamadan sonra 4 saat yatmayın","2 gün enjeksiyon bölgelerine masaj yapmayın","2 gün yoğun spor programlarına ara verin"],normal:["1–2 gün kızarıklık, morluk veya hafif şişlik olabilir","Uygulama sonrası ilk hafta hafif baş ağrısı hissedilebilir","Etki kişiye göre 3–7 gün içinde başlar"],followup:"Gerekirse 15 gün sonra kontrol"},

  "Dolgu Uygulaması":{category:"Medikal Estetik",desc:"Yüzün çeşitli bölgelerine hacim kazandırmak ve olukları doldurmak için uygulanan hyalüronik asit bazlı işlem.",stats:[{val:"15–30 dk",lbl:"Süre"},{val:"1–2 gün",lbl:"İyileşme"},{val:"6–18 ay",lbl:"Etki Süresi"}],process:"Uygulama sonrası soğuk uygulama şişliği azaltır. İlk 2 gün ödem bölgesi normalden şişik görünebilir. 4–5. günden itibaren hafif masaj yapılabilir.",timeline:[{time:"Uygulama günü",emoji:"💉",color:"#7c3aed",title:"Uygulama",desc:"Lokal anestezi kremi ile ağrısız. Eve aynı gün çıkılır."},{time:"1–3. gün",emoji:"❄️",color:"#0891b2",title:"Ödem Dönemi",desc:"Normalden biraz fazla şişlik beklenir, özellikle dudakta."},{time:"1–2 hafta",emoji:"✨",color:"#059669",title:"Nihai Görünüm",desc:"Ödem geçer, kalıcı sonuç ortaya çıkar."}],prep:["İşlem öncesi 10 gün kan sulandırıcılardan kaçının","Aşırı sıcak ve buhardan kaçının","Uygulamadan sonra masaj yapmayın"],normal:["İlk 2 gün ödem ve morluk olabilir","Dudak dolgusunda şişlik daha belirgin olabilir","Uygulama bölgesinde geçici gerginlik hissedilebilir"],followup:"Gerekirse 2 hafta sonra kontrol"},

  "Liposuction":{category:"Vücut Şekillendirme",desc:"Diyet ve egzersizle gidemeyen bölgesel yağ birikimlerinin vakumla alınarak vücudun şekillendirilmesi.",stats:[{val:"Değişken",lbl:"Süre"},{val:"2–3 gün",lbl:"Hastane"},{val:"3–6 ay",lbl:"Sonuç"}],process:"Ameliyat sonrası kompresyon giysi uygulanacak. İlk 48 saatte ödem yoğun. 3. günden haraketler kolaylaşır. Konturlar 3–6 ay içinde netleşir.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Kompresyon giysi uygulanır. Drenler takılabilir."},{time:"1–3. gün",emoji:"💊",color:"#6d28d9",title:"Yoğun Ödem",desc:"Vücut su toplar. Kompresyon giysiyi sürekli takın."},{time:"1–2. hafta",emoji:"🌤",color:"#0891b2",title:"İyileşme",desc:"Hareketler normalleşir. Sosyal hayata dönüş başlar."},{time:"3–6. ay",emoji:"✨",color:"#10b981",title:"Nihai Kontur",desc:"Vücut yeni şeklini alır. Son sonuç ortaya çıkar."}],prep:["Ameliyat öncesi 6–8 saat aç kalmanız gerekecek","Kompresyon giysi ameliyat sonrası sürekli kullanılacak","4 hafta havuz ve denizden kaçının","6 hafta sauna ve solaryumdan kaçının"],normal:["İlk 2–3 gün belirgin ödem ve morluk olabilir","Cilt yüzeyinde geçici düzensizlikler olabilir","Uyuşukluk veya hassasiyet hissi zamanla geçer"],followup:"1., 3. ve 6. aylarda kontrol"},

  "Meme Dikleştirme":{category:"Meme Estetiği",desc:"Sarkıklık gösteren memelerin yukarı taşınarak yeniden şekillendirilmesi, gerekirse protez eklenmesi.",stats:[{val:"2–4 saat",lbl:"Süre"},{val:"1–2 gece",lbl:"Hastane"},{val:"6 hafta",lbl:"İyileşme"}],process:"Ameliyat sonrası destek sütyeni kullanılacak. İlk birkaç gün kol hareketleri kısıtlanır. 3. günden şişlik azalır. Dikişler 10–14 günde alınır.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Genel anestezi. Destek sütyeni uygulanır."},{time:"1–3. gün",emoji:"💊",color:"#6d28d9",title:"Dinlenme",desc:"Kolları kullanmak kısıtlı. Ağrı kesici desteği."},{time:"1–2. hafta",emoji:"🩹",color:"#0891b2",title:"Dikişler Alınır",desc:"10–14. günde dikişler alınır. Hafif aktivitelere dönüş."},{time:"6 hafta+",emoji:"✨",color:"#10b981",title:"Nihai Görünüm",desc:"Şişlik tamamen geçer, son şekil ortaya çıkar."}],prep:["Ameliyat öncesi 6–8 saat aç kalmanız gerekecek","Destek sütyeni ameliyat sonrası sürekli takın","4 hafta havuzdan kaçının","6 hafta ağır kol egzersizlerinden kaçının"],normal:["Meme başı duyusunda geçici değişiklik olabilir","İlk günlerde meme bölgesinde sertlik ve şişlik normaldir","Kesi izleri ilk 3–4 ay daha belirgin olabilir"],followup:"1., 3. ve 6. aylarda kontrol"},

  "Meme Küçültme":{category:"Meme Estetiği",desc:"Büyük ve sarkık memelerin küçültülerek yeniden şekillendirilmesi, sırt ağrısı ve postür sorunlarını gidermesi.",stats:[{val:"2–4 saat",lbl:"Süre"},{val:"1–2 gece",lbl:"Hastane"},{val:"6 hafta",lbl:"İyileşme"}],process:"Ameliyat sonrası destek sütyeni kullanılacak. İlk birkaç gün kol hareketleri kısıtlanır. Dikişler 10–14 günde alınır. 2. haftadan itibaren sosyal hayata dönüş.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Genel anestezi. Destek sütyeni uygulanır."},{time:"1–2. hafta",emoji:"🩹",color:"#6d28d9",title:"Dikişler Alınır",desc:"Şişlik azalır. Kol hareketleri normalleşir."},{time:"6 hafta",emoji:"✨",color:"#10b981",title:"Nihai Görünüm",desc:"Yeni meme şekli oturur. İzler solmaya başlar."}],prep:["Ameliyat öncesi 6–8 saat aç kalın","Destek sütyeni sürekli takın","6 hafta ağır spor ve kol egzersizlerinden kaçının"],normal:["Meme başı duyusunda geçici değişiklik olabilir","Kesi izleri ilk aylarda belirgin olabilir","Hafif şişlik ve sertlik normaldir"],followup:"1., 3. ve 6. aylarda kontrol"},

  "Meme Büyütme (Silikon Protez ile)":{category:"Meme Estetiği",desc:"Silikon protez ile meme hacmini artırarak istenen dolgunluk ve şekle ulaşılması.",stats:[{val:"1–2 saat",lbl:"Süre"},{val:"1 gece",lbl:"Hastane"},{val:"3–6 ay",lbl:"Sonuç"}],process:"Ameliyat sonrası destek sütyeni kritik. İlk hafta kol hareketleri kısıtlı. 3. günden şişlik azalır. Protezler 3–6 ay içinde yerleşir.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Genel anestezi. Destek sütyeni takılır."},{time:"1–7. gün",emoji:"💊",color:"#6d28d9",title:"Dinlenme",desc:"Kollar yukarı kaldırmak yasak. Ağrı kesici desteği."},{time:"3–6. ay",emoji:"✨",color:"#10b981",title:"Protez Yerleşir",desc:"Protez doku ile bütünleşir, final şekil ortaya çıkar."}],prep:["Ameliyat öncesi 6–8 saat aç kalın","Destek sütyeni sürekli takın","İlk hafta kolları yukarı kaldırmayın"],normal:["İlk hafta sertlik ve gerginlik hissi normal","Protez bölgesinde geçici uyuşukluk olabilir","Şişlik 3–4 haftada belirgin azalır"],followup:"1., 3. ve 6. aylarda kontrol"},

  "Kol Germe":{category:"Vücut Şekillendirme",desc:"Kol arka ve iç kısmındaki sarkıklık ile yağ fazlalığının alınarak kolun yeniden şekillendirilmesi.",stats:[{val:"Genel Anestezi",lbl:"Anestezi"},{val:"10–14 gün",lbl:"Dikişler"},{val:"6 hafta",lbl:"İyileşme"}],process:"Ameliyat sonrası drenler 24–48 saat içinde alınır. 2–3 hafta günlük aktiviteler kısıtlanır. Dikişler 10–14. günde alınır. 2. haftadan itibaren sosyal hayata dönüş.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Koltukaltından kesi ile deri ve yağ dokusu çıkarılır. Dren takılır."},{time:"1–3. gün",emoji:"💊",color:"#6d28d9",title:"Dinlenme",desc:"Drenler alınır. Kol hareketleri kısıtlı."},{time:"1–2. hafta",emoji:"🩹",color:"#0891b2",title:"Dikişler Alınır",desc:"10–14. günde dikişler alınır. Şişlik azalır."},{time:"6 hafta",emoji:"✨",color:"#10b981",title:"İyileşme",desc:"Ağır kol egzersizlerine dönüş mümkün."}],prep:["Ameliyat öncesi 6–8 saat aç kalın","4 hafta havuz ve denizden kaçının","6 hafta ağır kol işlerinden kaçının","Sigara içiyorsanız ameliyat döneminde bırakın"],normal:["İlk 2 gün ödem belirgin olabilir","Kesi izi ilk 3–4 ay kırmızı ve kaşıntılı olabilir","Kolda geçici uyuşukluk hissedilebilir"],followup:"1., 3. ve 6. aylarda kontrol"},

  "Uyluk veya Kol germe":{category:"Vücut Şekillendirme",desc:"Uyluk veya kol bölgesindeki sarkıklık ve yağ fazlalığının ameliyatla düzeltilmesi.",stats:[{val:"Genel Anestezi",lbl:"Anestezi"},{val:"1–2 gece",lbl:"Hastane"},{val:"6 hafta",lbl:"İyileşme"}],process:"Ameliyat sonrası drenler 48–72 saat içinde alınır. 2–3 hafta günlük aktiviteler kısıtlanır. Dikişler 12–14. günde alınır.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Genel anestezi. Dren takılır."},{time:"1–3. gün",emoji:"💊",color:"#6d28d9",title:"Dinlenme",desc:"Drenler alınır. V pozisyonunda dinlenme."},{time:"1–2. hafta",emoji:"🩹",color:"#0891b2",title:"Dikişler Alınır",desc:"12–14. günde dikişler alınır."},{time:"6 hafta",emoji:"✨",color:"#10b981",title:"İyileşme",desc:"Ağır aktivitelere dönüş mümkün."}],prep:["Ameliyat öncesi 8 saat aç kalın","3–4 gün önceden yumuşak gıdalar alın","4 hafta havuz ve denizden kaçının","6 hafta sauna ve solaryumdan kaçının"],normal:["İlk 2 gün ödem belirgin","Dikiş hattı ilk aylarda kırmızı olabilir","Bölgede geçici uyuşukluk hissedilebilir"],followup:"1., 3. ve 6. aylarda kontrol"},

  "Kuşak Germe":{category:"Vücut Şekillendirme",desc:"Karın, bel, kalça ve kuyruk sokumu bölgelerinin tamamında sarkıklık ve yağ fazlalığının düzeltildiği kapsamlı bir ameliyat.",stats:[{val:"2–6 saat",lbl:"Süre"},{val:"1–5 gece",lbl:"Hastane"},{val:"6 hafta",lbl:"İyileşme"}],process:"Ameliyat sonrası karın korsesi uygulanacak. Çepeçevre kesi hattı var. İlk günler emboli riski nedeniyle bacak hareketleri önemli. 3. günden şişlik azalır.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"2–6 saat. Kapsamlı kesi. Korse uygulanır."},{time:"1–3. gün",emoji:"💊",color:"#6d28d9",title:"Yoğun Bakım",desc:"Bacak hareketleri çok önemli. V pozisyonunda dinlenme."},{time:"3–7. gün",emoji:"🌤",color:"#0891b2",title:"Şişlik Azalır",desc:"Drenler alınır. Hareketler kolaylaşır."},{time:"6 hafta",emoji:"✨",color:"#10b981",title:"İyileşme",desc:"Ağır sporlar ve aktivitelere dönüş mümkün."}],prep:["Sigara içiyorsanız 2 hafta önceden bırakın","E vitamini kullanıyorsanız ara verin","4 hafta havuz ve denizden kaçının","6 hafta ağır spor ve aktivitelerden kaçının"],normal:["İlk 2 gün yoğun ödem normaldir","İlk kalkışta baş dönmesi olabilir — yavaş kalkın","Kesi hattı ilk aylarda belirgin ve kaşıntılı olabilir","Bölgede geçici uyuşukluk hissedilebilir"],followup:"1., 3., 6. ve 12. aylarda kontrol"},

  "İple Askı Uygulaması":{category:"Yüz Gençleştirme",desc:"Yaşla sarkmış yüz dokularının özel iplerle normal anatomik konumlarına getirilmesi.",stats:[{val:"Sedasyon",lbl:"Anestezi"},{val:"Gündüz",lbl:"Hastane"},{val:"Değişken",lbl:"Sonuç Süresi"}],process:"İşlem sonrası hafif şişlik ve çekinti olabilir. Çoğu geçici. Masaj ile düzelir. Kalıcı değil, yıllar içinde tekrar gerekebilir.",timeline:[{time:"İşlem günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Sedasyon veya lokal anestezi. Eve aynı gün çıkılır."},{time:"1–2. hafta",emoji:"🌤",color:"#0891b2",title:"İlk Sonuç",desc:"Şişlik azalır. İplerin etkisi görülmeye başlar."},{time:"1–3 ay",emoji:"✨",color:"#10b981",title:"Nihai Görünüm",desc:"Son sonuç oturur. Doğal ve dinç görünüm."}],prep:["İşlem sonrası ilk gün sert yiyeceklerden kaçının","Aşırı mimik hareketlerinden kaçının","Masaj önerilerine uyun"],normal:["İşlem sonrası hafif çukurlar veya çentikler olabilir, geçer","Şakak bölgesinde hafif yanma hissi normaldir","İlk haftada yüzde hafif asimetri olabilir, düzelir"],followup:"1. ay ve 3. ay kontrolü"},

  "Yüz Germe":{category:"Yüz Gençleştirme",desc:"Yüz ve boyundaki sarkıklığın cerrahi olarak düzeltilmesi.",stats:[{val:"3–5 saat",lbl:"Süre"},{val:"1–2 gece",lbl:"Hastane"},{val:"2–4 hafta",lbl:"İyileşme"}],process:"Ameliyat sonrası bandajlar uygulanır. İlk hafta istirahat. 2. haftadan itibaren sosyal aktiviteler. Saç dipleri geçici olarak duyarsız olabilir.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Genel veya sedasyon anestezi. Bandajlar uygulanır."},{time:"1–7. gün",emoji:"💊",color:"#6d28d9",title:"Dinlenme",desc:"Baş yüksek tutulur. Şişlik ve morluk en yoğun dönem."},{time:"2–4. hafta",emoji:"🌤",color:"#0891b2",title:"Normalleşme",desc:"Şişlik ve morluklar geçer. Sosyal hayata dönüş."},{time:"3–6. ay",emoji:"✨",color:"#10b981",title:"Nihai Görünüm",desc:"Son sonuç oturur. Kesi izleri saç dibi ve kulak arkasında gizlenir."}],prep:["Ameliyat öncesi 6–8 saat aç kalın","Sigara içiyorsanız bırakın","6 hafta sauna ve solaryumdan kaçının"],normal:["Yüzde şişlik ve morluk ilk hafta belirgin","Saç diplerinde geçici uyuşukluk olabilir","Kulak çevresinde gerginlik hissi zamanla geçer"],followup:"1. ve 3. aylarda kontrol"},

  "Popo estetiği":{category:"Vücut Şekillendirme",desc:"Popo bölgesine yağ enjeksiyonu veya protez ile şekil ve hacim kazandırılması.",stats:[{val:"1–3 saat",lbl:"Süre"},{val:"1–2 gece",lbl:"Hastane"},{val:"3–6 ay",lbl:"Sonuç"}],process:"Ameliyat sonrası 2–4 hafta sırt üstü yatmaktan ve uzun süre oturmaktan kaçınılır. Kompresyon giysi önemli.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Genel anestezi. Kompresyon giysi uygulanır."},{time:"2–4. hafta",emoji:"💊",color:"#6d28d9",title:"Oturma Kısıtlı",desc:"Uzun süre oturmaktan ve sırt üstü yatmaktan kaçının."},{time:"3–6. ay",emoji:"✨",color:"#10b981",title:"Nihai Şekil",desc:"Yağ tutulumu stabil hale gelir, final şekil oturur."}],prep:["Ameliyat öncesi 6–8 saat aç kalın","Kompresyon giysiyi sürekli takın","2–4 hafta oturma aktivitelerini kısıtlayın"],normal:["İlk haftalarda oturma rahatsızlığı olabilir","Yağ enjeksiyonunun bir kısmı emilir, bu normal","Bölgede geçici sertlik ve hassasiyet olabilir"],followup:"1., 3. ve 6. aylarda kontrol"},

  "Jinekomasti":{category:"Erkek Estetiği",desc:"Erkeklerde meme bezi büyümesinin cerrahi veya liposuction ile düzeltilmesi.",stats:[{val:"1–2 saat",lbl:"Süre"},{val:"1 gece",lbl:"Hastane"},{val:"6 hafta",lbl:"İyileşme"}],process:"Ameliyat sonrası kompresyon giysi uygulanır. İlk hafta kol hareketleri kısıtlı. 3. günden şişlik azalır.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Genel veya sedasyon anestezi. Kompresyon giysi takılır."},{time:"1–7. gün",emoji:"💊",color:"#6d28d9",title:"Dinlenme",desc:"Kompresyon giysi sürekli. Kol hareketleri kısıtlı."},{time:"6 hafta",emoji:"✨",color:"#10b981",title:"İyileşme",desc:"Nihai sonuç oturur. Ağır spora dönüş mümkün."}],prep:["Ameliyat öncesi 6–8 saat aç kalın","Kompresyon giysiyi sürekli takın","6 hafta ağır koldan egzersizden kaçının"],normal:["İlk hafta şişlik ve hassasiyet normaldir","Meme başı çevresinde geçici uyuşukluk olabilir","Kesi izi meme başı çevresinde gizli kalır"],followup:"1., 3. ve 6. aylarda kontrol"},
};

function PatientForm({model,trainPct,doctorId}){
  const [currentQ,setCurrentQ]=useState(0);
  const [answers,setAnswers]=useState({});
  const [submitted,setSubmitted]=useState(false);
  const [doctorInfo,setDoctorInfo]=useState(null);
  const [ambassadorCode,setAmbassadorCode]=useState(null);
  const [patientSegment,setPatientSegment]=useState(null);
  const [personalGuide,setPersonalGuide]=useState(null);
  const [guideLoading,setGuideLoading]=useState(false);
  const [questionTimes,setQuestionTimes]=useState({});
  const [questionChanges,setQuestionChanges]=useState({});
  const qStartTime=useRef(Date.now());
  const q=QUESTIONS[currentQ];
  const canNext=(q?.optional||answers[q?.id]!==undefined&&answers[q?.id]!=="")&&
    !(q?.id==="referralCode"&&answers["source"]!=="Bir hasta beni yönlendirdi (referans kodu var)"&&!answers[q?.id])
    ||(q?.id==="referralCode");
  const progress=(currentQ/QUESTIONS.length)*100;
  const secIdx=SECTIONS.indexOf(q?.section);
  const accent=doctorInfo?.primary_color||"#1a1510";
  const C={bg:"#f5f0e8",accent:accent,navy:"#1a1510",muted:"#b0a898",border:"#e0d9cc"};

  useEffect(()=>{
    if(!doctorId) return;
    sb.from("doctors").select("id,name,clinic_name,photo_url,primary_color").eq("id",doctorId).single()
      .then(({data})=>{ if(data) setDoctorInfo(data); });
  },[doctorId]);

  async function handleSubmit(){
    const feats=extractFeatures(answers);
    const raw=model?model.forward(feats):0.5;
    const score=Math.round(raw*100);
    const cls=classify(score,answers);
    const ambCode=cls.ambassador?"REF-"+Math.random().toString(36).substr(2,4).toUpperCase():null;
    const timingData={questionTimes,questionChanges};
    const slowQuestions=Object.entries(questionTimes).filter(([,s])=>s>30).map(([id])=>id);
    const changedQuestions=Object.entries(questionChanges).filter(([,c])=>c>0).map(([id,c])=>`${id}(${c}x)`);

    // İsmi şifrele
    const encryptedName=await encryptName(answers.name||"",doctorId||"default");
    const safeAnswers={...answers,name:encryptedName};

    const rec={
      id:Date.now().toString(),
      doctor_id:doctorId,
      date:new Date().toISOString(),
      risk_score:score,
      segment:cls.label,
      color:cls.color,
      icon:cls.icon,
      answers:safeAnswers,
      ai_text:"",
      ai_loading:true,
      ambassador_code:ambCode||"",
      ambassador_sent:false,
      outcome_procedures:[],
      question_times:timingData,
    };
    await sb.from("patients").insert(rec);
    setSubmitted(true);
    setAmbassadorCode(ambCode);
    setPatientSegment(cls);
    fetchAI(answers,score,cls,rec.id,slowQuestions,changedQuestions);
    fetchPersonalGuide(answers,score,cls,slowQuestions,changedQuestions);
  }

  async function fetchPersonalGuide(a,score,cls,slowQ=[],changedQ=[]){
    setGuideLoading(true);
    const profile=detectProfile(a);
    const profileNames={analyst:"analitik ve araştırmacı",trustseeker:"güven arayan ve endişeli",social:"sosyal ve paylaşımcı",pragmatic:"pratik ve hızlı karar veren"};
    const toneInstructions={
      analyst:"Bilimsel ve teknik bir dil kullan. Spesifik süreler, yüzdeler ve mekanizmalar belirt. Klinik terminoloji kullan ama açıkla.",
      trustseeker:"Çok sıcak, güvence verici ve yargısız bir dil kullan. 'Normal', 'endişelenmeyin', 'yanınızdayız' ifadelerini kullan. Karmaşık terimlerden kaçın.",
      social:"Sosyal hayata dönüş, görünüm ve çevresiyle paylaşım odaklı yaz. Ne zaman dışarı çıkabileceğini, ne zaman fark edilmeyeceğini vurgula.",
      pragmatic:"Çok kısa, madde madde, net. Sayılar ve tarihler kullan. Gereksiz açıklama yapma.",
    };
    try{
      setGuideLoading(true);
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        model:"claude-sonnet-4-20250514",
        max_tokens:800,
        messages:[{role:"user",content:`Sen empati yeteneği çok yüksek, klinik deneyimli bir hasta koordinatörüsün. Hacettepe Üniversitesi Plastik Cerrahi Kliniği'nde çalışıyorsun.

Aşağıdaki kişi formu doldurdu ve şu an teşekkür ekranını okuyor. Bu kişiye özel, sadece ona yazılmış gibi hissettiren bir rehber yaz.

KİŞİ HAKKINDA BİLDİKLERİN:
- ${a.name||"Hasta"}, ${a.age} yaş, ${a.gender}
- İstediği işlem: ${a.procedure}
- Ek bölge ilgisi: ${a.otherAreas||"belirtmedi"}
- Başka işlem düşünmüş mü: ${a.otherConsidered||"belirtmedi"}
- Motivasyon: ${a.motivation}
- Beklenti: ${a.expectation}
- Hayal ettiği: ${a.imagineAfter||"belirtmedi"}
- En kötü ihtimal: ${a.worstCase||"belirtmedi"}
- Süreci ne kadar biliyor: ${a.riskKnowledge}
- Sabır: ${a.patience}
- Sosyal destek: ${a.support}
- Revizyon tutumu: ${a.revision}
- Önceki işlem: ${a.prevSurgery}
- Benlik saygısı: ${a.selfEsteem||"belirtmedi"}
- Kaçınma davranışı: ${a.avoidance||"belirtmedi"}
- Uzun düşündüğü sorular: ${slowQ.length>0?slowQ.join(", "):"yok"}
- Cevap değiştirdiği: ${changedQ.length>0?changedQ.join(", "):"yok"}
- Sabah aynaya bakış: "${a.openStory||"boş bıraktı"}"
- Risk segmenti: ${cls.cat} (${cls.label})

SEGMENT'E GÖRE ODAK:
${cls.cat==="ambassador"?"Bu kişi marka elçisi adayı — düşük risk, pozitif profil. Güven ver, konsültasyona heyecanla gitsin. Referans programından bahset.":""}
${cls.cat==="green"?"Bu kişi randevuya hazır ama henüz net karar vermemiş olabilir. 'Doğru adımı atıyorsunuz' mesajı ver. Randevuyu somutlaştır.":""}
${cls.cat==="amber"?"Bu kişi kararsız ya da bazı endişeleri var. Güvence ver, endişelerini normalize et, ama gerçekçi ol.":""}
${cls.cat==="red"?"Bu kişide yüksek risk var. Sakin, güven verici ama beklenti yönetici bir ton. Performatif heyecan yok.":""}

${(a.otherAreas&&a.otherAreas!=="Hayır, sadece bu bölge")||(a.otherConsidered&&a.otherConsidered!=="Hayır")?`CROSS-SELL FIRSATI: Bu kişi ${a.procedure} dışında da ilgi gösterdi (${a.otherAreas||""} / ${a.otherConsidered||""}). [Size Özel Tavsiye] bölümünde doktorla bu konuyu konuşmaya nazikçe teşvik et — "konsültasyonda bunu da sorabilirsiniz" gibi. Satış gibi değil, bilgilendirme gibi.`:""}

FORMAT — tam olarak bu 3 başlık:
[Sizi Bekleyen Süreç]
[Dikkat Etmeniz Gerekenler]
[Size Özel Tavsiye]

Her bölüm 2-3 cümle, akıcı paragraf. Toplam 180-220 kelime.
Profil etiketi kullanma. O kişiyle konuşur gibi yaz. Klişelerden kaçın.
Türkçe yaz.`}]
      })});
      const d=await res.json();
      const txt=d.content?.map(b=>b.text||"").join("")||"";
      setPersonalGuide(txt);
    }catch{
      setPersonalGuide(null);
    }
    setGuideLoading(false);
  }

  async function fetchAI(a,score,cls,recId,slowQ=[],changedQ=[]){
    try{
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,messages:[{role:"user",content:`Bir plastik cerrahın konsültasyon asistanısın. Aşağıdaki hasta hakkında doktora kısa, içten ve kullanışlı bir ön not yazacaksın.

TON: Meslektaşına not bırakır gibi — yargılamayan, ego incitmeyen, "bence şuna dikkat edebilirsin" tarzında. Doktoru küçümsemeden, ama gerçeği söyle.

HASTA:
${a.name||"Hasta"}, ${a.age} yaş · ${a.procedure}

FORM CEVAPLARI:
· Motivasyon: ${a.motivation}
· Beklenti: ${a.expectation}
· Ne zamandır düşünüyor: ${a.decisionAge||"belirtmedi"}
· Sosyal destek: ${a.support}
· Kaç doktora danıştı: ${a.multiDoctor}
· Önceki işlem: ${a.prevSurgery}
· Revizyon tutumu: ${a.revision}
· Sabır: ${a.patience}
· Benlik saygısı: ${a.selfEsteem||"belirtmedi"}
· Gelecek bakışı: ${a.futureOptimism||"belirtmedi"}
· Bölgeyle meşguliyet: ${a.bodyFocus||"belirtmedi"}
· Sosyal kaçınma: ${a.avoidance||"belirtmedi"}
· Hayal ettiği: ${a.imagineAfter||"belirtmedi"}
· En kötü ihtimal tutumu: ${a.worstCase||"belirtmedi"}
· ML risk skoru: ${score}/100

FORM DAVRANIŞI:
· Uzun düşündüğü sorular: ${slowQ.length>0?slowQ.join(", "):"yok"}
· Cevap değiştirdiği sorular: ${changedQ.length>0?changedQ.join(", "):"yok"}
· Sabah aynaya bakış (kendi sözleriyle): "${a.openStory||"boş bıraktı"}"

YAZIM KURALLARI:
- Tam olarak 3 kısa paragraf yaz, başlık yok, liste yok
- Her paragraf 2-3 cümle, toplam 120-150 kelime
- İlk paragraf: Bu kişiyi bir cümlede tanımla — ne arıyor, ne hissediyor, ne taşıyor
- İkinci paragraf: Konsültasyonda dikkat edilmesi gereken 1-2 spesifik nokta — "motivasyon sorusunda çok düşündü" veya "aynaya bakmaktan bahsetti" gibi form verisinden somut bağlantı kur
- Üçüncü paragraf: Tek bir pratik öneri — nasıl başlayabilirsin, neyi sormak işe yarayabilir
- Hasta ismi kullan, soyut konuşma
- "Belki", "düşünülebilir", "fark edilebilir" gibi yumuşak ifadeler kullan — direktif değil, öneri
- Türkçe yaz`}]})});
      const d=await res.json();
      const txt=d.content?.map(b=>b.text||"").join("\n")||"Analiz mevcut değil.";
      await sb.from("patients").update({ai_text:txt,ai_loading:false}).eq("id",recId);
    }catch{
      await sb.from("patients").update({ai_text:"Sistem gözlemi şu an kullanılamıyor.",ai_loading:false}).eq("id",recId);
    }
  }

  const proc=answers.procedure||"";
  const PI=PROCEDURE_INFO[proc]||PROCEDURE_INFO["default"];
  const profile=detectProfile(answers);
  const PC=PROFILE_CONTENT[profile];
  const recoveryText=getPersonalizedContent(proc,profile,"recovery");
  const riskText=getPersonalizedContent(proc,profile,"risks");
  const [infoPage,setInfoPage]=useState(0); // 0=thanks+proc, 1=prep+normal

  const BORD="#4a1520";
  const BORD2="#8a3040";

  if(submitted) return(
    <div style={{minHeight:"100vh",background:"#f5f0e8",fontFamily:"'Inter',sans-serif",display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#f5f0e8",borderBottom:"1px solid #d4cabf",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <div style={{width:18,height:18,border:"1px solid #c8bfb0",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{width:5,height:5,background:BORD,borderRadius:"50%"}}/>
          </div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:"#1a1510",letterSpacing:"0.02em"}}>SculptAI</div>
        </div>
        <div style={{fontSize:9,color:"#b0a898",letterSpacing:"0.06em"}}>{doctorInfo?.name||""}</div>
      </div>

      {/* Scrollable content */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 18px 4px"}}>

        {infoPage===0&&(<>
          {/* HERO */}
          <div style={{background:BORD,borderRadius:16,padding:"22px 20px",marginBottom:16,marginTop:14,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",bottom:-40,right:-40,width:140,height:140,borderRadius:"50%",background:"rgba(245,240,232,0.03)"}}/>
            <div style={{width:34,height:34,borderRadius:"50%",border:"1px solid rgba(245,240,232,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(245,240,232,0.5)",fontSize:13,marginBottom:14}}>✓</div>
            <div style={{fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(245,240,232,0.28)",marginBottom:8}}>Değerlendirme tamamlandı</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:"#f5f0e8",lineHeight:1.15,marginBottom:8,letterSpacing:"-0.01em"}}>Teşekkürler,<br/><em>iyi ki geldiniz.</em></div>
            <div style={{fontSize:11,color:"rgba(245,240,232,0.35)",lineHeight:1.7}}>Bilgileriniz alındı. Aşağıda size özel rehber ve prosedür bilgileri.</div>
          </div>

          {/* MARKA ELÇİSİ */}
          {ambassadorCode&&(
            <div style={{background:BORD,borderRadius:14,padding:"18px 16px",marginBottom:16,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"rgba(245,240,232,0.04)"}}/>

              {/* Header */}
              <div style={{fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",color:"rgba(245,240,232,0.28)",marginBottom:8}}>Marka Elçisi Programı</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:300,color:"#f5f0e8",lineHeight:1.2,marginBottom:8,letterSpacing:"-0.01em"}}>Sizi aramızda<br/><em>görmekten mutluluk.</em></div>
              <div style={{fontSize:10,color:"rgba(245,240,232,0.42)",lineHeight:1.7,marginBottom:14}}>{PC.ambassadorMsg}</div>

              {/* Kod + butonlar */}
              <div style={{background:"rgba(245,240,232,0.07)",border:"1px solid rgba(245,240,232,0.1)",borderRadius:9,padding:"11px 13px",marginBottom:8}}>
                <div style={{fontSize:8,color:"rgba(245,240,232,0.3)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:3}}>Referans Kodunuz</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:"#f5f0e8",letterSpacing:"0.1em",fontWeight:300}}>{ambassadorCode}</div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                <button onClick={()=>{
                  const msg=`Merhaba! Hacettepe Üniversitesi Plastik Cerrahi'de çok iyi bir deneyim yaşadım. Seni de yönlendirmek istedim — formu doldurursan doktor seni çok daha hazırlıklı karşılıyor. İşte bağlantı: ${window.location.origin}/form/${doctorInfo?.id||""}%0AReferans kodum: ${ambassadorCode}`;
                  window.open(`https://wa.me/?text=${msg}`,"_blank");
                }} style={{padding:"10px",background:"#25D366",border:"none",borderRadius:8,color:"white",fontSize:10,fontWeight:500,cursor:"pointer",fontFamily:"'Inter',sans-serif",letterSpacing:"0.04em",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.528 5.845L0 24l6.335-1.508A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.853 0-3.601-.5-5.112-1.374l-.366-.217-3.76.896.951-3.666-.239-.379A9.946 9.946 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  WhatsApp'ta Paylaş
                </button>
                <button onClick={()=>{
                  navigator.clipboard?.writeText(`${window.location.origin}/form/${doctorInfo?.id||""} — Referans: ${ambassadorCode}`);
                }} style={{padding:"10px",background:"rgba(245,240,232,0.08)",border:"1px solid rgba(245,240,232,0.15)",borderRadius:8,fontSize:10,color:"rgba(245,240,232,0.7)",cursor:"pointer",fontFamily:"'Inter',sans-serif",letterSpacing:"0.04em"}}>
                  Linki Kopyala
                </button>
              </div>
            </div>
          )}

          {/* KİŞİSEL REHBER */}
          <div style={{fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",color:"#b0a898",fontWeight:500,margin:"0 0 8px 0"}}>Size Özel Rehber</div>
          {guideLoading&&(
            <div style={{background:"#ece7db",border:"1px solid #d4cabf",borderRadius:12,padding:"20px 16px",marginBottom:10,textAlign:"center"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"#b0a898",fontStyle:"italic",animation:"pulse 1.5s infinite"}}>Kişisel rehberiniz hazırlanıyor...</div>
              <div style={{fontSize:10,color:"#d4cabf",marginTop:6}}>Yapay zeka form cevaplarınızı analiz ediyor</div>
            </div>
          )}
          {personalGuide&&!guideLoading&&(()=>{
            const sections=personalGuide.split(/\[([^\]]+)\]/).filter(s=>s.trim());
            const parsed=[];
            for(let i=0;i<sections.length;i+=2){
              if(sections[i+1]) parsed.push({title:sections[i],body:sections[i+1].trim()});
            }
            return(
              <div style={{border:"1px solid #d4cabf",borderRadius:12,overflow:"hidden",marginBottom:12}}>
                {parsed.map((s,i)=>(
                  <div key={i} style={{padding:"13px 15px",borderBottom:i<parsed.length-1?"1px solid #ece7db":"none"}}>
                    <div style={{fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",color:BORD2,fontWeight:500,marginBottom:5}}>{s.title}</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontWeight:300,color:"#1a1510",lineHeight:1.8}}>{s.body}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          <div style={{fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",color:"#b0a898",fontWeight:500,margin:"14px 0 8px 0"}}>Seçtiğiniz Prosedür</div>
          <div style={{border:"1px solid #d4cabf",borderRadius:12,padding:15,marginBottom:12}}>
            <div style={{fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",color:BORD2,marginBottom:5}}>◈ {PI.category}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,fontWeight:300,color:"#1a1510",marginBottom:6,letterSpacing:"-0.01em"}}>{proc||"İşlem"}</div>
            <div style={{fontSize:10,color:"#8a7a68",lineHeight:1.65,marginBottom:11}}>{PI.desc}</div>
            <div style={{display:"flex",gap:5}}>
              {PI.stats.map((s,i)=>(
                <div key={i} style={{flex:1,background:"#ece7db",borderRadius:7,padding:"8px 5px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:"#1a1510",lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:7,color:"#b0a898",marginTop:3,letterSpacing:"0.08em",textTransform:"uppercase"}}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sonraki adım */}
          <div style={{fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",color:"#b0a898",fontWeight:500,margin:"0 0 8px 0"}}>Sonraki Adım</div>
          <div style={{border:"1px solid #d4cabf",borderRadius:12,padding:"13px 15px",display:"flex",alignItems:"center",gap:11,marginBottom:12}}>
            <div style={{width:30,height:30,background:"#ece7db",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>📅</div>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:"#1a1510",marginBottom:1}}>Konsültasyon randevusu</div>
              <div style={{fontSize:10,color:"#b0a898",lineHeight:1.4}}>{doctorInfo?.name||"Doktorunuz"} ekibi sizinle iletişime geçecek.</div>
            </div>
          </div>
        </>)}

        {infoPage===1&&(<>
          {/* Kişiselleştirilmiş giriş — EN ÜSTTE */}
          <div style={{background:"linear-gradient(135deg,#ece7db,#e8e3d8)",border:"1px solid #d4cabf",borderRadius:10,padding:"14px 16px",marginBottom:14}}>
            <div style={{fontSize:9,letterSpacing:"0.15em",textTransform:"uppercase",color:"#b0a898",marginBottom:6,fontWeight:500}}>Size özel not</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:300,color:"#1a1510",lineHeight:1.75,fontStyle:"italic"}}>{PC.recoveryIntro}</div>
          </div>

          {/* Recovery timeline */}
          <div style={{fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",color:"#b0a898",fontWeight:600,margin:"4px 0 10px 2px"}}>İyileşme takvimi</div>
          <div style={{position:"relative",paddingLeft:16,marginBottom:14}}>
            <div style={{position:"absolute",left:4,top:8,bottom:8,width:1,background:"linear-gradient(180deg,"+BORD+",rgba(74,21,32,0.08))"}}/>
            {PI.timeline.map((t,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,paddingBottom:10}}>
                <div style={{width:9,height:9,borderRadius:"50%",flexShrink:0,marginTop:4,position:"relative",left:-16,marginRight:-6,border:"1.5px solid #f5f0e8",background:BORD,opacity:1-i*0.18,zIndex:1}}/>
                <div style={{flex:1,border:"1px solid #d4cabf",borderRadius:9,padding:"9px 11px"}}>
                  <div style={{fontSize:7,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:600,color:BORD2,marginBottom:2,opacity:1-i*0.15}}>{t.time}</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:"#1a1510",marginBottom:1}}>{t.title}</div>
                  <div style={{fontSize:9,color:"#8a7a68",lineHeight:1.55}}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Prep tips */}
          {/* Kişiselleştirilmiş giriş */}
          <div style={{background:"#ece7db",border:"1px solid #d4cabf",borderRadius:10,padding:"12px 14px",marginBottom:14}}>
            <div style={{fontSize:11,color:"#2a2018",lineHeight:1.7,fontStyle:"italic"}}>{PC.recoveryIntro}</div>
          </div>

          <div style={{fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",color:"#b0a898",fontWeight:600,margin:"0 0 8px 2px"}}>İşlem öncesi hazırlık</div>
          <div style={{background:"#f5f0e8",border:"1.5px solid #e0d9cc",borderRadius:12,marginBottom:10,overflow:"hidden"}}>
            <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10,background:"#f0fdf4"}}>
              <div style={{fontSize:20}}>🌿</div>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:"#065f46"}}>Bilmeniz gerekenler</div>
                <div style={{fontSize:10,color:"#6ee7b7",marginTop:1}}>Hacettepe Plastik Cerrahi önerileri</div>
              </div>
            </div>
            <div style={{padding:"10px 14px 12px",display:"flex",flexDirection:"column",gap:7,borderTop:"1px solid #ece7db"}}>
              {PI.prep.map((p,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:9,fontSize:11,color:"#2a2018",lineHeight:1.55}}>
                  <div style={{width:16,height:16,borderRadius:4,background:"#ecfdf5",border:"1.5px solid #6ee7b7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#059669",flexShrink:0,marginTop:1}}>✓</div>
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* Kişiselleştirilmiş İyileşme */}
          {recoveryText&&(
            <>
              <div style={{fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",color:"#b0a898",fontWeight:600,margin:"0 0 8px 2px"}}>İyileşme süreci</div>
              <div style={{background:"#f5f0e8",border:"1.5px solid #e0d9cc",borderRadius:12,padding:"14px 16px",marginBottom:10}}>
                <div style={{fontSize:11,color:"#2a2018",lineHeight:1.8}}>{recoveryText}</div>
              </div>
            </>
          )}

          {/* Kişiselleştirilmiş Riskler */}
          {riskText&&(
            <>
              <div style={{fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",color:"#b0a898",fontWeight:500,margin:"0 0 8px 0"}}>Bilinmesi Gerekenler</div>
              <div style={{borderLeft:"1.5px solid "+BORD2,padding:"10px 12px",marginBottom:8}}>
                <div style={{fontSize:11,fontWeight:500,color:"#1a1510",marginBottom:2}}>{PC.riskIntro}</div>
                <div style={{fontSize:10,color:"#8a7a68",lineHeight:1.65}}>{riskText}</div>
              </div>
            </>
          )}

          {/* Normal */}
          {PI.normal&&PI.normal.length>0&&(
            <>
              <div style={{fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",color:"#b0a898",fontWeight:500,margin:"8px 0 8px 0"}}>Bunlar Normaldir</div>
              {PI.normal.map((n,i)=>(
                <div key={i} style={{borderLeft:"1.5px solid #d4cabf",padding:"8px 12px",marginBottom:6}}>
                  <div style={{fontSize:10,color:"#8a7a68",lineHeight:1.6}}>{n}</div>
                </div>
              ))}
            </>
          )}

          {/* Disclaimer */}
          <div style={{padding:"9px 11px",background:"#ece7db",borderRadius:8,fontSize:9,color:"#b0a898",lineHeight:1.6,fontStyle:"italic",marginBottom:10}}>
            Son karar her zaman hekiminize aittir. Bu bilgiler yalnızca ön bilgilendirme amaçlıdır.
          </div>
        </>)}

      </div>

      {/* Bottom CTA */}
      <div style={{padding:"10px 22px 22px",flexShrink:0,background:"#f5f0e8",borderTop:"1px solid #d4cabf"}}>
        {infoPage===0
          ?<button onClick={()=>setInfoPage(1)} style={{width:"100%",padding:13,background:BORD,border:"none",borderRadius:9,color:"#f5f0e8",fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"'Inter',sans-serif",letterSpacing:"0.08em"}}>Hazırlık bilgilerini gör →</button>
          :<button onClick={()=>{setSubmitted(false);setAnswers({});setCurrentQ(0);setInfoPage(0);}} style={{width:"100%",padding:13,background:BORD,border:"none",borderRadius:9,color:"#f5f0e8",fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"'Inter',sans-serif",letterSpacing:"0.08em"}}>Anladım, teşekkürler</button>
        }
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Inter',sans-serif",color:C.navy}}>
      {/* Hero grid — sadece ilk soru (karşılama) */}
      {currentQ===0&&(
        <div style={{width:"100%",height:280,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:2,position:"relative",overflow:"hidden",flexShrink:0}}>
          {["hero.png","hero2.png","hero3.png","hero4.png"].map((src,i)=>(
            <div key={i} style={{position:"relative",overflow:"hidden"}}>
              <img src={`/${src}`} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 15%"}}
                onError={e=>{e.target.parentElement.style.background="#ece7db"}}/>
            </div>
          ))}
          {/* Gradient overlay */}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, rgba(245,240,232,0) 20%, rgba(245,240,232,1) 100%)"}}/>
          {/* Logo üstte */}
          <div style={{position:"absolute",top:16,left:20,display:"flex",alignItems:"center",gap:7}}>
            <div style={{width:20,height:20,border:"1px solid rgba(255,255,255,0.7)",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(245,240,232,0.25)"}}>
              <div style={{width:6,height:6,background:"white",borderRadius:"50%"}}/>
            </div>
            <div style={{fontSize:12,fontWeight:500,color:"white",letterSpacing:"0.04em",textShadow:"0 1px 6px rgba(0,0,0,0.3)"}}>SculptAI</div>
          </div>
        </div>
      )}

      {/* Normal header — sadece soru ekranlarında */}
      {currentQ>0&&(
        <header style={{background:"#f5f0e8",borderBottom:`1px solid ${C.border}`,padding:"16px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:20,height:20,border:"1px solid #c8bfb0",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:6,height:6,background:"#1a1510",borderRadius:"50%"}}/>
            </div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:C.navy,letterSpacing:"-0.01em"}}>SculptAI</div>
          </div>
          {!model&&<div style={{fontSize:11,color:C.muted}}>Model yükleniyor %{trainPct}...</div>}
        </header>
      )}

      <main style={{maxWidth:580,margin:"0 auto",padding:currentQ===0?"0 20px 36px":"36px 20px"}}>
        {currentQ===0&&(
          <div style={{textAlign:"center",marginBottom:32,paddingTop:8}} className="f1">
            {doctorInfo?.photo_url&&<img src={doctorInfo.photo_url} alt={doctorInfo.name} style={{width:72,height:72,borderRadius:"50%",objectFit:"cover",margin:"0 auto 12px",display:"block",border:`3px solid ${accent}`}}/>}
            <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"5px 18px",border:`1px solid ${accent}33`,borderRadius:24,fontSize:10,letterSpacing:"0.22em",color:accent,marginBottom:18,textTransform:"uppercase",background:`${accent}11`}}>✦ {doctorInfo?.clinic_name||"Plastik Cerrahi Kliniği"}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:46,color:C.navy,marginBottom:12,fontWeight:300,lineHeight:1.1,letterSpacing:"-0.01em"}}>Hoş Geldiniz</div>
            <div style={{fontSize:14,color:C.muted,lineHeight:1.85,maxWidth:420,margin:"0 auto",marginBottom:6}}>Bu kısa form, size en doğru ve güvenli planlama yapabilmemiz için beklentilerinizi anlamamıza yardımcı olur.</div>
            {doctorInfo?.name&&<div style={{fontSize:13,color:accent,fontWeight:500}}>Dr. görüşmesi: {doctorInfo.name}</div>}
          </div>
        )}
        <div style={{display:"flex",gap:5,marginBottom:20,flexWrap:"wrap"}} className="f2">
          {SECTIONS.map((sec,i)=>(
            <div key={sec} style={{padding:"3px 11px",borderRadius:20,fontSize:9,letterSpacing:"0.13em",textTransform:"uppercase",background:i===secIdx?"#ece7db":"transparent",border:`1.5px solid ${i===secIdx?C.accent:C.border}`,color:i===secIdx?C.accent:C.muted,transition:"all 0.3s"}}>{sec}</div>
          ))}
        </div>
        <div style={{marginBottom:22}} className="f2">
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:10,color:C.muted}}>SORU {currentQ+1} / {QUESTIONS.length}</span>
            <span style={{fontSize:10,color:C.accent,fontWeight:500}}>%{Math.round(progress)}</span>
          </div>
          <div style={{height:1,background:C.border,borderRadius:1}}>
            <div style={{height:"100%",width:`${progress}%`,background:`linear-gradient(90deg,${accent},${accent}cc)`,borderRadius:2,transition:"width 0.4s ease"}}/>
          </div>
        </div>
        <div style={{background:"#f5f0e8",border:`1.5px solid ${C.border}`,borderRadius:14,padding:"24px 22px",marginBottom:14}} className="f3">
          <div style={{fontSize:9,color:"#b0a898",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:9,fontWeight:400}}>{q.section}</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:300,color:C.navy,marginBottom:20,lineHeight:1.35,letterSpacing:"-0.01em"}}>{q.label}</div>
          {q.type==="text"&&<input type="text" placeholder={q.placeholder} value={answers[q.id]||""} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.value}))} style={{width:"100%",padding:"12px 14px",background:"#ece7db",border:`1.5px solid ${C.border}`,borderRadius:10,color:C.navy,fontSize:14,outline:"none"}}/>}
          {q.type==="number"&&<input type="number" placeholder={q.placeholder} value={answers[q.id]||""} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.value}))} style={{width:"100%",padding:"12px 14px",background:"#ece7db",border:`1.5px solid ${C.border}`,borderRadius:10,color:C.navy,fontSize:14,outline:"none"}}/>}
          {q.type==="radio"&&(
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {q.options.map(opt=>{
                const sel=answers[q.id]===opt;
                return(<button key={opt} onClick={()=>{
                  if(answers[q.id]&&answers[q.id]!==opt){
                    setQuestionChanges(p=>({...p,[q.id]:(p[q.id]||0)+1}));
                  }
                  setAnswers(p=>({...p,[q.id]:opt}));
                }} style={{padding:"12px 14px",background:sel?"#ece7db":"#ece7db",border:`1.5px solid ${sel?C.accent:C.border}`,borderRadius:10,color:sel?C.accent:"#2a2018",fontSize:13,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:11,transition:"all 0.15s"}}>
                  <div style={{width:15,height:15,borderRadius:"50%",border:`2px solid ${sel?C.accent:C.muted}`,background:sel?C.accent:"transparent",flexShrink:0,transition:"all 0.15s"}}/>
                  {opt}
                </button>);
              })}
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:9}} className="f3">
          {currentQ>0&&<button onClick={()=>{
            const elapsed=Math.round((Date.now()-qStartTime.current)/1000);
            setQuestionTimes(p=>({...p,[QUESTIONS[currentQ].id]:elapsed}));
            qStartTime.current=Date.now();
            setCurrentQ(c=>c-1);
          }} style={{flex:1,padding:"13px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,fontSize:12,cursor:"pointer"}}>← Geri</button>}
          <button onClick={()=>{
            const elapsed=Math.round((Date.now()-qStartTime.current)/1000);
            setQuestionTimes(p=>({...p,[QUESTIONS[currentQ].id]:elapsed}));
            qStartTime.current=Date.now();
            if(currentQ<QUESTIONS.length-1)setCurrentQ(c=>c+1);else if(model)handleSubmit();
          }} disabled={!canNext||(!model&&currentQ===QUESTIONS.length-1)}
            style={{flex:2,padding:"13px",background:canNext?"#1a1510":"#e0d9cc",border:"none",borderRadius:8,color:canNext?"#f5f0e8":"#b0a898",fontSize:12,fontWeight:500,letterSpacing:"0.08em",cursor:canNext?"pointer":"not-allowed",transition:"all 0.2s",fontFamily:"'Inter',sans-serif"}}>
            {currentQ===QUESTIONS.length-1?(model?"Formu Gönder →":"Model yükleniyor..."):"Devam →"}
          </button>
        </div>
      </main>
    </div>
  );
}

/* ─── ADMIN PANEL ────────────────────────────────────────────────────────── */
function AdminPanel(){
  const ADMIN_PASS="sculpt_admin_2024";
  const [authed,setAuthed]=useState(false);
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [doctors,setDoctors]=useState([]);
  const [patients,setPatients]=useState([]);
  const [loading,setLoading]=useState(false);

  async function login(){
    if(pass===ADMIN_PASS){setAuthed(true);loadData();}
    else setErr("Hatalı şifre.");
  }

  async function loadData(){
    setLoading(true);
    const [{data:docs},{data:pats}]=await Promise.all([
      sb.from("doctors").select("id,name,username,clinic_name"),
      sb.from("patients").select("id,doctor_id,created_at,risk_score,segment,outcome_procedures,no_appointment,ambassador_code,ambassador_sent,answers"),
    ]);
    setDoctors(docs||[]);
    setPatients(pats||[]);
    setLoading(false);
  }

  const C={border:"#d4cabf",muted:"#b0a898",bord:"#4a1520",ivory:"#f5f0e8",ivory2:"#ece7db"};

  if(!authed) return(
    <div style={{minHeight:"100vh",background:C.ivory,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit',sans-serif"}}>
      <div style={{width:360,background:C.ivory2,border:`1px solid ${C.border}`,borderRadius:12,padding:"32px 28px"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,color:"#1a1510",marginBottom:4}}>Admin Paneli</div>
        <div style={{fontSize:11,color:C.muted,marginBottom:24}}>SculptAI · Sadece sistem yöneticisi</div>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Şifre" style={{width:"100%",padding:"11px 13px",background:C.ivory,border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,outline:"none",marginBottom:10,fontFamily:"'Outfit',sans-serif"}}/>
        {err&&<div style={{fontSize:11,color:"#dc2626",marginBottom:8}}>{err}</div>}
        <button onClick={login} style={{width:"100%",padding:"11px",background:"#1a1510",border:"none",borderRadius:7,color:C.ivory,fontSize:11,fontWeight:500,cursor:"pointer",letterSpacing:"0.06em"}}>GİRİŞ</button>
      </div>
    </div>
  );

  // Klinik bazlı istatistikler
  const stats=doctors.map(doc=>{
    const dp=patients.filter(p=>p.doctor_id===doc.id);
    const reports=dp.length;
    const critical=dp.filter(p=>(p.risk_score||0)>=72).length;
    const noAppt=dp.filter(p=>p.no_appointment).length;
    const crossSell=dp.filter(p=>p.outcome_procedures?.length>0&&p.outcome_procedures.some(x=>x!==(p.answers?.procedure||""))).length;
    const ambassadors=dp.filter(p=>p.ambassador_code&&p.ambassador_code!=="").length;
    const refs=dp.filter(p=>p.answers?.referralCode).length;
    const lastActive=dp.length>0?new Date(Math.max(...dp.map(p=>new Date(p.created_at)))).toLocaleDateString("tr-TR",{day:"numeric",month:"short"}):"-";
    return{...doc,reports,critical,noAppt,crossSell,ambassadors,refs,lastActive};
  });

  const total={
    reports:patients.length,
    critical:patients.filter(p=>(p.risk_score||0)>=72).length,
    noAppt:patients.filter(p=>p.no_appointment).length,
    crossSell:patients.filter(p=>p.outcome_procedures?.length>0&&p.outcome_procedures.some(x=>x!==(p.answers?.procedure||""))).length,
    ambassadors:patients.filter(p=>p.ambassador_code&&p.ambassador_code!=="").length,
    refs:patients.filter(p=>p.answers?.referralCode).length,
  };

  const cardS={background:C.ivory2,border:`1px solid ${C.border}`,borderRadius:9,padding:"14px 18px"};

  return(
    <div style={{minHeight:"100vh",background:C.ivory,fontFamily:"'Outfit',sans-serif",padding:"32px"}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:28}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:300,color:"#1a1510",letterSpacing:"-0.02em"}}>SculptAI <em>Admin</em></div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{doctors.length} klinik · {patients.length} toplam rapor</div>
          </div>
          <button onClick={loadData} style={{padding:"7px 16px",border:`1px solid ${C.border}`,borderRadius:7,background:"transparent",fontSize:11,color:C.muted,cursor:"pointer"}}>↻ Yenile</button>
        </div>

        {/* Genel KPI */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:24}}>
          {[
            {lbl:"Toplam Rapor",val:total.reports,color:"#1a1510"},
            {lbl:"Kritik Hasta",val:total.critical,color:C.bord},
            {lbl:"Randevu Yok",val:total.noAppt,color:"#dc2626"},
            {lbl:"Cross-sell",val:total.crossSell,color:"#059669"},
            {lbl:"Marka Elçisi",val:total.ambassadors,color:"#7c3aed"},
            {lbl:"Referansla Gelen",val:total.refs,color:"#0891b2"},
          ].map((k,i)=>(
            <div key={i} style={{...cardS,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.color}}/>
              <div style={{fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:C.muted,marginBottom:6,fontWeight:500}}>{k.lbl}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:300,color:k.color,lineHeight:1}}>{k.val}</div>
            </div>
          ))}
        </div>

        {/* Klinik tablosu */}
        <div style={{...cardS,padding:0,overflow:"hidden"}}>
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:C.muted,fontWeight:500}}>Klinik Bazlı İstatistikler</div>
            <div style={{fontSize:9,color:C.muted}}>Rapor başı ücret: 1 rapor = {patients.length} fatura kalemi</div>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:C.ivory2}}>
                {["Klinik","Doktor","Toplam Rapor","Kritik","Randevu Yok","Cross-sell","Elçi","Referans","Son Aktivite"].map(h=>(
                  <th key={h} style={{padding:"10px 16px",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,fontWeight:500,textAlign:"left",borderBottom:`1px solid ${C.border}`}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map((s,i)=>(
                <tr key={s.id} style={{borderBottom:i<stats.length-1?`1px solid ${C.border}`:"none",background:i%2===0?"transparent":C.ivory2}}>
                  <td style={{padding:"11px 16px",fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#1a1510"}}>{s.clinic_name||"—"}</td>
                  <td style={{padding:"11px 16px",fontSize:11,color:C.muted}}>{s.name}</td>
                  <td style={{padding:"11px 16px",fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"#1a1510",fontWeight:400}}>{s.reports}</td>
                  <td style={{padding:"11px 16px"}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:s.critical>0?"#fef2f2":"transparent",color:s.critical>0?"#991b1b":C.muted,border:s.critical>0?"1px solid #fecaca":"none"}}>{s.critical}</span></td>
                  <td style={{padding:"11px 16px",fontSize:11,color:s.noAppt>0?"#dc2626":C.muted,fontWeight:s.noAppt>0?500:400}}>{s.noAppt}</td>
                  <td style={{padding:"11px 16px",fontSize:11,color:s.crossSell>0?"#059669":C.muted,fontWeight:s.crossSell>0?500:400}}>{s.crossSell}</td>
                  <td style={{padding:"11px 16px",fontSize:11,color:s.ambassadors>0?"#7c3aed":C.muted}}>{s.ambassadors}</td>
                  <td style={{padding:"11px 16px",fontSize:11,color:s.refs>0?"#0891b2":C.muted}}>{s.refs}</td>
                  <td style={{padding:"11px 16px",fontSize:10,color:C.muted}}>{s.lastActive}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{background:"#1a1510"}}>
                <td colSpan={2} style={{padding:"11px 16px",fontSize:10,fontWeight:500,color:"rgba(245,240,232,0.5)",letterSpacing:"0.06em",textTransform:"uppercase"}}>TOPLAM</td>
                <td style={{padding:"11px 16px",fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"#f5f0e8",fontWeight:300}}>{total.reports}</td>
                <td style={{padding:"11px 16px",fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"#f5f0e8"}}>{total.critical}</td>
                <td style={{padding:"11px 16px",fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"#f5f0e8"}}>{total.noAppt}</td>
                <td style={{padding:"11px 16px",fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"#f5f0e8"}}>{total.crossSell}</td>
                <td style={{padding:"11px 16px",fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"#f5f0e8"}}>{total.ambassadors}</td>
                <td style={{padding:"11px 16px",fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"#f5f0e8"}}>{total.refs}</td>
                <td style={{padding:"11px 16px"}}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Fatura notu */}
        <div style={{marginTop:16,padding:"12px 16px",background:C.ivory2,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11,color:C.muted,lineHeight:1.7}}>
          <strong style={{color:"#1a1510"}}>Fatura hesabı:</strong> Toplam rapor sayısı = fatura kalemi. Rapor başı ücret modelinde bu ayın toplam tutarı: <strong style={{color:"#1a1510"}}>{patients.length} rapor × birim fiyat</strong>.
          Cross-sell ve referans verileri değer kanıtı için kullanılabilir.
        </div>

      </div>
    </div>
  );
}

/* ─── LOGIN ──────────────────────────────────────────────────────────────── */
function Login({onLogin}){
  const [u,setU]=useState("");const [p,setP]=useState("");const [err,setErr]=useState("");const [loading,setLoading]=useState(false);
  async function attempt(){
    setLoading(true);setErr("");
    const {data}=await sb.from("doctors").select("*").eq("username",u).eq("password_hash",p).single();
    if(data) onLogin(data);
    else setErr("Kullanıcı adı veya şifre hatalı.");
    setLoading(false);
  }
  return(
    <div style={{minHeight:"100vh",background:"#f5f0e8",fontFamily:"'Inter',sans-serif",display:"flex"}}>

      {/* SOL — Görsel */}
      <div style={{flex:"0 0 52%",position:"relative",overflow:"hidden",display:"flex"}}>
        <img src="/login-hero.png" alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center"}}
          onError={e=>{e.target.parentElement.style.background="#ece7db";e.target.style.display="none"}}/>
        {/* Gradient sağa doğru */}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to right, rgba(245,240,232,0) 50%, rgba(245,240,232,1) 100%)"}}/>
        {/* Sol alt — tagline */}
        <div style={{position:"absolute",bottom:40,left:40,right:"30%"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:300,color:"white",lineHeight:1.4,textShadow:"0 2px 20px rgba(0,0,0,0.3)",fontStyle:"italic"}}>
            "Her hasta bir ilişki.<br/>Her ilişki bir güven."
          </div>
        </div>
      </div>

      {/* SAĞ — Form */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 48px"}}>
        <div style={{width:"100%",maxWidth:360}}>

          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:52}}>
            <div style={{width:22,height:22,border:"1px solid #c8bfb0",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:7,height:7,background:"#1a1510",borderRadius:"50%"}}/>
            </div>
            <div style={{fontSize:12,fontWeight:500,color:"#1a1510",letterSpacing:"0.04em"}}>SculptAI</div>
          </div>

          {/* Title */}
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:44,fontWeight:300,color:"#1a1510",lineHeight:1.1,marginBottom:14,letterSpacing:"-0.02em"}}>
            Görünmeyeni<br/><em>görmek.</em>
          </div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:300,fontStyle:"italic",color:"#b0a898",lineHeight:1.7,marginBottom:44}}>
            Hasta beklentisi, karar kalitesini<br/><span style={{color:"#1a1510",fontStyle:"normal",fontWeight:400}}>doğrudan etkiler.</span>
          </div>

          {/* Fields */}
          {[["KULLANICI ADI",u,setU,"text"],["ŞİFRE",p,setP,"password"]].map(([label,val,set,type])=>(
            <div key={label} style={{marginBottom:16}}>
              <div style={{fontSize:10,color:"#b0a898",letterSpacing:"0.15em",marginBottom:7}}>{label}</div>
              <input type={type} value={val} onChange={e=>set(e.target.value)} onKeyDown={e=>e.key==="Enter"&&attempt()} style={{width:"100%",padding:"13px 15px",background:"#ece7db",border:"1px solid #d4cabf",borderRadius:8,color:"#1a1510",fontSize:13,outline:"none",fontFamily:"'Inter',sans-serif"}}/>
            </div>
          ))}

          {err&&<div style={{marginBottom:14,padding:"9px 12px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,fontSize:12,color:"#dc2626"}}>{err}</div>}

          <button onClick={attempt} disabled={loading} style={{width:"100%",padding:"14px",background:"#1a1510",border:"none",borderRadius:8,color:"#f5f0e8",fontSize:12,fontWeight:500,letterSpacing:"0.1em",cursor:"pointer",opacity:loading?0.7:1,fontFamily:"'Inter',sans-serif",marginTop:4}}>
            {loading?"GİRİŞ YAPILIYOR...":"GİRİŞ YAP"}
          </button>

          <div style={{textAlign:"center",fontSize:10,color:"#c8bfb0",marginTop:20,letterSpacing:"0.06em"}}>
            Hacettepe Üniversitesi · Plastik Cerrahi
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────────────────── */
export default function App(){
  const [view,setView]=useState("loading");
  const [model,setModel]=useState(null);
  const [trainPct,setTrainPct]=useState(0);
  const [doctor,setDoctor]=useState(null);
  const [doctorId,setDoctorId]=useState(null);
  const trained=useRef(false);

  // Detect route: /form/dr-ahmet → patient form for that doctor
  // /panel → doctor login
  // / → default patient form (no doctor)
  useEffect(()=>{
    const path=window.location.pathname;
    const formMatch=path.match(/^\/form\/(.+)$/);
    if(formMatch){setDoctorId(formMatch[1]);setView("patient");}
    else if(path.startsWith("/admin")){setView("admin");}
    else if(path.startsWith("/panel")){
      try{const saved=sessionStorage.getItem("sculpt_doctor");if(saved){const d=JSON.parse(saved);setDoctor(d);setView("doctor");}else{setView("login");}}catch{setView("login");}
    }
    else{setView("patient");}
  },[]);

  // Train ML
  useEffect(()=>{
    if(trained.current)return; trained.current=true;
    const net=new NN(12,28,1);
    const aug=[];
    for(let e=0;e<80;e++) REAL_DATA.forEach(d=>aug.push({f:d.f.map(v=>Math.min(1,Math.max(0,v+(Math.random()-0.5)*0.03))),r:d.r}));
    for(let i=aug.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[aug[i],aug[j]]=[aug[j],aug[i]];}
    let idx=0,b=0;
    function run(){
      for(let i=0;i<25&&idx<aug.length;i++,idx++) net.train(aug[idx].f,aug[idx].r);
      b++; setTrainPct(Math.min(100,Math.round((idx/aug.length)*100)));
      if(idx<aug.length) requestAnimationFrame(run); else setModel(net);
    }
    requestAnimationFrame(run);
  },[]);

  if(view==="loading") return null;

  if(view==="patient") return(
    <div>
      <PatientForm model={model} trainPct={trainPct} doctorId={doctorId}/>
      <button onClick={()=>setView("login")} style={{position:"fixed",bottom:16,right:16,padding:"6px 14px",background:"rgba(12,20,40,0.06)",border:"1px solid rgba(12,20,40,0.1)",borderRadius:8,color:"rgba(12,20,40,0.35)",fontSize:11,cursor:"pointer"}}>🔒</button>
    </div>
  );

  if(view==="admin") return <AdminPanel/>;
  if(view==="login") return <Login onLogin={d=>{try{sessionStorage.setItem("sculpt_doctor",JSON.stringify(d));}catch{}setDoctor(d);setView("doctor");}}/>;

  return <DoctorPanel doctor={doctor} onLogout={()=>{try{sessionStorage.removeItem("sculpt_doctor");}catch{}setDoctor(null);setView("login");}}/>;
}
