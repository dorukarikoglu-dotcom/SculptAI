import React, { useState, useEffect, useRef } from "react";
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
FL.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Nunito:wght@300;400;500;600&display=swap";
document.head.appendChild(FL);
const SE = document.createElement("style");
SE.textContent = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Nunito',sans-serif;background:#f8fafd;color:#1e3a5f;font-size:13px;line-height:1.5}input,button,select{font-family:'Nunito',sans-serif}button{cursor:pointer}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#d4e1ef;border-radius:2px}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}.f1{animation:fadeUp 0.35s ease 0.05s both}.f2{animation:fadeUp 0.35s ease 0.12s both}.f3{animation:fadeUp 0.35s ease 0.19s both}.f4{animation:fadeUp 0.35s ease 0.26s both}.f5{animation:fadeUp 0.35s ease 0.33s both}`;
document.head.appendChild(SE);



/* ─── ML AĞIRLIKLARI (pipeline'dan üretildi, outcome verisi arttıkça güncellenir) ── */

/* ─── THRESHOLD MODES ───────────────────────────────────────────────────── */
const THRESHOLD_MODES = {
  conservative: {
    key: "conservative",
    label: "Temkinli",
    icon: "🎯",
    description: "Az kırmızı, yüksek isabet",
    offset: +15,   // base threshold'a eklenir
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    hint: "Kırmızı deyince %90 haklısın. Az yanlış alarm.",
  },
  balanced: {
    key: "balanced",
    label: "Dengeli",
    icon: "⚖️",
    description: "Varsayılan mod",
    offset: 0,
    color: "#1d4ed8",
    bg: "#eff6ff",
    border: "#dbeafe",
    hint: "Risk ve isabet dengeli. Çoğu klinik için ideal.",
  },
  aggressive: {
    key: "aggressive",
    label: "Agresif",
    icon: "🔍",
    description: "Daha fazla risk yakalar",
    offset: -15,  // base threshold'u düşürür → daha fazla kırmızı
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    hint: "Daha fazla hasta kırmızı. Kaçırma azalır ama yanlış alarm artar.",
  },
};

function getEffectiveThreshold(baseThreshold, mode) {
  const m = THRESHOLD_MODES[mode] || THRESHOLD_MODES.balanced;
  return Math.max(30, Math.min(85, baseThreshold + m.offset));
}

/* ─── ML SİSTEMİ v4 — 66 etiketli hasta, CV: 0.738 ─────────────── */
const GLOBAL_ML_WEIGHTS = {
  intercept: -0.34503517192523303,
  coef: {
    motivasyon:        0.15116297782111604,
    destek:            0.21539350264057514,
    revizyon:          0.40252144126340345,
    riskBilgisi:       0.2075156745364276,
    beklenti:          -0.0932367558588931,
    doktorSayisi:      -0.36379790340670776,
    oncekiAmeliyat:    0.4294283067622374,
    prosedurRiski:     0.41566307289326543,
    yas:               0.11618179936975316,
    rhinoDışsal:       0.2660153289981645,
    oncekiKotu:        0.11797215576584166,
    bilgisizDesteksiz: 0.07309238684161413,
    yuksekRiskProc:    0.25104960620530054,
    kararSuresi:       0.18,
  },
  mean: [0.10909090909090911, 0.16666666666666663, 0.37727272727272726, 0.5984848484848485, 0.2833333333333331, 0.19696969696969696, 0.016666666666666677, 0.30666666666666664, 0.4504419191919193, 0.06060606060606061, 0.07575757575757576, 0.09090909090909091, 0.12121212121212122, 0.1],
  std:  [0.2737103494059018, 0.2987769682684338, 0.3694982078709378, 0.2782479950334389, 0.2214506808307529, 0.2735677285646635, 0.25677683586013644, 0.21066513233043097, 0.24411112287949602, 0.23860629921247942, 0.26460983631171175, 0.28747978728803425, 0.32637362467481823, 0.3],
};

const PROC_RISK_MAP = {
  "Meme Asimetrisinin Giderilmesi":1.0,
  "Karın Germe":0.6,
  "Yüz Germe":0.4,
  "Burun Estetiği":0.35,
  "Jinekomasti":0.33,
  "Meme Büyütme (Silikon Protez ile)":0.29,
  "Meme Dikleştirme":0.25,
  "Meme Küçültme":0.14,
  "Üst Göz Kapağı Estetiği":0.05,
  "Alt Göz Kapağı Estetiği":0.05,
  "Liposuction":0.02,
  "Dolgu Uygulaması":0.02,
  "Botoks":0.02,
  "Uyluk veya Kol germe":0.05,
};

function extractRawFeatures(a) {
  const m_motiv = {
    "Görünümümü iyileştirmek istiyorum":0.0,
    "Sosyal özgüvenimi artırmak istiyorum":0.2,
    "Özgüvenimi artırmak istiyorum":0.2,
    "Kendim için daha iyi hissetmek istiyorum":0.15,
    "Hayatımda büyük bir değişime ihtiyacım var":0.85,
    "Başka insanların yorumları beni kötü etkiliyor":1.0,
    "Yakınlarımın yorumları etkili oldu":1.0,
  }[a.motivation] ?? 0.0;

  const m_support = {
    "Evet, destekliyorlar":0.0,"Evet":0.0,"Kararsızlar":0.35,
    "Biliyorlar ama kararsızlar":0.5,"Kimseye söylemedim":0.85,
    "Bu işleme karşılar":1.0,"Karşılar":1.0,
  }[a.support] ?? 0.0;

  const m_rev = {
    "Evet, ve olası revizyonu normal kabul ederim":0.0,
    "Evet, olası revizyonu normal karşılarım":0.0,
    "Revizyon ihtimali beni çok endişelendiriyor":0.5,
    "Revizyon beni endişelendiriyor":0.45,
    "Kusursuz sonuç bekliyorum":1.0,
  }[a.revision] ?? 0.0;

  const m_risk = {
    "Detaylı araştırdım ve biliyorum":0.0,
    "Genel olarak bilgi sahibiyim":0.5,
    "Hiçbir bilgim yok":1.0,
  }[a.riskKnowledge] ?? 0.5;

  const m_exp = {
    "Küçük iyileştirmeler yeterli":0.0,"Küçük, doğal bir iyileştirme yeterli":0.0,
    "Doğal ve dengeli bir sonuç bekliyorum":0.2,"Dengeli ve orantılı bir sonuç bekliyorum":0.2,
    "Belirgin bir fark olmasını istiyorum":0.6,
    "Belirgin bir değişim bekliyorum, ameliyat olduğum belli olmalı":0.75,
    "Tamamen farklı bir görünüm istiyorum":1.0,"Tamamen farklı görünmek istiyorum":1.0,
  }[a.expectation] ?? 0.2;

  const m_multi = {
    "Hayır":0.0,"1-2 doktora danıştım":0.5,"1-2 doktorla görüştüm":0.5,
    "Birçok doktora danıştım":1.0,"Birçok doktorla görüştüm":1.0,
  }[a.multiDoctor] ?? 0.0;

  const m_prev = {
    "Hayır":0.0,"Evet ve memnunum":-0.3,
    "Evet ama beklentimi karşılamadı":0.7,"Evet ve hiç memnun değilim":1.0,
  }[a.prevSurgery] ?? 0.0;

  // Karar süresi + his — yeni sinyal
  const m_decision = {
    "Yeni karar verdim — heyecanlı ve kararlı hissediyorum": 0.2,
    "Birkaç aydır düşünüyorum — hazır olduğumu hissediyorum": 0.0,
    "1 yılı aşkın süredir düşünüyorum — artık harekete geçme zamanı": 0.1,
    "Uzun süredir düşünüyorum ama hâlâ kararsız hissediyorum": 0.9,
  }[a.decisionDuration] ?? 0.1;

  const m_proc = PROC_RISK_MAP[a.procedure] ?? 0.3;
  const age_n  = Math.min(1, Math.max(0, ((parseInt(a.age)||35) - 17) / 48));

  // Kombinasyon featureları
  const rhinoDışsal       = (a.procedure==="Burun Estetiği" && m_motiv>=0.85) ? 1.0 : 0.0;
  const oncekiKotu        = m_prev >= 0.7 ? 1.0 : 0.0;
  const bilgisizDesteksiz = (m_risk>=1.0 && m_support>=0.5) ? 1.0 : 0.0;
  const yuksekRiskProc    = m_proc >= 0.5 ? 1.0 : 0.0;

  return [m_motiv, m_support, m_rev, m_risk, m_exp, m_multi, m_prev,
          m_proc, age_n, rhinoDışsal, oncekiKotu, bilgisizDesteksiz, yuksekRiskProc, m_decision];
}

function computeMLScore(a) {
  const feats = extractRawFeatures(a);
  const W = GLOBAL_ML_WEIGHTS;
  const coefs = Object.values(W.coef);

  let logit = W.intercept;
  feats.forEach((v, i) => {
    const z = (v - W.mean[i]) / (W.std[i] || 1);
    logit += coefs[i] * z;
  });

  const prob = 1 / (1 + Math.exp(-logit));
  const mlBase = Math.round((1 - prob) * 100);

  // Kombinasyon bonusları — ML'in göremediği pattern'ler
  const procRisk = PROC_RISK_MAP[a.procedure] ?? 0.3;

  // %30 prosedür + %70 ML
  const blended = Math.round(mlBase * 0.70 + procRisk * 100 * 0.30);

  // Güçlü sinyaller — veriden kanıtlanmış
  const prevBadBonus =
    a.prevSurgery === "Evet ve hiç memnun değilim" ? 15 :
    a.prevSurgery === "Evet ama beklentimi karşılamadı" ? 8 : 0;

  const rhinoExtBonus = (a.procedure === "Burun Estetiği" &&
    ["Yakınlarımın yorumları etkili oldu","Başka insanların yorumları beni kötü etkiliyor"].includes(a.motivation)) ? 14 : 0;

  const noKnowNoSupportBonus = (a.riskKnowledge === "Hiçbir bilgim yok" &&
    ["Kimseye söylemedim","Bu işleme karşılar","Biliyorlar ama kararsızlar"].includes(a.support)) ? 8 : 0;

  const abdoFaceBonus = (["Karın Germe","Yüz Germe"].includes(a.procedure) &&
    a.riskKnowledge === "Hiçbir bilgim yok") ? 10 : 0;

  const riskScore = Math.min(100, blended + prevBadBonus + rhinoExtBonus + noKnowNoSupportBonus + abdoFaceBonus);

  // Memnuniyet — risk skorunun tersinden
  const mlSatisfaction = Math.round((1 - riskScore / 100) * 100);

  return { riskScore, mlSatisfaction, prob };
}



/* ─── ELÇİ ML MODELİ ────────────────────────────────────────────────────── */
const AMBASSADOR_WEIGHTS = {
  intercept: -2.4879774705640325,
  coef: {
    sharing:    1.7456693036553208,
    social:     0.23462709374771243,
    recommends: 0.4055491101140394,
    motivation: -0.4139539651161969,
    support:    0.22992151735834254,
    low_risk:   0.9136872112774931,
    age:        -0.1731016285821571,
  },
  mean: [0.31739130434782625, 0.5391304347826089, 0.8478260869565217, 0.5434782608695652, 0.8521739130434781, 0.6245652173913042, 0.44157608695652173],
  std:  [0.29177444223539684, 0.30106929786546194, 0.2525858704048316, 0.15414867740205082, 0.3097959569969316, 0.2349440869814804, 0.2445673141348659],
};

function computeAmbassadorScore(a, riskScore){
  const sharing = {
    "Evet, açıkça paylaşırım":1.0,"Sık paylaşırım":0.85,"Evet paylaşırım":0.7,
    "Ara sıra":0.4,"Sadece yakın çevrem ile paylaşırım":0.3,
    "Sadece çok yakınlarımla":0.2,"Genelde paylaşmam":0.0,
  }[a.sharing] ?? 0.3;

  const social = {
    "Sık sık danışırlar":1.0,"Evet, sık sık danışırlar":1.0,
    "Bazen danışanlar olur":0.6,"Bazen":0.6,
    "Hayır":0.0,"Hayır, danışmazlar":0.0,
  }[a.socialInfluence] ?? 0.3;

  const recommends = {"Evet, sık öneririm":1.0,"Bazen":0.5,"Önermem":0.0}[a.recommends] ?? 0.5;

  const motivation = {
    "Kendim için daha iyi hissetmek istiyorum":1.0,
    "Özgüvenimi artırmak istiyorum":0.9,
    "Sosyal özgüvenimi artırmak istiyorum":0.8,
    "Görünümümü iyileştirmek istiyorum":0.5,
    "Başka insanların yorumları beni kötü etkiliyor":0.0,
    "Yakınlarımın yorumları etkili oldu":0.0,
  }[a.motivation] ?? 0.5;

  const support = {
    "Evet, destekliyorlar":1.0,"Evet":1.0,"Kararsızlar":0.4,
    "Biliyorlar ama kararsızlar":0.3,"Bu işleme karşılar":0.0,"Kimseye söylemedim":0.0,
  }[a.support] ?? 0.5;

  const low_risk = 1 - (riskScore / 100);
  const age_norm = Math.min(1, Math.max(0, ((parseInt(a.age)||35) - 17) / 48));

  const feats  = [sharing, social, recommends, motivation, support, low_risk, age_norm];
  const coefs  = Object.values(AMBASSADOR_WEIGHTS.coef);
  const means  = AMBASSADOR_WEIGHTS.mean;
  const stds   = AMBASSADOR_WEIGHTS.std;

  let logit = AMBASSADOR_WEIGHTS.intercept;
  feats.forEach((v, i) => {
    logit += coefs[i] * (v - means[i]) / (stds[i] || 1);
  });
  return 1 / (1 + Math.exp(-logit));
}

/* ─── KLİNİK BAZLI MODEL ────────────────────────────────────────────────── */
const clinicModelCache = {};

async function loadClinicModel(doctorId) {
  if(clinicModelCache[doctorId] !== undefined) return clinicModelCache[doctorId];
  try {
    const { data } = await sb.from("clinic_models")
      .select("weights, threshold, n_train, n_neg, accuracy, updated_at")
      .eq("doctor_id", doctorId)
      .single();
    if(data && data.weights) { clinicModelCache[doctorId] = data; return data; }
  } catch(e) {}
  clinicModelCache[doctorId] = null;
  return null;
}

function computeScoreWithModel(a, weights) {
  // Klinik modeli varsa onun ağırlıklarıyla hesapla
  const W = weights;
  const feats = extractRawFeatures(a);
  const coefs = Object.values(W.coef || {});
  if(!coefs.length) return computeMLScore(a).riskScore;
  let logit = W.intercept || 0;
  feats.forEach((v, i) => {
    const z = (v - (W.mean?.[i] || 0)) / (W.std?.[i] || 1);
    logit += (coefs[i] || 0) * z;
  });
  const prob = 1 / (1 + Math.exp(-logit));
  return Math.min(100, Math.round((1 - prob) * 100));
}


function classify(score,a,threshold=60){
  // Marka elçisi — yeni sorular + düşük risk
  // ML tabanlı elçi skoru
  const ambassadorProb = computeAmbassadorScore(a, score);
  const sharesFreely=a.sharing==="Evet, açıkça paylaşırım";
  const socialInfluencer=a.socialInfluence==="Sık sık danışırlar"||a.socialInfluence==="Evet, sık sık danışırlar";
  const intMotiv=["Kendim için daha iyi hissetmek istiyorum","Özgüvenimi artırmak istiyorum"].some(x=>a.motivation===x);
  const hasSupport=a.support==="Evet, destekliyorlar"||a.support==="Evet";
  const socialActive=ambassadorProb>=0.82&&score<35;

  // Risk sinyalleri
  const bddRisk=a.bodyFocus==="Neredeyse her gün, bazen işimi gücümü etkiliyor"||a.avoidance==="Günlük hayatımı önemli ölçüde kısıtlıyor";
  const highExp=a.expectation?.includes("Tamamen farklı");
  const extMotiv=["Yakınlarımın yorumları etkili oldu","Başka insanların yorumları beni kötü etkiliyor"].some(x=>a.motivation===x);
  const manyDocs=a.multiDoctor==="Birçok doktorla görüştüm";
  const noSupport=["Kimseye söylemedim","Karşılar"].some(x=>a.support===x);
  const unrealistic=a.revision==="Kusursuz sonuç bekliyorum";
  const rhinoRedFlag=a.procedure==="Burun Estetiği"&&a.rhinoVision==="Aklımda belirli bir referans var — bir ünlü veya fotoğraf";
  const breastSymRedFlag=["Meme Küçültme","Meme Dikleştirme","Meme Büyütme (Silikon Protez ile)","Meme Asimetrisinin Giderilmesi"].includes(a.procedure)&&a.breastSymmetry==="Çok küçük bir fark var ama bu küçük fark bile beni rahatsız ediyor";

  // Açık uçlu cevap — red flag keyword taraması
  const storyLower=(a.openStory||"").toLowerCase();
  const redKeywords=["mükemmel","kusursuz","herkes fark","herkes görsün","tamamen değiş","özgüvenim tamamen","hayatım değiş","bambaşka biri","tanınamaz","artık ben olam"];
  const storyRedFlag=redKeywords.some(kw=>storyLower.includes(kw));

  const riskFactors=[bddRisk,highExp&&extMotiv,manyDocs,unrealistic,rhinoRedFlag,breastSymRedFlag,storyRedFlag].filter(Boolean).length;

  // Elçi — gevşetilmiş eşik: score<45, iki sosyal sinyal yeterli
  if(socialActive&&riskFactors===0)
    return{cat:"ambassador",label:"Marka Elçisi",icon:"🌟",color:"#7c3aed",bg:"#faf5ff",border:"#ddd6fe",textColor:"#5b21b6",obs:"Randevuya hazır · Referans potansiyeli yüksek",obsBody:"Düşük risk, içsel motivasyon, aktif sosyal profil. Konsültasyon standart ilerleyebilir. Referans programını aktive edin.",ambassador:true};

  // Kırmızı
  if(score>=threshold||riskFactors>=3||bddRisk)
    return{cat:"red",label:"Konsültasyon Kritik",icon:"🔴",color:"#dc2626",bg:"#fef2f2",border:"#fecaca",textColor:"#991b1b",obs:"Beklenti yönetimi öncelikli",obsBody:"Yüksek risk sinyalleri saptandı. Gerçekçi beklenti çerçevesi çizmeden randevu verilmemesi önerilir.",ambassador:false};

  // Amber
  if(score>=45||riskFactors>=2||(highExp&&noSupport)||(extMotiv&&manyDocs))
    return{cat:"amber",label:"Dikkatli Değerlendir",icon:"🟡",color:"#d97706",bg:"#fffbeb",border:"#fde68a",textColor:"#92400e",obs:"Bazı sinyaller dikkat gerektiriyor",obsBody:"Konsültasyonda beklenti ve motivasyon konuları açılmalı. Randevu verilebilir ancak hazırlıklı girilmeli.",ambassador:false};

  // Yeşil
  return{cat:"green",label:"Randevuya Hazır",icon:"🟢",color:"#059669",bg:"#ecfdf5",border:"#a7f3d0",textColor:"#047857",obs:"Profil uygun görünüyor",obsBody:"İçsel motivasyon, gerçekçi beklenti ve süreç farkındalığı saptandı. Standart konsültasyon yeterli.",ambassador:false};
}

function predictOutcomes(score, a){
  // ── Sinyal tespiti ──────────────────────────────────────────────
  const bddRisk      = a.bodyFocus==="Neredeyse her gün, bazen işimi gücümü etkiliyor" || a.avoidance==="Günlük hayatımı önemli ölçüde kısıtlıyor";
  const unrealistic  = a.revision==="Kusursuz sonuç bekliyorum";
  const extMotiv     = ["Yakınlarımın yorumları etkili oldu","Başka insanların yorumları beni kötü etkiliyor"].some(x=>a.motivation===x);
  const intMotiv     = ["Kendim için daha iyi hissetmek istiyorum","Özgüvenimi artırmak istiyorum"].some(x=>a.motivation===x);
  const highExp      = a.expectation?.includes("Tamamen farklı");
  const realisticExp = ["Küçük, doğal bir iyileştirme yeterli","Dengeli ve orantılı bir sonuç bekliyorum"].some(x=>a.expectation===x);
  const manyDocs     = a.multiDoctor==="Birçok doktorla görüştüm";
  const noSupport    = ["Kimseye söylemedim","Karşılar"].some(x=>a.support===x);
  const goodSupport  = a.support==="Evet, destekliyorlar"||a.support==="Evet";
  const impulsive    = false; // soru kaldırıldı
  const patient      = true;  // varsayılan
  const worstAvoid   = false; // soru kaldırıldı
  const prevBad      = ["Evet ama beklentimi karşılamadı","Evet ve hiç memnun değilim"].some(x=>a.prevSurgery===x);
  const prevGood     = a.prevSurgery==="Evet ve memnunum";
  const detailedKnow = a.riskKnowledge==="Detaylı araştırdım ve biliyorum";
  const lowSelfEst   = ["Kendimden pek memnun değilim","Hayır, kendimle barışık değilim"].some(x=>a.selfEsteem===x);
  const lifeExpect   = a.imagineAfter?.includes("Hayatımın daha iyi");

  // ── Revizyon Riski % ───────────────────────────────────────────
  let rev = 12;
  const revReasons = [];
  if(bddRisk)      { rev+=28; revReasons.push({txt:"BDD riski saptandı — revizyon döngüsü olasılığı yüksek",w:"high"}); }
  if(unrealistic)  { rev+=22; revReasons.push({txt:"Kusursuz sonuç beklentisi — gerçek sonuçla uyumsuzluk riski",w:"high"}); }
  if(extMotiv)     { rev+=16; revReasons.push({txt:"Dışsal motivasyon — sonuç değerlendirmesi başkalarına bağımlı",w:"med"}); }
  if(highExp)      { rev+=14; revReasons.push({txt:"Tamamen farklı görünüm beklentisi — hayal kırıklığı riski",w:"med"}); }
  if(manyDocs)     { rev+=12; revReasons.push({txt:"Birçok doktora gidilmiş — kararsızlık ve yüksek standart",w:"med"}); }
  if(prevBad)      { rev+=14; revReasons.push({txt:"Geçmiş deneyim memnuniyetsizliği — tekrar riski",w:"med"}); }
  if(worstAvoid)   { rev+=8;  revReasons.push({txt:"En kötü senaryo kaçınması — gerçekçi süreç planlaması eksik",w:"low"}); }
  if(noSupport)    { rev+=8;  revReasons.push({txt:"Sosyal destek eksikliği — karar kırılganlığı artar",w:"low"}); }
  if(lowSelfEst)   { rev+=6;  revReasons.push({txt:"Düşük benlik saygısı — sonuç algısını olumsuz etkileyebilir",w:"low"}); }
  if(lifeExpect)   { rev+=8;  revReasons.push({txt:"İşlemden hayat değişikliği beklentisi — gerçekçi değil",w:"med"}); }
  if(prevGood)     { rev-=8;  }
  if(detailedKnow) { rev-=6;  }
  if(intMotiv)     { rev-=5;  }
  if(realisticExp) { rev-=8;  }
  rev = Math.min(85, Math.max(5, rev));

  // Memnuniyet kaldırıldı — kontrol verisi birikince eklenecek

  // ── Cerrahi Uygunluk ──────────────────────────────────────────
  const riskFactors = [bddRisk, highExp&&extMotiv, manyDocs, unrealistic, worstAvoid].filter(Boolean).length;
  let fit, fitColor, fitBg;
  if(bddRisk || (score>=60 && riskFactors>=3)){
    fit="Uygun Değil"; fitColor="#dc2626"; fitBg="#fef2f2";
  } else if(score>=45 || riskFactors>=2 || (extMotiv&&highExp) || (prevBad&&unrealistic)){
    fit="Borderline"; fitColor="#d97706"; fitBg="#fffbeb";
  } else {
    fit="Uygun"; fitColor="#059669"; fitBg="#ecfdf5";
  }

  // ── Yaklaşım Önerisi ─────────────────────────────────────────
  let approach, approachDesc;
  if(fit==="Uygun Değil" || bddRisk){
    approach="Ameliyat Önerilmez";
    approachDesc="Psikolojik değerlendirme önce. Beklenti çerçevesi kurulmadan cerrahi planlanmamalı.";
  } else if(fit==="Borderline" || extMotiv || unrealistic || highExp){
    approach="Konservatif";
    approachDesc="Minimal müdahale planla, beklenti yönetimini önceliklendir. Birden fazla konsültasyon düşün.";
  } else if(intMotiv && realisticExp && !manyDocs && score<35){
    approach="Standart / Agresif";
    approachDesc="Hasta iyi aday. İstenen sonucu doğrudan hedefleyebilirsin.";
  } else {
    approach="Standart";
    approachDesc="Normal konsültasyon akışı yeterli. Beklentileri teyit et, sonra planla.";
  }

  return { rev, fit, fitColor, fitBg, approach, approachDesc, revReasons };
}


const QUESTIONS=[
  {id:"name",section:"Kişisel Bilgiler",label:"İsminiz ve Soyisminiz",type:"text",placeholder:"Ad Soyad"},
  {id:"age",section:"Kişisel Bilgiler",label:"Kaç yaşındasınız?",type:"number",placeholder:"örn. 34"},
  {id:"gender",section:"Kişisel Bilgiler",label:"Cinsiyetiniz nedir?",type:"radio",options:["Kadın","Erkek","Belirtmek istemiyorum"]},
  {id:"procedure",section:"İşlem Bilgisi",label:"Hangi işlemi yaptırmak istiyorsunuz?",type:"radio",options:["Meme Küçültme","Meme Büyütme (Silikon Protez ile)","Meme Dikleştirme","Meme Asimetrisinin Giderilmesi","Meme Onarımı (Kanser sonrası)","Doğumsal Meme Anomalisinin Düzeltilmesi","Jinekomasti","Burun Estetiği","Yüz Germe","Üst Göz Kapağı Estetiği","Alt Göz Kapağı Estetiği","Botoks Uygulaması","Dolgu Uygulaması","Karın Germe","Liposuction","Uyluk veya Kol germe","Popo estetiği"]},

  /* ── Cross-sell sinyalleri ── */
  {id:"otherAreas",section:"İşlem Bilgisi",label:"Bunun dışında vücudunuzda rahatsız olduğunuz başka bir bölge var mı?",type:"radio",options:["Hayır, sadece bu bölge","Evet, 1-2 bölge daha var ama önceliğim bu","Evet, birkaç bölge var, hepsini konuşmak isterim","Henüz bilmiyorum, doktorun önerilerine açığım"]},

  /* ── Prosedüre özel sorular ── */
  {id:"rhinoVision",section:"İşlem Bilgisi",label:"Ameliyat sonucunu hayal ettiğinizde aklınızda ne var?",type:"radio",showIf:(a)=>a.procedure==="Burun Estetiği",options:["Doktorum benim yüz yapıma en uygun olanı belirlesin","Burnumda beni rahatsız eden belirli bir şeyi düzeltmek istiyorum","Aklımda net bir görünüm var, buna ulaşmak istiyorum","Aklımda belirli bir referans var — bir ünlü veya fotoğraf"]},

  {id:"breastSymmetry",section:"İşlem Bilgisi",label:"Şu an iki memeniz arasındaki farkı nasıl tarif edersiniz?",type:"radio",showIf:(a)=>["Meme Küçültme","Meme Dikleştirme","Meme Büyütme (Silikon Protez ile)","Meme Asimetrisinin Giderilmesi"].includes(a.procedure),options:["Fark var ama beni pek rahatsız etmiyor, ameliyatla düzelsin istiyorum","Belirgin bir fark var ve bu beni çok rahatsız ediyor","Çok küçük bir fark var ama bu küçük fark bile beni rahatsız ediyor","Fark olduğunu düşünmüyorum, sadece küçültmek/büyütmek istiyorum"]},
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
  {id:"prevSurgery",section:"Geçmiş Deneyimler",label:"Daha önce estetik bir işlem yaptırdınız mı?",type:"radio",options:["Hayır","Evet ve memnunum","Evet ama beklentimi karşılamadı","Evet ve hiç memnun değilim"]},
  {id:"multiDoctor",section:"Geçmiş Deneyimler",label:"Bu konuyu daha önce başka doktorlarla görüştünüz mü?",type:"radio",options:["Hayır","1-2 doktorla görüştüm","Birçok doktorla görüştüm"]},

  /* ── Süreç Farkındalığı ── */
  {id:"decisionDuration",section:"Süreç Farkındalığı",label:"Bu işlemi yaptırmayı ne zamandır düşünüyorsunuz ve şu an nasıl hissediyorsunuz?",type:"radio",options:[
    "Yeni karar verdim — heyecanlı ve kararlı hissediyorum",
    "Birkaç aydır düşünüyorum — hazır olduğumu hissediyorum",
    "1 yılı aşkın süredir düşünüyorum — artık harekete geçme zamanı",
    "Uzun süredir düşünüyorum ama hâlâ kararsız hissediyorum",
  ]},
  {id:"riskKnowledge",section:"Süreç Farkındalığı",label:"Bu işlemin riskleri ve iyileşme süreci hakkında bilginiz ne düzeyde?",type:"radio",options:["Hiçbir bilgim yok","Genel olarak bilgi sahibiyim","Detaylı araştırdım ve biliyorum"]},
  {id:"support",section:"Süreç Farkındalığı",label:"Yakın çevreniz bu kararınızı biliyor mu ve destekliyor mu?",type:"radio",options:["Evet, destekliyorlar","Biliyorlar ama kararsızlar","Karşılar","Kimseye söylemedim"]},
  {id:"revision",section:"Süreç Farkındalığı",label:"Revizyon ihtimali olabileceğini biliyor musunuz?",type:"radio",options:["Evet, olası revizyonu normal karşılarım","Revizyon beni endişelendiriyor","Kusursuz sonuç bekliyorum"]},


  /* ── Açık Uçlu ── */
  /* ── Marka Elçisi Sinyalleri ── */
  {id:"sharing",section:"Hasta Profili",label:"Memnun kaldığınız bir deneyimi çevrenizle paylaşır mısınız?",type:"radio",options:["Evet, açıkça paylaşırım","Sadece çok yakınlarımla","Hayır, paylaşmam"]},
  {id:"socialInfluence",section:"Hasta Profili",label:"Çevreniz estetik kararlarında size danışır mı?",type:"radio",options:["Evet, sık sık danışırlar","Bazen danışanlar olur","Hayır, danışmazlar"]},

  {id:"openStory",section:"Size Bir Sorum Var",label:"Bu işlemden sonra hayatınızda ne değişmesini istiyorsunuz? Kendi cümlelerinizle anlatır mısınız.",type:"text",placeholder:"İstediğiniz kadar az veya çok yazabilirsiniz...",optional:true},
];
const SECTIONS=[...new Set(QUESTIONS.map(q=>q.section))];

function getFlags(a,cat){
  const flags=[];
  if(["Başka insanların yorumları beni kötü etkiliyor","Hayatımda büyük bir değişime ihtiyacım var"].includes(a.motivation)) flags.push("Dış kaynaklı motivasyon");
  if(a.expectation==="Tamamen farklı görünmek istiyorum") flags.push("Yüksek beklenti düzeyi");
  if(a.multiDoctor==="Birçok doktora danıştım") flags.push("Birden fazla doktor görüşmesi");

  if(["Bu işleme karşılar","Kimseye söylemedim"].includes(a.support)) flags.push("Sosyal destek belirsiz");
  if(a.revision==="Kusursuz sonuç bekliyorum") flags.push("Kusursuz sonuç beklentisi");
  if(cat==="green"||cat==="ambassador"){
    if(a.motivation==="Görünümümü iyileştirmek istiyorum") flags.push("İçsel motivasyon");
    if(["Doğal ve dengeli bir sonuç bekliyorum","Küçük iyileştirmeler yeterli"].includes(a.expectation)) flags.push("Gerçekçi beklentiler");
    if(a.support==="Evet") flags.push("Ailesi destekliyor");
  }
  if(cat==="ambassador"){

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
    {label:"Paylaşım",val:a.sharing||"—"},
    {label:"Sosyal Etki",val:a.socialInfluence||"—"},
    {label:"Ek Prosedür",val:a.otherConsidered||"—"},
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
function Sidebar({tab,setTab,onLogout,doctor}){
  const items=[
    {id:"patients",  label:"Hastalar",
     icon:(on)=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={on?"#f8fafd":"rgba(255,255,255,0.35)"} strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>},
    {id:"analytics", label:"Analitik",
     icon:(on)=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={on?"#f8fafd":"rgba(255,255,255,0.35)"} strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>},
    {id:"value",     label:"Kazanç",
     icon:(on)=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={on?"#f8fafd":"rgba(255,255,255,0.35)"} strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>},
    {id:"settings",  label:"Ayarlar",
     icon:(on)=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={on?"#f8fafd":"rgba(255,255,255,0.35)"} strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>},
  ];
  const initials=(doctor?.name||"DR").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return(
    <aside style={{width:56,background:"#1e3a5f",display:"flex",flexDirection:"column",alignItems:"center",padding:"14px 0",gap:2,flexShrink:0,borderRight:"1px solid rgba(255,255,255,0.05)"}}>
      <div onClick={()=>setTab("patients")} title="SculptAI — Ana Sayfa"
        style={{width:32,height:32,background:"#1d4ed8",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16,cursor:"pointer",flexShrink:0}}
        onMouseEnter={e=>e.currentTarget.style.background="#5c1f2a"}
        onMouseLeave={e=>e.currentTarget.style.background="#1d4ed8"}>
        <div style={{width:10,height:10,background:"#f8fafd",borderRadius:"50%",opacity:0.9}}/>
      </div>
      {items.map(({id,icon,label})=>{
        const active=tab===id;
        return(
          <div key={id} onClick={()=>setTab(id)} title={label}
            style={{width:40,height:40,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative",
              background:active?"rgba(245,240,232,0.1)":"transparent",transition:"background 0.15s"}}
            onMouseEnter={e=>{if(!active)e.currentTarget.style.background="rgba(245,240,232,0.05)";}}
            onMouseLeave={e=>{if(!active)e.currentTarget.style.background="transparent";}}>
            {active&&<div style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:3,height:20,background:"#2d5a8e",borderRadius:"0 2px 2px 0"}}/>}
            {icon(active)}
          </div>
        );
      })}
      <div style={{flex:1}}/>
      {onLogout&&(
        <div onClick={onLogout} title="Çıkış Yap"
          style={{width:40,height:40,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:4,transition:"background 0.15s"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(220,38,38,0.12)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </div>
      )}
      <div title={doctor?.name||""} style={{width:32,height:32,borderRadius:"50%",background:"#2d5a8e",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:500,color:"rgba(245,240,232,0.6)",marginBottom:4}}>
        {initials}
      </div>
    </aside>
  );
}

/* ─── PATIENT CARD ───────────────────────────────────────────────────────── */
function PatientCard({patient,onDelete,isMobile,onConsult}){
  const [open,setOpen]=useState(false);
  const [rendered,setRendered]=useState(false);
  const [cardError,setCardError]=useState(false);
  const [confirm,setConfirm]=useState(false);
  const [showOutcome,setShowOutcome]=useState(false);
  const [showAmbassador,setShowAmbassador]=useState(false);
  const [outcomeProcedures,setOutcomeProcedures]=useState(patient.outcome_procedures||[]);
  const [noAppointment,setNoAppointment]=useState(patient.no_appointment||false);
  const [sat1m,setSat1m]=useState(patient.satisfaction_1m||null);
  const [sat6m,setSat6m]=useState(patient.satisfaction_6m||null);
  const [wouldRecommend,setWouldRecommend]=useState(patient.would_recommend||null);
  const [hadRevision,setHadRevision]=useState(patient.had_revision||false);
  const [revisionReason,setRevisionReason]=useState(patient.revision_reason||"");
  const [hadProcedure,setHadProcedure]=useState(patient.had_procedure??null);
  const [procedureDate,setProcedureDate]=useState(patient.procedure_date||"");
  const [referredCount,setReferredCount]=useState(patient.referred_count||0);
  const [showSat1m,setShowSat1m]=useState(false);
  const [showSat6m,setShowSat6m]=useState(false);
  const [showProcedure,setShowProcedure]=useState(false);
  const [ambassadorSent,setAmbassadorSent]=useState(patient.ambassador_sent||false);
  const [consultNote,setConsultNote]=useState(patient.consult_note||"");
  const [showConsultNote,setShowConsultNote]=useState(false);
  const a=patient.answers||{};
  const score=patient.risk_score||0;
  const clinicThreshold=(clinicModelCache[patient.doctor_id]?.threshold)||60;
  const effectiveThreshold=getEffectiveThreshold(clinicThreshold, mode||'balanced');
  const cls=classify(score,a,effectiveThreshold);
  const flags=getFlags(a,cls.cat);
  const signals=getSignals(a,cls.cat);
  const storyLower=(a.openStory||"").toLowerCase();
  const redKeywords=["mükemmel","kusursuz","herkes fark","herkes görsün","tamamen değiş","özgüvenim tamamen","hayatım değiş","bambaşka biri","tanınamaz","artık ben olam"];
  const storyRedFlag=redKeywords.some(kw=>storyLower.includes(kw));
  const rhinoRedFlag=a.procedure==="Burun Estetiği"&&a.rhinoVision==="Aklımda belirli bir referans var — bir ünlü veya fotoğraf";
  const breastSymRedFlag=["Meme Küçültme","Meme Dikleştirme","Meme Büyütme (Silikon Protez ile)","Meme Asimetrisinin Giderilmesi"].includes(a.procedure)&&a.breastSymmetry==="Çok küçük bir fark var ama bu küçük fark bile beni rahatsız ediyor";

  const ALL_PROCS=["Burun Estetiği","Meme Küçültme","Meme Büyütme","Meme Dikleştirme","Karın Germe","Liposuction","Üst Göz Kapağı","Alt Göz Kapağı","Botoks","Dolgu","Kol Germe","Yüz Germe","Uyluk Germe","Popo Estetiği","Jinekomasti"];

  async function saveOutcome(){
    await sb.from("patients").update({outcome_procedures:outcomeProcedures,no_appointment:false}).eq("id",patient.id);
    setNoAppointment(false);
    setShowOutcome(false);
    triggerRetrain(patient.doctor_id);
  }

  async function triggerRetrain(doctorId){
    try {
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - 90*24*60*60*1000).toISOString();

      const [{ count: totalLabeled }, { count: negCount }, { count: recent }] = await Promise.all([
        // Toplam etiketli hasta
        sb.from("patients")
          .select("id", { count: "exact", head: true })
          .eq("doctor_id", doctorId)
          .or("no_appointment.eq.true,outcome_procedures.neq.[]"),
        // Toplam negatif
        sb.from("patients")
          .select("id", { count: "exact", head: true })
          .eq("doctor_id", doctorId)
          .eq("no_appointment", true),
        // Son 90 günde gelen toplam hasta
        sb.from("patients")
          .select("id", { count: "exact", head: true })
          .eq("doctor_id", doctorId)
          .gte("created_at", ninetyDaysAgo),
      ]);

      // Minimum negatif şartı
      if(!negCount || negCount < 15) return;

      // Klinik hızına göre dinamik eşik
      const monthlyRate = Math.round((recent || 0) / 3); // aylık hasta sayısı
      const retrainEvery =
        monthlyRate > 100 ? 60 :   // hızlı klinik — her 60 outcome
        monthlyRate > 30  ? 40 :   // orta klinik — her 40 outcome
                            25;    // yavaş klinik — her 25 outcome

      if(totalLabeled && totalLabeled % retrainEvery === 0){
        await sb.functions.invoke("auto-train", { body: { doctor_id: doctorId } });
        clinicModelCache[doctorId] = undefined;
        console.log(`✓ Auto-train: ${totalLabeled} etiketli, ${negCount} negatif, eşik:${retrainEvery} (aylık~${monthlyRate})`);
      }
    } catch(e) { /* sessiz hata */ }
  }

  async function saveSatisfaction(month){
    const data = month===1
      ? {satisfaction_1m:sat1m, would_recommend:wouldRecommend, had_revision:hadRevision, revision_reason:hadRevision?revisionReason:""}
      : {satisfaction_6m:sat6m, would_recommend:wouldRecommend, had_revision:hadRevision, revision_reason:hadRevision?revisionReason:""};
    await sb.from("patients").update(data).eq("id",patient.id);
    month===1 ? setShowSat1m(false) : setShowSat6m(false);
    // 6 ay verisi en değerli — retrain tetikle
    if(month===6) triggerRetrain(patient.doctor_id);
  }

  async function saveProcedure(){
    await sb.from("patients").update({
      had_procedure: hadProcedure,
      procedure_date: procedureDate||null,
    }).eq("id",patient.id);
    setShowProcedure(false);
  }

  async function markNoAppointment(){
    await sb.from("patients").update({no_appointment:true,outcome_procedures:[]}).eq("id",patient.id);
    setNoAppointment(true);
    setOutcomeProcedures([]);
    triggerRetrain(patient.doctor_id);
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

  function handleToggle(){
    if(!rendered){
      // Mobilde önce state'i set et, render'ı bir sonraki frame'e bırak
      requestAnimationFrame(()=>{
        setRendered(true);
        setOpen(true);
      });
    } else {
      setOpen(o=>!o);
    }
  }
  return(
    <div onClick={handleToggle} style={{background:"#f8fafd",borderRadius:10,border:`1px solid ${open?"#1e3a5f":"#d4e1ef"}`,marginBottom:8,overflow:"hidden",cursor:"pointer",transition:"border-color 0.15s",WebkitTapHighlightColor:"transparent"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:noAppointment?"#fff5f5":outcomeProcedures.length>0?"#f0fdf4":"transparent",minWidth:0,overflow:"hidden"}}>
        {/* Left accent */}
        <div style={{width:2,height:36,borderRadius:1,background:noAppointment?"#fca5a5":outcomeProcedures.length>0?"#86efac":cls.color,flexShrink:0}}/>
        {/* Segment pill — kısa label */}
        <div style={{padding:"2px 6px",borderRadius:20,background:cls.bg,border:`1px solid ${cls.border}`,flexShrink:0,maxWidth:60}}>
          <div style={{fontSize:9,fontWeight:500,textTransform:"uppercase",color:cls.textColor,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{cls.icon}</div>
        </div>
        {/* Name + procedure — flex:1 minWidth:0 kritik */}
        <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:400,color:"#1e3a5f",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name||"İsimsiz Hasta"}</div>
          <div style={{fontSize:12,color:"#7b9ab5",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.age?`${a.age} yaş · `:""}{a.procedure}</div>
          {noAppointment&&<div style={{fontSize:9,color:"#dc2626",fontWeight:500,marginTop:1,whiteSpace:"nowrap"}}>✕ Randevu Yok</div>}
          {/* 5 outcome mini gösterge */}
          {!noAppointment&&(
            <div style={{display:"flex",gap:3,marginTop:2}}>
              {[
                {done:outcomeProcedures.length>0, label:"R", title:"Randevu"},
                {done:hadProcedure===true, neg:hadProcedure===false, label:"A", title:"Ameliyat"},
                {done:!!sat1m, label:"1", title:"1 Ay"},
                {done:!!sat6m, label:"6", title:"6 Ay"},
                {done:referredCount>0, label:"↗", title:"Referans"},
              ].map((item,i)=>(
                <div key={i} title={item.title} style={{
                  width:14,height:14,borderRadius:3,fontSize:8,fontWeight:600,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  background:item.done?"#059669":item.neg?"#dc2626":"#e2e8f0",
                  color:item.done||item.neg?"white":"#94a3b8",
                }}>{item.label}</div>
              ))}
            </div>
          )}
        </div>
        {/* Tarih + chevron — sabit genişlik */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3,flexShrink:0,width:40}}>
          <div style={{fontSize:11,color:"#7b9ab5",whiteSpace:"nowrap"}}>{patient.created_at?new Date(patient.created_at).toLocaleDateString("tr-TR",{day:"numeric",month:"short"}):""}</div>
          <div style={{fontSize:14,color:"#7b9ab5",transform:open?"rotate(90deg)":"none",transition:"transform 0.2s"}}>›</div>
        </div>
      </div>
        {/* No appointment badge */}
        {noAppointment&&(
          <div onClick={e=>e.stopPropagation()} style={{padding:"5px 18px",background:"#fef2f2",borderTop:"1px solid #fecaca",display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontSize:12,color:"#dc2626",fontWeight:500}}>✕ Randevu Alınmadı</div>
            <button onClick={async e=>{e.stopPropagation();await sb.from("patients").update({no_appointment:false}).eq("id",patient.id);setNoAppointment(false);}} style={{fontSize:11,color:"#7b9ab5",background:"transparent",border:"none",cursor:"pointer",textDecoration:"underline"}}>Geri Al</button>
          </div>
        )}
      {cardError&&<div style={{padding:12,fontSize:12,color:"#dc2626"}}>Detay yüklenemedi</div>}
      {rendered&&!cardError&&open&&(
        <div style={{borderTop:"1px solid #d4e1ef",animation:"fadeUp 0.18s ease"}}>
          {/* Observation strip */}
          <div style={{padding:"12px 18px",background:cls.bg,borderBottom:`1px solid ${cls.border}`,display:"flex",alignItems:"flex-start",gap:10}}>
            <div style={{fontSize:15,flexShrink:0,marginTop:1}}>{cls.icon}</div>
            <div>
              <div style={{fontSize:13,fontWeight:500,color:cls.textColor,marginBottom:2}}>{cls.obs}</div>
              <div style={{fontSize:13,lineHeight:1.65,color:cls.textColor,opacity:0.8}}>{cls.obsBody}</div>
            </div>
          </div>
          {/* Signal boxes */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",borderBottom:"1px solid #d4e1ef"}}>
            {signals.map((s,i)=>(
              <div key={i} style={{padding:"10px 16px",borderRight:i<2?"1px solid #d4e1ef":"none"}}>
                <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"#7b9ab5",marginBottom:3}}>{s.label}</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:"#1e3a5f"}}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* CROSS-SELL SİNYALİ */}
          {((a.otherAreas&&a.otherAreas!=="Hayır, sadece bu bölge")||(a.otherConsidered&&a.otherConsidered!=="Hayır"))&&(
            <div style={{padding:"10px 18px",borderBottom:"1px solid #d4e1ef",background:"#f0fdf4"}}>
              <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"#059669",marginBottom:5,fontWeight:500}}>↗ Ek İşlem İlgisi</div>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                {a.otherAreas&&a.otherAreas!=="Hayır, sadece bu bölge"&&(
                  <div style={{fontSize:13,color:"#065f46",lineHeight:1.5}}>
                    <span style={{color:"#7b9ab5",marginRight:5}}>Başka bölge:</span>{a.otherAreas}
                  </div>
                )}
                {a.otherConsidered&&a.otherConsidered!=="Hayır"&&(
                  <div style={{fontSize:13,color:"#065f46",lineHeight:1.5}}>
                    <span style={{color:"#7b9ab5",marginRight:5}}>Başka işlem düşünmüş:</span>{a.otherConsidered}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AÇIK UÇLU SORU — Ayna */}
          {a.openStory&&(
            <div style={{padding:"12px 18px",borderBottom:"1px solid #d4e1ef",background:"#eef3f9"}}>
              <div style={{fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:"#1d4ed8",marginBottom:6,fontWeight:500}}>Değişim Beklentisi — Kendi Sözleriyle</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:300,color:"#1e3a5f",lineHeight:1.8,fontStyle:"italic"}}>"{a.openStory}"</div>
              {storyRedFlag&&(
                <div style={{marginTop:8,padding:"5px 10px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,fontSize:11,color:"#dc2626",fontWeight:500}}>
                  ⚠ Yüksek beklenti sinyali — cevabında dikkat çekici ifadeler var
                </div>
              )}
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
              <div style={{padding:"12px 18px",borderBottom:"1px solid #d4e1ef",background:"#f8fafd"}}>
                <div style={{fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:"#7b9ab5",marginBottom:8,fontWeight:500}}>Soru Davranışı</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {slowQ.map(([id,sec])=>(
                    <div key={id} style={{fontSize:11,padding:"3px 9px",borderRadius:10,background:"#fef2f2",border:"1px solid #fecaca",color:"#991b1b"}}>
                      ⏱ {qLabels[id]||id}: {sec}sn
                    </div>
                  ))}
                  {changedQ.map(([id,cnt])=>(
                    <div key={id} style={{fontSize:11,padding:"3px 9px",borderRadius:10,background:"#fffbeb",border:"1px solid #fde68a",color:"#92400e"}}>
                      ↺ {qLabels[id]||id}: {cnt}x değişti
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
            <div style={{borderTop:"1px solid #d4e1ef",padding:"12px 16px",background:"#f8fafd"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
                <div style={{width:18,height:18,background:"#1e3a5f",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#f8fafd",flexShrink:0}}>✦</div>
                <div style={{fontSize:12,letterSpacing:"0.14em",textTransform:"uppercase",color:"#1e3a5f",fontWeight:600}}>Sistem Gözlemi</div>
                {patient.ai_loading&&<div style={{fontSize:12,color:"#7b9ab5",animation:"pulse 1.5s infinite"}}>Claude analizi hazırlanıyor...</div>}
              </div>

              {/* AUTO SUMMARY — hasta spesifik */}
              {(()=>{
                const a=patient.answers||{};
                const s=patient.risk_score||0;
                const name=a.name?.split(" ")[0]||"Hasta";
                const proc=a.procedure||"işlem";
                const risks=[];
                const comms=[];

                // ── RİSK FAKTÖRLERİ — ML sinyalleri ile ──
                // ML'in yüksek risk dediği sinyalleri göster
                if(a.multiDoctor?.includes("1-2")||a.multiDoctor?.includes("Birçok")) risks.push(`${name} daha önce ${a.multiDoctor?.includes("Birçok")?"birçok":"1-2"} doktora danışmış — önceki konsültasyonlarda ne duyduğunu sormak değerli olabilir`);
                if(a.motivation?.includes("Yakınlarımın yorumları")||a.motivation?.includes("Başka insanların")) risks.push(`Dışsal baskıyla karar veriyor — kendi isteği mi yoksa çevre baskısı mı olduğunu netleştirmek değerli olabilir`);
                if(a.expectation?.includes("Tamamen farklı")) risks.push(`"Tamamen farklı görünmek" beklentisi ${proc} ile karşılanamayabilir — fotoğraflarla sınırları çerçevelemek faydalı olabilir`);
                if(a.support?.includes("Kimseye söylemedim")) risks.push(`${name} bu kararı tek başına veriyor — iyileşme sürecinde yalnız kalma riski göz önünde bulundurulabilir`);
                if(a.revision?.includes("Kusursuz")) risks.push(`Kusursuz sonuç beklentisi var — revizyon ihtimalini konsültasyonda ele almak önemli olabilir`);
                if(a.bodyFocus?.includes("işimi gücümü etkiliyor")) risks.push(`Bu bölge günlük işleyişini etkiliyor — BDD değerlendirmesi düşünülebilir`);
                if(a.prevSurgery?.includes("beklentimi karşılamadı")) risks.push(`Önceki işlemden beklentisi karşılanmamış — bu sefer standartları daha yüksek olabilir, geçmişi mutlaka konuş`);
                if(a.prevSurgery?.includes("hiç memnun değilim")) risks.push(`Önceki işlemden hiç memnun değil — yüksek riskli profil, konsültasyonu çok dikkatli yürüt`);
                if(a.selfEsteem?.includes("barışık değilim")) risks.push(`Benlik saygısı düşük — işlem sonrası psikolojik iyileşme yavaş olabilir`);
                // Prosedür bazlı uyarı
                if(["Meme Asimetrisinin Giderilmesi"].includes(a.procedure)) risks.push(`Meme asimetrisi vakaları yüksek beklenti riski taşıyor — tam olarak ne istediğini netleştir`);
                if(["Karın Germe","Yüz Germe"].includes(a.procedure) && a.riskKnowledge==="Hiçbir bilgim yok") risks.push(`${a.procedure} için hiç bilgisi yok — iyileşme süreci ve sınırlamalar mutlaka anlatılmalı`);
                if(a.procedure==="Burun Estetiği" && ["Yakınlarımın yorumları etkili oldu","Başka insanların yorumları beni kötü etkiliyor"].includes(a.motivation)) risks.push(`Rinoplasti + dışsal motivasyon kombinasyonu — bu kombinasyondaki hastaların tümü randevu almadı`);
                if(rhinoRedFlag) risks.push(`Ünlü referansı var — gerçekçi olmayan beklenti riski yüksek`);
                if(breastSymRedFlag) risks.push(`Küçük asimetri bile çok rahatsız ediyor — postop memnuniyetsizlik riski`);
                if(storyRedFlag) risks.push(`Açık cevabında yüksek beklenti sinyali — "mükemmel", "kusursuz" gibi ifadeler kullanmış`);
                // ML skoru yüksek ama kural sinyali yoksa açıkla
                if(risks.length===0 && s>=68) risks.push(`ML modeli bu profili yüksek risk olarak değerlendirdi — form cevaplarının kombinasyonu randevu almama riskiyle ilişkili. Genel beklenti yönetimi önerilir`);
                if(risks.length===0) risks.push(`${name} için belirgin risk sinyali saptanmadı — standart konsültasyon yeterli`);

                // ── İLETİŞİM TARZI — spesifik ──
                const isAnalyst=a.riskKnowledge?.includes("Detaylı");
                const isSocial=false; // soru kaldırıldı
                const isPragmatic=false; // soru kaldırıldı
                const isTrustSeeker=a.riskKnowledge?.includes("Hiçbir")||a.support?.includes("Kimseye");

                if(isAnalyst){
                  const multiDoctor=a.doctorCount?.includes("3")||a.doctorCount?.includes("4")||a.doctorCount?.includes("5");
                  comms.push(`${name} araştırmacı bir profil${multiDoctor?`, ${a.doctorCount} doktora gitmiş`:""} — teknik detayları paylaşmaktan çekinmeyebilirsiniz, genel konuşmadan pek hoşlanmaz`);
                  const proc=a.procedure||"işlem";
                  comms.push(`${proc} için tercih ettiğiniz tekniği ve neden seçtiğinizi aktarabilirsiniz — "neden siz" sorusunu sormadan yanıtlamış olursunuz`);
                } else if(isPragmatic){
                  const recoveryHint=a.procedure?.includes("Botoks")||a.procedure?.includes("Dolgu")?"aynı gün işe dönebileceğini":"2 haftada normale döneceğini";
                  comms.push(`${name} hızlı karar veren biri — uzun açıklamalar yerine net bir takvim ve birkaç kritik nokta yeterli olabilir`);
                  comms.push(`${recoveryHint} belirtebilirsiniz${a.jobStatus?.includes("çalış")?" — iş hayatına etkisi açısından bu bilgi özellikle anlamlı olabilir":""}`);
                } else if(isTrustSeeker){
                  const hasNoSupport=a.support?.includes("Kimseye");
                  const hasAnxiety=false; // soru kaldırıldı
                  const longDecision=a.decisionAge?.includes("1 yıldan")||a.decisionAge?.includes("2 yıl");
                  const firstTime=!a.previousProcedure||a.previousProcedure?.includes("Hayır")||a.previousProcedure?.includes("ilk");

                  if(hasNoSupport){
                    comms.push(`${name} bu kararı çevresine anlatmamış — yargılanmayacağını hissedebilmesi için ilk birkaç dakikayı buna ayırabilirsiniz`);
                  } else {
                    comms.push(`${name} bilgi konusunda biraz belirsiz — sorularını küçümsemeden, kısa ve somut yanıtlar verebilirsiniz`);
                  }

                  if(hasAnxiety){
                    comms.push(`En kötü senaryoyu düşünmekten kaçınıyor — riskleri "bu çok nadir karşılaşılan bir durum" diye başlayarak aktarabilirsiniz, liste halinde sıralamak yerine`);
                  } else if(longDecision){
                    comms.push(`${a.decisionAge} süredir düşünüyor — "bu kadar süre düşünmüşseniz zaten doğru adaylardan birisiniz" gibi onaylayıcı bir cümleyle başlayabilirsiniz`);
                  } else if(firstTime){
                    comms.push(`İlk kez konsültasyona geliyor — sürecin nasıl ilerleyeceğini adım adım aktarabilirsiniz, belirsizlik bırakmamak rahatlatıcı olur`);
                  } else {
                    comms.push(`Güven arayan bir profil — "Sizin durumunuzda ben de bunu düşünürdüm" gibi kişisel bir yaklaşım etkili olabilir`);
                  }
                } else if(isSocial){
                  comms.push(`${name} sosyal profili güçlü biri — konsültasyon olumlu geçerse çevresine anlatma ihtimali yüksek`);
                  comms.push(`Sonuç fotoğraflarını paylaşmayı düşünüp düşünmediğini sorabilirsiniz — doğal bir referans kaynağı olabilir`);
                } else {
                  comms.push(`${name} ${a.decisionAge?.includes("1 yıldan") ? "uzun süredir" : "yakın zamanda"} bu kararı düşünüyor — motivasyonunu dinleyebilir, süreci güvenli hissettirmeye çalışabilirsiniz`);
                  if(a.imagineAfter?.includes("hayatımın daha iyi")||a.imagineAfter?.includes("Hayatımın")) comms.push(`İşlemden sonra hayatının daha iyi gideceğini umuyor — bu beklentiyi gerçekçi bir çerçevede ele alabilirsiniz`);
                }

                const pred=predictOutcomes(score,a);

                return(
                  <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:patient.ai_text?10:0}}>

                    {/* ── KLİNİK TAHMİN BLOĞU ── */}
                    <div style={{background:"#f8f7ff",border:"1px solid #ddd6fe",borderRadius:9,padding:"11px 13px"}}>
                      <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#5b21b6",marginBottom:10}}>🧠 Klinik Tahmin</div>

                      {/* 3 metrik — mobilde 1 sütun, masaüstünde 3 */}
                      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:6,marginBottom:10}}>
                        {/* Revizyon Riski */}
                        <div style={{background:"white",border:"1px solid #ede9fe",borderRadius:7,padding:"8px 6px",textAlign:"center"}}>
                          <div style={{fontSize:20,fontWeight:600,color:pred.rev>=50?"#dc2626":pred.rev>=30?"#d97706":"#059669",lineHeight:1}}>{pred.rev}%</div>
                          <div style={{fontSize:9,color:"#8b5cf6",letterSpacing:"0.08em",textTransform:"uppercase",marginTop:3}}>Revizyon Riski</div>
                        </div>
                        
                        {/* Cerrahi Uygunluk */}
                        <div style={{background:pred.fitBg,border:`1px solid ${pred.fitColor}44`,borderRadius:7,padding:"8px 6px",textAlign:"center"}}>
                          <div style={{fontSize:13,fontWeight:600,color:pred.fitColor,lineHeight:1.2}}>{pred.fit}</div>
                          <div style={{fontSize:9,color:"#8b5cf6",letterSpacing:"0.08em",textTransform:"uppercase",marginTop:3}}>Cerrahi Uygunluk</div>
                        </div>
                      </div>

                      {/* Yaklaşım önerisi */}
                      <div style={{background:"white",border:"1px solid #ede9fe",borderRadius:7,padding:"8px 10px",marginBottom:8}}>
                        <div style={{fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:"#8b5cf6",marginBottom:3}}>Önerilen Yaklaşım</div>
                        <div style={{fontSize:13,fontWeight:500,color:"#3730a3",marginBottom:2}}>{pred.approach}</div>
                        <div style={{fontSize:12,color:"#6d28d9",lineHeight:1.5}}>{pred.approachDesc}</div>
                      </div>

                      {/* Explainable — neden bu skor */}
                      {pred.revReasons.length>0&&(
                        <div style={{display:"flex",flexDirection:"column",gap:3}}>
                          <div style={{fontSize:9,letterSpacing:"0.08em",textTransform:"uppercase",color:"#8b5cf6",marginBottom:2}}>Tahmin Gerekçeleri</div>
                          {pred.revReasons.slice(0,2).map((r,i)=>(
                            <div key={i} style={{fontSize:12,color:"#7f1d1d",display:"flex",gap:5,lineHeight:1.45}}>
                              <span style={{flexShrink:0,color:"#dc2626"}}>↑</span>{r.txt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:9,padding:"10px 13px"}}>
                      <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#991b1b",marginBottom:7}}>⚠ Risk Faktörleri</div>
                      <div style={{display:"flex",flexDirection:"column",gap:5}}>
                        {risks.map((r,i)=>(
                          <div key={i} style={{fontSize:13,color:"#7f1d1d",display:"flex",gap:6,lineHeight:1.55}}>
                            <span style={{flexShrink:0,marginTop:1}}>·</span>{r}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{background:"#f0f9f4",border:"1px solid #a7f3d0",borderRadius:9,padding:"10px 13px"}}>
                      <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#065f46",marginBottom:7}}>💬 Konsültasyon Notu</div>
                      <div style={{display:"flex",flexDirection:"column",gap:5}}>
                        {comms.map((c,i)=>(
                          <div key={i} style={{fontSize:13,color:"#064e3b",display:"flex",gap:6,lineHeight:1.55}}>
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
                <div style={{background:"#f0f7ff",border:"1px solid #d4e1ef",borderRadius:9,padding:"9px 12px"}}>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#1e40af",marginBottom:5}}>🤖 Claude Derinlemeli Analiz</div>
                  <div style={{fontSize:13,color:"#1e3a5f",lineHeight:1.75}}>{patient.ai_text}</div>
                </div>
              )}
              {patient.ai_loading&&(
                <div style={{background:"#f0f7ff",border:"1px dashed #d4e1ef",borderRadius:9,padding:"9px 12px",textAlign:"center"}}>
                  <div style={{fontSize:13,color:"#93c5fd",animation:"pulse 1.5s infinite"}}>✦ Claude analizi yükleniyor...</div>
                </div>
              )}
            </div>
            {/* Cross-sell badge */}
            {crossSellDetected&&(
              <div style={{padding:"6px 16px",background:"#f0fdf4",borderTop:"1px solid #a7f3d0",display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontSize:12,color:"#059669",fontWeight:500}}>↗ Cross-sell tespit edildi</div>
                <div style={{fontSize:12,color:"#7b9ab5"}}>{outcomeProcedures.filter(p=>p!==formProc).join(", ")} eklendi</div>
              </div>
            )}
            {/* Referral badge */}
            {a.referralCode&&(
              <div style={{padding:"6px 16px",background:"#f5f3ff",borderTop:"1px solid #ddd6fe",display:"flex",alignItems:"center",gap:6}}>
                <div style={{fontSize:12,color:"#7c3aed",fontWeight:500}}>🔗 Referans kodu: {a.referralCode}</div>
              </div>
            )}

            <div style={{borderTop:"1px solid #d4e1ef",padding:"10px 16px",display:"flex",gap:7,background:"#f8fafd"}}>
              {/* Konsültasyona Başla — en öne */}
              {onConsult&&(
                <button onClick={e=>{e.stopPropagation();onConsult(patient);}} style={{flex:1,padding:"8px",borderRadius:7,fontSize:13,fontWeight:500,border:"none",background:"#1e3a5f",color:"#f8fafd",letterSpacing:"0.04em",cursor:"pointer"}}>
                  ◈ Konsültasyon
                </button>
              )}
              {/* 1. Randevu sonucu */}
              <button onClick={e=>{e.stopPropagation();setShowOutcome(v=>!v);}} style={{flex:1,padding:"8px",borderRadius:7,fontSize:12,fontWeight:400,border:`1px solid ${outcomeProcedures.length>0?"#059669":"#d4e1ef"}`,background:"transparent",color:outcomeProcedures.length>0?"#059669":"#7b9ab5"}}>
                {outcomeProcedures.length>0?"✓ Randevu":"Randevu?"}
              </button>
              {/* 2. Ameliyat oldu mu */}
              {outcomeProcedures.length>0&&(
                <button onClick={e=>{e.stopPropagation();setShowProcedure(v=>!v);setShowSat1m(false);setShowSat6m(false);}}
                  style={{padding:"8px 8px",borderRadius:7,fontSize:12,fontWeight:400,border:`1px solid ${hadProcedure===true?"#059669":hadProcedure===false?"#dc2626":"#d4e1ef"}`,background:"transparent",color:hadProcedure===true?"#059669":hadProcedure===false?"#dc2626":"#7b9ab5",flexShrink:0}}>
                  {hadProcedure===true?"✓ Ameliyat":hadProcedure===false?"✗ Vazgeçti":"Ameliyat?"}
                </button>
              )}
              {/* 3. 1 ay memnuniyet */}
              {hadProcedure===true&&(
                <button onClick={e=>{e.stopPropagation();setShowSat1m(v=>!v);setShowSat6m(false);setShowProcedure(false);}}
                  style={{padding:"8px 8px",borderRadius:7,fontSize:12,fontWeight:400,border:`1px solid ${sat1m?"#059669":"#d4e1ef"}`,background:"transparent",color:sat1m?"#059669":"#7b9ab5",flexShrink:0}}>
                  {sat1m?`1ay:${sat1m.charAt(0)}`:"1 Ay"}
                </button>
              )}
              {/* 4. 6 ay memnuniyet */}
              {hadProcedure===true&&(
                <button onClick={e=>{e.stopPropagation();setShowSat6m(v=>!v);setShowSat1m(false);setShowProcedure(false);}}
                  style={{padding:"8px 8px",borderRadius:7,fontSize:12,fontWeight:400,border:`1px solid ${sat6m?"#1d4ed8":"#d4e1ef"}`,background:"transparent",color:sat6m?"#1d4ed8":"#7b9ab5",flexShrink:0}}>
                  {sat6m?`6ay:${sat6m.charAt(0)}`:"6 Ay"}
                </button>
              )}
              {/* 5. Randevu Yok */}
              {!noAppointment&&(
                <button onClick={e=>{e.stopPropagation();markNoAppointment();}} style={{padding:"8px 8px",borderRadius:7,fontSize:12,fontWeight:400,border:"1px solid #fecaca",background:"transparent",color:"#dc2626",flexShrink:0}}>
                  Gelmedi
                </button>
              )}
              {cls.ambassador&&!ambassadorSent&&(
                <button onClick={e=>{e.stopPropagation();setShowAmbassador(v=>!v);}} style={{flex:1,padding:"8px",borderRadius:7,fontSize:12,fontWeight:400,border:"1px solid #ddd6fe",background:"transparent",color:"#7c3aed"}}>🌟 Elçi</button>
              )}
              {cls.ambassador&&ambassadorSent&&(
                <div style={{flex:1,padding:"8px",borderRadius:7,fontSize:12,textAlign:"center",background:"#f5f3ff",color:"#7c3aed",border:"1px solid #ddd6fe"}}>✓ Elçi</div>
              )}
              {!confirm
                ?<button onClick={e=>{e.stopPropagation();setConfirm(true);}} style={{padding:"8px 12px",borderRadius:7,fontSize:13,border:"1px solid #d4e1ef",background:"transparent",color:"#7b9ab5"}}>Sil</button>
                :<button onClick={e=>{e.stopPropagation();onDelete(patient.id);}} style={{padding:"8px 12px",borderRadius:7,fontSize:13,border:"none",background:"#ef4444",color:"white",fontWeight:500}}>Emin misin?</button>
              }
            </div>



            {/* SEKRETER MODALI */}
            {showOutcome&&(
              <div onClick={e=>e.stopPropagation()} style={{borderTop:"1px solid #d4e1ef",padding:"16px",background:"#eef3f9"}}>
                <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"#7b9ab5",marginBottom:8}}>Randevu Sonucu — Hangi prosedürler planlandı?</div>
                <div style={{fontSize:13,color:"#7b9ab5",marginBottom:10}}>Form prosedürü: <strong style={{color:"#1e3a5f"}}>{formProc}</strong></div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                  {ALL_PROCS.map(p=>{
                    const sel=outcomeProcedures.includes(p);
                    return(
                      <button key={p} onClick={()=>setOutcomeProcedures(prev=>sel?prev.filter(x=>x!==p):[...prev,p])}
                        style={{padding:"5px 11px",borderRadius:20,fontSize:12,border:`1px solid ${sel?"#1e3a5f":"#d4e1ef"}`,background:sel?"#1e3a5f":"transparent",color:sel?"#f8fafd":"#7b9ab5",cursor:"pointer"}}>
                        {p}{p===formProc?" ✓":""}
                      </button>
                    );
                  })}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={saveOutcome} style={{padding:"9px 20px",background:"#1e3a5f",border:"none",borderRadius:7,color:"#f8fafd",fontSize:13,fontWeight:500,cursor:"pointer"}}>Kaydet</button>
                  <button onClick={()=>setShowOutcome(false)} style={{padding:"9px 14px",background:"transparent",border:"1px solid #d4e1ef",borderRadius:7,color:"#7b9ab5",fontSize:13,cursor:"pointer"}}>İptal</button>
                </div>
              </div>
            )}

            {/* AMELİYAT OLDU MU? */}
            {showProcedure&&(
              <div onClick={e=>e.stopPropagation()} style={{borderTop:"1px solid #d4e1ef",padding:"16px",background:"#f0fdf4"}}>
                <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"#059669",marginBottom:12,fontWeight:500}}>Ameliyat Sonucu</div>
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:12,color:"#7b9ab5",marginBottom:6}}>Ameliyat gerçekleşti mi?</div>
                  <div style={{display:"flex",gap:6}}>
                    {[["true","✓ Evet, ameliyat oldu"],["false","✗ Vazgeçti"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setHadProcedure(v==="true")}
                        style={{padding:"7px 14px",borderRadius:20,fontSize:12,border:`1px solid ${String(hadProcedure)===v?"#059669":"#d4e1ef"}`,background:String(hadProcedure)===v?"#059669":"transparent",color:String(hadProcedure)===v?"white":"#7b9ab5",cursor:"pointer"}}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                {hadProcedure===true&&(
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:12,color:"#7b9ab5",marginBottom:6}}>Ameliyat tarihi (isteğe bağlı)</div>
                    <input type="date" value={procedureDate} onChange={e=>setProcedureDate(e.target.value)}
                      style={{padding:"6px 10px",borderRadius:7,border:"1px solid #d4e1ef",fontSize:12,color:"#1e3a5f"}}/>
                  </div>
                )}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={saveProcedure} style={{padding:"8px 18px",background:"#059669",border:"none",borderRadius:7,color:"white",fontSize:13,fontWeight:500,cursor:"pointer"}}>Kaydet</button>
                  <button onClick={()=>setShowProcedure(false)} style={{padding:"8px 14px",background:"transparent",border:"1px solid #d4e1ef",borderRadius:7,color:"#7b9ab5",fontSize:13,cursor:"pointer"}}>İptal</button>
                </div>
              </div>
            )}

            {/* MEMNUNİYET — 1 AY KONTROLÜ */}
            {showSat1m&&(
              <div onClick={e=>e.stopPropagation()} style={{borderTop:"1px solid #d4e1ef",padding:"16px",background:"#f0fdf4"}}>
                <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"#059669",marginBottom:12,fontWeight:500}}>1 Ay Kontrol — Memnuniyet</div>
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:12,color:"#7b9ab5",marginBottom:6}}>Genel memnuniyet</div>
                  <div style={{display:"flex",gap:6}}>
                    {["Memnun","Kısmen","Değil"].map(v=>(
                      <button key={v} onClick={()=>setSat1m(v)}
                        style={{padding:"6px 14px",borderRadius:20,fontSize:12,border:`1px solid ${sat1m===v?"#059669":"#d4e1ef"}`,background:sat1m===v?"#059669":"transparent",color:sat1m===v?"white":"#7b9ab5",cursor:"pointer"}}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:12,color:"#7b9ab5",marginBottom:6}}>Bu kliniği önerir mi?</div>
                  <div style={{display:"flex",gap:6}}>
                    {["Evet","Belki","Hayır"].map(v=>(
                      <button key={v} onClick={()=>setWouldRecommend(v)}
                        style={{padding:"6px 14px",borderRadius:20,fontSize:12,border:`1px solid ${wouldRecommend===v?"#1e3a5f":"#d4e1ef"}`,background:wouldRecommend===v?"#1e3a5f":"transparent",color:wouldRecommend===v?"white":"#7b9ab5",cursor:"pointer"}}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <input type="checkbox" checked={hadRevision} onChange={e=>setHadRevision(e.target.checked)} id="rev1m"/>
                  <label htmlFor="rev1m" style={{fontSize:12,color:"#7b9ab5",cursor:"pointer"}}>Revizyon talebi var</label>
                  {hadRevision&&(
                    <input value={revisionReason} onChange={e=>setRevisionReason(e.target.value)}
                      placeholder="Neden? (isteğe bağlı)" style={{marginLeft:8,padding:"4px 8px",borderRadius:6,border:"1px solid #d4e1ef",fontSize:11,color:"#1e3a5f",width:160}}/>
                  )}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>saveSatisfaction(1)} style={{padding:"8px 18px",background:"#059669",border:"none",borderRadius:7,color:"white",fontSize:13,fontWeight:500,cursor:"pointer"}}>Kaydet</button>
                  <button onClick={()=>setShowSat1m(false)} style={{padding:"8px 14px",background:"transparent",border:"1px solid #d4e1ef",borderRadius:7,color:"#7b9ab5",fontSize:13,cursor:"pointer"}}>İptal</button>
                </div>
              </div>
            )}

            {/* MEMNUNİYET — 6 AY KONTROLÜ */}
            {showSat6m&&(
              <div onClick={e=>e.stopPropagation()} style={{borderTop:"1px solid #d4e1ef",padding:"16px",background:"#eff6ff"}}>
                <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"#1d4ed8",marginBottom:12,fontWeight:500}}>6 Ay Kontrol — Memnuniyet</div>
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:12,color:"#7b9ab5",marginBottom:6}}>Genel memnuniyet</div>
                  <div style={{display:"flex",gap:6}}>
                    {["Memnun","Kısmen","Değil"].map(v=>(
                      <button key={v} onClick={()=>setSat6m(v)}
                        style={{padding:"6px 14px",borderRadius:20,fontSize:12,border:`1px solid ${sat6m===v?"#1d4ed8":"#d4e1ef"}`,background:sat6m===v?"#1d4ed8":"transparent",color:sat6m===v?"white":"#7b9ab5",cursor:"pointer"}}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:12,color:"#7b9ab5",marginBottom:6}}>Bu kliniği önerir mi?</div>
                  <div style={{display:"flex",gap:6}}>
                    {["Evet","Belki","Hayır"].map(v=>(
                      <button key={v} onClick={()=>setWouldRecommend(v)}
                        style={{padding:"6px 14px",borderRadius:20,fontSize:12,border:`1px solid ${wouldRecommend===v?"#1e3a5f":"#d4e1ef"}`,background:wouldRecommend===v?"#1e3a5f":"transparent",color:wouldRecommend===v?"white":"#7b9ab5",cursor:"pointer"}}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <input type="checkbox" checked={hadRevision} onChange={e=>setHadRevision(e.target.checked)} id="rev6m"/>
                  <label htmlFor="rev6m" style={{fontSize:12,color:"#7b9ab5",cursor:"pointer"}}>Revizyon talebi var</label>
                  {hadRevision&&(
                    <input value={revisionReason} onChange={e=>setRevisionReason(e.target.value)}
                      placeholder="Neden? (isteğe bağlı)" style={{marginLeft:8,padding:"4px 8px",borderRadius:6,border:"1px solid #d4e1ef",fontSize:11,color:"#1e3a5f",width:160}}/>
                  )}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>saveSatisfaction(6)} style={{padding:"8px 18px",background:"#1d4ed8",border:"none",borderRadius:7,color:"white",fontSize:13,fontWeight:500,cursor:"pointer"}}>Kaydet</button>
                  <button onClick={()=>setShowSat6m(false)} style={{padding:"8px 14px",background:"transparent",border:"1px solid #d4e1ef",borderRadius:7,color:"#7b9ab5",fontSize:13,cursor:"pointer"}}>İptal</button>
                </div>
              </div>
            )}

            {/* MARKA ELÇİSİ MODALI */}
            {showAmbassador&&(
              <div onClick={e=>e.stopPropagation()} style={{borderTop:"1px solid #ddd6fe",padding:"16px",background:"#faf5ff"}}>
                <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"#7c3aed",marginBottom:10}}>Marka Elçisi Paketi</div>
                <div style={{fontSize:13,color:"#5b21b6",marginBottom:12,lineHeight:1.6}}>
                  <strong>{a.name}</strong> marka elçisi profiline sahip. Referans kodu oluşturulacak ve hastaya iletilecek.
                </div>
                <div style={{background:"#ede9fe",border:"1px solid #ddd6fe",borderRadius:8,padding:"10px 12px",marginBottom:14}}>
                  <div style={{fontSize:12,color:"#7c3aed",marginBottom:5,fontWeight:500}}>Pakete dahil:</div>
                  <div style={{fontSize:13,color:"#5b21b6",lineHeight:1.7}}>✓ Kişisel referans kodu<br/>✓ Getirdiği her hasta için klinik avantajı<br/>✓ VIP konsültasyon önceliği</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={sendAmbassador} style={{padding:"9px 20px",background:"#7c3aed",border:"none",borderRadius:7,color:"white",fontSize:13,fontWeight:500,cursor:"pointer"}}>Kodu Oluştur ve Gönder</button>
                  <button onClick={()=>setShowAmbassador(false)} style={{padding:"9px 14px",background:"transparent",border:"1px solid #ddd6fe",borderRadius:7,color:"#7c3aed",fontSize:13,cursor:"pointer"}}>İptal</button>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

/* ─── CONSULTATION MODE ──────────────────────────────────────────────────── */
function ConsultationMode({patient, onClose, mode}){
  const a=patient.answers||{};
  const score=patient.risk_score||0;
  const clinicThreshold=(clinicModelCache[patient.doctor_id]?.threshold)||60;
  const effectiveThreshold=getEffectiveThreshold(clinicThreshold, mode||'balanced');
  const cls=classify(score,a,effectiveThreshold);
  const pred=predictOutcomes(score,a);
  const name=a.name||"Hasta";
  const proc=a.procedure||"İşlem";

  const C={red:"#dc2626",amber:"#d97706",green:"#059669"};
  // Konuşulacaklar — risk sinyallerinden otomatik üret
  const talkingPoints=[];
  if(a.rhinoVision==="Aklımda belirli bir referans var — bir ünlü veya fotoğraf")
    talkingPoints.push({text:"Referans beklentisini netleştir",sub:"Aklında belirli bir referans olduğunu belirtti — kendi yüz yapısına uygun sonucu açıkla"});
  if(a.revision==="Kusursuz sonuç bekliyorum")
    talkingPoints.push({text:"Revizyon ihtimali konuşması",sub:"Kusursuz sonuç beklentisi var — revizyonun nadir ama olası bir süreç olduğunu çerçeveleyerek aktarabilirsin"});
  if(a.breastSymmetry==="Çok küçük bir fark var ama bu küçük fark bile beni rahatsız ediyor")
    talkingPoints.push({text:"Simetri beklentisini çerçevele",sub:"Mevcut asimetri küçük ama çok rahatsız ediyor — memeler kardeştir, ikiz değildir"});
  if(a.expectation?.includes("Tamamen farklı"))
    talkingPoints.push({text:"Beklenti yönetimi",sub:"Tamamen farklı görünmek istiyor — mümkün olan değişimi fotoğraflarla somutlaştır"});
  if(["Yakınlarımın yorumları etkili oldu","Başka insanların yorumları beni kötü etkiliyor"].some(x=>a.motivation===x))
    talkingPoints.push({text:"Motivasyonu netleştir",sub:"Dışsal baskı bileşeni var — kendi isteği mi çevre baskısı mı olduğunu anlamak değerli"});
  if(a.decisionDuration==="Uzun süredir düşünüyorum ama hâlâ kararsız hissediyorum")
    talkingPoints.push({text:"Karar netliği yok",sub:"Uzun süredir düşünüyor ama hâlâ kararsız — ne engelliyor? Bilgi mi, destek mi, korku mu?"});
  if(a.decisionDuration==="Yeni karar verdim — heyecanlı ve kararlı hissediyorum")
    talkingPoints.push({text:"Acele karar sinyali",sub:"Çok yeni karar — heyecanın yerini gerçekçi beklenti almalı, süreci iyi anlat"});
  if((a.otherAreas&&a.otherAreas!=="Hayır, sadece bu bölge")||(a.otherConsidered&&a.otherConsidered!=="Hayır")){
    const crossSuggs = getCrossSellSuggestion(a);
    if(crossSuggs.length>0){
      talkingPoints.push({text:"Ek işlem fırsatı",sub:`${crossSuggs[0].proc} — %${crossSuggs[0].prob} ihtimal (${crossSuggs[0].reason})`});
    } else {
      talkingPoints.push({text:"Ek işlem sinyali",sub:`Başka bölge ilgisi var — ${a.otherAreas||a.otherConsidered}`});
    }
  } else {
    // Prosedüre göre otomatik cross-sell önerisi
    const crossSuggs = getCrossSellSuggestion(a);
    if(crossSuggs.length>0){
      talkingPoints.push({text:"Cross-sell fırsatı",sub:`${crossSuggs[0].proc} sorulabilir — %${crossSuggs[0].prob} ihtimal`});
    }
  }
  if(talkingPoints.length===0)
    talkingPoints.push({text:"Standart konsültasyon",sub:"Belirgin risk sinyali yok — beklentiyi teyit et, süreci anlat"});

  // Risk sinyalleri
  const flags=[];
  if(a.rhinoVision==="Aklımda belirli bir referans var — bir ünlü veya fotoğraf") flags.push({txt:"Belirli bir referans var — kendi yüzüne uygun sonuç değil, başka birinin özelliğini istiyor olabilir",sev:"red"});
  if(a.revision==="Kusursuz sonuç bekliyorum") flags.push({txt:"Kusursuz sonuç beklentisi — revizyon ihtimalini kabul etmiyor",sev:"red"});
  if(a.breastSymmetry==="Çok küçük bir fark var ama bu küçük fark bile beni rahatsız ediyor") flags.push({txt:"Küçük asimetri bile rahatsız ediyor — postop memnuniyetsizlik riski yüksek",sev:"red"});
  if(["Yakınlarımın yorumları etkili oldu","Başka insanların yorumları beni kötü etkiliyor"].some(x=>a.motivation===x)) flags.push({txt:"Dışsal motivasyon bileşeni var",sev:"amber"});
  if(a.multiDoctor==="Birçok doktora danıştım") flags.push({txt:"Birçok doktora danışmış — kararsızlık veya yüksek standart",sev:"amber"});
  if(a.support?.includes("Kimseye")||a.support?.includes("karşılar")) flags.push({txt:"Sosyal destek zayıf — iyileşme sürecinde yalnız kalabilir",sev:"amber"});
  if(flags.length===0) flags.push({txt:"Belirgin risk sinyali saptanmadı",sev:"green"});

  return(
    <div style={{position:"fixed",inset:0,background:"#f8fafd",zIndex:1000,display:"flex",flexDirection:"column",fontFamily:"'Nunito',sans-serif"}}>

      {/* TOPBAR */}
      <div style={{background:"#1e3a5f",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
          <div style={{width:7,height:7,background:"#2d5a8e",borderRadius:"50%",flexShrink:0}}/>
          <div style={{minWidth:0}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:"#f8fafd",fontWeight:300,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
            <div style={{fontSize:11,color:"rgba(245,240,232,0.4)",marginTop:1}}>{a.age&&`${a.age} yaş · `}{proc}</div>
          </div>
          <div style={{padding:"2px 8px",borderRadius:20,background:cls.bg,border:`1px solid ${cls.border}`,fontSize:11,fontWeight:500,color:cls.textColor,flexShrink:0}}>{cls.icon}</div>
        </div>
        <button onClick={onClose} style={{background:"rgba(245,240,232,0.12)",color:"#f8fafd",border:"1px solid rgba(245,240,232,0.2)",borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:500,cursor:"pointer",flexShrink:0,marginLeft:8}}>
          ← Geri
        </button>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflowY:"auto",padding:"14px 14px",maxWidth:720,margin:"0 auto",width:"100%"}}>

        {/* 3 metrik */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
          {[
            {val:`${pred.rev}%`,lbl:"Revizyon Riski",color:pred.rev>=50?"#dc2626":pred.rev>=30?"#d97706":"#059669",bg:pred.rev>=50?"#fef2f2":pred.rev>=30?"#fffbeb":"#ecfdf5",border:pred.rev>=50?"#fecaca":pred.rev>=30?"#fde68a":"#a7f3d0"},
            {val:pred.fit,lbl:"Uygunluk",color:pred.fitColor,bg:pred.fitBg,border:`${pred.fitColor}44`},
          ].map((m,i)=>(
            <div key={i} style={{background:m.bg,border:`1px solid ${m.border}`,borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
              <div style={{fontSize:i===2?11:20,fontWeight:600,color:m.color,lineHeight:1.1,fontVariantNumeric:"lining-nums"}}>{m.val}</div>
              <div style={{fontSize:8,color:m.color,opacity:0.7,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:3}}>{m.lbl}</div>
            </div>
          ))}
        </div>

        {/* Yaklaşım önerisi */}
        <div style={{background:"#eff6ff",border:"1px solid #c4b5fd",borderRadius:10,padding:"11px 14px",marginBottom:16,display:"flex",gap:10,alignItems:"flex-start"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#7c3aed",marginTop:5,flexShrink:0}}/>
          <div>
            <div style={{fontSize:12,fontWeight:500,color:"#5b21b6",marginBottom:2}}>{pred.approach}</div>
            <div style={{fontSize:13,color:"#6d28d9",lineHeight:1.55}}>{pred.approachDesc}</div>
          </div>
        </div>

        {/* Konuşulacaklar */}
        <div style={{fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:"#7b9ab5",fontWeight:500,marginBottom:8}}>Bugün Konuşulacaklar</div>
        <div style={{background:"white",border:"1px solid #d4e1ef",borderRadius:10,marginBottom:16,overflow:"hidden"}}>
          {talkingPoints.map((t,i)=>(
            <div key={i} style={{display:"flex",gap:12,padding:"12px 14px",borderBottom:i<talkingPoints.length-1?"1px solid #eef3f9":"none"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:"#1d4ed8",color:"#f8fafd",fontSize:12,fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
              <div>
                <div style={{fontSize:13,fontWeight:500,color:"#1e3a5f",marginBottom:2}}>{t.text}</div>
                <div style={{fontSize:13,color:"#7b9ab5",lineHeight:1.55}}>{t.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Risk sinyalleri */}
        <div style={{fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:"#7b9ab5",fontWeight:500,marginBottom:8}}>Risk Sinyalleri</div>
        <div style={{background:"white",border:"1px solid #d4e1ef",borderRadius:10,overflow:"hidden"}}>
          {flags.map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 14px",borderBottom:i<flags.length-1?"1px solid #eef3f9":"none",background:f.sev==="green"?"#f0fdf4":"white"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:C[f.sev],marginTop:4,flexShrink:0}}/>
              <div style={{fontSize:13,color:f.sev==="red"?"#7f1d1d":f.sev==="amber"?"#78350f":"#065f46",lineHeight:1.55}}>{f.txt}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

/* ─── VALUE SCREEN ───────────────────────────────────────────────────────── */
function ValueScreen({patients,doctor}){
  const total=patients.length;
  const crossSells=patients.filter(p=>p.outcome_procedures&&p.outcome_procedures.length>0&&p.outcome_procedures.some(x=>x!==(p.answers?.procedure||""))).length;
  const noAppt=patients.filter(p=>p.no_appointment).length;
  const ambassadors=patients.filter(p=>p.ambassador_code&&p.ambassador_code!=="").length;
  const withOutcome=patients.filter(p=>p.outcome_procedures?.length>0).length;
  const donusum=total?Math.round(withOutcome/total*100):0;
  const C={border:"#d4e1ef",muted:"#7b9ab5"};
  const cardS={background:"#eef3f9",border:"1px solid #d4e1ef",borderRadius:10,padding:"16px 20px"};
  return(
    <div style={{flex:1,overflowY:"auto",padding:"24px 32px"}}>
      <div style={{marginBottom:24}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:34,fontWeight:300,color:"#1e3a5f",letterSpacing:"-0.01em",marginBottom:4}}>SculptAI'ın <em>Katkısı</em></div>
        <div style={{fontSize:13,color:C.muted}}>{total} hasta · Gerçek veriye dayalı</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        {[
          {accent:"#059669",icon:"↗",title:"Cross-Sell",sub:"Ek prosedür planlanan",val:crossSells,unit:" hasta",note:total?`Hastaların %${Math.round(crossSells/total*100)}'inde`:"Veri yok",color:"#059669"},
          {accent:"#1d4ed8",icon:"🛡",title:"Risk Filtresi",sub:"Randevu alınmadı",val:noAppt,unit:" hasta",note:noAppt>0?"Konsültasyon boşa gitmedi":"Henüz işaretlenmedi",color:"#1d4ed8"},
          {accent:"#1e3a5f",icon:"📋",title:"Dönüşüm",sub:"Randevu girilmiş",val:withOutcome>0?`%${donusum}`:"—",unit:"",note:withOutcome>0?`${withOutcome}/${total} hasta`:"Outcome girilince hesaplanır",color:"#1e3a5f"},
        ].map((k,i)=>(
          <div key={i} style={{...cardS,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.accent}}/>
            <div style={{fontSize:17,marginBottom:8}}>{k.icon}</div>
            <div style={{fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:C.muted,marginBottom:4,fontWeight:500}}>{k.title}</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:10}}>{k.sub}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:40,fontWeight:300,fontVariantNumeric:"lining-nums",color:k.color,lineHeight:1,letterSpacing:"-0.02em",marginBottom:2}}>{k.val}<span style={{fontSize:16}}>{k.unit}</span></div>
            <div style={{fontSize:12,fontWeight:500,color:k.color,marginTop:4}}>{k.note}</div>
          </div>
        ))}
      </div>
      {crossSells>0&&(
        <div style={{...cardS,marginBottom:12}}>
          <div style={{fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:C.muted,marginBottom:12,fontWeight:500}}>Cross-Sell Detayı</div>
          {patients.filter(p=>p.outcome_procedures?.length>0&&p.outcome_procedures.some(x=>x!==(p.answers?.procedure||""))).slice(0,5).map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,paddingBottom:10,marginBottom:10,borderBottom:"1px solid #d4e1ef"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:"#1e3a5f",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.answers?.name||"Hasta"}</div>
              <div style={{fontSize:12,color:C.muted,flexShrink:0}}>{p.answers?.procedure}</div>
              <div style={{fontSize:12,color:C.muted,flexShrink:0}}>→</div>
              <div style={{fontSize:12,color:"#059669",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.outcome_procedures.filter(x=>x!==p.answers?.procedure).join(", ")}</div>
            </div>
          ))}
        </div>
      )}
      <div style={cardS}>
        <div style={{fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:C.muted,marginBottom:10,fontWeight:500}}>Marka Elçisi Programı</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[["Aktif Elçi",ambassadors],["Kod Gönderildi",patients.filter(p=>p.ambassador_sent).length],["Referansla Gelen",patients.filter(p=>p.answers?.referralCode).length]].map(([lbl,val])=>(
            <div key={lbl} style={{background:"#f8fafd",borderRadius:8,padding:"12px 14px",textAlign:"center"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:300,fontVariantNumeric:"lining-nums",color:"#7c3aed",lineHeight:1,marginBottom:3}}>{val}</div>
              <div style={{fontSize:11,color:C.muted}}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── SETTINGS SCREEN ────────────────────────────────────────────────────── */
function SettingsScreen({doctor,onLogout,newU,setNewU,newP,setNewP,newP2,setNewP2,pwErr,setPwErr,saveNewCreds,confirmClear,setConfirmClear,clearAll,clinicName,setClinicName,clinicSaved,saveClinicName,thresholdMode,setThresholdMode}){
  const C={border:"#d4e1ef",muted:"#7b9ab5"};
  const cardS={background:"#eef3f9",border:"1px solid #d4e1ef",borderRadius:10,padding:"18px 20px",marginBottom:12};
  return(
    <div style={{flex:1,overflowY:"auto",padding:"24px 32px",maxWidth:520}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:34,fontWeight:300,color:"#1e3a5f",marginBottom:24,letterSpacing:"-0.01em"}}>Ayarlar</div>

      {/* THRESHOLD MODE */}
      <div style={cardS}>
        <div style={{fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:C.muted,marginBottom:4,fontWeight:500}}>Risk Hassasiyeti</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Sistmin kaç hastayı kırmızı işaretleyeceğini belirler.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
          {Object.values(THRESHOLD_MODES).map(m=>(
            <button key={m.key} onClick={()=>{setThresholdMode(m.key);localStorage.setItem('threshold_mode',m.key);}}
              style={{padding:"12px 8px",borderRadius:10,border:`2px solid ${thresholdMode===m.key?m.color:C.border}`,
                background:thresholdMode===m.key?m.bg:"white",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:4}}>{m.icon}</div>
              <div style={{fontSize:12,fontWeight:500,color:thresholdMode===m.key?m.color:"#1e3a5f"}}>{m.label}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:2,lineHeight:1.3}}>{m.description}</div>
            </button>
          ))}
        </div>
        <div style={{fontSize:11,color:"#2d5a8e",background:THRESHOLD_MODES[thresholdMode||"balanced"].bg,
          border:`1px solid ${THRESHOLD_MODES[thresholdMode||"balanced"].border}`,
          borderRadius:7,padding:"8px 12px",lineHeight:1.6}}>
          <strong style={{color:THRESHOLD_MODES[thresholdMode||"balanced"].color}}>
            {THRESHOLD_MODES[thresholdMode||"balanced"].label}:
          </strong> {THRESHOLD_MODES[thresholdMode||"balanced"].hint}
        </div>
      </div>

      <div style={{fontFamily:"'Playfair Display',serif",fontSize:34,fontWeight:300,color:"#1e3a5f",marginBottom:24,letterSpacing:"-0.01em"}}></div>
      <div style={cardS}>
        <div style={{fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:C.muted,marginBottom:12,fontWeight:500}}>Klinik Bilgileri</div>
        {[["Doktor",doctor.name],["Kullanıcı Adı",doctor.username]].map(([lbl,val])=>(
          <div key={lbl} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #d4e1ef"}}>
            <div style={{fontSize:13,color:C.muted}}>{lbl}</div>
            <div style={{fontSize:13,color:"#1e3a5f",fontWeight:500}}>{val}</div>
          </div>
        ))}
        {/* Düzenlenebilir klinik adı */}
        <div style={{padding:"10px 0",borderBottom:"1px solid #d4e1ef"}}>
          <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:C.muted,marginBottom:6}}>Klinik Adı</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input
              value={clinicName}
              onChange={e=>setClinicName(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&saveClinicName()}
              placeholder="Klinik adı girin..."
              style={{flex:1,padding:"8px 10px",background:"#f8fafd",border:"1px solid #d4e1ef",borderRadius:7,fontSize:13,color:"#1e3a5f",outline:"none"}}
            />
            <button onClick={saveClinicName} style={{padding:"8px 14px",background:"#1e3a5f",border:"none",borderRadius:7,color:"#f8fafd",fontSize:13,fontWeight:500,cursor:"pointer",whiteSpace:"nowrap"}}>
              {clinicSaved?"✓ Kaydedildi":"Kaydet"}
            </button>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0"}}>
          <div style={{fontSize:13,color:C.muted}}>Form Linki</div>
          <button onClick={()=>navigator.clipboard?.writeText(`${window.location.origin}/form/${doctor.id}`)} style={{fontSize:12,color:"#1d4ed8",border:"none",background:"transparent",cursor:"pointer",textDecoration:"underline"}}>Kopyala</button>
        </div>
      </div>
      <div style={cardS}>
        <div style={{fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:C.muted,marginBottom:12,fontWeight:500}}>Şifre Değiştir</div>
        {[["Yeni Kullanıcı Adı",newU,setNewU,"text"],["Yeni Şifre",newP,setNewP,"password"],["Şifre Tekrar",newP2,setNewP2,"password"]].map(([lbl,val,set,type])=>(
          <div key={lbl} style={{marginBottom:10}}>
            <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:C.muted,marginBottom:5}}>{lbl}</div>
            <input type={type} value={val} onChange={e=>set(e.target.value)} style={{width:"100%",padding:"10px 12px",background:"#f8fafd",border:"1px solid #d4e1ef",borderRadius:7,fontSize:13,color:"#1e3a5f",outline:"none"}}/>
          </div>
        ))}
        {pwErr&&<div style={{fontSize:13,color:"#dc2626",marginBottom:8}}>{pwErr}</div>}
        <button onClick={saveNewCreds} style={{padding:"9px 20px",background:"#1e3a5f",border:"none",borderRadius:7,color:"#f8fafd",fontSize:13,fontWeight:500,cursor:"pointer",letterSpacing:"0.05em"}}>Kaydet</button>
      </div>
      <div style={{...cardS,border:"1px solid #fecaca"}}>
        <div style={{fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:"#dc2626",marginBottom:12,fontWeight:500}}>Tehlikeli Alan</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontSize:13,color:C.muted}}>Tüm hasta verilerini sil</div>
          {!confirmClear
            ?<button onClick={()=>setConfirmClear(true)} style={{padding:"7px 14px",border:"1px solid #fecaca",borderRadius:7,fontSize:13,color:"#dc2626",background:"transparent",cursor:"pointer"}}>Verileri Temizle</button>
            :<div style={{display:"flex",gap:8}}>
              <button onClick={clearAll} style={{padding:"7px 14px",background:"#dc2626",border:"none",borderRadius:7,fontSize:13,color:"white",cursor:"pointer",fontWeight:500}}>Evet, sil</button>
              <button onClick={()=>setConfirmClear(false)} style={{padding:"7px 14px",border:"1px solid #d4e1ef",borderRadius:7,fontSize:13,color:C.muted,background:"transparent",cursor:"pointer"}}>İptal</button>
            </div>
          }
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:13,color:C.muted}}>Oturumu kapat</div>
          <button onClick={onLogout} style={{padding:"7px 14px",border:"1px solid #d4e1ef",borderRadius:7,fontSize:13,color:C.muted,background:"transparent",cursor:"pointer"}}>Çıkış Yap</button>
        </div>
      </div>
    </div>
  );
}

/* ─── DOCTOR PANEL ───────────────────────────────────────────────────────── */
function Analytics({patients}){
  const total=patients.length;
  if(total===0) return(
    <div style={{textAlign:"center",padding:"60px 20px",color:"#7b9ab5"}}>
      <div style={{fontSize:40,marginBottom:14}}>📊</div>
      <div style={{fontSize:16,color:"#2d5a8e",marginBottom:8}}>Henüz veri yok</div>
      <div style={{fontSize:13}}>İlk hasta formu doldurulunca istatistikler burada görünecek</div>
    </div>
  );

  // Segment — classify() ile tutarlı
  const segCounts={red:0,amber:0,green:0,ambassador:0};
  patients.forEach(p=>{
    const c=classify(p.risk_score||0,p.answers||{});
    segCounts[c.cat]=(segCounts[c.cat]||0)+1;
  });
  const red=segCounts.red;
  const amber=segCounts.amber;
  const green=segCounts.green;
  const amb=segCounts.ambassador;

  const avgRisk=total?Math.round(patients.reduce((s,p)=>s+(p.risk_score||0),0)/total):0;
  const fitRate=total?Math.round((green+amb)/total*100):0;

  // Outcome metrikleri
  const withOutcome=patients.filter(p=>p.outcome_procedures?.length>0);
  const donusum=total?Math.round(withOutcome.length/total*100):0;
  const crossSellCount=patients.filter(p=>p.outcome_procedures?.length>0&&p.outcome_procedures.some(x=>x!==(p.answers?.procedure||""))).length;

  // Prosedür
  const procMap={};
  patients.forEach(p=>{const pr=p.answers?.procedure||"Diğer";procMap[pr]=(procMap[pr]||0)+1;});
  const procs=Object.entries(procMap).sort((a,b)=>b[1]-a[1]).slice(0,6);

  // Kaynak
  const srcMap={};
  patients.forEach(p=>{
    const s=p.answers?.source||"Diğer";
    const short=s.includes("tavsiye")?"Hasta tavsiyesi":s.includes("Hacettepe")?"Hacettepe itibarı":s.includes("Google")?"Google":s.includes("Instagram")?"Instagram":"Diğer";
    srcMap[short]=(srcMap[short]||0)+1;
  });
  const sources=Object.entries(srcMap).sort((a,b)=>b[1]-a[1]);

  // Son 7 gün
  const now=Date.now();
  const dayMs=86400000;
  const bins=Array(7).fill(0);
  patients.forEach(p=>{
    const d=now-(new Date(p.created_at||now).getTime());
    const idx=Math.floor(d/dayMs);
    if(idx>=0&&idx<7) bins[6-idx]++;
  });
  const maxBin=Math.max(...bins,1);

  // Motivasyon dağılımı
  const extMotivCount=patients.filter(p=>
    ["Yakınlarımın yorumları etkili oldu","Başka insanların yorumları beni kötü etkiliyor"].some(x=>p.answers?.motivation===x)
  ).length;
  const intMotivCount=patients.filter(p=>
    ["Kendim için daha iyi hissetmek istiyorum","Özgüvenimi artırmak istiyorum"].some(x=>p.answers?.motivation===x)
  ).length;

  // Revizyon riski dağılımı
  const kusursuzCount=patients.filter(p=>p.answers?.revision==="Kusursuz sonuç bekliyorum").length;
  const noSupportCount=patients.filter(p=>["Kimseye söylemedim","Karşılar"].some(x=>p.answers?.support===x)).length;

  // Sistem içgörüleri — gerçek veriden
  const insights=[];

  if(total>=5){
    if(fitRate>=70)
      insights.push({type:"green",title:"Uygun profil oranı güçlü",body:`Hastaların %${fitRate}'i uygun veya marka elçisi segmentinde. Klinik profil seçimi başarılı görünüyor.`});
    else if(fitRate<40)
      insights.push({type:"warn",title:"Uygun profil oranı düşük",body:`Hastaların yalnızca %${fitRate}'i düşük riskli segmente giriyor. Hasta yönlendirme kanalları gözden geçirilebilir.`});

    if(red/total>0.25)
      insights.push({type:"warn",title:`Yüksek riskli hasta oranı dikkat çekiyor`,body:`Hastaların %${Math.round(red/total*100)}'i kritik segmente giriyor. Konsültasyon öncesi ek beklenti yönetimi faydalı olabilir.`});

    if(kusursuzCount>0)
      insights.push({type:"warn",title:`${kusursuzCount} hasta kusursuz sonuç bekliyor`,body:"Bu hastalarda revizyon konuşması konsültasyonun önceliği olmalı — beklenti yönetimi kritik."});

    if(extMotivCount>0&&total>=5)
      insights.push({type:"warn",title:`${extMotivCount} hastada dışsal motivasyon sinyali`,body:`%${Math.round(extMotivCount/total*100)} oranında dışsal baskı tespit edildi. Bu profil revizyon riskiyle ilişkili.`});

    if(amb>0)
      insights.push({type:"info",title:`${amb} marka elçisi adayı`,body:"Bu hastaları referans programına davet etmek organik büyümeye katkı sağlayabilir."});

    if(noSupportCount>0)
      insights.push({type:"warn",title:`${noSupportCount} hasta kararını çevresinden saklıyor`,body:"Bu hastalarda iyileşme sürecinde yalnız kalma riski var — konsültasyonda destek sistemi konuşulabilir."});

    if(withOutcome.length>0)
      insights.push({type:"green",title:`%${donusum} dönüşüm oranı`,body:`${withOutcome.length} hastada randevu outcome'u girilmiş. Daha doğru analiz için tüm hastaların outcome'unu girmek değerli.`});

    if(crossSellCount>0)
      insights.push({type:"green",title:`${crossSellCount} cross-sell gerçekleşti`,body:"Birden fazla işlem planlanan hastalar sistemdeki form sinyalleriyle örtüşüyor mu karşılaştırılabilir."});

    const topProc=procs[0];
    if(topProc&&topProc[1]/total>0.3)
      insights.push({type:"info",title:`${topProc[0]} dominant prosedür`,body:`Hastaların %${Math.round(topProc[1]/total*100)}'i bu işlem için başvuruyor. Segmente özel optimizasyon düşünülebilir.`});
  }

  if(insights.length===0)
    insights.push({type:"info",title:"Veri birikiminde",body:"İçgörüler en az 5 hasta kaydından sonra otomatik oluşmaya başlar."});

  const days=["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];
  const today=new Date().getDay();
  const dayLabels=Array(7).fill(0).map((_,i)=>days[(today-6+i+7)%7]);

  const C={card:"#f8fafd",border:"#f1f3f5",muted:"#7b9ab5",navy:"#1e3a5f"};
  const card=(extra={})=>({background:C.card,border:`1.5px solid ${C.border}`,borderRadius:12,padding:16,...extra});

  return(
    <div style={{padding:"20px 28px 24px",overflowY:"auto",flex:1}}>

      {/* KPI ROW */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:18}}>
        {[
          {val:total,lbl:"Toplam Hasta",color:"#1e3a5f",grad:"linear-gradient(90deg,#1e3a5f,#2d5a8e)",note:`Ort. risk: ${avgRisk}`},
          {val:fitRate+"%",lbl:"Uygun Profil Oranı",color:"#10b981",grad:"linear-gradient(90deg,#10b981,#2d5a8e)",note:`${green+amb} hasta`},
          {val:red,lbl:"Dikkat Gerektiren",color:"#ef4444",grad:"linear-gradient(90deg,#ef4444,#f97316)",note:`%${Math.round(red/total*100)} oranında`},
          {val:amb,lbl:"Marka Elçisi Adayı",color:"#8b5cf6",grad:"linear-gradient(90deg,#8b5cf6,#a78bfa)",note:"Referans potansiyeli"},
        ].map(k=>(
          <div key={k.lbl} style={{...card(),position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:k.grad}}/>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,lineHeight:1,marginBottom:3,color:k.color}}>{k.val}</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:4}}>{k.lbl}</div>
            <div style={{fontSize:13,fontWeight:500,color:k.color}}>{k.note}</div>
          </div>
        ))}
      </div>

      {/* TREND + SEGMENT */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>

        {/* Weekly trend */}
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"#2d5a8e",marginBottom:12}}>Son 7 Gün</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:6,height:70,marginBottom:6}}>
            {bins.map((v,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{fontSize:11,color:C.muted,fontWeight:500}}>{v||""}</div>
                <div style={{width:"100%",borderRadius:4,background:v>0?"#1e3a5f":"#d4e1ef",height:`${Math.max(4,Math.round(v/maxBin*52))}px`,transition:"height 0.4s ease"}}/>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:6}}>
            {dayLabels.map((d,i)=><div key={i} style={{flex:1,textAlign:"center",fontSize:11,color:C.muted}}>{d}</div>)}
          </div>
        </div>

        {/* Segment dist */}
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"#2d5a8e",marginBottom:12}}>Segment Dağılımı</div>
          {[
            {label:"🟢 Uygun Görünüyor",count:green,color:"#10b981"},
            {label:"🟡 Değerlendirme",count:amber,color:"#f59e0b"},
            {label:"🔴 Dikkat",count:red,color:"#ef4444"},
            {label:"🌟 Marka Elçisi",count:amb,color:"#8b5cf6"},
          ].map(s=>(
            <div key={s.label} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
              <div style={{fontSize:13,color:"#2d5a8e",width:130,flexShrink:0}}>{s.label}</div>
              <div style={{flex:1,height:7,background:"#d4e1ef",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:4,background:s.color,width:`${total?Math.round(s.count/total*100):0}%`,transition:"width 0.8s ease"}}/>
              </div>
              <div style={{fontSize:13,fontWeight:600,color:s.color,minWidth:22,textAlign:"right"}}>{s.count}</div>
              <div style={{fontSize:12,color:C.muted,minWidth:28,textAlign:"right"}}>{total?Math.round(s.count/total*100):0}%</div>
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
          <div style={{fontSize:13,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"#2d5a8e",marginBottom:12}}>En Sık Prosedürler</div>
          {procs.map(([name,count])=>(
            <div key={name} style={{display:"flex",alignItems:"center",gap:8,paddingBottom:7,borderBottom:"1px solid #eef3f9",marginBottom:7}}>
              <div style={{flex:1,fontSize:13,color:"#2d5a8e",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{name}</div>
              <div style={{width:70,height:5,background:"#d4e1ef",borderRadius:3,overflow:"hidden",flexShrink:0}}>
                <div style={{height:"100%",borderRadius:3,background:"linear-gradient(90deg,#1e3a5f,#2d5a8e)",width:`${Math.round(count/procs[0][1]*100)}%`}}/>
              </div>
              <div style={{fontSize:13,fontWeight:600,color:C.navy,minWidth:20,textAlign:"right"}}>{count}</div>
              <div style={{fontSize:12,color:C.muted,minWidth:28,textAlign:"right"}}>{Math.round(count/total*100)}%</div>
            </div>
          ))}
        </div>

        {/* Auto insights */}
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"#2d5a8e",marginBottom:12}}>Sistem İçgörüleri</div>
          {insights.length===0&&<div style={{fontSize:13,color:C.muted}}>Daha fazla veri geldikçe içgörüler burada görünecek.</div>}
          {insights.map((ins,i)=>{
            const colors={green:{bg:"#f0fdf4",border:"#a7f3d0",title:"#065f46",body:"#047857"},warn:{bg:"#fffbeb",border:"#fde68a",title:"#92400e",body:"#b45309"},info:{bg:"#eef3f9",border:"#d4e1ef",title:"#1e40af",body:"#2563eb"}};
            const c=colors[ins.type]||colors.info;
            return(
              <div key={i} style={{background:c.bg,border:`1.5px solid ${c.border}`,borderRadius:10,padding:"10px 12px",marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:600,color:c.title,marginBottom:3}}>{ins.title}</div>
                <div style={{fontSize:13,color:c.body,lineHeight:1.55}}>{ins.body}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SOURCE */}
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"#2d5a8e",marginBottom:12}}>Hasta Kaynakları</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {sources.map(([src,cnt])=>(
            <div key={src} style={{background:"#eef3f9",border:"1px solid #d4e1ef",borderRadius:10,padding:"10px 14px",textAlign:"center",minWidth:90}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:C.navy,lineHeight:1}}>{cnt}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:3}}>{src}</div>
              <div style={{fontSize:12,fontWeight:600,color:"#1e3a5f",marginTop:2}}>{Math.round(cnt/total*100)}%</div>
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
  const [thresholdMode,setThresholdMode]=useState(()=>localStorage.getItem('threshold_mode')||'balanced');
  const [tab,setTab]=useState("patients"); // patients | analytics | value | settings
  const [consultPatient,setConsultPatient]=useState(null); // konsültasyon modu
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
  const [clinicName,setClinicName]=useState(doctor.clinic_name||"");
  const [clinicSaved,setClinicSaved]=useState(false);

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

  async function saveClinicName(){
    if(!clinicName.trim())return;
    await sb.from("doctors").update({clinic_name:clinicName.trim()}).eq("id",doctor.id);
    try{const saved=JSON.parse(sessionStorage.getItem("sculpt_doctor")||"{}");sessionStorage.setItem("sculpt_doctor",JSON.stringify({...saved,clinic_name:clinicName.trim()}));}catch{}
    setClinicSaved(true);setTimeout(()=>setClinicSaved(false),2500);
  }

  const today=new Date().toLocaleDateString("tr-TR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

  // Anlamlı KPI hesapları
  const total=patients.length;
  const kritik=patients.filter(p=>{const c=classify(p.risk_score||0,p.answers||{});return c.cat==="red";}).length;
  const randevuAlan=patients.filter(p=>p.outcome_procedures?.length>0).length;
  const donusum=total?Math.round(randevuAlan/total*100):0;
  const elci=patients.filter(p=>classify(p.risk_score||0,p.answers||{}).ambassador).length;
  const crossSell=patients.filter(p=>p.outcome_procedures?.length>0&&p.outcome_procedures.some(x=>x!==(p.answers?.procedure||""))).length;

  const displayed=filter==="all"?patients:patients.filter(p=>{
    const cls=classify(p.risk_score||0,p.answers||{});
    return cls.cat===filter;
  });
  const clinical=displayed.filter(p=>!classify(p.risk_score||0,p.answers||{}).ambassador);
  const ambassadors=displayed.filter(p=>classify(p.risk_score||0,p.answers||{}).ambassador);

  return(
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",height:"100vh",overflow:"hidden",fontFamily:"'Nunito',sans-serif"}}>

      {/* KONSÜLTASYOn MODU — overlay */}
      {consultPatient&&<ConsultationMode patient={consultPatient} onClose={()=>setConsultPatient(null)} mode={thresholdMode}/>}

      {/* DESKTOP: Sol sidebar / MOBİL: Alt nav */}
      {!isMobile&&<Sidebar tab={tab} setTab={setTab} doctor={doctor} onLogout={onLogout}/>}

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"#f8fafd"}}>
        <div style={{padding:isMobile?"12px 16px":"14px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:"#f8fafd",borderBottom:"1px solid #d4e1ef"}} className="f1">
          {/* Logo + Karşılama */}
          <div style={{display:"flex",alignItems:"center",gap:isMobile?10:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8,paddingRight:isMobile?10:16,borderRight:"1px solid #d4e1ef"}}>
              {/* SculptAI Wordmark — Option D */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:2}}>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:400,color:"#1e3a5f",lineHeight:1,letterSpacing:"-0.02em"}}>SculptAI</span>
                <div style={{width:"100%",height:1,background:"linear-gradient(90deg,#1d4ed8,transparent)"}}/>
                <span style={{fontSize:8,letterSpacing:"0.22em",color:"#7b9ab5",textTransform:"uppercase"}}>Klinik Karar Desteği</span>
              </div>
            </div>
            <div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?17:22,color:"#1e3a5f",fontWeight:300,letterSpacing:"-0.01em"}}>Günaydın, <em>Dr. {doctor.name.split(" ").slice(-1)[0]}</em></div>
              {!isMobile&&<div style={{fontSize:12,color:"#7b9ab5",marginTop:1,letterSpacing:"0.03em"}}>{today}</div>}
            </div>
          </div>
          {/* Sağ butonlar */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {!isMobile&&<button onClick={()=>setTab("settings")} style={{padding:"6px 13px",borderRadius:7,fontSize:13,border:"1px solid #d4e1ef",background:"transparent",color:"#7b9ab5",letterSpacing:"0.03em"}}>Ayarlar</button>}
            <div style={{width:32,height:32,borderRadius:"50%",background:"#1e3a5f",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:"#f8fafd",letterSpacing:"0.04em"}}>{doctor.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>
          </div>
        </div>

        {/* TAB NAV — Desktop */}
        {!isMobile&&<div style={{display:"flex",gap:0,padding:"0 28px",background:"#f8fafd",borderBottom:"1px solid #d4e1ef",flexShrink:0}}>
          {[["patients","Hastalar"],["analytics","Analitik"]].map(([v,l])=>(
            <button key={v} onClick={()=>setTab(v)} style={{padding:"11px 18px",fontSize:13,fontWeight:500,letterSpacing:"0.06em",border:"none",background:"transparent",color:tab===v?"#1e3a5f":"#7b9ab5",borderBottom:tab===v?"1px solid #1e3a5f":"1px solid transparent",cursor:"pointer",transition:"all 0.15s",textTransform:"uppercase"}}>{l}</button>
          ))}
        </div>}

        {tab==="analytics"&&<Analytics patients={patients}/>}
        {tab==="value"&&<ValueScreen patients={patients} doctor={doctor}/>}
        {tab==="settings"&&<SettingsScreen doctor={doctor} onLogout={onLogout} showPw={showPw} setShowPw={setShowPw} newU={newU} setNewU={setNewU} newP={newP} setNewP={setNewP} newP2={newP2} setNewP2={setNewP2} pwErr={pwErr} setPwErr={setPwErr} saveNewCreds={saveNewCreds} confirmClear={confirmClear} setConfirmClear={setConfirmClear} clearAll={clearAll} clinicName={clinicName} setClinicName={setClinicName} clinicSaved={clinicSaved} saveClinicName={saveClinicName} thresholdMode={thresholdMode} setThresholdMode={setThresholdMode}/>}
        {tab==="patients"&&<div style={{flex:1,overflowY:"auto",padding:isMobile?"12px 12px 24px":"20px 28px 24px"}}>
          {showPw&&(
            <div style={{background:"#f8fafd",border:"1px solid #d4e1ef",borderRadius:12,padding:"16px 20px",marginBottom:18,animation:"fadeUp 0.25s ease"}}>
              <div style={{fontSize:13,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#2d5a8e",marginBottom:12}}>Giriş Bilgilerini Değiştir</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[["Yeni kullanıcı adı",newU,setNewU,"text"],["Yeni şifre",newP,setNewP,"password"],["Şifre tekrar",newP2,setNewP2,"password"]].map(([ph,val,set,type])=>(
                  <input key={ph} type={type} placeholder={ph} value={val} onChange={e=>set(e.target.value)} style={{flex:1,minWidth:130,padding:"9px 12px",background:"#eef3f9",border:"1px solid #d4e1ef",borderRadius:9,color:"#1e3a5f",fontSize:14,outline:"none"}}/>
                ))}
                <button onClick={saveNewCreds} style={{padding:"9px 18px",background:"#1e3a5f",border:"none",borderRadius:9,color:"#f8fafd",fontSize:14,fontWeight:600}}>Kaydet</button>
              </div>
              {pwErr&&<div style={{fontSize:13,color:"#ef4444",marginTop:8}}>{pwErr}</div>}
            </div>
          )}

          {/* KPI */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:isMobile?8:12,marginBottom:isMobile?16:24}} className="f2">
            {[
              {val:total,label:"Toplam Hasta",note:elci>0?`${elci} marka elçisi`:"Tüm kayıtlar",color:"#1e3a5f",accent:"#1d4ed8"},
              {val:randevuAlan>0?`%${donusum}`:"—",label:"Dönüşüm",note:randevuAlan>0?`${randevuAlan}/${total} randevu`:"Henüz outcome yok",color:donusum>=60?"#059669":donusum>=40?"#d97706":"#7b9ab5",accent:donusum>=60?"#059669":donusum>=40?"#d97706":"#7b9ab5"},
              {val:kritik,label:"Kritik Profil",note:kritik>0?`%${Math.round(kritik/total*100||0)} oranında`:"Belirgin risk yok",color:kritik>0?"#dc2626":"#059669",accent:kritik>0?"#dc2626":"#059669"},
            ].map(k=>(
              <div key={k.label} style={{background:"#f8fafd",border:"1px solid #d4e1ef",borderRadius:10,padding:isMobile?"12px 10px":"18px 20px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.accent}}/>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?28:36,fontVariantNumeric:"lining-nums",lineHeight:1,marginBottom:3,color:k.color}}>{k.val}</div>
                <div style={{fontSize:isMobile?9:11,color:"#1e3a5f",fontWeight:500}}>{k.label}</div>
                <div style={{fontSize:isMobile?9:10,color:"#7b9ab5",marginTop:1}}>{k.note}</div>
              </div>
            ))}
          </div>

          {/* LIST HEADER */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}} className="f3">
            <div style={{fontSize:13,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#2d5a8e"}}>Hasta Listesi</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              {[["all","Tümü"],["red","🔴 Dikkat"],["amber","🟡 Değerlendirme"],["green","🟢 Uygun"],["ambassador","🌟 Elçi"]].map(([v,l])=>(
                <button key={v} onClick={()=>setFilter(v)} style={{padding:"5px 13px",borderRadius:20,fontSize:13,fontWeight:500,border:`1.5px solid ${filter===v?"#1e3a5f":"#d4e1ef"}`,background:filter===v?"#1e3a5f":"#f8fafd",color:filter===v?"#f8fafd":"#7b9ab5",transition:"all 0.15s"}}>{l}</button>
              ))}
              <button onClick={()=>exportCSV(patients)} style={{padding:"5px 13px",borderRadius:20,fontSize:13,fontWeight:500,border:"1px solid #d4e1ef",background:"#eef3f9",color:"#2563eb"}}>📊 CSV</button>
              <button onClick={loadPatients} style={{padding:"5px 13px",borderRadius:20,fontSize:13,fontWeight:500,border:"1px solid #d4e1ef",background:"#f8fafd",color:"#7b9ab5"}}>↻ Yenile</button>
              {/* Aktif mod göstergesi */}
              <div onClick={()=>setTab("settings")} title="Ayarlardan değiştir" style={{
                display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:20,cursor:"pointer",
                background:THRESHOLD_MODES[thresholdMode||"balanced"].bg,
                border:`1px solid ${THRESHOLD_MODES[thresholdMode||"balanced"].border}`,
              }}>
                <span style={{fontSize:12}}>{THRESHOLD_MODES[thresholdMode||"balanced"].icon}</span>
                <span style={{fontSize:11,fontWeight:500,color:THRESHOLD_MODES[thresholdMode||"balanced"].color}}>
                  {THRESHOLD_MODES[thresholdMode||"balanced"].label}
                </span>
              </div>
            </div>
          </div>

          {loading&&<div style={{textAlign:"center",padding:"40px",color:"#7b9ab5"}}>Yükleniyor...</div>}

          {!loading&&clinical.length===0&&ambassadors.length===0&&(
            <div style={{textAlign:"center",padding:"60px 20px",color:"#7b9ab5"}}>
              <div style={{fontSize:40,marginBottom:14}}>📋</div>
              <div style={{fontSize:16,color:"#2d5a8e",marginBottom:8}}>Henüz kayıt yok</div>
              <div style={{fontSize:13}}>Hastalar <strong>sculptai-brown.vercel.app/form/{doctor.id}</strong> linkinden formu doldurunca burada görünecek</div>
            </div>
          )}

          <div className="f4">{clinical.map(p=><PatientCard key={p.id} patient={p} onDelete={deletePatient} isMobile={isMobile} onConsult={setConsultPatient} mode={thresholdMode}/>)}</div>

          {ambassadors.length>0&&(
            <div className="f5">
              <div style={{display:"flex",alignItems:"center",gap:10,margin:"18px 0 12px"}}>
                <div style={{flex:1,height:1,background:"#f1f3f5"}}/>
                <div style={{fontSize:12,color:"#a78bfa",background:"#faf5ff",padding:"2px 10px",borderRadius:10,border:"1px solid #ede9fe",letterSpacing:"0.08em",fontWeight:500}}>Ticari Fırsat</div>
                <div style={{flex:1,height:1,background:"#f1f3f5"}}/>
              </div>
              {ambassadors.map(p=><PatientCard key={p.id} patient={p} onDelete={deletePatient} isMobile={isMobile} onConsult={setConsultPatient} mode={thresholdMode}/>)}
            </div>
          )}

          {patients.length>0&&(
            <div style={{marginTop:20,textAlign:"center"}}>
              {!confirmClear
                ?<button onClick={()=>setConfirmClear(true)} style={{padding:"6px 16px",background:"transparent",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,color:"rgba(239,68,68,0.5)",fontSize:11}}>Tüm kayıtları sil</button>
                :<div style={{display:"flex",gap:9,justifyContent:"center",alignItems:"center"}}>
                  <span style={{fontSize:13,color:"#ef4444"}}>Emin misiniz?</span>
                  <button onClick={clearAll} style={{padding:"6px 14px",background:"#ef4444",border:"none",borderRadius:8,color:"#f8fafd",fontSize:13,fontWeight:600}}>Evet</button>
                  <button onClick={()=>setConfirmClear(false)} style={{padding:"6px 14px",background:"#f8fafd",border:"1px solid #d4e1ef",borderRadius:8,color:"#7b9ab5",fontSize:12}}>İptal</button>
                </div>
              }
            </div>
          )}
        </div>}

        {/* MOBİL — Alt Navigasyon */}
        {isMobile&&(
          <div style={{display:"flex",borderTop:"1px solid #d4e1ef",background:"#f8fafd",flexShrink:0}}>
            {[
              {id:"patients",label:"Hastalar",icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>},
              {id:"analytics",label:"Analitik",icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>},
              {id:"value",label:"Kazanç",icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>},
              {id:"settings",label:"Ayarlar",icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>},
            ].map(({id,label,icon})=>(
              <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"10px 0 8px",border:"none",background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",color:tab===id?"#1d4ed8":"#7b9ab5"}}>
                {icon}
                <span style={{fontSize:11,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:tab===id?500:400}}>{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


/* ─── AKILLI CROSS-SELL ──────────────────────────────────────────────────── */
function getCrossSellSuggestion(a){
  const proc = a.procedure||"";
  const otherAreas = a.otherAreas||"";
  const otherConsidered = a.otherConsidered||"";
  const hasOtherInterest = !["Hayır, sadece bu bölge","Hayır"].includes(otherAreas) || otherConsidered.includes("Evet");

  // Prosedüre özel akıllı öneriler
  const map = {
    "Burun Estetiği": [
      {proc:"Çene dolgusu veya çene ucu estetiği", prob:65, reason:"Profil dengesi için tamamlayıcı"},
      {proc:"Botoks (alın veya kaş bölgesi)", prob:40, reason:"Yüz üst bölgesi uyumu"},
    ],
    "Meme Küçültme": [
      {proc:"Liposuction (bel veya karın)", prob:70, reason:"Vücut orantısı için sık tercih"},
      {proc:"Karın germe", prob:45, reason:"Özellikle doğum sonrası hastalarda"},
    ],
    "Meme Büyütme (Silikon Protez ile)": [
      {proc:"Meme dikleştirme (mastopexi)", prob:55, reason:"Şekil ve doluluk birlikte"},
      {proc:"Liposuction", prob:35, reason:"Vücut dengesi"},
    ],
    "Meme Dikleştirme": [
      {proc:"Meme büyütme (implant)", prob:60, reason:"Dikleştirme sonrası doluluk"},
      {proc:"Karın germe", prob:40, reason:"Anne estetiği paketi"},
    ],
    "Yüz Germe": [
      {proc:"Üst göz kapağı estetiği", prob:75, reason:"Yüz yenileme bütünlüğü için"},
      {proc:"Boyun germe veya dolgu", prob:50, reason:"Yüz-boyun orantısı"},
    ],
    "Karın Germe": [
      {proc:"Liposuction (bel veya kalça)", prob:65, reason:"Karın estetiği ile sıkça kombine"},
      {proc:"Meme dikleştirme", prob:45, reason:"Anne estetiği paketi"},
    ],
    "Üst Göz Kapağı Estetiği": [
      {proc:"Alt göz kapağı estetiği", prob:70, reason:"Göz yenileme bütünlüğü"},
      {proc:"Kaş kaldırma veya botoks", prob:50, reason:"Üst yüz uyumu"},
    ],
    "Alt Göz Kapağı Estetiği": [
      {proc:"Üst göz kapağı estetiği", prob:75, reason:"Göz yenileme bütünlüğü"},
      {proc:"Dolgu (göz altı)", prob:55, reason:"Hacim ve şekil birlikte"},
    ],
    "Liposuction": [
      {proc:"Karın germe", prob:50, reason:"Cilt gevşekliği varsa tamamlayıcı"},
      {proc:"Vaser liposuction (detay şekillendirme)", prob:45, reason:"Daha ince sonuç için"},
    ],
    "Jinekomasti": [
      {proc:"Liposuction (karın veya bel)", prob:55, reason:"Vücut orantısı için sık tercih"},
    ],
  };

  const suggestions = map[proc] || [];

  // Ek bölge ilgisi varsa ihtimali artır
  if(hasOtherInterest && suggestions.length > 0){
    return suggestions.map(s => ({...s, prob: Math.min(95, s.prob + 15)}));
  }
  return suggestions;
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
  const isSocial=false; // soru kaldırıldı
  const isPragmatic=false; // soru kaldırıldı
  const isTrustSeeker=knowledge.includes("Hiçbir")||knowledge.includes("Genel");

  if(isAnalyst) return "analyst";
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

  "Karın Germe":{category:"Vücut Şekillendirme",desc:"Orta ve alt karın bölgesindeki yağ ve sarkık derinin alınarak karın kaslarının gerilerek sağlamlaştırıldığı bir cerrahi girişimdir.",stats:[{val:"2–5 saat",lbl:"Süre"},{val:"2–3 gece",lbl:"Hastane"},{val:"6 hafta",lbl:"İyileşme"}],process:"Ameliyat sonrası V pozisyonunda yatmanız sağlanacak. Karın korsesi uygulanacak. İlk iki gün en zor dönem. 3. günden itibaren şişlik azalır. Drenler 1–3 günde alınır. Cilt altı eriyen dikişler atılır, dikiş alma işlemi yapılmaz. 2. haftadan itibaren sosyal hayata dönüş.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"2–5 saat. Dren takılır, karın korsesi uygulanır."},{time:"1–2. gün",emoji:"💊",color:"#6d28d9",title:"En Yoğun Dönem",desc:"Ağrı kesici desteği. V pozisyonunda dinlenme. Bacak egzersizleri önemli."},{time:"3–7. gün",emoji:"🌤",color:"#0891b2",title:"Şişlik Azalır",desc:"Drenler alınır. Hareketler kolaylaşır. Sıvı gıdadan normale geçiş."},{time:"2–6. hafta",emoji:"🚶",color:"#059669",title:"Sosyal Hayata Dönüş",desc:"2. haftadan itibaren sosyal aktiviteler. 6 hafta ağır iş yasak."},{time:"6+ ay",emoji:"✨",color:"#10b981",title:"Nihai Sonuç",desc:"Kesi izi 6. aydan itibaren solmaya başlar. 2 yıla kadar iyileşir."}],prep:["Ameliyat öncesi 6–8 saat aç kalmanız gerekecek","Sigara içiyorsanız ameliyattan 2 hafta önce bırakın","E vitamini kullanıyorsanız bu dönemde ara verin","4 hafta boyunca havuz ve denize girmeyin","6 hafta sauna, solaryum ve güneş banyosundan kaçının"],normal:["İlk 2 gün vücut su toplar, hareketler zorlaşabilir","İlk kalkmada baş dönmesi olabilir — yavaş kalkın","Dikiş hattı ilk 3–4 ay kırmızı ve kaşıntılı olabilir","Göbek altı bölgesinde geçici uyuşukluk olabilir"],followup:"1., 3., 6. ve 12. aylarda kontrol"},

  "Üst Göz Kapağı Estetiği":{category:"Yüz Estetiği",desc:"Sarkık ve gevşek üst göz kapağı cildinin düzeltilerek daha genç ve dinç bir görünüm elde edilmesi.",stats:[{val:"Lokal Anestezi",lbl:"Anestezi"},{val:"3–4. gün",lbl:"Bantlar Alınır"},{val:"6 hafta",lbl:"İyileşme"}],process:"İşlem lokal anestezi ile yapılır, açlık gerektirmez. İşlem sonrası göz kapağında bantlar olacak. Soğuk uygulama ilk gün saat başı 20 dk, 2. gün 2 saatte bir 20 dk yapılmalı. 3. günden şişlik azalır. 4. günde bantlar alınır.",timeline:[{time:"İşlem günü",emoji:"🏥",color:"#7c3aed",title:"İşlem & Uyanış",desc:"Lokal anestezi. Göz kapağında bantlar olacak. Eve aynı gün çıkılır."},{time:"1–2. gün",emoji:"❄️",color:"#6d28d9",title:"Soğuk Uygulama",desc:"Saat başı 20 dakika soğuk uygulama. Baş yüksek tutularak dinlenin."},{time:"3–4. gün",emoji:"🩹",color:"#0891b2",title:"Bantlar Alınır",desc:"Şişlik azalmaya başlar. 4. günde bantlar alınır. Göz çevresi yıkanabilir."},{time:"2–4. hafta",emoji:"🌤",color:"#059669",title:"Normalleşme",desc:"Morluklar geçer. Gözler açılmaya başlar. Hafif makyaj yapılabilir."},{time:"6+ hafta",emoji:"✨",color:"#10b981",title:"Nihai Görünüm",desc:"6 haftadan sonra son sonuç ortaya çıkar."}],prep:["Lokal anestezi ile yapıldığı için aç kalmanıza gerek yoktur","İşlem sonrası 4 saat yatmayın ve yorucu aktivitelerden kaçının","Güneş gözlüğü kullanın","6 hafta boyunca sauna ve solaryumdan kaçının"],normal:["Göz çevresinde şişlik ve morluk ilk 2–3 gün artabilir","Sabahları gözler daha şişik olabilir, gün içinde azalır","İlk haftalarda rüzgar ve güneşe maruz kalınca gözde gerginlik hissedilebilir","Göz köşesinde hafif çekilme ilk hafta daha belirgin olabilir"],followup:"İşlem sonrası 15. günde kontrol"},

  "Alt Göz Kapağı Estetiği":{category:"Yüz Estetiği",desc:"Alt göz kapağındaki yağ birikimi ve sarkıklığın düzeltilerek daha dinç ve genç bir görünüm elde edilmesi.",stats:[{val:"Sedasyon",lbl:"Anestezi"},{val:"3–4. gün",lbl:"Bantlar Alınır"},{val:"6 hafta",lbl:"İyileşme"}],process:"Alt göz kapağı ameliyatı üst ile benzer süreç izler. İşlem sonrası soğuk uygulama ve dinlenme kritik. 3. günden itibaren şişlik azalır.",timeline:[{time:"İşlem günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Sedasyon altında yapılır. Eve aynı gün çıkılabilir."},{time:"1–3. gün",emoji:"❄️",color:"#6d28d9",title:"Soğuk Uygulama",desc:"Düzenli soğuk uygulama şişliği kontrol altında tutar."},{time:"4–7. gün",emoji:"🩹",color:"#0891b2",title:"Bantlar Alınır",desc:"Şişlik belirgin şekilde azalır. Günlük aktivitelere dönüş başlar."},{time:"6 hafta",emoji:"✨",color:"#10b981",title:"Nihai Görünüm",desc:"Son sonuç ortaya çıkar."}],prep:["İşlemden 5 saat önce yemek yemeyin","İşlem sonrası 4 saat yatmayın","6 hafta sauna ve solaryumdan kaçının","Güneş gözlüğü kullanın"],normal:["Şişlik ve morluk ilk 2–3 gün artabilir","Sabahları gözler daha şişik olabilir","İlk haftalarda göz çevresinde gerginlik hissedilebilir"],followup:"İşlem sonrası 15. günde kontrol"},

  "Botoks Uygulaması":{category:"Medikal Estetik",desc:"Mimik kaslarını geçici olarak gevşeterek kırışıklıkları azaltan, cerrahi gerektirmeyen hızlı bir uygulama.",stats:[{val:"10–15 dk",lbl:"Süre"},{val:"3–7 gün",lbl:"Etki Başlar"},{val:"3–4 ay",lbl:"Etki Süresi"}],process:"Uygulama sonrası hemen eve gidebilirsiniz. 4 saat mimiklerinizi kullanmayın ve yatmayın. Yüzünüzü yıkayabilir, makyaj yapabilirsiniz.",timeline:[{time:"Uygulama günü",emoji:"💉",color:"#7c3aed",title:"Uygulama",desc:"10–15 dakika. Ağrısız. Eve aynı gün çıkılır."},{time:"3–7. gün",emoji:"🌱",color:"#0891b2",title:"Etki Başlar",desc:"Kırışıklıklar azalmaya başlar. Mimik kasları yavaşça gevşer."},{time:"2–4 hafta",emoji:"✨",color:"#059669",title:"Tam Etki",desc:"Botoxun tam etkisi 2–4. haftada görülür."},{time:"3–4 ay",emoji:"🔄",color:"#d97706",title:"Tekrar Zamanı",desc:"Etki yavaşça azalır. Tekrarlanan uygulamalarla etki 12 aya kadar uzayabilir."}],prep:["Uygulamadan sonra 4 saat mimiklerinizi kullanmayın","Uygulamadan sonra 4 saat yatmayın","2 gün enjeksiyon bölgelerine masaj yapmayın","2 gün yoğun spor programlarına ara verin"],normal:["1–2 gün kızarıklık, morluk veya hafif şişlik olabilir","Uygulama sonrası ilk hafta hafif baş ağrısı hissedilebilir","Etki kişiye göre 3–7 gün içinde başlar"],followup:"Gerekirse 15 gün sonra kontrol"},

  "Dolgu Uygulaması":{category:"Medikal Estetik",desc:"Yüzün çeşitli bölgelerine hacim kazandırmak ve olukları doldurmak için uygulanan hyalüronik asit bazlı işlem.",stats:[{val:"15–30 dk",lbl:"Süre"},{val:"1–2 gün",lbl:"İyileşme"},{val:"6–18 ay",lbl:"Etki Süresi"}],process:"Uygulama sonrası soğuk uygulama şişliği azaltır. İlk 2 gün ödem bölgesi normalden şişik görünebilir. 4–5. günden itibaren hafif masaj yapılabilir.",timeline:[{time:"Uygulama günü",emoji:"💉",color:"#7c3aed",title:"Uygulama",desc:"Lokal anestezi kremi ile ağrısız. Eve aynı gün çıkılır."},{time:"1–3. gün",emoji:"❄️",color:"#0891b2",title:"Ödem Dönemi",desc:"Normalden biraz fazla şişlik beklenir, özellikle dudakta."},{time:"1–2 hafta",emoji:"✨",color:"#059669",title:"Nihai Görünüm",desc:"Ödem geçer, kalıcı sonuç ortaya çıkar."}],prep:["İşlem öncesi 10 gün kan sulandırıcılardan kaçının","Aşırı sıcak ve buhardan kaçının","Uygulamadan sonra masaj yapmayın"],normal:["İlk 2 gün ödem ve morluk olabilir","Dudak dolgusunda şişlik daha belirgin olabilir","Uygulama bölgesinde geçici gerginlik hissedilebilir"],followup:"Gerekirse 2 hafta sonra kontrol"},

  "Liposuction":{category:"Vücut Şekillendirme",desc:"Diyet ve egzersizle gidemeyen bölgesel yağ birikimlerinin vakumla alınarak vücudun şekillendirilmesi.",stats:[{val:"Değişken",lbl:"Süre"},{val:"2–3 gün",lbl:"Hastane"},{val:"3–6 ay",lbl:"Sonuç"}],process:"Ameliyat sonrası kompresyon giysi uygulanacak. İlk 48 saatte ödem yoğun. 3. günden haraketler kolaylaşır. Konturlar 3–6 ay içinde netleşir.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Kompresyon giysi uygulanır. Drenler takılabilir."},{time:"1–3. gün",emoji:"💊",color:"#6d28d9",title:"Yoğun Ödem",desc:"Vücut su toplar. Kompresyon giysiyi sürekli takın."},{time:"1–2. hafta",emoji:"🌤",color:"#0891b2",title:"İyileşme",desc:"Hareketler normalleşir. Sosyal hayata dönüş başlar."},{time:"3–6. ay",emoji:"✨",color:"#10b981",title:"Nihai Kontur",desc:"Vücut yeni şeklini alır. Son sonuç ortaya çıkar."}],prep:["Ameliyat öncesi 6–8 saat aç kalmanız gerekecek","Kompresyon giysi ameliyat sonrası sürekli kullanılacak","4 hafta havuz ve denizden kaçının","6 hafta sauna ve solaryumdan kaçının"],normal:["İlk 2–3 gün belirgin ödem ve morluk olabilir","Cilt yüzeyinde geçici düzensizlikler olabilir","Uyuşukluk veya hassasiyet hissi zamanla geçer"],followup:"1., 3. ve 6. aylarda kontrol"},

  "Meme Dikleştirme":{category:"Meme Estetiği",desc:"Sarkıklık gösteren memelerin yukarı taşınarak yeniden şekillendirilmesi, gerekirse protez eklenmesi.",stats:[{val:"2–4 saat",lbl:"Süre"},{val:"1–2 gece",lbl:"Hastane"},{val:"6 hafta",lbl:"İyileşme"}],process:"Ameliyat sonrası destek sütyeni kullanılacak. İlk birkaç gün kol hareketleri kısıtlanır. 3. günden şişlik azalır. Cilt altı eriyen dikişler atılır, dikiş alma işlemi yapılmaz.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Genel anestezi. Destek sütyeni uygulanır."},{time:"1–3. gün",emoji:"💊",color:"#6d28d9",title:"Dinlenme",desc:"Kolları kullanmak kısıtlı. Ağrı kesici desteği."},{time:"2–4. hafta",emoji:"🌤",color:"#0891b2",title:"Normalleşme",desc:"Şişlik azalır, kol hareketleri normalleşir. Hafif aktivitelere dönüş."},{time:"6 hafta+",emoji:"✨",color:"#10b981",title:"Nihai Görünüm",desc:"Şişlik tamamen geçer, son şekil ortaya çıkar."}],prep:["Ameliyat öncesi 6–8 saat aç kalmanız gerekecek","Destek sütyeni ameliyat sonrası sürekli takın","4 hafta havuzdan kaçının","6 hafta ağır kol egzersizlerinden kaçının"],normal:["Meme başı duyusunda geçici değişiklik olabilir","İlk günlerde meme bölgesinde sertlik ve şişlik normaldir","Kesi izleri ilk 3–4 ay daha belirgin olabilir"],followup:"1., 3. ve 6. aylarda kontrol"},

  "Meme Küçültme":{category:"Meme Estetiği",desc:"Büyük ve sarkık memelerin küçültülerek yeniden şekillendirilmesi, sırt ağrısı ve postür sorunlarını gidermesi.",stats:[{val:"2–4 saat",lbl:"Süre"},{val:"1–2 gece",lbl:"Hastane"},{val:"6 hafta",lbl:"İyileşme"}],process:"Ameliyat sonrası destek sütyeni kullanılacak. İlk birkaç gün kol hareketleri kısıtlanır. Cilt altı eriyen dikişler atılır, dikiş alma işlemi yapılmaz. 2. haftadan itibaren sosyal hayata dönüş.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Genel anestezi. Destek sütyeni uygulanır."},{time:"1–2. hafta",emoji:"🌤",color:"#6d28d9",title:"İyileşme",desc:"Şişlik azalır. Kol hareketleri normalleşir."},{time:"6 hafta",emoji:"✨",color:"#10b981",title:"Nihai Görünüm",desc:"Yeni meme şekli oturur. İzler solmaya başlar."}],prep:["Ameliyat öncesi 6–8 saat aç kalın","Destek sütyeni sürekli takın","6 hafta ağır spor ve kol egzersizlerinden kaçının"],normal:["Meme başı duyusunda geçici değişiklik olabilir","Kesi izleri ilk aylarda belirgin olabilir","Hafif şişlik ve sertlik normaldir"],followup:"1., 3. ve 6. aylarda kontrol"},

  "Meme Büyütme (Silikon Protez ile)":{category:"Meme Estetiği",desc:"Silikon protez ile meme hacmini artırarak istenen dolgunluk ve şekle ulaşılması.",stats:[{val:"1–2 saat",lbl:"Süre"},{val:"1 gece",lbl:"Hastane"},{val:"3–6 ay",lbl:"Sonuç"}],process:"Ameliyat sonrası destek sütyeni kritik. İlk hafta kol hareketleri kısıtlı. 3. günden şişlik azalır. Cilt altı eriyen dikişler atılır, dikiş alma işlemi yapılmaz. Protezler 3–6 ay içinde yerleşir.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Genel anestezi. Destek sütyeni takılır."},{time:"1–7. gün",emoji:"💊",color:"#6d28d9",title:"Dinlenme",desc:"Kollar yukarı kaldırmak yasak. Ağrı kesici desteği."},{time:"3–6. ay",emoji:"✨",color:"#10b981",title:"Protez Yerleşir",desc:"Protez doku ile bütünleşir, final şekil ortaya çıkar."}],prep:["Ameliyat öncesi 6–8 saat aç kalın","Destek sütyeni sürekli takın","İlk hafta kolları yukarı kaldırmayın"],normal:["İlk hafta sertlik ve gerginlik hissi normal","Protez bölgesinde geçici uyuşukluk olabilir","Şişlik 3–4 haftada belirgin azalır"],followup:"1., 3. ve 6. aylarda kontrol"},

  "Kol Germe":{category:"Vücut Şekillendirme",desc:"Kol arka ve iç kısmındaki sarkıklık ile yağ fazlalığının alınarak kolun yeniden şekillendirilmesi.",stats:[{val:"Genel Anestezi",lbl:"Anestezi"},{val:"10–14 gün",lbl:"Dikişler"},{val:"6 hafta",lbl:"İyileşme"}],process:"Ameliyat sonrası drenler 24–48 saat içinde alınır. 2–3 hafta günlük aktiviteler kısıtlanır. Dikişler 10–14. günde alınır. 2. haftadan itibaren sosyal hayata dönüş.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Koltukaltından kesi ile deri ve yağ dokusu çıkarılır. Dren takılır."},{time:"1–3. gün",emoji:"💊",color:"#6d28d9",title:"Dinlenme",desc:"Drenler alınır. Kol hareketleri kısıtlı."},{time:"1–2. hafta",emoji:"🩹",color:"#0891b2",title:"Dikişler Alınır",desc:"10–14. günde dikişler alınır. Şişlik azalır."},{time:"6 hafta",emoji:"✨",color:"#10b981",title:"İyileşme",desc:"Ağır kol egzersizlerine dönüş mümkün."}],prep:["Ameliyat öncesi 6–8 saat aç kalın","4 hafta havuz ve denizden kaçının","6 hafta ağır kol işlerinden kaçının","Sigara içiyorsanız ameliyat döneminde bırakın"],normal:["İlk 2 gün ödem belirgin olabilir","Kesi izi ilk 3–4 ay kırmızı ve kaşıntılı olabilir","Kolda geçici uyuşukluk hissedilebilir"],followup:"1., 3. ve 6. aylarda kontrol"},

  "Uyluk veya Kol germe":{category:"Vücut Şekillendirme",desc:"Uyluk veya kol bölgesindeki sarkıklık ve yağ fazlalığının ameliyatla düzeltilmesi.",stats:[{val:"Genel Anestezi",lbl:"Anestezi"},{val:"1–2 gece",lbl:"Hastane"},{val:"6 hafta",lbl:"İyileşme"}],process:"Ameliyat sonrası drenler 48–72 saat içinde alınır. 2–3 hafta günlük aktiviteler kısıtlanır. Dikişler 12–14. günde alınır.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Genel anestezi. Dren takılır."},{time:"1–3. gün",emoji:"💊",color:"#6d28d9",title:"Dinlenme",desc:"Drenler alınır. V pozisyonunda dinlenme."},{time:"1–2. hafta",emoji:"🩹",color:"#0891b2",title:"Dikişler Alınır",desc:"12–14. günde dikişler alınır."},{time:"6 hafta",emoji:"✨",color:"#10b981",title:"İyileşme",desc:"Ağır aktivitelere dönüş mümkün."}],prep:["Ameliyat öncesi 8 saat aç kalın","3–4 gün önceden yumuşak gıdalar alın","4 hafta havuz ve denizden kaçının","6 hafta sauna ve solaryumdan kaçının"],normal:["İlk 2 gün ödem belirgin","Dikiş hattı ilk aylarda kırmızı olabilir","Bölgede geçici uyuşukluk hissedilebilir"],followup:"1., 3. ve 6. aylarda kontrol"},

  "Kuşak Germe":{category:"Vücut Şekillendirme",desc:"Karın, bel, kalça ve kuyruk sokumu bölgelerinin tamamında sarkıklık ve yağ fazlalığının düzeltildiği kapsamlı bir ameliyat.",stats:[{val:"2–6 saat",lbl:"Süre"},{val:"1–5 gece",lbl:"Hastane"},{val:"6 hafta",lbl:"İyileşme"}],process:"Ameliyat sonrası karın korsesi uygulanacak. Çepeçevre kesi hattı var. İlk günler emboli riski nedeniyle bacak hareketleri önemli. 3. günden şişlik azalır.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"2–6 saat. Kapsamlı kesi. Korse uygulanır."},{time:"1–3. gün",emoji:"💊",color:"#6d28d9",title:"Yoğun Bakım",desc:"Bacak hareketleri çok önemli. V pozisyonunda dinlenme."},{time:"3–7. gün",emoji:"🌤",color:"#0891b2",title:"Şişlik Azalır",desc:"Drenler alınır. Hareketler kolaylaşır."},{time:"6 hafta",emoji:"✨",color:"#10b981",title:"İyileşme",desc:"Ağır sporlar ve aktivitelere dönüş mümkün."}],prep:["Sigara içiyorsanız 2 hafta önceden bırakın","E vitamini kullanıyorsanız ara verin","4 hafta havuz ve denizden kaçının","6 hafta ağır spor ve aktivitelerden kaçının"],normal:["İlk 2 gün yoğun ödem normaldir","İlk kalkışta baş dönmesi olabilir — yavaş kalkın","Kesi hattı ilk aylarda belirgin ve kaşıntılı olabilir","Bölgede geçici uyuşukluk hissedilebilir"],followup:"1., 3., 6. ve 12. aylarda kontrol"},

  "İple Askı Uygulaması":{category:"Yüz Gençleştirme",desc:"Yaşla sarkmış yüz dokularının özel iplerle normal anatomik konumlarına getirilmesi.",stats:[{val:"Sedasyon",lbl:"Anestezi"},{val:"Gündüz",lbl:"Hastane"},{val:"Değişken",lbl:"Sonuç Süresi"}],process:"İşlem sonrası hafif şişlik ve çekinti olabilir. Çoğu geçici. Masaj ile düzelir. Kalıcı değil, yıllar içinde tekrar gerekebilir.",timeline:[{time:"İşlem günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Sedasyon veya lokal anestezi. Eve aynı gün çıkılır."},{time:"1–2. hafta",emoji:"🌤",color:"#0891b2",title:"İlk Sonuç",desc:"Şişlik azalır. İplerin etkisi görülmeye başlar."},{time:"1–3 ay",emoji:"✨",color:"#10b981",title:"Nihai Görünüm",desc:"Son sonuç oturur. Doğal ve dinç görünüm."}],prep:["İşlem sonrası ilk gün sert yiyeceklerden kaçının","Aşırı mimik hareketlerinden kaçının","Masaj önerilerine uyun"],normal:["İşlem sonrası hafif çukurlar veya çentikler olabilir, geçer","Şakak bölgesinde hafif yanma hissi normaldir","İlk haftada yüzde hafif asimetri olabilir, düzelir"],followup:"1. ay ve 3. ay kontrolü"},

  "Yüz Germe":{category:"Yüz Gençleştirme",desc:"Yüz ve boyundaki sarkıklığın cerrahi olarak düzeltilmesi.",stats:[{val:"3–5 saat",lbl:"Süre"},{val:"1–2 gece",lbl:"Hastane"},{val:"2–4 hafta",lbl:"İyileşme"}],process:"Ameliyat sonrası bandajlar uygulanır. İlk hafta istirahat. 2. haftadan itibaren sosyal aktiviteler. Saç dipleri geçici olarak duyarsız olabilir.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Genel veya sedasyon anestezi. Bandajlar uygulanır."},{time:"1–7. gün",emoji:"💊",color:"#6d28d9",title:"Dinlenme",desc:"Baş yüksek tutulur. Şişlik ve morluk en yoğun dönem."},{time:"2–4. hafta",emoji:"🌤",color:"#0891b2",title:"Normalleşme",desc:"Şişlik ve morluklar geçer. Sosyal hayata dönüş."},{time:"3–6. ay",emoji:"✨",color:"#10b981",title:"Nihai Görünüm",desc:"Son sonuç oturur. Kesi izleri saç dibi ve kulak arkasında gizlenir."}],prep:["Ameliyat öncesi 6–8 saat aç kalın","Sigara içiyorsanız bırakın","6 hafta sauna ve solaryumdan kaçının"],normal:["Yüzde şişlik ve morluk ilk hafta belirgin","Saç diplerinde geçici uyuşukluk olabilir","Kulak çevresinde gerginlik hissi zamanla geçer"],followup:"1. ve 3. aylarda kontrol"},

  "Popo estetiği":{category:"Vücut Şekillendirme",desc:"Popo bölgesine yağ enjeksiyonu veya protez ile şekil ve hacim kazandırılması.",stats:[{val:"1–3 saat",lbl:"Süre"},{val:"1–2 gece",lbl:"Hastane"},{val:"3–6 ay",lbl:"Sonuç"}],process:"Ameliyat sonrası 2–4 hafta sırt üstü yatmaktan ve uzun süre oturmaktan kaçınılır. Kompresyon giysi önemli.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Genel anestezi. Kompresyon giysi uygulanır."},{time:"2–4. hafta",emoji:"💊",color:"#6d28d9",title:"Oturma Kısıtlı",desc:"Uzun süre oturmaktan ve sırt üstü yatmaktan kaçının."},{time:"3–6. ay",emoji:"✨",color:"#10b981",title:"Nihai Şekil",desc:"Yağ tutulumu stabil hale gelir, final şekil oturur."}],prep:["Ameliyat öncesi 6–8 saat aç kalın","Kompresyon giysiyi sürekli takın","2–4 hafta oturma aktivitelerini kısıtlayın"],normal:["İlk haftalarda oturma rahatsızlığı olabilir","Yağ enjeksiyonunun bir kısmı emilir, bu normal","Bölgede geçici sertlik ve hassasiyet olabilir"],followup:"1., 3. ve 6. aylarda kontrol"},

  "Jinekomasti":{category:"Erkek Estetiği",desc:"Erkeklerde meme bezi büyümesinin cerrahi veya liposuction ile düzeltilmesi.",stats:[{val:"1–2 saat",lbl:"Süre"},{val:"1 gece",lbl:"Hastane"},{val:"6 hafta",lbl:"İyileşme"}],process:"Ameliyat sonrası kompresyon giysi uygulanır. İlk hafta kol hareketleri kısıtlı. 3. günden şişlik azalır.",timeline:[{time:"Ameliyat günü",emoji:"🏥",color:"#7c3aed",title:"İşlem",desc:"Genel veya sedasyon anestezi. Kompresyon giysi takılır."},{time:"1–7. gün",emoji:"💊",color:"#6d28d9",title:"Dinlenme",desc:"Kompresyon giysi sürekli. Kol hareketleri kısıtlı."},{time:"6 hafta",emoji:"✨",color:"#10b981",title:"İyileşme",desc:"Nihai sonuç oturur. Ağır spora dönüş mümkün."}],prep:["Ameliyat öncesi 6–8 saat aç kalın","Kompresyon giysiyi sürekli takın","6 hafta ağır koldan egzersizden kaçının"],normal:["İlk hafta şişlik ve hassasiyet normaldir","Meme başı çevresinde geçici uyuşukluk olabilir","Kesi izi meme başı çevresinde gizli kalır"],followup:"1., 3. ve 6. aylarda kontrol"},
};

function PatientForm({doctorId}){
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
  const VISIBLE_QUESTIONS=QUESTIONS.filter(q=>!q.showIf||q.showIf(answers));
  const q=VISIBLE_QUESTIONS[currentQ];
  const canNext=(q?.optional||answers[q?.id]!==undefined&&answers[q?.id]!=="")&&
    !(q?.id==="referralCode"&&answers["source"]!=="Bir hasta beni yönlendirdi (referans kodu var)"&&!answers[q?.id])
    ||(q?.id==="referralCode");
  const progress=(currentQ/VISIBLE_QUESTIONS.length)*100;
  const secIdx=SECTIONS.indexOf(q?.section);
  const accent=doctorInfo?.primary_color||"#1e3a5f";
  const C={bg:"#f8fafd",accent:accent,navy:"#1e3a5f",muted:"#7b9ab5",border:"#d4e1ef"};

  useEffect(()=>{
    if(!doctorId) return;
    sb.from("doctors").select("id,name,clinic_name,photo_url,primary_color").eq("id",doctorId).single()
      .then(({data})=>{ if(data) setDoctorInfo(data); });
  },[doctorId]);

  async function handleSubmit(){
    // Klinik bazlı model varsa onu kullan, yoksa global model
    let score, mlSat;
    try {
      const clinicModel = await loadClinicModel(doctorId);
      if(clinicModel && clinicModel.weights) {
        score = Math.round(computeScoreWithModel(answers, clinicModel.weights));
        mlSat = Math.round((1 - score/100) * 100);
      } else {
        const mlResult = computeMLScore(answers);
        score = mlResult.riskScore;
        mlSat = mlResult.mlSatisfaction;
      }
    } catch(e) {
      const mlResult = computeMLScore(answers);
      score = mlResult.riskScore;
      mlSat = mlResult.mlSatisfaction;
    }
    const cls=classify(score,answers);
    const ambCode=cls.ambassador?"REF-"+Math.random().toString(36).substr(2,4).toUpperCase():null;
    const timingData={questionTimes,questionChanges};
    const slowQuestions=Object.entries(questionTimes).filter(([,s])=>s>30).map(([id])=>id);
    const changedQuestions=Object.entries(questionChanges).filter(([,c])=>c>0).map(([id,c])=>`${id}(${c}x)`);

    // İsmi şifrele
    const encryptedName=await encryptName(answers.name||"",doctorId||"default");
    const safeAnswers={...answers,name:encryptedName};

    const rec={
      id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(),
      doctor_id:doctorId,
      date:new Date().toISOString(),
      created_at:new Date().toISOString(),
      risk_score:score,
      segment:cls.label,
      answers:safeAnswers,
      ai_text:"",
      ai_loading:true,
      ambassador_code:ambCode||"",
      ambassador_sent:false,
      outcome_procedures:[],
      no_appointment:false,
      referred_by:answers.referralCode||null,  // referans kodu varsa kaydet
    };

    const {error}=await sb.from("patients").insert(rec);
    if(error){
      console.error("Insert hatası:",error);
      alert("Form kaydedilemedi: "+error.message);
      return;
    }

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
- Süreci ne kadar biliyor: ${a.riskKnowledge}
- Sosyal destek: ${a.support}
- Revizyon tutumu: ${a.revision}
- Önceki işlem: ${a.prevSurgery}
- Benlik saygısı: ${a.selfEsteem||"belirtmedi"}
- Kaçınma davranışı: ${a.avoidance||"belirtmedi"}
- Uzun düşündüğü sorular: ${slowQ.length>0?slowQ.join(", "):"yok"}
- Cevap değiştirdiği: ${changedQ.length>0?changedQ.join(", "):"yok"}
- Değişim beklentisi: "${a.openStory||"boş bıraktı"}"
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

· Benlik saygısı: ${a.selfEsteem||"belirtmedi"}
· Gelecek bakışı: ${a.futureOptimism||"belirtmedi"}
· Bölgeyle meşguliyet: ${a.bodyFocus||"belirtmedi"}
· Sosyal kaçınma: ${a.avoidance||"belirtmedi"}
· Hayal ettiği: ${a.imagineAfter||"belirtmedi"}

· ML risk skoru: ${score}/100

FORM DAVRANIŞI:
· Uzun düşündüğü sorular: ${slowQ.length>0?slowQ.join(", "):"yok"}
· Cevap değiştirdiği sorular: ${changedQ.length>0?changedQ.join(", "):"yok"}
· Değişim beklentisi (kendi sözleriyle): "${a.openStory||"boş bıraktı"}"

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

  // Cross-sell haritası — işleme göre tamamlayıcı öneriler
  const CROSS_SELL_MAP={
    "Üst Göz Kapağı Estetiği":[
      {proc:"Kaş Kaldırma",why:"Kaş pozisyonu göz kapağı sonucunu doğrudan etkiliyor — birlikte değerlendirilince çok daha dengeli bir sonuç ortaya çıkabiliyor."},
      {proc:"Botoks",why:"Göz çevresindeki ince çizgiler için botoks, göz kapağı estetiğini güzel şekilde tamamlayabiliyor."},
    ],
    "Alt Göz Kapağı Estetiği":[
      {proc:"Yüz Germe",why:"Alt göz kapağı ile yüz alt bölgesi aynı seansta değerlendirilebiliyor — bazı hastalarda çok daha bütüncül bir sonuç veriyor."},
      {proc:"Dolgu",why:"Göz altı çukurluğu için dolgu, ameliyat sonrası görünümü destekleyebiliyor."},
    ],
    "Burun Estetiği":[
      {proc:"Çene Ucu Estetiği",why:"Çene-burun oranı yüz profilini belirleyen en önemli faktörlerden biri — çene ucu değerlendirmesi sonucu belirgin şekilde güçlendirebiliyor."},
      {proc:"Çene Dolgusu",why:"Cerrahi olmadan çene hattını güçlendirmek isteyenler için dolgu, burun estetiğiyle birlikte çok daha dengeli bir profil oluşturabiliyor."},
    ],
    "Meme Büyütme (Silikon Protez ile)":[
      {proc:"Meme Dikleştirme",why:"Sarkma varsa meme büyütme ile dikleştirme aynı seansta yapılabiliyor — ikinci ameliyat ihtiyacını ortadan kaldırabiliyor."},
      {proc:"Korse Liposuction",why:"Bel hatlarını birlikte şekillendirmek, meme büyütme sonucunun vücutla uyumunu çok daha güçlü kılabiliyor."},
    ],
    "Meme Dikleştirme":[
      {proc:"Meme Büyütme (Silikon Protez ile)",why:"Hacim kaybı da varsa dikleştirme ile birlikte değerlendirilebiliyor — tek seansta çok daha tatmin edici sonuç veriyor."},
      {proc:"Korse Liposuction",why:"Bel ve yan hat şekillendirme, meme estetiği sonucunu vücutla çok daha uyumlu hale getirebiliyor."},
    ],
    "Meme Küçültme":[
      {proc:"Liposuction",why:"Koltuk altı ve yan göğüs bölgesi aynı seansta liposuction ile şekillendirilebiliyor — bütüncül bir siluet için değerlendirilebilir."},
      {proc:"Korse Liposuction",why:"Bel ve sırt bölgesiyle birlikte ele alındığında meme küçültme çok daha orantılı bir görünüm yaratıyor."},
    ],
    "Karın Germe":[
      {proc:"Liposuction",why:"Karın germe ile liposuction birlikte yapıldığında bel ve yan hatlar çok daha belirgin hale gelebiliyor."},
      {proc:"Korse Liposuction",why:"Korse liposuction karın germe sonucunu bütünleyerek daha kadınsı bir siluet oluşturabiliyor."},
    ],
    "Liposuction":[
      {proc:"Karın Germe",why:"Liposuction sonrası deri sarkması oluşabiliyorsa karın germe seçeneği önceden değerlendirilebiliyor."},
      {proc:"Korse Liposuction",why:"Bel, sırt ve yan hatları birlikte şekillendiren korse liposuction, standart liposuction'ı tamamlayan bir yaklaşım olabiliyor."},
    ],
    "Yüz Germe":[
      {proc:"Boyun Germe",why:"Yüz ve boyun birlikte ele alındığında çok daha doğal ve bütüncül bir yenilenme sağlanabiliyor."},
      {proc:"Dolgu",why:"Yüz germe sonrası hacim kayıplarını dolgu ile desteklemek sonucu belirgin şekilde güçlendirebiliyor."},
      {proc:"Botoks",why:"Alın ve göz çevresi için botoks, yüz germe sonucunu tamamlayan çok yaygın bir tercih."},
    ],
    "Jinekomasti":[
      {proc:"Liposuction",why:"Jinekomasti ile birlikte göğüs çevresi yağlanması varsa liposuction aynı seansta değerlendirilebiliyor."},
      {proc:"Karın Germe",why:"Karın bölgesi de rahatsızlık yaratıyorsa aynı seansta ele alınabiliyor — tek iyileşme süreci anlamına geliyor."},
    ],
    "Kol Germe":[
      {proc:"Liposuction",why:"Kol germe ile birlikte liposuction uygulanması kolların hem sıkılaşmasını hem şekillenmesini sağlayabiliyor."},
      {proc:"Uyluk Germe",why:"Kollar ve uyluklar birlikte ele alındığında bütüncül bir vücut sıkılaştırma sonucu elde edilebiliyor."},
    ],
    "Uyluk Germe":[
      {proc:"Liposuction",why:"Uyluk germe ile birlikte liposuction, bacak konturunu çok daha belirgin şekilde şekillendirebiliyor."},
      {proc:"Kol Germe",why:"Kol ve uyluk sıkılaştırma birlikte planlandığında tek iyileşme sürecinde kapsamlı bir sonuç alınabiliyor."},
    ],
    "Yüz Germe (Mini)":[
      {proc:"Boyun Germe",why:"Mini yüz germe ile boyun bölgesi birlikte ele alındığında sonuç çok daha kapsamlı ve doğal görünüyor."},
      {proc:"Dolgu",why:"Mini yüz germe sonrası hacim desteği için dolgu, yüzün gençliğini çok daha uzun süre koruyabiliyor."},
      {proc:"Botoks",why:"Dinamik çizgiler için botoks, mini yüz germeyi mükemmel şekilde tamamlıyor."},
    ],
    "Sıvı Yüz Germe":[
      {proc:"Botoks",why:"Dolgu ve botoks birlikte uygulandığında 'sıvı yüz germe' etkisi çok daha kapsamlı bir yenilenme sunuyor."},
      {proc:"İp Askı",why:"İp askı ile birlikte değerlendirildiğinde sarkma ve hacim kaybı aynı anda ele alınabiliyor."},
    ],
    "Botoks":[
      {proc:"Dolgu",why:"Botoks dinamik çizgileri, dolgu ise hacim kayıplarını ele alıyor — ikisi birlikte çok daha bütüncül bir yenilenme sağlıyor."},
      {proc:"Sıvı Yüz Germe",why:"Cerrahi olmadan kapsamlı bir yenilenme isteyenler için dolgu ve botoks kombinasyonu giderek yaygınlaşıyor."},
    ],
    "Dolgu":[
      {proc:"Botoks",why:"Dolgu hacim için, botoks çizgiler için — ikisi birlikte uygulandığında sonuç çok daha dengeli oluyor."},
      {proc:"Sıvı Yüz Germe",why:"Yüzün farklı bölgelerini birlikte ele alan kombine yaklaşım, tek işlemden çok daha kapsamlı bir etki yaratıyor."},
    ],
    "İp Askı":[
      {proc:"Dolgu",why:"İp askı ile dolgu birlikte uygulandığında sarkma ve hacim kaybı aynı seansta ele alınabiliyor."},
      {proc:"Botoks",why:"İp askı sonrası botoks desteği sonucun ömrünü uzatmaya yardımcı olabiliyor."},
    ],
  };

  const crossSellSuggestions=(()=>{
    const base=CROSS_SELL_MAP[proc]||[];
    if(base.length===0) return [];

    const a=answers;
    const age=parseInt(a.age)||30;

    const isAnalyst=a.riskKnowledge?.includes("Detaylı");
    const isPragmatic=false; // soru kaldırıldı
    const isTrustSeeker=a.riskKnowledge?.includes("Hiçbir")||a.support?.includes("Kimseye");
    const isSocial=false; // soru kaldırıldı
    const isExternal=["Yakınlarımın yorumları etkili oldu","Başka insanların yorumları beni kötü etkiliyor"].some(x=>a.motivation===x);
    const isHighExpect=a.expectation?.includes("Tamamen farklı");

    if(isExternal&&isHighExpect) return [];

    const filtered=base.filter(s=>{
      if(age<30&&(s.proc.includes("Yüz Germe")||s.proc.includes("Boyun Germe"))) return false;
      if(age<25&&s.proc.includes("Boyun Germe")) return false;
      if(age>55&&s.proc.includes("Dolgu")&&proc.includes("Meme")) return false;
      if(age<35&&s.proc.includes("Karın Germe")&&proc.includes("Liposuction")) return false;
      return true;
    });

    // Tüm işlemler × 4 profil mesaj tablosu
    const MESSAGES={
      analyst:{
        "Kaş Kaldırma":"Kaş-kapak oranı cerrahi planlamada kritik bir değişken — kaş pozisyonu değerlendirilmeden yapılan göz kapağı girişimleri zaman içinde yetersiz kalabiliyor.",
        "Botoks":"Nörotoksin uygulaması dinamik çizgiler için altın standart — statik değişikliklerle kombine yaklaşım çok daha kapsamlı bir yenilenme sunuyor.",
        "Yüz Germe":"Alt göz kapağı ile birlikte ritmidektomi planlandığında tek iyileşme sürecinde çok daha kapsamlı bir sonuç elde ediliyor.",
        "Dolgu":"Volüm restorasyonu ve yapısal değişiklik farklı patolojiler — ikisi birlikte ele alındığında sonuç anatomik açıdan çok daha bütüncül oluyor.",
        "Çene Ucu Estetiği":"Fasiyal estetik analizde çene-burun oranı temel referans noktası — profilometrik açıdan çene değerlendirmesi rinoplasti planlamasının ayrılmaz bir parçası.",
        "Çene Dolgusu":"Cerrahi olmadan çene projeksiyonunu optimize etmek mümkün — rinoplasti öncesi veya sonrasında filler ile profil dengesi çok daha hassas ayarlanabiliyor.",
        "Meme Dikleştirme":"Silikon yerleşimi ile eş zamanlı mastopexi, cilt zarf kalitesini korurken hacmi optimize ediyor — ayrı seanslara kıyasla iyileşme süreci ve skar yükü azalıyor.",
        "Korse Liposuction":"Gövde konturunun bütünü ele alındığında estetik sonucun vücutla orantısallığı çok daha güçlü hale geliyor.",
        "Liposuction":"Kombine yaklaşımda flap kaldırma sırasında lateral hatlar şekillendirilebiliyor — tek seansta çok daha kapsamlı bir kontur elde ediliyor.",
        "Karın Germe":"Liposuction sonrası deri elastikiyeti değerlendirmesi kritik — sarkma riski varsa önceden planlamak çok daha iyi sonuç veriyor.",
        "Boyun Germe":"Ritmidektomi ile platismaplasti birlikte yapıldığında alt yüz-boyun geçiş bölgesinde anatomik bütünlük sağlanıyor.",
        "Uyluk Germe":"Ekstremite konturlamasında bütüncül planlama tek seansta çok daha uyumlu bir sonuç veriyor.",
        "Sıvı Yüz Germe":"Nonsurgical kombinasyonlarda sinerji etkisi belgelenmiş — tek ajan uygulamasına kıyasla çok daha kapsamlı bir yenilenme sağlanıyor.",
        "İp Askı":"Mekanik destek ile volüm restorasyonu birlikte planlandığında sonucun sürekliliği çok daha güçlü oluyor.",
        "Meme Büyütme (Silikon Protez ile)":"Hacim ve ptoz eş zamanlı ele alındığında tek iyileşme sürecinde çok daha tatmin edici bir sonuç elde ediliyor.",
      },
      pragmatic:{
        "Kaş Kaldırma":"Aynı seansta yapılıyor, ek iyileşme süresi yok — sonuç çok daha belirgin çıkıyor.",
        "Botoks":"Konsültasyon günü bile yapılabiliyor, 15-20 dakika — ayrı randevu gerekmez.",
        "Yüz Germe":"Aynı anestezi, aynı iyileşme — iki ayrı ameliyat yerine tek seferlik.",
        "Dolgu":"Aynı seansta tamamlanabiliyor, ek ziyaret gerektirmiyor.",
        "Çene Ucu Estetiği":"Tek randevuda hem burun hem çene tamamlanıyor, ayrı sefer gerekmez.",
        "Çene Dolgusu":"20-30 dakikalık bir uygulama — aynı gün yapılabilir, ek süreç yok.",
        "Meme Dikleştirme":"Tek anestezi, tek iyileşme süreci — ikinci ameliyat planlamak zorunda kalmıyorsunuz.",
        "Korse Liposuction":"Aynı seansta birleştiriliyor — toplam süreç iki ayrı ameliyattan çok daha kısa.",
        "Liposuction":"Birlikte planlanınca tek iyileşme süreci — zaman ve maliyet açısından çok daha verimli.",
        "Karın Germe":"Şimdi değerlendirip planlamak, ileride ikinci bir ameliyat ihtimalini ortadan kaldırıyor.",
        "Boyun Germe":"Yüz ve boyun aynı anda tamamlanıyor — iki ayrı süreç yerine tek seferlik.",
        "Uyluk Germe":"Tek iyileşme sürecinde ikisi birlikte tamamlanıyor — çok daha pratik.",
        "Sıvı Yüz Germe":"Aynı seansta yapılabiliyor, cerrahi gerektirmiyor — hızlı ve pratik bir seçenek.",
        "İp Askı":"Minimal invaziv, kısa iyileşme — botoks ile aynı gün planlanabiliyor.",
        "Meme Büyütme (Silikon Protez ile)":"Tek anestezi, tek iyileşme — iki ayrı ameliyat planlamak zorunda kalmıyorsunuz.",
      },
      trustSeeker:{
        "Kaş Kaldırma":"Bunu fark etmeden gelenlerin çoğu konsültasyonda ilk kez duyuyor — sadece sormak bile yeterli, doktorunuz değerlendirsin.",
        "Botoks":"Merak ediyorsanız sorabilirsiniz — doktorunuz size uygun olup olmadığını zaten söyleyecek.",
        "Yüz Germe":"Pek çok kişi sonradan 'keşke sorsaydım' diyor — konsültasyonda gündeme getirmek hiçbir şeyi bağlamıyor.",
        "Dolgu":"Küçük bir soru, büyük fark yaratabilir — konsültasyonda sormak yeterli, karar tamamen size ait.",
        "Çene Ucu Estetiği":"Pek çok kişinin aklına gelmiyor ama yüz profilinde büyük fark yaratıyor — merak ediyorsanız konsültasyonda bir sorun.",
        "Çene Dolgusu":"Cerrahi olmadan deneyebilirsiniz — kalıcı bir karar vermeden önce konsültasyonda sormaya değer.",
        "Meme Dikleştirme":"Bunu merak eden çok kişi var ama çoğu sormaktan çekiniyor — bir soru sormak hiçbir şeyi bağlamıyor.",
        "Korse Liposuction":"Sadece 'benim için uygun mu' diye sorabilirsiniz — doktorunuz en iyi değerlendireni.",
        "Liposuction":"Endişelenmeyin, sadece 'bu benim için uygun mu' diye sorabilirsiniz — karar tamamen size ait.",
        "Karın Germe":"Birçok kişi bunu sonradan keşfediyor — konsültasyonda bir sorup öğrenmek çok daha iyi.",
        "Boyun Germe":"Pek çok kişi sonradan keşke sorsaydım diyor — konsültasyonda gündeme getirmek hiçbir şeyi bağlamıyor.",
        "Uyluk Germe":"Merak ediyorsanız sorabilirsiniz — doktorunuz size en uygun planı zaten önerecek.",
        "Sıvı Yüz Germe":"Cerrahi olmadan ne kadar değişiklik mümkün olduğunu merak ediyorsanız konsültasyonda sorabilirsiniz.",
        "İp Askı":"Kalıcı bir karar vermeden önce bu seçeneği sormak mantıklı — cerrahi gerektirmiyor.",
        "Meme Büyütme (Silikon Protez ile)":"Bunu merak eden çok kişi var — konsültasyonda sormak hiçbir şeyi bağlamıyor, karar tamamen sizin.",
      },
      social:{
        "Kaş Kaldırma":"Göz çevresi yüzün en çok dikkat çeken bölgesi — kaş ve kapak birlikte ele alınınca fotoğraflarda fark çok daha belirgin oluyor.",
        "Botoks":"Işık altında cilt yüzeyi çok daha pürüzsüz görünüyor — sonuçları paylaşmak isteyenlerin büyük çoğunluğu bunu da yaptırıyor.",
        "Yüz Germe":"Alt göz kapağı ile birlikte yüz gençleşince fotoğraflarda ve videolarda fark inanılmaz oluyor.",
        "Dolgu":"Hacim ve kontur birlikte ele alındığında sonuçlar çok daha çarpıcı ve paylaşılabilir hale geliyor.",
        "Çene Ucu Estetiği":"Profil fotoğraflarında en belirleyici detaylardan biri — çene hattı güçlenince tüm yüz çok daha çekici görünüyor.",
        "Çene Dolgusu":"Selfie açısından büyük fark yaratan bir uygulama — çene hattı profilinizi çok daha belirgin hale getirebiliyor.",
        "Meme Dikleştirme":"Giyim ve duruş üzerindeki etkisi çok belirgin — ikisi birlikte yapılınca sonuç çok daha göz alıcı oluyor.",
        "Korse Liposuction":"Siluet bütünüyle şekillenince kıyafetlerin üzerindeki etkisi dramatik biçimde değişiyor.",
        "Liposuction":"Vücut kontürünün bütünü ele alındığında siluet çok daha çarpıcı ve fotoğrafik bir hal alabiliyor.",
        "Karın Germe":"Bel ve karın birlikte şekillenince kıyafetler çok farklı oturuyor — etki çok daha belirgin oluyor.",
        "Boyun Germe":"Yüz ve boyun birlikte gençleşince fotoğraflarda ve videolarda fark inanılmaz oluyor.",
        "Uyluk Germe":"Bacak ve kol birlikte sıkılaşınca vücudun bütünü çok daha dengeli ve çarpıcı görünüyor.",
        "Sıvı Yüz Germe":"Kombine uygulamada yüzün her bölgesi birden parlıyor — fotoğraflara yansıması çok güçlü oluyor.",
        "İp Askı":"Minimal müdahaleyle elde edilen etki fotoğraflarda çok belirgin — sosyal medyada paylaşım için ideal.",
        "Meme Büyütme (Silikon Protez ile)":"Giyim seçenekleri ve siluet üzerindeki etkisi çok belirgin — çoğu hasta sonuçları paylaşmak istiyor.",
      },
    };

    const profileKey=isAnalyst?"analyst":isPragmatic?"pragmatic":isTrustSeeker?"trustSeeker":isSocial?"social":null;

    return filtered.map(s=>{
      let why=s.why;
      if(profileKey&&MESSAGES[profileKey][s.proc]){
        why=MESSAGES[profileKey][s.proc];
      }
      return {...s,why};
    });
  })();
  const profile=detectProfile(answers);
  const PC=PROFILE_CONTENT[profile];
  const recoveryText=getPersonalizedContent(proc,profile,"recovery");
  const riskText=getPersonalizedContent(proc,profile,"risks");
  const [infoPage,setInfoPage]=useState(0); // 0=thanks+proc, 1=prep+normal

  const BORD="#1d4ed8";
  const BORD2="#2d5a8e";

  if(submitted) return(
    <div style={{minHeight:"100vh",background:"#f8fafd",fontFamily:"'Nunito',sans-serif",display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#f8fafd",borderBottom:"1px solid #d4e1ef",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <div style={{width:18,height:18,border:"1px solid #d4e1ef",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{width:5,height:5,background:BORD,borderRadius:"50%"}}/>
          </div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:"#1e3a5f",letterSpacing:"0.02em"}}>SculptAI</div>
        </div>
        <div style={{fontSize:11,color:"#7b9ab5",letterSpacing:"0.06em"}}>Hacettepe Plastik Cerrahi</div>
      </div>

      {/* Scrollable content */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 18px 4px"}}>

        {infoPage===0&&(<>
          {/* HERO */}
          <div style={{background:BORD,borderRadius:16,padding:"22px 20px",marginBottom:16,marginTop:14,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",bottom:-40,right:-40,width:140,height:140,borderRadius:"50%",background:"rgba(245,240,232,0.03)"}}/>
            <div style={{width:34,height:34,borderRadius:"50%",border:"1px solid rgba(245,240,232,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(245,240,232,0.5)",fontSize:14,marginBottom:14}}>✓</div>
            <div style={{fontSize:11,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(245,240,232,0.28)",marginBottom:8}}>Değerlendirme tamamlandı</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:300,color:"#f8fafd",lineHeight:1.15,marginBottom:8,letterSpacing:"-0.01em"}}>Teşekkürler,<br/><em>iyi ki geldiniz.</em></div>
            <div style={{fontSize:13,color:"rgba(245,240,232,0.35)",lineHeight:1.7}}>Bilgileriniz alındı. Aşağıda size özel rehber ve prosedür bilgileri.</div>
          </div>

          {/* MARKA ELÇİSİ */}
          {ambassadorCode&&(
            <div style={{background:BORD,borderRadius:14,padding:"18px 16px",marginBottom:16,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"rgba(245,240,232,0.04)"}}/>

              {/* Header */}
              <div style={{fontSize:11,letterSpacing:"0.16em",textTransform:"uppercase",color:"rgba(245,240,232,0.28)",marginBottom:8}}>Marka Elçisi Programı</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:300,color:"#f8fafd",lineHeight:1.2,marginBottom:8,letterSpacing:"-0.01em"}}>Sizi aramızda<br/><em>görmekten mutluluk.</em></div>
              <div style={{fontSize:12,color:"rgba(245,240,232,0.42)",lineHeight:1.7,marginBottom:14}}>{PC.ambassadorMsg}</div>

              {/* Kod + butonlar */}
              <div style={{background:"rgba(245,240,232,0.07)",border:"1px solid rgba(245,240,232,0.1)",borderRadius:9,padding:"11px 13px",marginBottom:8}}>
                <div style={{fontSize:9,color:"rgba(245,240,232,0.3)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:3}}>Referans Kodunuz</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"#f8fafd",letterSpacing:"0.1em",fontWeight:300}}>{ambassadorCode}</div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                <button onClick={()=>{
                  const msg=`Merhaba! Hacettepe Üniversitesi Plastik Cerrahi'de çok iyi bir deneyim yaşadım. Seni de yönlendirmek istedim — formu doldurursan doktor seni çok daha hazırlıklı karşılıyor. İşte bağlantı: ${window.location.origin}/form/${doctorInfo?.id||""}%0AReferans kodum: ${ambassadorCode}`;
                  window.open(`https://wa.me/?text=${msg}`,"_blank");
                }} style={{padding:"10px",background:"#25D366",border:"none",borderRadius:8,color:"white",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"'Nunito',sans-serif",letterSpacing:"0.04em",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.528 5.845L0 24l6.335-1.508A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.853 0-3.601-.5-5.112-1.374l-.366-.217-3.76.896.951-3.666-.239-.379A9.946 9.946 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  WhatsApp'ta Paylaş
                </button>
                <button onClick={()=>{
                  navigator.clipboard?.writeText(`${window.location.origin}/form/${doctorInfo?.id||""} — Referans: ${ambassadorCode}`);
                }} style={{padding:"10px",background:"rgba(245,240,232,0.08)",border:"1px solid rgba(245,240,232,0.15)",borderRadius:8,fontSize:12,color:"rgba(245,240,232,0.7)",cursor:"pointer",fontFamily:"'Nunito',sans-serif",letterSpacing:"0.04em"}}>
                  Linki Kopyala
                </button>
              </div>
            </div>
          )}

          {/* KİŞİSEL REHBER */}
          <div style={{fontSize:11,letterSpacing:"0.16em",textTransform:"uppercase",color:"#7b9ab5",fontWeight:500,margin:"0 0 8px 0"}}>Size Özel Rehber</div>
          {guideLoading&&(
            <div style={{background:"#eef3f9",border:"1px solid #d4e1ef",borderRadius:12,padding:"20px 16px",marginBottom:10,textAlign:"center"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:"#7b9ab5",fontStyle:"italic",animation:"pulse 1.5s infinite"}}>Kişisel rehberiniz hazırlanıyor...</div>
              <div style={{fontSize:12,color:"#d4e1ef",marginTop:6}}>Yapay zeka form cevaplarınızı analiz ediyor</div>
            </div>
          )}
          {personalGuide&&!guideLoading&&(()=>{
            const sections=personalGuide.split(/\[([^\]]+)\]/).filter(s=>s.trim());
            const parsed=[];
            for(let i=0;i<sections.length;i+=2){
              if(sections[i+1]) parsed.push({title:sections[i],body:sections[i+1].trim()});
            }
            return(
              <div style={{border:"1px solid #d4e1ef",borderRadius:12,overflow:"hidden",marginBottom:12}}>
                {parsed.map((s,i)=>(
                  <div key={i} style={{padding:"13px 15px",borderBottom:i<parsed.length-1?"1px solid #eef3f9":"none"}}>
                    <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:BORD2,fontWeight:500,marginBottom:5}}>{s.title}</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:300,color:"#1e3a5f",lineHeight:1.8}}>{s.body}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          <div style={{fontSize:11,letterSpacing:"0.16em",textTransform:"uppercase",color:"#7b9ab5",fontWeight:500,margin:"14px 0 8px 0"}}>Seçtiğiniz Prosedür</div>
          <div style={{border:"1px solid #d4e1ef",borderRadius:12,padding:15,marginBottom:12}}>
            <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:BORD2,marginBottom:5}}>◈ {PI.category}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:300,color:"#1e3a5f",marginBottom:6,letterSpacing:"-0.01em"}}>{proc||"İşlem"}</div>
            <div style={{fontSize:12,color:"#7b9ab5",lineHeight:1.65,marginBottom:11}}>{PI.desc}</div>
            <div style={{display:"flex",gap:5}}>
              {PI.stats.map((s,i)=>(
                <div key={i} style={{flex:1,background:"#eef3f9",borderRadius:7,padding:"8px 5px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:"#1e3a5f",lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:8,color:"#7b9ab5",marginTop:3,letterSpacing:"0.08em",textTransform:"uppercase"}}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sonraki adım */}
          {/* TAMAMLAYICI İŞLEMLER */}
          {crossSellSuggestions.length>0&&(
            <>
              <div style={{fontSize:11,letterSpacing:"0.16em",textTransform:"uppercase",color:"#7b9ab5",fontWeight:500,margin:"14px 0 8px 0"}}>Konsültasyonda Sorabilirsiniz</div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                {crossSellSuggestions.map((s,i)=>(
                  <div key={i} style={{border:"1px solid #d4e1ef",borderRadius:12,padding:"13px 15px",background:"#faf8f4"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:BORD2,flexShrink:0}}/>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:400,color:"#1e3a5f"}}>{s.proc}</div>
                    </div>
                    <div style={{fontSize:12,color:"#7b9ab5",lineHeight:1.65}}>{s.why}</div>
                  </div>
                ))}
                <div style={{fontSize:11,color:"#7b9ab5",lineHeight:1.5,padding:"0 2px"}}>Bu bilgiler yalnızca ön bilgilendirme amaçlıdır. Son karar konsültasyonunuzda doktorunuzla birlikte değerlendirilecektir.</div>
              </div>
            </>
          )}

          <div style={{fontSize:11,letterSpacing:"0.16em",textTransform:"uppercase",color:"#7b9ab5",fontWeight:500,margin:"0 0 8px 0"}}>Sonraki Adım</div>
          <div style={{border:"1px solid #d4e1ef",borderRadius:12,padding:"13px 15px",display:"flex",alignItems:"center",gap:11,marginBottom:12}}>
            <div style={{width:30,height:30,background:"#eef3f9",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>📅</div>
            <div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:"#1e3a5f",marginBottom:1}}>Konsültasyon randevusu</div>
              <div style={{fontSize:12,color:"#7b9ab5",lineHeight:1.4}}>{doctorInfo?.name||"Doktorunuz"} ekibi sizinle iletişime geçecek.</div>
            </div>
          </div>
        </>)}

        {infoPage===1&&(<>
          {/* Kişiselleştirilmiş giriş — EN ÜSTTE */}
          <div style={{background:"linear-gradient(135deg,#eef3f9,#e8e3d8)",border:"1px solid #d4e1ef",borderRadius:10,padding:"14px 16px",marginBottom:14}}>
            <div style={{fontSize:11,letterSpacing:"0.15em",textTransform:"uppercase",color:"#7b9ab5",marginBottom:6,fontWeight:500}}>Size özel not</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:300,color:"#1e3a5f",lineHeight:1.75,fontStyle:"italic"}}>{PC.recoveryIntro}</div>
          </div>

          {/* Recovery timeline */}
          <div style={{fontSize:11,letterSpacing:"0.16em",textTransform:"uppercase",color:"#7b9ab5",fontWeight:600,margin:"4px 0 10px 2px"}}>İyileşme takvimi</div>
          <div style={{position:"relative",paddingLeft:16,marginBottom:14}}>
            <div style={{position:"absolute",left:4,top:8,bottom:8,width:1,background:"linear-gradient(180deg,"+BORD+",rgba(74,21,32,0.08))"}}/>
            {PI.timeline.map((t,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,paddingBottom:10}}>
                <div style={{width:9,height:9,borderRadius:"50%",flexShrink:0,marginTop:4,position:"relative",left:-16,marginRight:-6,border:"1.5px solid #f8fafd",background:BORD,opacity:1-i*0.18,zIndex:1}}/>
                <div style={{flex:1,border:"1px solid #d4e1ef",borderRadius:9,padding:"9px 11px"}}>
                  <div style={{fontSize:8,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:600,color:BORD2,marginBottom:2,opacity:1-i*0.15}}>{t.time}</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:"#1e3a5f",marginBottom:1}}>{t.title}</div>
                  <div style={{fontSize:11,color:"#7b9ab5",lineHeight:1.55}}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Prep tips */}
          {/* Kişiselleştirilmiş giriş */}
          <div style={{background:"#eef3f9",border:"1px solid #d4e1ef",borderRadius:10,padding:"12px 14px",marginBottom:14}}>
            <div style={{fontSize:13,color:"#2d5a8e",lineHeight:1.7,fontStyle:"italic"}}>{PC.recoveryIntro}</div>
          </div>

          <div style={{fontSize:11,letterSpacing:"0.16em",textTransform:"uppercase",color:"#7b9ab5",fontWeight:600,margin:"0 0 8px 2px"}}>İşlem öncesi hazırlık</div>
          <div style={{background:"#f8fafd",border:"1px solid #d4e1ef",borderRadius:12,marginBottom:10,overflow:"hidden"}}>
            <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10,background:"#f0fdf4"}}>
              <div style={{fontSize:20}}>🌿</div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#065f46"}}>Bilmeniz gerekenler</div>
                <div style={{fontSize:12,color:"#6ee7b7",marginTop:1}}>Hacettepe Plastik Cerrahi önerileri</div>
              </div>
            </div>
            <div style={{padding:"10px 14px 12px",display:"flex",flexDirection:"column",gap:7,borderTop:"1px solid #eef3f9"}}>
              {PI.prep.map((p,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:9,fontSize:13,color:"#2d5a8e",lineHeight:1.55}}>
                  <div style={{width:16,height:16,borderRadius:4,background:"#ecfdf5",border:"1.5px solid #6ee7b7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#059669",flexShrink:0,marginTop:1}}>✓</div>
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* Kişiselleştirilmiş İyileşme */}
          {recoveryText&&(
            <>
              <div style={{fontSize:11,letterSpacing:"0.16em",textTransform:"uppercase",color:"#7b9ab5",fontWeight:600,margin:"0 0 8px 2px"}}>İyileşme süreci</div>
              <div style={{background:"#f8fafd",border:"1px solid #d4e1ef",borderRadius:12,padding:"14px 16px",marginBottom:10}}>
                <div style={{fontSize:13,color:"#2d5a8e",lineHeight:1.8}}>{recoveryText}</div>
              </div>
            </>
          )}

          {/* Kişiselleştirilmiş Riskler */}
          {riskText&&(
            <>
              <div style={{fontSize:11,letterSpacing:"0.16em",textTransform:"uppercase",color:"#7b9ab5",fontWeight:500,margin:"0 0 8px 0"}}>Bilinmesi Gerekenler</div>
              <div style={{borderLeft:"1.5px solid "+BORD2,padding:"10px 12px",marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:500,color:"#1e3a5f",marginBottom:2}}>{PC.riskIntro}</div>
                <div style={{fontSize:12,color:"#7b9ab5",lineHeight:1.65}}>{riskText}</div>
              </div>
            </>
          )}

          {/* Normal */}
          {PI.normal&&PI.normal.length>0&&(
            <>
              <div style={{fontSize:11,letterSpacing:"0.16em",textTransform:"uppercase",color:"#7b9ab5",fontWeight:500,margin:"8px 0 8px 0"}}>Bunlar Normaldir</div>
              {PI.normal.map((n,i)=>(
                <div key={i} style={{borderLeft:"1.5px solid #d4e1ef",padding:"8px 12px",marginBottom:6}}>
                  <div style={{fontSize:12,color:"#7b9ab5",lineHeight:1.6}}>{n}</div>
                </div>
              ))}
            </>
          )}

          {/* Disclaimer */}
          <div style={{padding:"9px 11px",background:"#eef3f9",borderRadius:8,fontSize:11,color:"#7b9ab5",lineHeight:1.6,fontStyle:"italic",marginBottom:10}}>
            Son karar her zaman hekiminize aittir. Bu bilgiler yalnızca ön bilgilendirme amaçlıdır.
          </div>
        </>)}

      </div>

      {/* Bottom CTA */}
      <div style={{padding:"10px 22px 22px",flexShrink:0,background:"#f8fafd",borderTop:"1px solid #d4e1ef"}}>
        {infoPage===0
          ?<button onClick={()=>setInfoPage(1)} style={{width:"100%",padding:13,background:BORD,border:"none",borderRadius:9,color:"#f8fafd",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"'Nunito',sans-serif",letterSpacing:"0.08em"}}>Hazırlık bilgilerini gör →</button>
          :<button onClick={()=>{setSubmitted(false);setAnswers({});setCurrentQ(0);setInfoPage(0);}} style={{width:"100%",padding:13,background:BORD,border:"none",borderRadius:9,color:"#f8fafd",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"'Nunito',sans-serif",letterSpacing:"0.08em"}}>Anladım, teşekkürler</button>
        }
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Nunito',sans-serif",color:C.navy}}>
      {/* Hero grid — sadece ilk soru (karşılama) */}
      {currentQ===0&&(
        <div style={{width:"100%",height:280,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:2,position:"relative",overflow:"hidden",flexShrink:0}}>
          {["hero.png","hero2.png","hero3.png","hero4.png"].map((src,i)=>(
            <div key={i} style={{position:"relative",overflow:"hidden"}}>
              <img src={`/${src}`} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 15%"}}
                onError={e=>{e.target.parentElement.style.background="#eef3f9"}}/>
            </div>
          ))}
          {/* Gradient overlay */}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, rgba(245,240,232,0) 20%, rgba(245,240,232,1) 100%)"}}/>
          {/* Logo üstte */}
          <div style={{position:"absolute",top:16,left:20,display:"flex",alignItems:"center",gap:7}}>
            <div style={{width:20,height:20,border:"1px solid rgba(255,255,255,0.7)",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(245,240,232,0.25)"}}>
              <div style={{width:6,height:6,background:"white",borderRadius:"50%"}}/>
            </div>
            <div style={{fontSize:13,fontWeight:500,color:"white",letterSpacing:"0.04em",textShadow:"0 1px 6px rgba(0,0,0,0.3)"}}>SculptAI</div>
          </div>
        </div>
      )}

      {/* Normal header — sadece soru ekranlarında */}
      {currentQ>0&&(
        <header style={{background:"#f8fafd",borderBottom:`1px solid ${C.border}`,padding:"16px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:20,height:20,border:"1px solid #d4e1ef",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:6,height:6,background:"#1e3a5f",borderRadius:"50%"}}/>
            </div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:C.navy,letterSpacing:"-0.01em"}}>SculptAI</div>
          </div>
          
        </header>
      )}

      <main style={{maxWidth:580,margin:"0 auto",padding:currentQ===0?"0 20px 36px":"36px 20px"}}>
        {currentQ===0&&(
          <div style={{textAlign:"center",marginBottom:32,paddingTop:8}} className="f1">
            <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"5px 18px",border:`1px solid ${accent}33`,borderRadius:24,fontSize:12,letterSpacing:"0.22em",color:accent,marginBottom:18,textTransform:"uppercase",background:`${accent}11`}}>✦ Hacettepe Plastik Cerrahi Kliniği</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:46,color:C.navy,marginBottom:12,fontWeight:300,lineHeight:1.1,letterSpacing:"-0.01em"}}>Hoş Geldiniz</div>
            <div style={{fontSize:15,color:C.muted,lineHeight:1.85,maxWidth:420,margin:"0 auto",marginBottom:6}}>Bu kısa form, size en doğru ve güvenli planlama yapabilmemiz için beklentilerinizi anlamamıza yardımcı olur.</div>
          </div>
        )}
        <div style={{display:"flex",gap:5,marginBottom:20,flexWrap:"wrap"}} className="f2">
          {SECTIONS.map((sec,i)=>(
            <div key={sec} style={{padding:"3px 11px",borderRadius:20,fontSize:11,letterSpacing:"0.13em",textTransform:"uppercase",background:i===secIdx?"#eef3f9":"transparent",border:`1.5px solid ${i===secIdx?C.accent:C.border}`,color:i===secIdx?C.accent:C.muted,transition:"all 0.3s"}}>{sec}</div>
          ))}
        </div>
        <div style={{marginBottom:22}} className="f2">
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:12,color:C.muted}}>SORU {currentQ+1} / {VISIBLE_QUESTIONS.length}</span>
            <span style={{fontSize:12,color:C.accent,fontWeight:500}}>%{Math.round(progress)}</span>
          </div>
          <div style={{height:1,background:C.border,borderRadius:1}}>
            <div style={{height:"100%",width:`${progress}%`,background:`linear-gradient(90deg,${accent},${accent}cc)`,borderRadius:2,transition:"width 0.4s ease"}}/>
          </div>
        </div>
        <div style={{background:"#f8fafd",border:`1.5px solid ${C.border}`,borderRadius:14,padding:"24px 22px",marginBottom:14}} className="f3">
          <div style={{fontSize:11,color:"#7b9ab5",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:9,fontWeight:400}}>{q.section}</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:300,color:C.navy,marginBottom:20,lineHeight:1.35,letterSpacing:"-0.01em"}}>{q.label}</div>
          {q.type==="text"&&<input type="text" placeholder={q.placeholder} value={answers[q.id]||""} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.value}))} style={{width:"100%",padding:"12px 14px",background:"#eef3f9",border:`1.5px solid ${C.border}`,borderRadius:10,color:C.navy,fontSize:15,outline:"none"}}/>}
          {q.type==="number"&&<input type="number" placeholder={q.placeholder} value={answers[q.id]||""} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.value}))} style={{width:"100%",padding:"12px 14px",background:"#eef3f9",border:`1.5px solid ${C.border}`,borderRadius:10,color:C.navy,fontSize:15,outline:"none"}}/>}
          {q.type==="radio"&&(
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {q.options.map(opt=>{
                const sel=answers[q.id]===opt;
                return(<button key={opt} onClick={()=>{
                  if(answers[q.id]&&answers[q.id]!==opt){
                    setQuestionChanges(p=>({...p,[q.id]:(p[q.id]||0)+1}));
                  }
                  setAnswers(p=>({...p,[q.id]:opt}));
                }} style={{padding:"12px 14px",background:sel?"#eef3f9":"#eef3f9",border:`1.5px solid ${sel?C.accent:C.border}`,borderRadius:10,color:sel?C.accent:"#2d5a8e",fontSize:14,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:11,transition:"all 0.15s"}}>
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
          }} style={{flex:1,padding:"13px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,fontSize:13,cursor:"pointer"}}>← Geri</button>}
          <button onClick={()=>{
            const elapsed=Math.round((Date.now()-qStartTime.current)/1000);
            setQuestionTimes(p=>({...p,[QUESTIONS[currentQ].id]:elapsed}));
            qStartTime.current=Date.now();
            if(currentQ<VISIBLE_QUESTIONS.length-1)setCurrentQ(c=>c+1);else handleSubmit();
          }} disabled={!canNext}
            style={{flex:2,padding:"13px",background:canNext?"#1e3a5f":"#d4e1ef",border:"none",borderRadius:8,color:canNext?"#f8fafd":"#7b9ab5",fontSize:13,fontWeight:500,letterSpacing:"0.08em",cursor:canNext?"pointer":"not-allowed",transition:"all 0.2s",fontFamily:"'Nunito',sans-serif"}}>
            {currentQ===VISIBLE_QUESTIONS.length-1?"Formu Gönder →":"Devam →"}
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
  const [clinicModels,setClinicModels]=useState({});
  const [loading,setLoading]=useState(false);
  const [tab,setTab]=useState("overview");
  const [newDoc,setNewDoc]=useState({name:"",username:"",password:"",clinic_name:""});
  const [addErr,setAddErr]=useState("");
  const [addOk,setAddOk]=useState(false);

  async function login(){
    if(pass===ADMIN_PASS){setAuthed(true);loadData();}
    else setErr("Hatalı şifre.");
  }

  async function loadData(){
    setLoading(true);
    const [{data:docs},{data:pats},{data:models}]=await Promise.all([
      sb.from("doctors").select("id,name,username,clinic_name"),
      sb.from("patients").select("id,doctor_id,created_at,risk_score,segment,outcome_procedures,no_appointment,ambassador_code,ambassador_sent,had_procedure,procedure_date,satisfaction_1m,satisfaction_6m,would_recommend,had_revision,revision_reason,referred_count,referral_source,answers"),
      sb.from("clinic_models").select("doctor_id,version,threshold,threshold_src,n_train,label_count,n_neg,neg_count,accuracy,val_accuracy,val_f1,val_precision,val_recall,train_date,updated_at,is_active").catch(()=>({data:[]})),
    ]);
    setDoctors(docs||[]);
    setPatients(pats||[]);
    const modelMap = {};
    (models||[]).forEach(m=>{ modelMap[m.doctor_id]=m; });
    setClinicModels(modelMap);
    setLoading(false);
  }

  async function addDoctor(){
    setAddErr("");setAddOk(false);
    if(!newDoc.name||!newDoc.username||!newDoc.password||!newDoc.clinic_name){setAddErr("Tüm alanları doldurun.");return;}
    const id="dr-"+newDoc.username.toLowerCase().replace(/\s/g,"-");
    const {error}=await sb.from("doctors").insert({
      id, name:newDoc.name, username:newDoc.username,
      password_hash:newDoc.password, clinic_name:newDoc.clinic_name
    });
    if(error){setAddErr("Hata: "+error.message);}
    else{setAddOk(true);setNewDoc({name:"",username:"",password:"",clinic_name:""});loadData();}
  }

  const C={border:"#d4e1ef",muted:"#7b9ab5",navy:"#1e3a5f",ivory:"#f8fafd",ivory2:"#eef3f9"};
  const cardS={background:C.ivory2,border:`1px solid ${C.border}`,borderRadius:9,padding:"14px 18px"};

  if(!authed) return(
    <div style={{minHeight:"100vh",background:C.ivory,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Nunito',sans-serif"}}>
      <div style={{width:360,background:C.ivory2,border:`1px solid ${C.border}`,borderRadius:12,padding:"32px 28px"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:300,color:C.navy,marginBottom:4}}>Admin Paneli</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:24}}>SculptAI · Sadece sistem yöneticisi</div>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Şifre" style={{width:"100%",padding:"11px 13px",background:C.ivory,border:`1px solid ${C.border}`,borderRadius:7,fontSize:13,outline:"none",marginBottom:10,boxSizing:"border-box"}}/>
        {err&&<div style={{fontSize:13,color:"#dc2626",marginBottom:8}}>{err}</div>}
        <button onClick={login} style={{width:"100%",padding:"11px",background:C.navy,border:"none",borderRadius:7,color:C.ivory,fontSize:13,fontWeight:500,cursor:"pointer",letterSpacing:"0.06em"}}>GİRİŞ</button>
      </div>
    </div>
  );

  // Klinik bazlı istatistikler
  const stats=doctors.map(doc=>{
    const dp=patients.filter(p=>p.doctor_id===doc.id);
    const total=dp.length;
    const critical=dp.filter(p=>(p.risk_score||0)>=68).length;
    const noAppt=dp.filter(p=>p.no_appointment).length;
    const withOutcome=dp.filter(p=>p.outcome_procedures?.length>0);
    const donusum=total?Math.round(withOutcome.length/total*100):0;
    const crossSell=dp.filter(p=>p.outcome_procedures?.length>0&&p.outcome_procedures.some(x=>x!==(p.answers?.procedure||""))).length;
    const ambassadors=dp.filter(p=>p.ambassador_code&&p.ambassador_code!=="").length;
    // ML doğruluğu — kırmızı + randevu yok
    const redPats=dp.filter(p=>(p.risk_score||0)>=68);
    const redNoAppt=redPats.filter(p=>p.no_appointment).length;
    const redKnown=redPats.filter(p=>p.no_appointment||p.outcome_procedures?.length>0).length;
    const mlAcc=redKnown>0?Math.round(redNoAppt/redKnown*100):null;
    // Son aktivite
    const dates=dp.map(p=>new Date(p.created_at)).filter(d=>!isNaN(d));
    const lastActive=dates.length>0?new Date(Math.max(...dates)).toLocaleDateString("tr-TR",{day:"numeric",month:"short"}):"—";
    // Aktif mi? Son 30 gün
    const isActive=dates.some(d=>(Date.now()-d.getTime())<30*86400000);
    return{...doc,total,critical,noAppt,donusum,crossSell,ambassadors,mlAcc,lastActive,isActive};
  });

  const total={
    patients:patients.length,
    critical:patients.filter(p=>(p.risk_score||0)>=68).length,
    noAppt:patients.filter(p=>p.no_appointment).length,
    withOutcome:patients.filter(p=>p.outcome_procedures?.length>0).length,
    crossSell:patients.filter(p=>p.outcome_procedures?.length>0&&p.outcome_procedures.some(x=>x!==(p.answers?.procedure||""))).length,
    ambassadors:patients.filter(p=>p.ambassador_code&&p.ambassador_code!=="").length,
  };
  const totalDonusum=total.patients?Math.round(total.withOutcome/total.patients*100):0;

  // ML genel doğruluk
  const redAll=patients.filter(p=>(p.risk_score||0)>=68);
  const redNoApptAll=redAll.filter(p=>p.no_appointment).length;
  const redKnownAll=redAll.filter(p=>p.no_appointment||p.outcome_procedures?.length>0).length;
  const mlAccAll=redKnownAll>0?Math.round(redNoApptAll/redKnownAll*100):null;

  return(
    <div style={{minHeight:"100vh",background:C.ivory,fontFamily:"'Nunito',sans-serif"}}>
      {/* Header */}
      <div style={{background:C.navy,padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:C.ivory,fontWeight:300}}>SculptAI <em>Admin</em></div>
          <div style={{fontSize:11,color:"rgba(245,240,232,0.4)",letterSpacing:"0.06em"}}>{doctors.length} klinik · {patients.length} hasta</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[["overview","Genel"],["clinics","Klinikler"],["ml","ML"],["add","+ Yeni Klinik"]].map(([v,l])=>(
            <button key={v} onClick={()=>setTab(v)} style={{padding:"6px 14px",borderRadius:7,fontSize:12,border:"none",
              background:tab===v?"rgba(245,240,232,0.15)":"transparent",color:tab===v?C.ivory:"rgba(245,240,232,0.4)",cursor:"pointer"}}>
              {l}
            </button>
          ))}
          <button onClick={loadData} style={{padding:"6px 12px",borderRadius:7,fontSize:12,border:"1px solid rgba(245,240,232,0.2)",background:"transparent",color:"rgba(245,240,232,0.4)",cursor:"pointer"}}>↻</button>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 32px"}}>
        {loading&&<div style={{textAlign:"center",padding:40,color:C.muted}}>Yükleniyor...</div>}

        {/* GENEL BAKIŞ */}
        {tab==="overview"&&!loading&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:24}}>
              {[
                {lbl:"Toplam Hasta",val:total.patients,color:C.navy},
                {lbl:"Dönüşüm",val:total.withOutcome>0?`%${totalDonusum}`:"—",color:totalDonusum>=60?"#059669":"#d97706"},
                {lbl:"Kritik Profil",val:total.critical,color:"#dc2626"},
                {lbl:"Cross-sell",val:total.crossSell,color:"#059669"},
                {lbl:"ML Doğruluğu",val:mlAccAll!=null?`%${mlAccAll}`:"—",color:"#7c3aed"},
              ].map((k,i)=>(
                <div key={i} style={{...cardS,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.color}}/>
                  <div style={{fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:C.muted,marginBottom:6}}>{k.lbl}</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:300,fontVariantNumeric:"lining-nums",color:k.color,lineHeight:1}}>{k.val}</div>
                </div>
              ))}
            </div>

            {/* Klinik özet tablosu */}
            <div style={{...cardS,padding:0,overflow:"hidden"}}>
              <div style={{padding:"12px 20px",borderBottom:`1px solid ${C.border}`}}>
                <div style={{fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:C.muted,fontWeight:500}}>Klinik Özet</div>
              </div>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{background:C.ivory2}}>
                    {["Klinik","Durum","Hasta","Dönüşüm","Kritik","Cross-sell","Son Aktivite"].map(h=>(
                      <th key={h} style={{padding:"10px 16px",fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",color:C.muted,fontWeight:500,textAlign:"left",borderBottom:`1px solid ${C.border}`}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s,i)=>(
                    <tr key={s.id} style={{borderBottom:i<stats.length-1?`1px solid ${C.border}`:"none"}}>
                      <td style={{padding:"12px 16px"}}>
                        <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:C.navy}}>{s.clinic_name||"—"}</div>
                        <div style={{fontSize:11,color:C.muted}}>{s.name}</div>
                      </td>
                      <td style={{padding:"12px 16px"}}>
                        <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:s.isActive?"#ecfdf5":"#fff5f5",color:s.isActive?"#059669":"#dc2626",border:`1px solid ${s.isActive?"#a7f3d0":"#fecaca"}`}}>
                          {s.isActive?"Aktif":"Pasif"}
                        </span>
                      </td>
                      <td style={{padding:"12px 16px",fontFamily:"'Playfair Display',serif",fontSize:20,color:C.navy}}>{s.total}</td>
                      <td style={{padding:"12px 16px",fontSize:13,color:s.donusum>=60?"#059669":s.donusum>0?"#d97706":C.muted}}>{s.total>0?`%${s.donusum}`:"—"}</td>
                      <td style={{padding:"12px 16px"}}><span style={{fontSize:12,padding:"2px 8px",borderRadius:10,background:s.critical>0?"#fef2f2":"transparent",color:s.critical>0?"#991b1b":C.muted,border:s.critical>0?"1px solid #fecaca":"none"}}>{s.critical}</span></td>
                      <td style={{padding:"12px 16px",fontSize:13,color:s.crossSell>0?"#059669":C.muted}}>{s.crossSell}</td>
                      <td style={{padding:"12px 16px",fontSize:12,color:C.muted}}>{s.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* KLİNİKLER */}
        {tab==="clinics"&&!loading&&(
          <div style={{display:"grid",gap:12}}>
            {stats.map(s=>(
              <div key={s.id} style={{...cardS}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                  <div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:C.navy}}>{s.clinic_name||"İsimsiz"}</div>
                    <div style={{fontSize:12,color:C.muted}}>Dr. {s.name} · @{s.username} · ID: {s.id}</div>
                  </div>
                  <span style={{fontSize:11,padding:"3px 10px",borderRadius:10,background:s.isActive?"#ecfdf5":"#fff5f5",color:s.isActive?"#059669":"#dc2626",border:`1px solid ${s.isActive?"#a7f3d0":"#fecaca"}`}}>
                    {s.isActive?"Son 30 günde aktif":"30+ gündür işlem yok"}
                  </span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
                  {[
                    {l:"Hasta",v:s.total,c:C.navy},
                    {l:"Dönüşüm",v:s.total>0?`%${s.donusum}`:"—",c:s.donusum>=60?"#059669":"#d97706"},
                    {l:"Kritik",v:s.critical,c:"#dc2626"},
                    {l:"Cross-sell",v:s.crossSell,c:"#059669"},
                    {l:"ML Doğruluğu",v:s.mlAcc!=null?`%${s.mlAcc}`:"—",c:"#7c3aed"},
                  ].map((k,i)=>(
                    <div key={i} style={{background:C.ivory,borderRadius:7,padding:"10px 12px",textAlign:"center"}}>
                      <div style={{fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,marginBottom:4}}>{k.l}</div>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontVariantNumeric:"lining-nums",color:k.c,fontWeight:300}}>{k.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:10,fontSize:11,color:C.muted}}>
                  Form linki: <span style={{color:C.navy,fontWeight:500}}>{window.location.origin}/form/{s.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ML PERFORMANS */}
        {tab==="ml"&&!loading&&(
          <div style={{display:"grid",gap:12}}>
            <div style={{...cardS}}>
              <div style={{fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:C.muted,marginBottom:16,fontWeight:500}}>Model Performansı — Genel</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
                {[
                  {l:"Toplam Etiketli",v:patients.filter(p=>p.no_appointment||p.outcome_procedures?.length>0).length,c:C.navy},
                  {l:"Kırmızı Hasta",v:redAll.length,c:"#dc2626"},
                  {l:"Doğru Alarm",v:redNoApptAll,c:"#dc2626"},
                  {l:"Hassasiyet",v:mlAccAll!=null?`%${mlAccAll}`:"—",c:"#7c3aed"},
                ].map((k,i)=>(
                  <div key={i} style={{background:C.ivory,borderRadius:7,padding:"12px 14px",textAlign:"center"}}>
                    <div style={{fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,marginBottom:6}}>{k.l}</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontVariantNumeric:"lining-nums",color:k.c,fontWeight:300}}>{k.v}</div>
                  </div>
                ))}
              </div>
              <div style={{background:C.ivory,borderRadius:8,padding:"12px 16px",fontSize:12,color:C.muted,lineHeight:1.7}}>
                <div style={{marginBottom:4,color:C.navy,fontWeight:500}}>Model v3 — {patients.filter(p=>p.no_appointment||p.outcome_procedures?.length>0).length} etiketli hasta</div>
                En güçlü sinyal: Revizyon tutumu → Beklenti → Doktor sayısı<br/>
                Yeşil hastaların %100'ü güvenli — yanlış güven yok<br/>
                Daha fazla negatif örnek geldikçe hassasiyet artacak
              </div>
            </div>

            {/* Klinik bazlı ML */}
            {stats.filter(s=>s.total>0).map(s=>(
              <div key={s.id} style={{...cardS}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:500,color:C.navy}}>{s.clinic_name}</div>
                    <div style={{fontSize:11,color:C.muted}}>{s.total} hasta · {s.noAppt} negatif örnek</div>
                  </div>
                  <span style={{fontSize:11,padding:"3px 10px",borderRadius:10,
                    background:clinicModels[s.id]?"#eff6ff":s.noAppt<10?"#fffbeb":"#ecfdf5",
                    color:clinicModels[s.id]?"#1d4ed8":s.noAppt<10?"#92400e":"#065f46",
                    border:`1px solid ${clinicModels[s.id]?"#dbeafe":s.noAppt<10?"#fde68a":"#a7f3d0"}`}}>
                    {clinicModels[s.id]?"Klinik Modeli Aktif":s.noAppt<10?"Veri Biriktirilyor":"Eğitime Hazır"}
                  </span>
                </div>
                <div style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginBottom:4}}>
                    <span>Klinik modeli için negatif örnek</span>
                    <span style={{fontWeight:500,color:s.noAppt>=10?"#059669":"#d97706"}}>{s.noAppt}/10</span>
                  </div>
                  <div style={{height:5,background:"#eef3f9",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:5,width:`${Math.min(100,s.noAppt*10)}%`,background:s.noAppt>=10?"#059669":"#1d4ed8",borderRadius:3}}/>
                  </div>
                </div>
                <div style={{fontSize:11,color:C.muted,background:C.ivory,borderRadius:7,padding:"10px 12px"}}>
                  {clinicModels[s.id] ? (
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontWeight:500,color:C.navy}}>v{clinicModels[s.id].version||1} — {clinicModels[s.id].train_date?new Date(clinicModels[s.id].train_date).toLocaleDateString("tr-TR"):""}</span>
                        <span style={{fontSize:10,color:"#7c3aed",background:"#faf5ff",padding:"1px 7px",borderRadius:8,border:"1px solid #e9d5ff"}}>
                          {clinicModels[s.id].threshold_src==="auto_f1"?"Otomatik F1":"Manuel"}
                        </span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:4}}>
                        {[
                          {l:"Doğruluk", v:clinicModels[s.id].val_accuracy?`%${Math.round(clinicModels[s.id].val_accuracy*100)}`:(clinicModels[s.id].accuracy?`%${Math.round(clinicModels[s.id].accuracy*100)}`:"—")},
                          {l:"F1",       v:clinicModels[s.id].val_f1?clinicModels[s.id].val_f1.toFixed(2):"—"},
                          {l:"Eşik",     v:clinicModels[s.id].threshold||60},
                          {l:"Etiketli", v:`${clinicModels[s.id].label_count||clinicModels[s.id].n_train||"—"} hasta`},
                        ].map((k,i)=>(
                          <div key={i} style={{background:"white",borderRadius:5,padding:"5px 7px",textAlign:"center",border:"1px solid #d4e1ef"}}>
                            <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>{k.l}</div>
                            <div style={{fontSize:13,fontWeight:500,color:C.navy,marginTop:2}}>{k.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : s.noAppt>=10
                    ? "10+ negatif örnek mevcut — klinik modeli eğitilebilir. Doruk'a bildirin."
                    : `${10-s.noAppt} negatif örnek daha gerekiyor. Outcome girişini düzenli tut.`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* YENİ KLİNİK EKLE */}
        {tab==="add"&&(
          <div style={{maxWidth:480}}>
            <div style={{...cardS}}>
              <div style={{fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:C.muted,marginBottom:20,fontWeight:500}}>Yeni Klinik Ekle</div>
              {[
                ["Doktor Adı Soyadı","name","text","Dr. Ayşe Kaya"],
                ["Kullanıcı Adı","username","text","dr-ayse"],
                ["Şifre","password","password","sculpt2024"],
                ["Klinik Adı","clinic_name","text","Özel Plastik Cerrahi"],
              ].map(([label,field,type,ph])=>(
                <div key={field} style={{marginBottom:14}}>
                  <div style={{fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,marginBottom:6}}>{label}</div>
                  <input type={type} value={newDoc[field]} placeholder={ph}
                    onChange={e=>setNewDoc(d=>({...d,[field]:e.target.value}))}
                    style={{width:"100%",padding:"10px 12px",background:C.ivory,border:`1px solid ${C.border}`,borderRadius:7,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                </div>
              ))}
              {addErr&&<div style={{fontSize:12,color:"#dc2626",marginBottom:10}}>{addErr}</div>}
              {addOk&&<div style={{fontSize:12,color:"#059669",marginBottom:10}}>✓ Klinik eklendi! Form linki: {window.location.origin}/form/dr-{newDoc.username||"..."}</div>}
              <button onClick={addDoctor} style={{width:"100%",padding:"11px",background:C.navy,border:"none",borderRadius:7,color:C.ivory,fontSize:13,fontWeight:500,cursor:"pointer",letterSpacing:"0.06em"}}>
                KLİNİK EKLE
              </button>
              <div style={{marginTop:12,fontSize:11,color:C.muted,lineHeight:1.6}}>
                Eklenen klinik hemen aktif olur. Doktor /panel sayfasından giriş yapabilir.
                Şifreyi doktor istediği zaman ayarlardan değiştirebilir.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


/* ─── LOGIN ──────────────────────────────────────────────────────────────── */
function Login({onLogin}){
  const [u,setU]=useState("");const [p,setP]=useState("");const [err,setErr]=useState("");const [loading,setLoading]=useState(false);
  const [isMobile,setIsMobile]=useState(window.innerWidth<640);
  useEffect(()=>{
    const fn=()=>setIsMobile(window.innerWidth<640);
    window.addEventListener("resize",fn);
    return()=>window.removeEventListener("resize",fn);
  },[]);
  async function attempt(){
    setLoading(true);setErr("");
    const {data}=await sb.from("doctors").select("*").eq("username",u).eq("password_hash",p).single();
    if(data) onLogin(data);
    else setErr("Kullanıcı adı veya şifre hatalı.");
    setLoading(false);
  }
  return(
    <div style={{minHeight:"100vh",background:"#f8fafd",fontFamily:"'Nunito',sans-serif",display:"flex",flexDirection:isMobile?"column":"row"}}>

      {/* SOL — Görsel (sadece masaüstü) */}
      {!isMobile&&(
        <div style={{flex:"0 0 52%",position:"relative",overflow:"hidden",display:"flex"}}>
          <img src="/login-hero.png" alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center"}}
            onError={e=>{e.target.parentElement.style.background="#eef3f9";e.target.style.display="none"}}/>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to right, rgba(245,240,232,0) 50%, rgba(245,240,232,1) 100%)"}}/>
          <div style={{position:"absolute",bottom:40,left:40,right:"30%"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:300,color:"white",lineHeight:1.4,textShadow:"0 2px 20px rgba(0,0,0,0.3)",fontStyle:"italic"}}>
              "Her hasta bir ilişki.<br/>Her ilişki bir güven."
            </div>
          </div>
        </div>
      )}

      {/* SAĞ — Form */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:isMobile?"32px 24px":"40px 48px",minHeight:isMobile?"100vh":"auto"}}>
        <div style={{width:"100%",maxWidth:360}}>

          {/* Logo */}
          <div style={{display:"flex",flexDirection:"column",alignItems:isMobile?"center":"flex-start",gap:2,marginBottom:isMobile?32:52}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:22,height:22,border:"1px solid #d4e1ef",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:7,height:7,background:"#1e3a5f",borderRadius:"50%"}}/>
              </div>
              <div style={{fontSize:13,fontWeight:500,color:"#1e3a5f",letterSpacing:"0.04em"}}>SculptAI</div>
            </div>
            {isMobile&&<div style={{fontSize:11,color:"#7b9ab5",letterSpacing:"0.08em"}}>Hacettepe Plastik Cerrahi</div>}
          </div>

          {/* Title */}
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?32:44,fontWeight:300,color:"#1e3a5f",lineHeight:1.1,marginBottom:10,letterSpacing:"-0.02em",textAlign:isMobile?"center":"left"}}>
            Görünmeyeni<br/><em>görmek.</em>
          </div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?14:17,fontWeight:300,fontStyle:"italic",color:"#7b9ab5",lineHeight:1.7,marginBottom:isMobile?28:44,textAlign:isMobile?"center":"left"}}>
            Hasta beklentisi, karar kalitesini<br/><span style={{color:"#1e3a5f",fontStyle:"normal",fontWeight:400}}>doğrudan etkiler.</span>
          </div>

          {/* Fields */}
          {[["KULLANICI ADI",u,setU,"text"],["ŞİFRE",p,setP,"password"]].map(([label,val,set,type])=>(
            <div key={label} style={{marginBottom:14}}>
              <div style={{fontSize:11,color:"#7b9ab5",letterSpacing:"0.15em",marginBottom:6}}>{label}</div>
              <input type={type} value={val} onChange={e=>set(e.target.value)} onKeyDown={e=>e.key==="Enter"&&attempt()} style={{width:"100%",padding:"12px 14px",background:"#eef3f9",border:"1px solid #d4e1ef",borderRadius:8,color:"#1e3a5f",fontSize:14,outline:"none",fontFamily:"'Nunito',sans-serif",boxSizing:"border-box"}}/>
            </div>
          ))}

          {err&&<div style={{marginBottom:14,padding:"9px 12px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,fontSize:13,color:"#dc2626"}}>{err}</div>}

          <button onClick={attempt} disabled={loading} style={{width:"100%",padding:"13px",background:"#1e3a5f",border:"none",borderRadius:8,color:"#f8fafd",fontSize:13,fontWeight:500,letterSpacing:"0.1em",cursor:"pointer",opacity:loading?0.7:1,fontFamily:"'Nunito',sans-serif",marginTop:4}}>
            {loading?"GİRİŞ YAPILIYOR...":"GİRİŞ YAP"}
          </button>

          <div style={{textAlign:"center",fontSize:11,color:"#d4e1ef",marginTop:20,letterSpacing:"0.06em"}}>
            Hacettepe Üniversitesi · Plastik Cerrahi
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────────────────── */

export class ErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={hasError:false,error:null};}
  static getDerivedStateFromError(e){return{hasError:true,error:e};}
  componentDidCatch(e,info){console.error("SculptAI Error:",e,info);}
  render(){
    if(this.state.hasError){
      return(
        <div style={{padding:32,fontFamily:"'Nunito',sans-serif",color:"#1e3a5f"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:8}}>Bir hata oluştu</div>
          <div style={{fontSize:13,color:"#7b9ab5",marginBottom:16}}>{String(this.state.error?.message||"")}</div>
          <button onClick={()=>window.location.reload()} style={{padding:"8px 20px",background:"#1d4ed8",color:"white",border:"none",borderRadius:8,cursor:"pointer",fontSize:13}}>Sayfayı Yenile</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App(){
  const [view,setView]=useState(()=>{
    const path=window.location.pathname;
    if(path.match(/^\/form\/.+$/)) return "patient";
    if(path.startsWith("/admin")) return "admin";
    if(path.startsWith("/panel")) return "doctor_or_login";
    return "patient";
  });
  const [doctor,setDoctor]=useState(null);
  const [doctorId,setDoctorId]=useState(()=>{
    const m=window.location.pathname.match(/^\/form\/(.+)$/);
    return m?m[1]:null;
  });

  useEffect(()=>{
    const path=window.location.pathname;
    if(path.startsWith("/panel")){
      try{const saved=sessionStorage.getItem("sculpt_doctor");if(saved){const d=JSON.parse(saved);setDoctor(d);setView("doctor");}else{setView("login");}}catch{setView("login");}
    }
  },[]);

  if(view==="loading"||view==="doctor_or_login") return null;

  if(view==="patient") return(
    <div>
      <PatientForm doctorId={doctorId}/>
      <button onClick={()=>setView("login")} style={{position:"fixed",bottom:16,right:16,padding:"6px 14px",background:"rgba(12,20,40,0.06)",border:"1px solid rgba(12,20,40,0.1)",borderRadius:8,color:"rgba(12,20,40,0.35)",fontSize:13,cursor:"pointer"}}>🔒</button>
    </div>
  );

  if(view==="admin") return <AdminPanel/>;
  if(view==="login") return <Login onLogin={d=>{try{sessionStorage.setItem("sculpt_doctor",JSON.stringify(d));}catch{}setDoctor(d);setView("doctor");}}/>;

  return <DoctorPanel doctor={doctor} onLogout={()=>{try{sessionStorage.removeItem("sculpt_doctor");}catch{}setDoctor(null);setView("login");}}/>;
}
