import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

/* ─── SUPABASE ───────────────────────────────────────────────────────────── */
const sb = createClient(
  "https://ndabbbnrlgtwparpivim.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kYWJiYm5ybGd0d3BhcnBpdmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTQ2NDAsImV4cCI6MjA4OTM5MDY0MH0.g9ZUYqFw00IE_aIVNumcGyGHi1lbrurSiPXnI5PzQJo"
);

/* ─── FONTS & STYLES ─────────────────────────────────────────────────────── */
const FL = document.createElement("link");
FL.rel = "stylesheet";
FL.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap";
document.head.appendChild(FL);
const SE = document.createElement("style");
SE.textContent = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;background:#f7f8fa;color:#111827;font-size:13px;line-height:1.5}input,button,select{font-family:'DM Sans',sans-serif}button{cursor:pointer}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:2px}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}.f1{animation:fadeUp 0.35s ease 0.05s both}.f2{animation:fadeUp 0.35s ease 0.12s both}.f3{animation:fadeUp 0.35s ease 0.19s both}.f4{animation:fadeUp 0.35s ease 0.26s both}.f5{animation:fadeUp 0.35s ease 0.33s both}`;
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
  const exp={"Küçük iyileştirmeler yeterli":0.05,"Doğal ve dengeli bir sonuç bekliyorum":0.2,"Belirgin bir değişim bekliyorum, ameliyat olduğum belli olmalı":0.65,"Tamamen farklı görünmek istiyorum":0.95}[a.expectation]??0.5;
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
  const sf=a.sharing==="Evet paylaşırım",rec=a.recommends==="Evet, sık öneririm",inf=a.socialMedia==="Sık paylaşırım";
  const otm=a.crossSell==="Evet, önerilere açığım",pq=a.price==="Dengeli fiyat/kalite isterim"||a.price==="Kalite için daha fazla öderim";
  if(score>=68)return{cat:"red",label:"Dikkat Gerektiriyor",icon:"🔴",color:"#ef4444",bg:"#fef2f2",border:"#fecaca",textColor:"#b91c1c",obs:"Ek değerlendirme faydalı olabilir",obsBody:"Beklenti uyumsuzluğuna işaret eden bazı göstergeler saptandı. Konsültasyon sırasında bu konuların ele alınması önerilebilir. Son karar her zaman hekimin değerlendirmesine aittir.",ambassador:false};
  if(score>=48)return{cat:"amber",label:"Değerlendirme Önerilir",icon:"🟡",color:"#f59e0b",bg:"#fffbeb",border:"#fde68a",textColor:"#b45309",obs:"Bazı konular üzerinde durmak faydalı olabilir",obsBody:"Genel profil dengeli görünüyor. Beklenti yönetimi ve sosyal destek konuları konsültasyonda ele alınabilir.",ambassador:false};
  if(sf&&rec&&inf&&score<35)return{cat:"ambassador",label:"Marka Elçisi Adayı",icon:"🌟",color:"#8b5cf6",bg:"#faf5ff",border:"#ddd6fe",textColor:"#5b21b6",obs:"Klinik profil olumlu · Referans potansiyeli yüksek",obsBody:"Düşük risk göstergeleri, aktif sosyal medya kullanımı ve güçlü tavsiye eğilimi bir arada saptandı.",ambassador:true};
  return{cat:"green",label:"Uygun Görünüyor",icon:"🟢",color:"#10b981",bg:"#ecfdf5",border:"#a7f3d0",textColor:"#047857",obs:"Genel profil olumlu görünüyor",obsBody:"İçsel motivasyon, gerçekçi beklentiler ve güçlü sosyal destek saptandı. Son karar her zaman hekimin değerlendirmesine aittir.",ambassador:false};
}

const QUESTIONS=[
  {id:"name",section:"Kişisel Bilgiler",label:"İsminiz ve Soyisminiz",type:"text",placeholder:"Ad Soyad"},
  {id:"age",section:"Kişisel Bilgiler",label:"Kaç yaşındasınız?",type:"number",placeholder:"örn. 34"},
  {id:"gender",section:"Kişisel Bilgiler",label:"Cinsiyetiniz nedir?",type:"radio",options:["Kadın","Erkek","Belirtmek istemiyorum"]},
  {id:"source",section:"Kişisel Bilgiler",label:"Bizi nereden duydunuz?",type:"radio",options:["Eski hastaların tavsiyesi üzerine geldim.","Kurumun (Hacettepe Üniversitesi) itibarı tercihimde etkili oldu.","Google'da gördüm.","Instagram'da gördüm.","Rastgele randevu aldım."]},
  {id:"procedure",section:"Ameliyat Bilgisi",label:"Hangi ameliyatı yaptırmak istiyorsunuz?",type:"radio",options:["Meme Küçültme","Meme Büyütme (Silikon Protez ile)","Meme Dikleştirme","Meme Asimetrisinin Giderilmesi","Meme Onarımı (Kanser sonrası)","Doğumsal Meme Anomalisinin Düzeltilmesi","Jinekomasti","Burun Estetiği","Yüz Germe","Üst Göz Kapağı Estetiği","Alt Göz Kapağı Estetiği","Botoks Uygulaması","Dolgu Uygulaması","Karın Germe","Liposuction","Uyluk veya Kol germe","Popo estetiği"]},
  {id:"motivation",section:"Motivasyon & Beklenti",label:"Sizi bu ameliyatı düşünmeye yönlendiren en önemli neden nedir?",type:"radio",options:["Görünümümü iyileştirmek istiyorum","Sosyal özgüvenimi artırmak istiyorum","Başka insanların yorumları beni kötü etkiliyor","Hayatımda büyük bir değişime ihtiyacım var"]},
  {id:"expectation",section:"Motivasyon & Beklenti",label:"Ameliyat sonucunda nasıl bir görünüm beklersiniz?",type:"radio",options:["Küçük iyileştirmeler yeterli","Doğal ve dengeli bir sonuç bekliyorum","Belirgin bir değişim bekliyorum, ameliyat olduğum belli olmalı","Tamamen farklı görünmek istiyorum"]},
  {id:"prevSurgery",section:"Geçmiş Deneyimler",label:"Daha önce estetik bir işlem geçirdiniz mi?",type:"radio",options:["Hayır","Evet ve memnunum","Evet ama beklentimi karşılamadı","Evet ve hiç memnun değilim"]},
  {id:"multiDoctor",section:"Geçmiş Deneyimler",label:"Mevcut şikayetinizi daha önce başka doktorlara danıştınız mı?",type:"radio",options:["Hayır","1-2 doktora danıştım","Birçok doktora danıştım"]},
  {id:"riskKnowledge",section:"Süreç Farkındalığı",label:"Ameliyatınızın riskleri ve iyileşme süreci hakkında bilginiz ne düzeydedir?",type:"radio",options:["Hiçbir bilgim yok","Genel olarak bilgi sahibiyim","Detaylı araştırdım ve biliyorum"]},
  {id:"patience",section:"Süreç Farkındalığı",label:"İyileşme sürecinde sabırlı olabileceğinizi düşünüyor musunuz?",type:"radio",options:["Evet","Sabırlı olmakta zorlanabilirim","Hızlı sonuç görmek istiyorum"]},
  {id:"support",section:"Süreç Farkındalığı",label:"Yakın çevreniz bu ameliyat kararınızı destekliyor mu?",type:"radio",options:["Evet","Kararsızlar","Bu işleme karşılar","Kimseye söylemedim"]},
  {id:"revision",section:"Süreç Farkındalığı",label:"Ameliyat sonrası revizyon ihtimali olabileceğini biliyor musunuz?",type:"radio",options:["Evet, ve olası revizyonu normal kabul ederim","Revizyon ihtimali beni çok endişelendiriyor","Kusursuz sonuç bekliyorum"]},
  {id:"compliance",section:"Süreç Farkındalığı",label:"Doktorunuzun önerilerine uyma konusunda kendinizi nasıl değerlendirirsiniz?",type:"radio",options:["Titizlikle tüm önerilere uyarım","Büyük ölçüde uyarım","Kendi yöntemlerimi uygulamayı tercih ederim"]},
  {id:"price",section:"Hasta Profili",label:"Hangisi size daha yakındır?",type:"radio",options:["En uygun fiyatı tercih ederim","Dengeli fiyat/kalite isterim","Kalite için daha fazla öderim"]},
  {id:"sharing",section:"Hasta Profili",label:"Yaptırdığınız işlemleri çevreniz ile paylaşır mısınız?",type:"radio",options:["Evet paylaşırım","Hayır paylaşmam","Sadece yakın çevrem ile paylaşırım"]},
  {id:"crossSell",section:"Hasta Profili",label:"Mevcut şikâyetiniz dışında başka iyileştirmeler hakkında bilgi almak ister misiniz?",type:"radio",options:["Evet, önerilere açığım","Doktor uygun görürse değerlendirebilirim","Sadece mevcut şikâyetimle ilgilenmek istiyorum"]},
  {id:"socialInfluence",section:"Hasta Profili",label:"Çevrenizde insanlar estetik kararlarında size danışır mı?",type:"radio",options:["Sık sık danışırlar","Bazen","Hayır"]},
  {id:"recommends",section:"Hasta Profili",label:"Memnun kaldığınız bir hizmeti aktif olarak başkalarına önerir misiniz?",type:"radio",options:["Evet, sık öneririm","Bazen","Önermem"]},
  {id:"socialMedia",section:"Hasta Profili",label:"Sosyal medyada deneyimlerinizi paylaşma sıklığınız nedir?",type:"radio",options:["Sık paylaşırım","Ara sıra","Genelde paylaşmam"]},
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
  const H=["Tarih","İsim","Yaş","Cinsiyet","Ameliyat","Kaynak","Motivasyon","Beklenti","Önceki Ameliyat","Çok Doktor","Risk Bilgisi","Sabır","Destek","Revizyon","Uyum","Fiyat","Paylaşım","Çapraz Satış","Sosyal Etki","Tavsiye","Sosyal Medya","Risk Skoru","Segment"];
  const R=records.map(p=>[p.date,p.answers?.name||"",p.answers?.age||"",p.answers?.gender||"",p.answers?.procedure||"",p.answers?.source||"",p.answers?.motivation||"",p.answers?.expectation||"",p.answers?.prevSurgery||"",p.answers?.multiDoctor||"",p.answers?.riskKnowledge||"",p.answers?.patience||"",p.answers?.support||"",p.answers?.revision||"",p.answers?.compliance||"",p.answers?.price||"",p.answers?.sharing||"",p.answers?.crossSell||"",p.answers?.socialInfluence||"",p.answers?.recommends||"",p.answers?.socialMedia||"",p.risk_score,p.segment]);
  const csv=[H,...R].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}));
  a.download=`SculptAI_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

/* ─── SIDEBAR ────────────────────────────────────────────────────────────── */
function Sidebar(){
  const s={width:52,background:"#0c1428",display:"flex",flexDirection:"column",alignItems:"center",padding:"18px 0",gap:4,flexShrink:0};
  const logo={width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#3b82f6,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Serif Display',serif",fontSize:16,color:"white",marginBottom:18};
  const ic=(on)=>({width:36,height:36,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:on?"#60a5fa":"rgba(255,255,255,0.28)",background:on?"rgba(59,130,246,0.18)":"transparent",cursor:"pointer"});
  return(<aside style={s}><div style={logo}>S</div><div style={ic(true)}>◉</div><div style={ic(false)}>◈</div><div style={ic(false)}>◎</div><div style={{width:20,height:1,background:"rgba(255,255,255,0.07)",margin:"6px 0"}}/><div style={ic(false)}>◻</div><div style={{flex:1}}/><div style={ic(false)}>◬</div></aside>);
}

/* ─── PATIENT CARD ───────────────────────────────────────────────────────── */
function PatientCard({patient,onDelete}){
  const [open,setOpen]=useState(false);
  const [confirm,setConfirm]=useState(false);
  const a=patient.answers||{};
  const score=patient.risk_score||0;
  const cls=classify(score,a);
  const flags=getFlags(a,cls.cat);
  const signals=getSignals(a,cls.cat);
  return(
    <div style={{background:"white",borderRadius:12,border:`1.5px solid ${open?"#0c1428":"#f1f3f5"}`,marginBottom:8,overflow:"hidden",cursor:"pointer",transition:"all 0.15s",boxShadow:open?"0 4px 18px rgba(12,20,40,0.09)":"none"}}>
      <div style={{display:"flex",alignItems:"center",gap:16,padding:"14px 18px"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{width:3,height:44,borderRadius:2,background:cls.color,flexShrink:0}}/>
        <div style={{width:72,height:44,borderRadius:9,background:cls.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,flexShrink:0}}>
          <div style={{fontSize:15,lineHeight:1}}>{cls.icon}</div>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",textAlign:"center",lineHeight:1.2,color:cls.textColor}}>{cls.label.split(" ").slice(0,2).join("\n")}</div>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:500,color:"#0c1428",marginBottom:2}}>{a.name||"İsimsiz Hasta"}</div>
          <div style={{fontSize:11,color:"#9ca3af"}}>{a.age&&`${a.age} yaş · `}{a.procedure}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:148}}>
          {flags.map((f,i)=>(
            <div key={i} style={{fontSize:11,color:"#6b7280",display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:cls.color,flexShrink:0}}/>{f}
            </div>
          ))}
        </div>
        <div style={{fontSize:10,color:"#d1d5db",flexShrink:0}}>{patient.date?.slice(0,10)}</div>
        <div style={{fontSize:10,color:"#d1d5db",transition:"transform 0.2s",transform:open?"rotate(180deg)":"none",flexShrink:0}}>▼</div>
      </div>
      {open&&(
        <div style={{borderTop:"1px solid #f9fafb",padding:"14px 18px 14px 57px",background:"#fafbfc",animation:"fadeUp 0.18s ease"}}>
          <div style={{borderRadius:12,border:"1.5px solid #f1f3f5",overflow:"hidden"}}>
            <div style={{padding:"12px 16px",display:"flex",alignItems:"flex-start",gap:10,background:cls.bg}}>
              <div style={{fontSize:16,flexShrink:0,marginTop:1}}>{cls.icon}</div>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:cls.textColor,marginBottom:2}}>{cls.obs}</div>
                <div style={{fontSize:11,lineHeight:1.65,color:"#6b7280"}}>{cls.obsBody}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",borderTop:"1px solid #f3f4f6"}}>
              {signals.map((s,i)=>(
                <div key={i} style={{padding:"10px 14px",borderRight:i<2?"1px solid #f3f4f6":"none"}}>
                  <div style={{fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:"#9ca3af",marginBottom:3}}>{s.label}</div>
                  <div style={{fontSize:12,fontWeight:500,color:"#1e293b"}}>{s.val}</div>
                </div>
              ))}
            </div>
            <div style={{borderTop:"1px solid #f3f4f6",padding:"12px 16px",background:"white"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
                <div style={{width:18,height:18,background:"linear-gradient(135deg,#0c1428,#3b82f6)",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"white",flexShrink:0}}>✦</div>
                <div style={{fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:"#3b82f6",fontWeight:600}}>Sistem Gözlemi</div>
                {patient.ai_loading&&<div style={{fontSize:10,color:"#9ca3af",animation:"pulse 1.5s infinite"}}>Hazırlanıyor...</div>}
              </div>
              <div style={{fontSize:12,color:"#475569",lineHeight:1.7}}>{patient.ai_text||(patient.ai_loading?"Klinik analiz hazırlanıyor...":"Analiz mevcut değil.")}</div>
            </div>
            <div style={{borderTop:"1px solid #f3f4f6",padding:"10px 16px",display:"flex",gap:8,background:"white"}}>
              <button onClick={e=>e.stopPropagation()} style={{flex:1,padding:"8px",borderRadius:8,fontSize:12,fontWeight:500,border:"1.5px solid #e5e7eb",background:"white",color:"#475569"}}>📋 Not Ekle</button>
              {cls.ambassador&&<button onClick={e=>e.stopPropagation()} style={{flex:1,padding:"8px",borderRadius:8,fontSize:12,fontWeight:500,border:"1.5px solid #ddd6fe",background:"white",color:"#7c3aed"}}>🌟 Sadakat</button>}
              <button onClick={e=>{e.stopPropagation();}} style={{flex:1,padding:"8px",borderRadius:8,fontSize:12,fontWeight:600,border:"none",background:"#0c1428",color:"white"}}>Görüşmeye Hazır</button>
              {!confirm
                ?<button onClick={e=>{e.stopPropagation();setConfirm(true);}} style={{padding:"8px 12px",borderRadius:8,fontSize:12,border:"1.5px solid #fee2e2",background:"white",color:"#ef4444"}}>Sil</button>
                :<button onClick={e=>{e.stopPropagation();onDelete(patient.id);}} style={{padding:"8px 12px",borderRadius:8,fontSize:12,border:"none",background:"#ef4444",color:"white",fontWeight:600}}>Emin misin?</button>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── DOCTOR PANEL ───────────────────────────────────────────────────────── */
function DoctorPanel({doctor,onLogout}){
  const [patients,setPatients]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState("all");
  const [showPw,setShowPw]=useState(false);
  const [newU,setNewU]=useState("");const [newP,setNewP]=useState("");const [newP2,setNewP2]=useState("");const [pwErr,setPwErr]=useState("");
  const [confirmClear,setConfirmClear]=useState(false);

  useEffect(()=>{loadPatients();},[]);

  async function loadPatients(){
    setLoading(true);
    const {data}=await sb.from("patients").select("*").eq("doctor_id",doctor.id).order("created_at",{ascending:false});
    setPatients(data||[]);
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
    <div style={{display:"flex",height:"100vh",overflow:"hidden",fontFamily:"'DM Sans',sans-serif"}}>
      <Sidebar/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"#f7f8fa"}}>
        <div style={{padding:"18px 28px 16px",display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexShrink:0,background:"white",borderBottom:"1px solid #e5e7eb"}} className="f1">
          <div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:"#0c1428",fontWeight:400,letterSpacing:"-0.02em"}}>Günaydın, <span style={{color:"#3b82f6"}}>{doctor.name}</span></div>
            <div style={{fontSize:12,color:"#9ca3af",marginTop:3}}>{today}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>setShowPw(v=>!v)} style={{padding:"6px 14px",borderRadius:8,fontSize:12,border:"1.5px solid #e5e7eb",background:"white",color:"#6b7280"}}>⚙ Şifre</button>
            <button onClick={onLogout} style={{padding:"6px 14px",borderRadius:8,fontSize:12,border:"1.5px solid #fee2e2",background:"white",color:"#ef4444"}}>Çıkış</button>
            <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:"white"}}>{doctor.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"20px 28px 24px"}}>
          {showPw&&(
            <div style={{background:"white",border:"1px solid #e5e7eb",borderRadius:12,padding:"16px 20px",marginBottom:18,animation:"fadeUp 0.25s ease"}}>
              <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#374151",marginBottom:12}}>Giriş Bilgilerini Değiştir</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[["Yeni kullanıcı adı",newU,setNewU,"text"],["Yeni şifre",newP,setNewP,"password"],["Şifre tekrar",newP2,setNewP2,"password"]].map(([ph,val,set,type])=>(
                  <input key={ph} type={type} placeholder={ph} value={val} onChange={e=>set(e.target.value)} style={{flex:1,minWidth:130,padding:"9px 12px",background:"#f9fafb",border:"1.5px solid #e5e7eb",borderRadius:9,color:"#111827",fontSize:13,outline:"none"}}/>
                ))}
                <button onClick={saveNewCreds} style={{padding:"9px 18px",background:"#0c1428",border:"none",borderRadius:9,color:"white",fontSize:13,fontWeight:600}}>Kaydet</button>
              </div>
              {pwErr&&<div style={{fontSize:12,color:"#ef4444",marginTop:8}}>{pwErr}</div>}
            </div>
          )}

          {/* KPI */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}} className="f2">
            {[
              {val:redCount,label:"Dikkat Gerektiriyor",note:"Bugün",color:"#ef4444",grad:"linear-gradient(90deg,#ef4444,#f97316)"},
              {val:convRate+"%",label:"Uygun Görünüyor Oranı",note:"Toplam",color:"#3b82f6",grad:"linear-gradient(90deg,#3b82f6,#06b6d4)"},
              {val:patients.length,label:"Toplam Hasta",note:"Tüm zamanlar",color:"#10b981",grad:"linear-gradient(90deg,#10b981,#06b6d4)"},
            ].map(k=>(
              <div key={k.label} style={{background:"white",border:"1.5px solid #f1f3f5",borderRadius:12,padding:"18px 20px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:k.grad}}/>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:36,lineHeight:1,marginBottom:4,color:k.color}}>{k.val}</div>
                <div style={{fontSize:11,color:"#9ca3af",marginBottom:4}}>{k.label}</div>
                <div style={{fontSize:11,fontWeight:500,color:k.color}}>{k.note}</div>
              </div>
            ))}
          </div>

          {/* LIST HEADER */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}} className="f3">
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#374151"}}>Hasta Listesi</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[["all","Tümü"],["red","🔴 Dikkat"],["amber","🟡 Değerlendirme"],["green","🟢 Uygun"],["ambassador","🌟 Elçi"]].map(([v,l])=>(
                <button key={v} onClick={()=>setFilter(v)} style={{padding:"5px 13px",borderRadius:20,fontSize:11,fontWeight:500,border:`1.5px solid ${filter===v?"#0c1428":"#e5e7eb"}`,background:filter===v?"#0c1428":"white",color:filter===v?"white":"#6b7280",transition:"all 0.15s"}}>{l}</button>
              ))}
              <button onClick={()=>exportCSV(patients)} style={{padding:"5px 13px",borderRadius:20,fontSize:11,fontWeight:500,border:"1.5px solid #bfdbfe",background:"#eff6ff",color:"#2563eb"}}>📊 CSV</button>
              <button onClick={loadPatients} style={{padding:"5px 13px",borderRadius:20,fontSize:11,fontWeight:500,border:"1.5px solid #e5e7eb",background:"white",color:"#6b7280"}}>↻ Yenile</button>
            </div>
          </div>

          {loading&&<div style={{textAlign:"center",padding:"40px",color:"#9ca3af"}}>Yükleniyor...</div>}

          {!loading&&clinical.length===0&&ambassadors.length===0&&(
            <div style={{textAlign:"center",padding:"60px 20px",color:"#9ca3af"}}>
              <div style={{fontSize:40,marginBottom:14}}>📋</div>
              <div style={{fontSize:15,color:"#374151",marginBottom:8}}>Henüz kayıt yok</div>
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
                  <button onClick={clearAll} style={{padding:"6px 14px",background:"#ef4444",border:"none",borderRadius:8,color:"white",fontSize:12,fontWeight:600}}>Evet</button>
                  <button onClick={()=>setConfirmClear(false)} style={{padding:"6px 14px",background:"white",border:"1.5px solid #e5e7eb",borderRadius:8,color:"#6b7280",fontSize:12}}>İptal</button>
                </div>
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── PATIENT FORM ───────────────────────────────────────────────────────── */
function PatientForm({model,trainPct,doctorId}){
  const [currentQ,setCurrentQ]=useState(0);
  const [answers,setAnswers]=useState({});
  const [submitted,setSubmitted]=useState(false);
  const q=QUESTIONS[currentQ];
  const canNext=answers[q?.id]!==undefined&&answers[q?.id]!=="";
  const progress=(currentQ/QUESTIONS.length)*100;
  const secIdx=SECTIONS.indexOf(q?.section);
  const C={bg:"#f7f8fa",accent:"#3b82f6",navy:"#0c1428",muted:"#9ca3af",border:"#e5e7eb"};

  async function handleSubmit(){
    const feats=extractFeatures(answers);
    const raw=model?model.forward(feats):0.5;
    const score=Math.round(raw*100);
    const cls=classify(score,answers);
    const rec={
      id:Date.now().toString(),
      doctor_id:doctorId,
      date:new Date().toISOString(),
      risk_score:score,
      segment:cls.label,
      color:cls.color,
      icon:cls.icon,
      answers:answers,
      ai_text:"",
      ai_loading:true,
    };
    await sb.from("patients").insert(rec);
    setSubmitted(true);
    fetchAI(answers,score,cls,rec.id);
  }

  async function fetchAI(a,score,cls,recId){
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:700,messages:[{role:"user",content:`You are SculptAI, trained on 71 real Hacettepe University plastic surgery patients. Write a brief clinical observation IN ENGLISH (3-4 sentences, no headers, no bullets). Soft advisory tone. Mention 1-2 specific risk signals and 1 positive. End with a communication tip.

Patient: ${a.name||"Anonymous"}, Age ${a.age}, ${a.gender} | Procedure: ${a.procedure}
Motivation: ${a.motivation} | Expected: ${a.expectation} | Prev: ${a.prevSurgery}
Multi-doctor: ${a.multiDoctor} | Knowledge: ${a.riskKnowledge} | Patience: ${a.patience}
Support: ${a.support} | Revision: ${a.revision} | Compliance: ${a.compliance}
Price: ${a.price} | Sharing: ${a.sharing} | Recommends: ${a.recommends} | Social: ${a.socialMedia}
ML RISK: ${score}/100 | ASSESSMENT: ${cls.label}`}]})});
      const d=await res.json();
      const txt=d.content?.map(b=>b.text||"").join("\n")||"Analiz mevcut değil.";
      await sb.from("patients").update({ai_text:txt,ai_loading:false}).eq("id",recId);
    }catch{
      await sb.from("patients").update({ai_text:"Sistem gözlemi şu an kullanılamıyor.",ai_loading:false}).eq("id",recId);
    }
  }

  if(submitted) return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{textAlign:"center",animation:"fadeUp 0.6s ease",maxWidth:440,padding:24}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,margin:"0 auto 28px",boxShadow:"0 8px 32px rgba(16,185,129,0.25)"}}>✓</div>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:36,color:C.navy,marginBottom:14,fontWeight:400}}>Teşekkürler</div>
        <div style={{fontSize:15,color:C.muted,lineHeight:1.85,marginBottom:10}}>Formunuz başarıyla iletildi. Ekibimiz en kısa sürede sizinle iletişime geçecektir.</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:36}}>Randevunuz için sizi arayacağız.</div>
        <button onClick={()=>{setSubmitted(false);setAnswers({});setCurrentQ(0);}} style={{padding:"11px 28px",background:"white",border:"1.5px solid",borderColor:C.border,borderRadius:11,color:C.muted,fontSize:13,cursor:"pointer"}}>Yeni Form Doldur</button>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif",color:C.navy}}>
      <header style={{background:"white",borderBottom:`1px solid ${C.border}`,padding:"16px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#3b82f6,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Serif Display',serif",fontSize:16,color:"white"}}>S</div>
          <div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:17,color:C.navy,letterSpacing:"-0.01em"}}>SculptAI</div>
            <div style={{fontSize:9,letterSpacing:"0.2em",color:C.muted,textTransform:"uppercase"}}>Ön Değerlendirme Formu</div>
          </div>
        </div>
        {!model&&<div style={{fontSize:11,color:C.muted}}>Model yükleniyor %{trainPct}...</div>}
      </header>
      <main style={{maxWidth:580,margin:"0 auto",padding:"36px 20px"}}>
        {currentQ===0&&(
          <div style={{textAlign:"center",marginBottom:32}} className="f1">
            <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"5px 18px",border:"1px solid #dbeafe",borderRadius:24,fontSize:10,letterSpacing:"0.22em",color:C.accent,marginBottom:18,textTransform:"uppercase",background:"#eff6ff"}}>✦ Hacettepe Üniversitesi · Plastik Cerrahi</div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:32,color:C.navy,marginBottom:12,fontWeight:400,lineHeight:1.2}}>Hoş Geldiniz</div>
            <div style={{fontSize:14,color:C.muted,lineHeight:1.85,maxWidth:420,margin:"0 auto"}}>Bu kısa form, size en doğru ve güvenli planlama yapabilmemiz için beklentilerinizi anlamamıza yardımcı olur. Yanıtlarınız tamamen gizli tutulur.</div>
          </div>
        )}
        <div style={{display:"flex",gap:5,marginBottom:20,flexWrap:"wrap"}} className="f2">
          {SECTIONS.map((sec,i)=>(
            <div key={sec} style={{padding:"3px 11px",borderRadius:20,fontSize:9,letterSpacing:"0.13em",textTransform:"uppercase",background:i===secIdx?"#eff6ff":"transparent",border:`1.5px solid ${i===secIdx?C.accent:C.border}`,color:i===secIdx?C.accent:C.muted,transition:"all 0.3s"}}>{sec}</div>
          ))}
        </div>
        <div style={{marginBottom:22}} className="f2">
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:10,color:C.muted}}>SORU {currentQ+1} / {QUESTIONS.length}</span>
            <span style={{fontSize:10,color:C.accent,fontWeight:500}}>%{Math.round(progress)}</span>
          </div>
          <div style={{height:3,background:C.border,borderRadius:2}}>
            <div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#3b82f6,#06b6d4)",borderRadius:2,transition:"width 0.4s ease"}}/>
          </div>
        </div>
        <div style={{background:"white",border:`1.5px solid ${C.border}`,borderRadius:14,padding:"24px 22px",marginBottom:14}} className="f3">
          <div style={{fontSize:9,color:C.accent,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:9,fontWeight:600}}>{q.section}</div>
          <div style={{fontSize:16,fontWeight:500,color:C.navy,marginBottom:20,lineHeight:1.6}}>{q.label}</div>
          {q.type==="text"&&<input type="text" placeholder={q.placeholder} value={answers[q.id]||""} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.value}))} style={{width:"100%",padding:"12px 14px",background:"#f9fafb",border:`1.5px solid ${C.border}`,borderRadius:10,color:C.navy,fontSize:14,outline:"none"}}/>}
          {q.type==="number"&&<input type="number" placeholder={q.placeholder} value={answers[q.id]||""} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.value}))} style={{width:"100%",padding:"12px 14px",background:"#f9fafb",border:`1.5px solid ${C.border}`,borderRadius:10,color:C.navy,fontSize:14,outline:"none"}}/>}
          {q.type==="radio"&&(
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {q.options.map(opt=>{
                const sel=answers[q.id]===opt;
                return(<button key={opt} onClick={()=>setAnswers(p=>({...p,[q.id]:opt}))} style={{padding:"12px 14px",background:sel?"#eff6ff":"#f9fafb",border:`1.5px solid ${sel?C.accent:C.border}`,borderRadius:10,color:sel?C.accent:"#374151",fontSize:13,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:11,transition:"all 0.15s"}}>
                  <div style={{width:15,height:15,borderRadius:"50%",border:`2px solid ${sel?C.accent:C.muted}`,background:sel?C.accent:"transparent",flexShrink:0,transition:"all 0.15s"}}/>
                  {opt}
                </button>);
              })}
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:9}} className="f3">
          {currentQ>0&&<button onClick={()=>setCurrentQ(c=>c-1)} style={{flex:1,padding:"12px",background:"white",border:`1.5px solid ${C.border}`,borderRadius:11,color:C.muted,fontSize:13,cursor:"pointer"}}>← Geri</button>}
          <button onClick={()=>{if(currentQ<QUESTIONS.length-1)setCurrentQ(c=>c+1);else if(model)handleSubmit();}} disabled={!canNext||(!model&&currentQ===QUESTIONS.length-1)}
            style={{flex:2,padding:"12px",background:canNext?"linear-gradient(135deg,#3b82f6,#06b6d4)":"#f3f4f6",border:"none",borderRadius:11,color:canNext?"white":"#9ca3af",fontSize:14,fontWeight:600,cursor:canNext?"pointer":"not-allowed",transition:"all 0.2s"}}>
            {currentQ===QUESTIONS.length-1?(model?"Formu Gönder →":"Model yükleniyor..."):"Devam →"}
          </button>
        </div>
      </main>
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
  const C={navy:"#0c1428",border:"#e5e7eb",muted:"#9ca3af"};
  return(
    <div style={{minHeight:"100vh",background:"#f7f8fa",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:360}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#3b82f6,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Serif Display',serif",fontSize:22,color:"white",margin:"0 auto 14px"}}>S</div>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:C.navy,marginBottom:3}}>SculptAI</div>
          <div style={{fontSize:12,color:C.muted}}>Doktor Paneli Girişi</div>
        </div>
        <div style={{background:"white",border:`1.5px solid ${C.border}`,borderRadius:16,padding:"26px 24px"}}>
          {[["Kullanıcı Adı",u,setU,"text"],["Şifre",p,setP,"password"]].map(([label,val,set,type])=>(
            <div key={label} style={{marginBottom:14}}>
              <div style={{fontSize:10,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6,fontWeight:600}}>{label}</div>
              <input type={type} value={val} onChange={e=>set(e.target.value)} onKeyDown={e=>e.key==="Enter"&&attempt()} style={{width:"100%",padding:"11px 14px",background:"#f9fafb",border:`1.5px solid ${C.border}`,borderRadius:10,color:C.navy,fontSize:14,outline:"none"}}/>
            </div>
          ))}
          {err&&<div style={{marginBottom:12,padding:"8px 12px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,fontSize:12,color:"#dc2626"}}>{err}</div>}
          <button onClick={attempt} disabled={loading} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#3b82f6,#0c1428)",border:"none",borderRadius:11,color:"white",fontSize:14,fontWeight:600,cursor:"pointer",opacity:loading?0.7:1}}>
            {loading?"Giriş yapılıyor...":"Giriş Yap →"}
          </button>
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
    else if(path.startsWith("/panel")){setView("login");}
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

  if(view==="login") return <Login onLogin={d=>{setDoctor(d);setView("doctor");}}/>;

  return <DoctorPanel doctor={doctor} onLogout={()=>{setDoctor(null);setView("login");}}/>;
}
