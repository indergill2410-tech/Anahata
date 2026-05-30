import React, { useState, useEffect, useRef, useCallback } from 'react';
import AnahataOrb, { OrbId } from '../components/AnahataOrb';

// ─── Types ────────────────────────────────────────────────────────────────────
interface JournalEntry {
  date: string; mood: number; text: string; followUp: string;
  sessionBw?: string; sessionMin?: number; sessionHz?: number;
  tags: string[]; cta: string;
}
type JournalStore = Record<string, JournalEntry>;

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'anahata_journal';

const MOOD_CONFIG = [
  { value:1, label:'Rough',    color:'#E64980', orbId:'mood-rough'    as OrbId },
  { value:2, label:'Okay',     color:'#F59F00', orbId:'mood-okay'     as OrbId },
  { value:3, label:'Good',     color:'#0CA678', orbId:'mood-good'     as OrbId },
  { value:4, label:'Great',    color:'#3B5BDB', orbId:'mood-great'    as OrbId },
  { value:5, label:'Blissful', color:'#7048E8', orbId:'mood-blissful' as OrbId },
];

const PRESET_TAGS = ['calm','focused','grateful','restless','anxious','peaceful','energised','creative','tired','inspired'];

const CTA_OPTIONS = [
  { id:'day',      icon:'🌅', label:'Tell me about your day',      placeholder:'Walk me through your day — big or small, it all matters…' },
  { id:'weight',   icon:'🌊', label:"What's weighing on you?",     placeholder:"What's been on your mind? You can be honest here..." },
  { id:'grateful', icon:'✨', label:"Something you're grateful for", placeholder:'Even one small thing. What made today worth it?' },
  { id:'win',      icon:'🏆', label:'Celebrate a win',             placeholder:'Big or tiny — what went right today?' },
  { id:'release',  icon:'🍃', label:'Something to release',        placeholder:'What would feel better if you let it go tonight?' },
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['S','M','T','W','T','F','S'];

// ─── Smart follow-up questions ────────────────────────────────────────────────
const FOLLOWUPS: Array<{ keys: string[]; question: string; feedback: (mood: number) => string }> = [
  {
    keys: ['tired','exhausted','drained','sleep','sleepy'],
    question: "Rest is resistance. What would feel most restorative for you right now — sleep, stillness, or something else?",
    feedback: (m) => m >= 3
      ? "There's strength in knowing when to rest. Your body is asking for something. Trust that."
      : "Heavy days are real. You showed up anyway — that counts for everything.",
  },
  {
    keys: ['anxious','anxiety','worried','worry','stress','stressed','overwhelmed'],
    question: "When you zoom out — is this something you can influence, or something you need to release?",
    feedback: (m) => m >= 3
      ? "Naming it takes courage. Anxiety shrinks when it's seen. You're already doing the work."
      : "You're carrying a lot. Breathe. This moment, right now, is safe.",
  },
  {
    keys: ['happy','great','amazing','wonderful','joy','excited','grateful','good'],
    question: "Beautiful. What do you want to anchor from today so you can return to this feeling?",
    feedback: () => "Savour this. The fact that you noticed it means it's real. Write it into your bones.",
  },
  {
    keys: ['sad','upset','hurt','pain','crying','cry','grief','lost','lonely'],
    question: "You don't have to carry this alone. Is there one person or one thing that made today even 1% softer?",
    feedback: () => "Feeling this deeply is a sign of how much you care. That's not weakness — that's your humanity.",
  },
  {
    keys: ['work','job','meeting','project','deadline','boss','colleague','office'],
    question: "Outside of work — what was one moment today that was just for you?",
    feedback: (m) => m >= 3
      ? "Work is part of life, not all of it. You're more than your output."
      : "Even when work is heavy, you exist beyond it. This journal is proof.",
  },
  {
    keys: ['meditat','breathe','breathing','calm','peaceful','still','quiet','present'],
    question: "What opened up for you in that stillness? Even a flicker — what did you notice?",
    feedback: () => "Stillness is its own kind of intelligence. What you touched in that quiet is real and yours.",
  },
  {
    keys: ['create','created','art','music','wrote','writing','draw','design','made'],
    question: "Creating is an act of trust. What did today's work teach you about yourself?",
    feedback: () => "Every creative act is a small act of faith. You made something that didn't exist before. That matters.",
  },
];

const DEFAULT_FOLLOWUP = {
  question: "If today had a soundtrack, what would it sound like? Or — what's one thing you want tomorrow to feel like?",
  feedback: (m: number) => m >= 4
    ? "You're moving with intention. Keep going — the path is unfolding perfectly."
    : m >= 3
    ? "Today was a chapter, not the whole story. Rest, and begin again."
    : "Some days are just hard. That's allowed. Tomorrow is a clean page.",
};

function getFollowUp(text: string) {
  const l = text.toLowerCase();
  for (const f of FOLLOWUPS) if (f.keys.some(k => l.includes(k))) return f;
  return DEFAULT_FOLLOWUP;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toKey(y:number,m:number,d:number){ return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function todayKey(){ const n=new Date(); return toKey(n.getFullYear(),n.getMonth(),n.getDate()); }
function loadStore():JournalStore{ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return{}} }
function saveStore(s:JournalStore){ localStorage.setItem(STORAGE_KEY,JSON.stringify(s)); }
function getDaysInMonth(y:number,m:number){ return new Date(y,m+1,0).getDate(); }
function getFirstDayOfMonth(y:number,m:number){ return new Date(y,m,1).getDay(); }
function calcStreak(store:JournalStore){
  let streak=0; const cur=new Date(); cur.setHours(0,0,0,0);
  while(true){ const k=toKey(cur.getFullYear(),cur.getMonth(),cur.getDate()); if(store[k]){streak++;cur.setDate(cur.getDate()-1);}else break; }
  return streak;
}
function formatShortDate(dateStr:string){
  const [y,m,d]=dateStr.split('-').map(Number);
  return new Date(y,m-1,d).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
}

// ─── Components ───────────────────────────────────────────────────────────────
function Bubble({ text, delay=0 }:{ text:string; delay?:number }){
  const [vis,setVis]=useState(delay===0);
  useEffect(()=>{ if(delay===0)return; const t=setTimeout(()=>setVis(true),delay); return ()=>clearTimeout(t); },[delay]);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:10, opacity:vis?1:0, transform:vis?'translateY(0)':'translateY(10px)', transition:'all 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
      <AnahataOrb id="int-peace" size={28}/>
      <div style={{ background:'#fff', border:'1px solid rgba(23,18,10,0.08)', borderRadius:'18px 18px 18px 4px', padding:'11px 16px', maxWidth:'82%', boxShadow:'0 2px 10px rgba(23,18,10,0.07)', fontSize:14, color:'#17120A', lineHeight:1.6, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        {text}
      </div>
    </div>
  );
}

function UserBubble({ children }:{ children: React.ReactNode }){
  return (
    <div style={{ display:'flex', justifyContent:'flex-end' }}>
      <div style={{ background:'#7048E8', color:'#fff', borderRadius:'18px 18px 4px 18px', padding:'10px 16px', maxWidth:'82%', fontSize:14, lineHeight:1.6, fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:'0 4px 14px rgba(112,72,232,0.25)' }}>
        {children}
      </div>
    </div>
  );
}

function TypingDots(){
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:10 }}>
      <AnahataOrb id="int-peace" size={28}/>
      <div style={{ background:'#fff', border:'1px solid rgba(23,18,10,0.08)', borderRadius:'18px 18px 18px 4px', padding:'12px 16px', boxShadow:'0 2px 10px rgba(23,18,10,0.07)', display:'flex', gap:5, alignItems:'center' }}>
        {[0,1,2].map(i=><div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'#C2B5A3', animation:`dotBounce 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
      </div>
    </div>
  );
}

function MiniCalendar({ year,month,store,onSelect,onPrev,onNext }:{ year:number; month:number; store:JournalStore; onSelect:(d:string)=>void; onPrev:()=>void; onNext:()=>void; }){
  const today=todayKey();
  const days=getDaysInMonth(year,month); const first=getFirstDayOfMonth(year,month);
  const cells:(number|null)[]=[];
  for(let i=0;i<first;i++) cells.push(null);
  for(let d=1;d<=days;d++) cells.push(d);
  while(cells.length%7!==0) cells.push(null);
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <button onClick={onPrev} style={{ background:'none', border:'none', cursor:'pointer', color:'#8C7D6C', padding:4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:700, color:'#17120A' }}>{MONTHS[month]} {year}</span>
        <button onClick={onNext} style={{ background:'none', border:'none', cursor:'pointer', color:'#8C7D6C', padding:4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg></button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
        {DAYS_SHORT.map((d,i)=><div key={i} style={{ textAlign:'center', fontSize:10, fontWeight:700, color:'#C2B5A3', paddingBottom:4 }}>{d}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px 0' }}>
        {cells.map((day,idx)=>{
          if(day===null) return <div key={`e${idx}`}/>;
          const key=toKey(year,month,day);
          const entry=store[key]; const isToday=key===today;
          const moodColor=entry?.mood?MOOD_CONFIG[entry.mood-1].color:undefined;
          return (
            <div key={key} onClick={()=>onSelect(key)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'2px 0', cursor:'pointer' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:500, background:moodColor||'transparent', color:moodColor?'#fff':'#4A3F32', border:isToday&&!moodColor?'2px solid #7048E8':'none', transition:'all 0.15s' }}>{day}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
type Step = 'greeting'|'mood'|'tags'|'cta'|'write'|'followup'|'feedback'|'done';

export default function JournalPage() {
  const today = new Date(); const todayStr = todayKey();
  const [store,       setStore]      = useState<JournalStore>(loadStore);
  const [step,        setStep]       = useState<Step>('greeting');
  const [mood,        setMood]       = useState(0);
  const [tags,        setTags]       = useState<string[]>([]);
  const [cta,         setCta]        = useState('');
  const [dayText,     setDayText]    = useState('');
  const [followUpAns, setFollowUpAns]= useState('');
  const [typing,      setTyping]     = useState(false);
  const [showCal,     setShowCal]    = useState(false);
  const [calYear,     setCalYear]    = useState(today.getFullYear());
  const [calMonth,    setCalMonth]   = useState(today.getMonth());
  const [viewing,     setViewing]    = useState<string|null>(null);
  const [draft,       setDraft]      = useState('');

  const bottomRef  = useRef<HTMLDivElement>(null);
  const textareaRef= useRef<HTMLTextAreaElement>(null);
  const streak     = calcStreak(store);
  const todayEntry = store[todayStr];
  const moodCfg    = MOOD_CONFIG[mood-1];
  const ctaCfg     = CTA_OPTIONS.find(c=>c.id===cta);
  const followUp   = dayText ? getFollowUp(dayText) : DEFAULT_FOLLOWUP;
  const greeting   = today.getHours()<12?'Good morning':today.getHours()<17?'Good afternoon':'Good evening';

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[step,typing,mood]);
  useEffect(()=>{
    if(todayEntry){ setStep('done'); setMood(todayEntry.mood); setTags(todayEntry.tags); setCta(todayEntry.cta||'day'); setDayText(todayEntry.text); setFollowUpAns(todayEntry.followUp||''); }
    else { setStep('greeting'); setMood(0); setTags([]); setCta(''); setDayText(''); setFollowUpAns(''); }
  },[todayStr]);

  const after = (next:Step, ms=900) => { setTyping(true); setTimeout(()=>{ setTyping(false); setStep(next); },ms); };

  const handleMood = (v:number) => { setMood(v); after('tags'); };
  const toggleTag  = (t:string) => setTags(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t]);
  const handleTags = () => after('cta');
  const handleCta  = (id:string) => { setCta(id); after('write',600); };

  const handleDaySubmit = () => {
    setDayText(draft); setDraft('');
    after('followup', 1000);
  };

  const handleFollowUpSubmit = () => {
    setFollowUpAns(draft); setDraft('');
    after('feedback', 800);
  };

  const handleSave = useCallback((fuAns?:string) => {
    const entry:JournalEntry = { date:todayStr, mood, tags, cta, text:dayText, followUp:fuAns??followUpAns };
    setStore(prev=>{ const next={...prev,[todayStr]:entry}; saveStore(next); return next; });
    setStep('done');
  },[todayStr,mood,tags,cta,dayText,followUpAns]);

  // Auto-save when feedback shown
  useEffect(()=>{ if(step==='feedback'&&followUpAns) handleSave(followUpAns); },[step]);

  // ── Past entry view ─────────────────────────────────────────────────────────
  if(viewing){
    const e=store[viewing]; const mc=e?MOOD_CONFIG[e.mood-1]:undefined;
    const ctaLabel=CTA_OPTIONS.find(c=>c.id===e?.cta)?.label||'Journal entry';
    return (
      <div className="dashboard fade-in">
        <style>{STYLES}</style>
        <button onClick={()=>setViewing(null)} style={{ alignSelf:'flex-start', display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'#8C7D6C', fontSize:13, fontFamily:'inherit', padding:'4px 0' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>Back
        </button>
        {e?(
          <div style={{ background:'#fff', borderRadius:20, border:'1px solid rgba(23,18,10,0.07)', padding:20, display:'flex', flexDirection:'column', gap:14, boxShadow:'0 2px 12px rgba(23,18,10,0.07)' }}>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:17, fontWeight:700, color:'#17120A' }}>{formatShortDate(viewing)}</div>
            {mc&&<div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'7px 14px', borderRadius:24, background:mc.color+'18', alignSelf:'flex-start' }}><AnahataOrb id={mc.orbId} size={22}/><span style={{ fontSize:13, fontWeight:700, color:mc.color }}>{mc.label}</span></div>}
            <div style={{ fontSize:11, fontWeight:700, color:'#C2B5A3', letterSpacing:'0.06em', textTransform:'uppercase' }}>{ctaLabel}</div>
            {e.text&&<p style={{ margin:0, fontSize:14, color:'#4A3F32', lineHeight:1.75 }}>{e.text}</p>}
            {e.followUp&&<><div style={{ fontSize:11, fontWeight:700, color:'#C2B5A3', letterSpacing:'0.06em', textTransform:'uppercase', marginTop:4 }}>Reflection</div><p style={{ margin:0, fontSize:14, color:'#4A3F32', lineHeight:1.75 }}>{e.followUp}</p></>}
            {e.tags.length>0&&<div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>{e.tags.map(t=><span key={t} style={{ padding:'4px 11px', borderRadius:20, fontSize:11, fontWeight:600, background:'rgba(112,72,232,0.1)', color:'#7048E8' }}>{t}</span>)}</div>}
          </div>
        ):<p style={{ color:'#8C7D6C', fontSize:14 }}>No entry for this day.</p>}
      </div>
    );
  }

  // ── Main ────────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard fade-in">
      <style>{STYLES}</style>

      {/* Top strip */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ margin:0, fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, color:'#17120A', letterSpacing:'-0.02em' }}>Journal</h1>
          <p style={{ margin:'2px 0 0', fontSize:12, color:'#8C7D6C' }}>{formatShortDate(todayStr)}</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {streak>=2&&<div style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:20, background:'rgba(245,159,0,0.1)', border:'1px solid rgba(245,159,0,0.2)' }}><span style={{ fontSize:13 }}>🔥</span><span style={{ fontSize:12, fontWeight:700, color:'#F59F00' }}>{streak}d</span></div>}
          <button onClick={()=>setShowCal(v=>!v)} style={{ width:36, height:36, borderRadius:12, border:'1px solid rgba(23,18,10,0.08)', background:showCal?'#7048E8':'#fff', color:showCal?'#fff':'#8C7D6C', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.2s', boxShadow:'0 2px 8px rgba(23,18,10,0.07)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </button>
        </div>
      </div>

      {/* Mini calendar */}
      {showCal&&(
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid rgba(23,18,10,0.08)', padding:16, boxShadow:'0 2px 12px rgba(23,18,10,0.07)', animation:'slideDown 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <MiniCalendar year={calYear} month={calMonth} store={store}
            onSelect={d=>{ if(d!==todayStr){setViewing(d);setShowCal(false);} }}
            onPrev={()=>{ if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1); }}
            onNext={()=>{ if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1); }}
          />
        </div>
      )}

      {/* Chat thread */}
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

        <Bubble text={`${greeting} ✨`} delay={0}/>

        {/* Mood step */}
        {step!=='greeting'&&<Bubble text="How are you feeling right now?" delay={0}/>}
        {mood>0&&moodCfg&&(
          <UserBubble><div style={{ display:'flex', alignItems:'center', gap:8 }}><AnahataOrb id={moodCfg.orbId} size={20}/>{moodCfg.label}</div></UserBubble>
        )}

        {/* Tags step */}
        {(step==='tags'||step==='cta'||step==='write'||step==='followup'||step==='feedback'||step==='done')&&!typing&&(
          <Bubble text="Got it. Any words that describe today?" delay={0}/>
        )}
        {tags.length>0&&(step==='cta'||step==='write'||step==='followup'||step==='feedback'||step==='done')&&(
          <UserBubble><div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>{tags.map(t=><span key={t} style={{ background:'rgba(255,255,255,0.2)', padding:'2px 9px', borderRadius:12, fontSize:12 }}>{t}</span>)}</div></UserBubble>
        )}

        {/* CTA step */}
        {(step==='cta'||step==='write'||step==='followup'||step==='feedback'||step==='done')&&!typing&&(
          <Bubble text="What do you want to explore today?" delay={0}/>
        )}
        {ctaCfg&&(step==='write'||step==='followup'||step==='feedback'||step==='done')&&(
          <UserBubble>{ctaCfg.icon} {ctaCfg.label}</UserBubble>
        )}

        {/* Write step */}
        {(step==='followup'||step==='feedback'||step==='done')&&ctaCfg&&(
          <Bubble text={ctaCfg.placeholder} delay={0}/>
        )}
        {dayText&&(step==='followup'||step==='feedback'||step==='done')&&(
          <UserBubble>{dayText}</UserBubble>
        )}

        {/* Follow-up step */}
        {(step==='followup'||step==='feedback'||step==='done')&&!typing&&(
          <Bubble text={followUp.question} delay={0}/>
        )}
        {followUpAns&&(step==='feedback'||step==='done')&&(
          <UserBubble>{followUpAns}</UserBubble>
        )}

        {/* Feedback + done */}
        {(step==='feedback'||step==='done')&&!typing&&(
          <Bubble text={followUp.feedback(mood)} delay={0}/>
        )}
        {step==='done'&&!typing&&(
          <Bubble text="Your entry is saved 🌙 Take care of yourself tonight." delay={200}/>
        )}

        {typing&&<TypingDots/>}
        <div ref={bottomRef}/>
      </div>

      {/* ── Input area ── */}
      {step==='greeting'&&!typing&&(
        <button onClick={()=>after('mood',600)} style={{ background:'linear-gradient(135deg,#7048E8,#3B5BDB)', color:'#fff', border:'none', borderRadius:16, padding:'14px 24px', fontSize:15, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", cursor:'pointer', boxShadow:'0 4px 20px rgba(112,72,232,0.35)', animation:'pulseGlow 2.5s ease-in-out infinite', transition:'transform 0.15s' }}
          onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.03)')} onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}>
          Start today's check-in ✨
        </button>
      )}

      {step==='mood'&&!typing&&(
        <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
          {MOOD_CONFIG.map(m=>(
            <button key={m.value} onClick={()=>handleMood(m.value)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5, padding:'10px 3px', border:'2px solid', borderRadius:16, cursor:'pointer', borderColor:mood===m.value?m.color:'rgba(23,18,10,0.08)', background:mood===m.value?m.color+'18':'#fff', transition:'all 0.18s cubic-bezier(0.34,1.56,0.64,1)', transform:mood===m.value?'scale(1.08)':'scale(1)' }}>
              <AnahataOrb id={m.orbId} size={40} selected={mood===m.value}/>
              <span style={{ fontSize:9, fontWeight:700, color:mood===m.value?m.color:'#8C7D6C', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{m.label}</span>
            </button>
          ))}
        </div>
      )}

      {step==='tags'&&!typing&&(
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {PRESET_TAGS.map(tag=>{ const active=tags.includes(tag); return (
              <button key={tag} onClick={()=>toggleTag(tag)} style={{ padding:'7px 14px', borderRadius:24, border:'1.5px solid', cursor:'pointer', fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600, borderColor:active?'#7048E8':'rgba(23,18,10,0.1)', background:active?'#7048E8':'#fff', color:active?'#fff':'#4A3F32', transition:'all 0.15s cubic-bezier(0.34,1.56,0.64,1)', transform:active?'scale(1.05)':'scale(1)', boxShadow:active?'0 3px 12px rgba(112,72,232,0.25)':'none' }}>{tag}</button>
            );})}
          </div>
          <button onClick={handleTags} style={{ padding:'12px', borderRadius:14, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#7048E8,#3B5BDB)', color:'#fff', fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:700, boxShadow:'0 4px 16px rgba(112,72,232,0.3)' }}>
            {tags.length>0?`Continue →`:'Skip →'}
          </button>
        </div>
      )}

      {step==='cta'&&!typing&&(
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {CTA_OPTIONS.map(c=>(
            <button key={c.id} onClick={()=>handleCta(c.id)} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', background:'#fff', border:'1.5px solid rgba(23,18,10,0.08)', borderRadius:16, cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all 0.18s cubic-bezier(0.34,1.56,0.64,1)', boxShadow:'0 2px 8px rgba(23,18,10,0.06)' }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(112,72,232,0.3)'; e.currentTarget.style.transform='translateX(3px)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(23,18,10,0.08)'; e.currentTarget.style.transform='translateX(0)'; }}>
              <span style={{ fontSize:22, flexShrink:0 }}>{c.icon}</span>
              <span style={{ fontSize:14, fontWeight:600, color:'#17120A', fontFamily:"'Space Grotesk',sans-serif" }}>{c.label}</span>
              <svg style={{ marginLeft:'auto', flexShrink:0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C2B5A3" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ))}
        </div>
      )}

      {(step==='write'||step==='followup')&&!typing&&(
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <textarea ref={textareaRef} value={draft} onChange={e=>setDraft(e.target.value)} placeholder={step==='write'?ctaCfg?.placeholder||'Write freely…':'Take your time…'} rows={3}
            onKeyDown={e=>{ if(e.key==='Enter'&&e.metaKey){ e.preventDefault(); step==='write'?handleDaySubmit():handleFollowUpSubmit(); } }}
            style={{ width:'100%', resize:'none', borderRadius:16, padding:'13px 16px', border:'1.5px solid rgba(23,18,10,0.1)', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, color:'#17120A', background:'#fff', outline:'none', lineHeight:1.65, boxSizing:'border-box', boxShadow:'0 2px 8px rgba(23,18,10,0.06)', transition:'border-color 0.15s' }}
            onFocus={e=>(e.target.style.borderColor='#7048E8')} onBlur={e=>(e.target.style.borderColor='rgba(23,18,10,0.1)')} autoFocus/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, color:'#C2B5A3', fontFamily:"'JetBrains Mono',monospace" }}>⌘↵ to send</span>
            <button onClick={step==='write'?handleDaySubmit:handleFollowUpSubmit} disabled={!draft.trim()} style={{ padding:'10px 22px', borderRadius:14, border:'none', cursor:draft.trim()?'pointer':'not-allowed', background:draft.trim()?'linear-gradient(135deg,#7048E8,#3B5BDB)':'rgba(23,18,10,0.08)', color:draft.trim()?'#fff':'#C2B5A3', fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:700, boxShadow:draft.trim()?'0 4px 14px rgba(112,72,232,0.28)':'none', transition:'all 0.15s' }}>
              Send →
            </button>
          </div>
          {step==='write'&&(
            <button onClick={()=>{ setDayText(''); after('followup',600); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#C2B5A3', fontSize:12, textAlign:'center', fontFamily:'inherit', padding:'4px 0' }}>
              Skip for now
            </button>
          )}
        </div>
      )}

      {step==='done'&&!typing&&(
        <button onClick={()=>{ setStep('mood'); setMood(0); setTags([]); setCta(''); setDayText(''); setFollowUpAns(''); setDraft(''); }} style={{ padding:'10px 20px', borderRadius:14, border:'1px solid rgba(112,72,232,0.2)', cursor:'pointer', background:'rgba(112,72,232,0.06)', color:'#7048E8', fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:700, alignSelf:'center' }}>
          Edit today's entry
        </button>
      )}

      {/* Past entries */}
      {Object.keys(store).filter(k=>k!==todayStr).length>0&&(
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#C2B5A3', fontFamily:"'Space Grotesk',sans-serif" }}>Past entries</div>
          {Object.keys(store).filter(k=>k!==todayStr).sort((a,b)=>b.localeCompare(a)).slice(0,6).map(key=>{
            const e=store[key]; const mc=MOOD_CONFIG[e.mood-1];
            return (
              <button key={key} onClick={()=>setViewing(key)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'#fff', border:'1px solid rgba(23,18,10,0.07)', borderRadius:14, cursor:'pointer', textAlign:'left', width:'100%', fontFamily:'inherit', boxShadow:'0 2px 8px rgba(23,18,10,0.05)', transition:'all 0.15s' }}
                onMouseEnter={e2=>(e2.currentTarget.style.boxShadow='0 4px 16px rgba(23,18,10,0.1)')} onMouseLeave={e2=>(e2.currentTarget.style.boxShadow='0 2px 8px rgba(23,18,10,0.05)')}>
                <AnahataOrb id={mc.orbId} size={28}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#17120A', fontFamily:"'Space Grotesk',sans-serif" }}>{formatShortDate(key).split(',').slice(0,2).join(',')}</div>
                  {e.text&&<div style={{ fontSize:11, color:'#8C7D6C', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{e.text.slice(0,55)}…</div>}
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:mc.color, background:mc.color+'18', padding:'3px 9px', borderRadius:12, flexShrink:0 }}>{mc.label}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C2B5A3" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const STYLES = `
@keyframes dotBounce { 0%,80%,100%{transform:translateY(0);opacity:0.4} 40%{transform:translateY(-6px);opacity:1} }
@keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulseGlow { 0%,100%{box-shadow:0 4px 20px rgba(112,72,232,0.35)} 50%{box-shadow:0 8px 32px rgba(112,72,232,0.55)} }
`;
