import React, { useState, useEffect, useRef, useCallback } from 'react';
import AnahataOrb, { OrbId } from '../components/AnahataOrb';

// ─── Shared types & helpers ───────────────────────────────────────────────────
type JournalTab = 'checkin' | 'daily' | 'dreams';

function todayKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}
function toKey(y:number,m:number,d:number){ return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function getDaysInMonth(y:number,m:number){ return new Date(y,m+1,0).getDate(); }
function getFirstDayOfMonth(y:number,m:number){ return new Date(y,m,1).getDay(); }
function formatShortDate(dateStr:string){
  const [y,m,d]=dateStr.split('-').map(Number);
  return new Date(y,m-1,d).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
}

// ─── Small Orb dot (replaces emojis) ─────────────────────────────────────────
function OrbDot({ color, size=10, glow=false }: { color:string; size?:number; glow?:boolean }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `radial-gradient(circle at 35% 35%, ${lighten(color)}, ${color})`,
      boxShadow: glow ? `0 0 ${size}px ${color}80` : 'none',
    }} />
  );
}
function lighten(hex:string){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `rgb(${Math.min(r+60,255)},${Math.min(g+60,255)},${Math.min(b+60,255)})`;
}

// ─── Segmented control ────────────────────────────────────────────────────────
const TAB_META: Record<JournalTab,{ label:string; color:string }> = {
  checkin: { label:'Check-in', color:'#7048E8' },
  daily:   { label:'Daily',   color:'#D97706' },
  dreams:  { label:'Dreams',  color:'#6366F1' },
};

function SegControl({ active, onChange }: { active:JournalTab; onChange:(t:JournalTab)=>void }) {
  return (
    <div style={{ display:'flex', background:'rgba(23,18,10,0.06)', borderRadius:16, padding:4, gap:3 }}>
      {(Object.keys(TAB_META) as JournalTab[]).map(t => {
        const meta = TAB_META[t];
        const isActive = t === active;
        return (
          <button key={t} onClick={()=>onChange(t)} style={{
            flex:1, padding:'9px 6px', borderRadius:12, border:'none',
            fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:700,
            cursor:'pointer', transition:'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            background: isActive ? 'white' : 'transparent',
            color: isActive ? meta.color : '#8C7D6C',
            boxShadow: isActive ? '0 2px 10px rgba(0,0,0,0.09)' : 'none',
            display:'flex', alignItems:'center', justifyContent:'center', gap:7,
          }}>
            <OrbDot color={meta.color} size={8} glow={isActive} />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — CHECK-IN
// ══════════════════════════════════════════════════════════════════════════════
interface JournalEntry {
  date:string; mood:number; text:string; followUp:string;
  tags:string[]; cta:string;
}
type JournalStore = Record<string,JournalEntry>;
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
  { id:'day',      label:'Tell me about your day',       placeholder:'Walk me through your day — big or small, it all matters…' },
  { id:'weight',   label:"What's weighing on you?",      placeholder:"What's been on your mind? You can be honest here…" },
  { id:'grateful', label:"Something you're grateful for", placeholder:'Even one small thing. What made today worth it?' },
  { id:'win',      label:'Celebrate a win',              placeholder:'Big or tiny — what went right today?' },
  { id:'release',  label:'Something to let go',          placeholder:'What would feel lighter if you released it tonight?' },
];
const FOLLOWUPS = [
  { keys:['tired','exhausted','drained','sleep'], question:"Rest is not weakness — it's wisdom. What would feel most restorative right now?", feedback:(m:number)=>m>=3?"There's strength in knowing when to rest. Your body is asking for something — trust that.":"Heavy days are real. You showed up anyway. That counts for everything." },
  { keys:['anxious','worried','stress','overwhelmed'], question:"When you zoom out — is this something you can influence, or something you need to release?", feedback:(m:number)=>m>=3?"Naming it takes courage. Anxiety shrinks when it's seen. You're already doing the work.":"You're carrying a lot. Breathe. This moment, right here, is safe." },
  { keys:['happy','great','amazing','joy','excited','grateful'], question:"What do you want to anchor from today so you can return to this feeling?", feedback:()=>"Savour this. The fact that you noticed it means it's real." },
  { keys:['sad','hurt','pain','grief','lonely'], question:"You don't have to carry this alone. Is there one thing that made today even 1% softer?", feedback:()=>"Feeling this deeply is a sign of how much you care. That's not weakness — that's your humanity." },
  { keys:['meditat','breathe','calm','peaceful','still','quiet'], question:"What opened up for you in that stillness? Even a flicker — what did you notice?", feedback:()=>"Stillness is its own kind of intelligence. What you touched in that quiet is real and yours." },
];
const DEFAULT_FOLLOWUP = {
  question:"If today had a soundtrack, what would it be? Or — what do you want tomorrow to feel like?",
  feedback:(m:number)=>m>=4?"You're moving with intention. Keep going — the path is unfolding.":m>=3?"Today was a chapter, not the whole story. Rest and begin again.":"Some days are just hard. That's allowed. Tomorrow is a clean page.",
};
function getFollowUp(text:string){ const l=text.toLowerCase(); for(const f of FOLLOWUPS) if(f.keys.some(k=>l.includes(k))) return f; return DEFAULT_FOLLOWUP; }
function loadStore():JournalStore{ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return{}} }
function saveStore(s:JournalStore){ localStorage.setItem(STORAGE_KEY,JSON.stringify(s)); }
function calcStreak(store:JournalStore){ let s=0; const c=new Date(); c.setHours(0,0,0,0); while(true){const k=toKey(c.getFullYear(),c.getMonth(),c.getDate());if(store[k]){s++;c.setDate(c.getDate()-1);}else break;} return s; }

function AiBubble({ text, delay=0 }:{text:string;delay?:number}){
  const [vis,setVis]=useState(delay===0);
  useEffect(()=>{if(delay===0)return;const t=setTimeout(()=>setVis(true),delay);return()=>clearTimeout(t);},[delay]);
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:10,opacity:vis?1:0,transform:vis?'none':'translateY(10px)',transition:'all 0.4s cubic-bezier(0.34,1.56,0.64,1)'}}>
      <div style={{width:28,height:28,borderRadius:'50%',background:'radial-gradient(circle at 35% 35%,#B197FC,#7048E8)',boxShadow:'0 4px 12px rgba(112,72,232,0.4)',flexShrink:0}}/>
      <div style={{background:'white',border:'1px solid rgba(23,18,10,0.07)',borderRadius:'18px 18px 18px 4px',padding:'11px 16px',maxWidth:'82%',boxShadow:'0 2px 10px rgba(23,18,10,0.07)',fontSize:14,color:'#17120A',lineHeight:1.65,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
        {text}
      </div>
    </div>
  );
}
function UserBubble({children}:{children:React.ReactNode}){
  return (
    <div style={{display:'flex',justifyContent:'flex-end'}}>
      <div style={{background:'#7048E8',color:'white',borderRadius:'18px 18px 4px 18px',padding:'10px 16px',maxWidth:'82%',fontSize:14,lineHeight:1.65,fontFamily:"'Plus Jakarta Sans',sans-serif",boxShadow:'0 4px 14px rgba(112,72,232,0.28)'}}>
        {children}
      </div>
    </div>
  );
}
function TypingDots(){
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:10}}>
      <div style={{width:28,height:28,borderRadius:'50%',background:'radial-gradient(circle at 35% 35%,#B197FC,#7048E8)',flexShrink:0}}/>
      <div style={{background:'white',border:'1px solid rgba(23,18,10,0.08)',borderRadius:'18px 18px 18px 4px',padding:'12px 16px',boxShadow:'0 2px 10px rgba(23,18,10,0.07)',display:'flex',gap:5,alignItems:'center'}}>
        {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:'#C2B5A3',animation:`dotBounce 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
      </div>
    </div>
  );
}

type CheckinStep = 'greeting'|'mood'|'tags'|'cta'|'write'|'followup'|'feedback'|'done';

function CheckinTab({ store, setStore, todayStr }: { store:JournalStore; setStore:(s:JournalStore)=>void; todayStr:string }) {
  const today = new Date();
  const todayEntry = store[todayStr];
  const [step,setStep]=useState<CheckinStep>(todayEntry?'done':'greeting');
  const [mood,setMood]=useState(todayEntry?.mood||0);
  const [tags,setTags]=useState<string[]>(todayEntry?.tags||[]);
  const [cta,setCta]=useState(todayEntry?.cta||'');
  const [dayText,setDayText]=useState(todayEntry?.text||'');
  const [followUpAns,setFollowUpAns]=useState(todayEntry?.followUp||'');
  const [typing,setTyping]=useState(false);
  const [draft,setDraft]=useState('');
  const [viewing,setViewing]=useState<string|null>(null);
  const bottomRef=useRef<HTMLDivElement>(null);
  const moodCfg=MOOD_CONFIG[mood-1];
  const ctaCfg=CTA_OPTIONS.find(c=>c.id===cta);
  const followUp=dayText?getFollowUp(dayText):DEFAULT_FOLLOWUP;
  const greeting=today.getHours()<12?'Good morning':today.getHours()<17?'Good afternoon':'Good evening';

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'});},[step,typing,mood]);
  const after=(next:CheckinStep,ms=900)=>{setTyping(true);setTimeout(()=>{setTyping(false);setStep(next);},ms);};

  const handleSave=useCallback((fuAns?:string)=>{
    const entry:JournalEntry={date:todayStr,mood,tags,cta,text:dayText,followUp:fuAns??followUpAns};
    const next={...store,[todayStr]:entry};
    setStore(next);saveStore(next);setStep('done');
  },[todayStr,mood,tags,cta,dayText,followUpAns,store]);

  useEffect(()=>{if(step==='feedback'&&followUpAns)handleSave(followUpAns);},[step]);

  const pastKeys = Object.keys(store).filter(k=>k!==todayStr).sort((a,b)=>b.localeCompare(a)).slice(0,5);

  if(viewing){
    const e=store[viewing]; const mc=e?MOOD_CONFIG[e.mood-1]:undefined;
    return (
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <button onClick={()=>setViewing(null)} style={{alignSelf:'flex-start',display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',color:'#8C7D6C',fontSize:13,fontFamily:'inherit',padding:'4px 0'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>Back
        </button>
        {e&&(
          <div style={{background:'white',borderRadius:20,border:'1px solid rgba(23,18,10,0.07)',padding:20,display:'flex',flexDirection:'column',gap:14,boxShadow:'0 2px 12px rgba(23,18,10,0.07)'}}>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:17,fontWeight:700,color:'#17120A'}}>{formatShortDate(viewing)}</div>
            {mc&&<div style={{display:'flex',alignItems:'center',gap:8}}><OrbDot color={mc.color} size={20} glow/><span style={{fontSize:13,fontWeight:700,color:mc.color}}>{mc.label}</span></div>}
            {e.text&&<p style={{margin:0,fontSize:14,color:'#4A3F32',lineHeight:1.75}}>{e.text}</p>}
            {e.followUp&&<><div style={{fontSize:11,fontWeight:700,color:'#C2B5A3',letterSpacing:'0.06em',textTransform:'uppercase'}}>Reflection</div><p style={{margin:0,fontSize:14,color:'#4A3F32',lineHeight:1.75}}>{e.followUp}</p></>}
            {e.tags.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:6}}>{e.tags.map(t=><span key={t} style={{padding:'4px 11px',borderRadius:20,fontSize:11,fontWeight:600,background:'rgba(112,72,232,0.1)',color:'#7048E8'}}>{t}</span>)}</div>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      {/* chat thread */}
      <AiBubble text={`${greeting} — I'm glad you're here.`} />
      {step!=='greeting'&&<AiBubble text="How are you feeling right now?" delay={0}/>}
      {mood>0&&moodCfg&&<UserBubble><div style={{display:'flex',alignItems:'center',gap:8}}><OrbDot color={moodCfg.color} size={16} glow/>{moodCfg.label}</div></UserBubble>}
      {['tags','cta','write','followup','feedback','done'].includes(step)&&!typing&&<AiBubble text="Got it. Any words that describe today?" delay={0}/>}
      {tags.length>0&&['cta','write','followup','feedback','done'].includes(step)&&<UserBubble><div style={{display:'flex',flexWrap:'wrap',gap:5}}>{tags.map(t=><span key={t} style={{background:'rgba(255,255,255,0.2)',padding:'2px 9px',borderRadius:12,fontSize:12}}>{t}</span>)}</div></UserBubble>}
      {['cta','write','followup','feedback','done'].includes(step)&&!typing&&<AiBubble text="What would you like to explore today?" delay={0}/>}
      {ctaCfg&&['write','followup','feedback','done'].includes(step)&&<UserBubble>{ctaCfg.label}</UserBubble>}
      {['followup','feedback','done'].includes(step)&&ctaCfg&&<AiBubble text={ctaCfg.placeholder} delay={0}/>}
      {dayText&&['followup','feedback','done'].includes(step)&&<UserBubble>{dayText}</UserBubble>}
      {['followup','feedback','done'].includes(step)&&!typing&&<AiBubble text={followUp.question} delay={0}/>}
      {followUpAns&&['feedback','done'].includes(step)&&<UserBubble>{followUpAns}</UserBubble>}
      {['feedback','done'].includes(step)&&!typing&&<AiBubble text={followUp.feedback(mood)} delay={0}/>}
      {step==='done'&&!typing&&<AiBubble text="Your entry is saved. Be gentle with yourself tonight." delay={200}/>}
      {typing&&<TypingDots/>}
      <div ref={bottomRef}/>

      {/* inputs */}
      {step==='greeting'&&!typing&&(
        <button onClick={()=>after('mood',600)} style={{background:'linear-gradient(135deg,#7048E8,#3B5BDB)',color:'white',border:'none',borderRadius:16,padding:'14px 24px',fontSize:15,fontWeight:700,fontFamily:"'Space Grotesk',sans-serif",cursor:'pointer',boxShadow:'0 4px 20px rgba(112,72,232,0.35)'}}>
          Begin today's check-in
        </button>
      )}
      {step==='mood'&&!typing&&(
        <div style={{display:'flex',gap:6}}>
          {MOOD_CONFIG.map(m=>(
            <button key={m.value} onClick={()=>{setMood(m.value);after('tags');}} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'10px 3px',border:'2px solid',borderRadius:16,cursor:'pointer',borderColor:mood===m.value?m.color:'rgba(23,18,10,0.08)',background:mood===m.value?m.color+'18':'white',transition:'all 0.2s cubic-bezier(0.34,1.56,0.64,1)'}}>
              <AnahataOrb id={m.orbId} size={38} selected={mood===m.value}/>
              <span style={{fontSize:9,fontWeight:700,color:mood===m.value?m.color:'#8C7D6C',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{m.label}</span>
            </button>
          ))}
        </div>
      )}
      {step==='tags'&&!typing&&(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
            {PRESET_TAGS.map(tag=>{const active=tags.includes(tag);return(
              <button key={tag} onClick={()=>setTags(p=>p.includes(tag)?p.filter(x=>x!==tag):[...p,tag])} style={{padding:'7px 14px',borderRadius:24,border:'1.5px solid',cursor:'pointer',fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,borderColor:active?'#7048E8':'rgba(23,18,10,0.1)',background:active?'#7048E8':'white',color:active?'white':'#4A3F32',transition:'all 0.15s',boxShadow:active?'0 3px 12px rgba(112,72,232,0.25)':'none'}}>{tag}</button>
            );})}
          </div>
          <button onClick={()=>after('cta')} style={{padding:'12px',borderRadius:14,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#7048E8,#3B5BDB)',color:'white',fontFamily:"'Space Grotesk',sans-serif",fontSize:14,fontWeight:700,boxShadow:'0 4px 16px rgba(112,72,232,0.3)'}}>{tags.length>0?'Continue':'Skip'}</button>
        </div>
      )}
      {step==='cta'&&!typing&&(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {CTA_OPTIONS.map(c=>(
            <button key={c.id} onClick={()=>{setCta(c.id);after('write',600);}} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',background:'white',border:'1.5px solid rgba(23,18,10,0.08)',borderRadius:16,cursor:'pointer',fontFamily:'inherit',textAlign:'left',boxShadow:'0 2px 8px rgba(23,18,10,0.06)',transition:'all 0.15s'}}>
              <OrbDot color="#7048E8" size={12} glow/>
              <span style={{fontSize:14,fontWeight:600,color:'#17120A',fontFamily:"'Space Grotesk',sans-serif",flex:1}}>{c.label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C2B5A3" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ))}
        </div>
      )}
      {(step==='write'||step==='followup')&&!typing&&(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder={step==='write'?ctaCfg?.placeholder||'Write freely…':'Take your time…'} rows={3}
            onKeyDown={e=>{if(e.key==='Enter'&&e.metaKey){e.preventDefault();if(step==='write'){setDayText(draft);setDraft('');after('followup',1000);}else{setFollowUpAns(draft);setDraft('');after('feedback',800);}}}}
            style={{width:'100%',resize:'none',borderRadius:16,padding:'13px 16px',border:'1.5px solid rgba(23,18,10,0.1)',fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,color:'#17120A',background:'white',outline:'none',lineHeight:1.65,boxSizing:'border-box',boxShadow:'0 2px 8px rgba(23,18,10,0.06)'}}
            onFocus={e=>(e.target.style.borderColor='#7048E8')} onBlur={e=>(e.target.style.borderColor='rgba(23,18,10,0.1)')} autoFocus/>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button onClick={()=>{if(step==='write'){setDayText(draft);setDraft('');after('followup',1000);}else{setFollowUpAns(draft);setDraft('');after('feedback',800);}}} disabled={!draft.trim()} style={{padding:'10px 22px',borderRadius:14,border:'none',cursor:draft.trim()?'pointer':'not-allowed',background:draft.trim()?'linear-gradient(135deg,#7048E8,#3B5BDB)':'rgba(23,18,10,0.08)',color:draft.trim()?'white':'#C2B5A3',fontFamily:"'Space Grotesk',sans-serif",fontSize:13,fontWeight:700,transition:'all 0.15s'}}>
              Send
            </button>
          </div>
        </div>
      )}
      {step==='done'&&!typing&&(
        <button onClick={()=>{setStep('mood');setMood(0);setTags([]);setCta('');setDayText('');setFollowUpAns('');setDraft('');}} style={{padding:'10px 20px',borderRadius:14,border:'1px solid rgba(112,72,232,0.2)',cursor:'pointer',background:'rgba(112,72,232,0.06)',color:'#7048E8',fontFamily:"'Space Grotesk',sans-serif",fontSize:13,fontWeight:700,alignSelf:'center'}}>
          Edit today's entry
        </button>
      )}

      {/* past entries */}
      {pastKeys.length>0&&(
        <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:4}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'#C2B5A3',fontFamily:"'Space Grotesk',sans-serif"}}>Past check-ins</div>
          {pastKeys.map(key=>{
            const e=store[key]; const mc=MOOD_CONFIG[e.mood-1];
            return (
              <button key={key} onClick={()=>setViewing(key)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'white',border:'1px solid rgba(23,18,10,0.07)',borderRadius:14,cursor:'pointer',textAlign:'left',width:'100%',fontFamily:'inherit',boxShadow:'0 2px 8px rgba(23,18,10,0.05)',transition:'all 0.15s'}}>
                <OrbDot color={mc.color} size={28} glow/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:'#17120A',fontFamily:"'Space Grotesk',sans-serif"}}>{formatShortDate(key).split(',').slice(0,2).join(',')}</div>
                  {e.text&&<div style={{fontSize:11,color:'#8C7D6C',marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.text.slice(0,55)}…</div>}
                </div>
                <span style={{fontSize:11,fontWeight:700,color:mc.color,background:mc.color+'18',padding:'3px 9px',borderRadius:12,flexShrink:0}}>{mc.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — DAILY JOURNAL
// ══════════════════════════════════════════════════════════════════════════════
interface DailyEntry { date:string; type:string; text:string; wordCount:number; }
type DailyStore = Record<string,DailyEntry>;
const DAILY_KEY = 'anahata_daily';

const DAILY_PROMPTS: Record<number,string> = {
  0:"Where did you feel most like yourself today?",
  1:"What are you carrying into this week — and what can you set down?",
  2:"What small thing asked for your attention today?",
  3:"Halfway through the week. What does your body actually need right now?",
  4:"What conversation is still alive inside you?",
  5:"What did today ask of you that you didn't expect?",
  6:"Where did you find rest today, even briefly?",
};
const DAILY_TYPES = [
  { id:'prompt',    label:"Today's prompt", color:'#D97706' },
  { id:'morning',   label:'Morning pages',  color:'#7048E8' },
  { id:'gratitude', label:'Gratitude',      color:'#0CA678' },
  { id:'freewrite', label:'Free write',     color:'#E64980' },
  { id:'intention', label:'Intentions',     color:'#3B5BDB' },
];
const TYPE_PLACEHOLDERS: Record<string,string> = {
  prompt:    'Begin anywhere. Even one sentence is enough…',
  morning:   'Write without stopping. Don\'t edit. Let it flow…',
  gratitude: 'Three things, or thirty — whatever wants to come…',
  freewrite: 'No rules. No structure. Just you and the page…',
  intention: 'What do you want to call in? How do you want to feel?',
};

function DailyTab() {
  const [dailyStore, setDailyStore] = useState<DailyStore>(()=>{ try{return JSON.parse(localStorage.getItem(DAILY_KEY)||'{}')}catch{return{}} });
  const [activeType, setActiveType] = useState('prompt');
  const [draft, setDraft]           = useState('');
  const [saved, setSaved]           = useState(false);
  const todayStr = todayKey();
  const todayEntry = dailyStore[todayStr];
  const dayOfWeek  = new Date().getDay();
  const prompt     = DAILY_PROMPTS[dayOfWeek];

  // Weekly heatmap — last 7 days
  const weekDays: Array<{label:string; key:string; intensity:number}> = [];
  const DAY_ABBR = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  for(let i=6;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    const k=toKey(d.getFullYear(),d.getMonth(),d.getDate());
    const wc=dailyStore[k]?.wordCount||0;
    const intensity=wc===0?0:wc<50?1:wc<150?2:3;
    weekDays.push({label:i===0?'TODAY':DAY_ABBR[d.getDay()],key:k,intensity});
  }

  const HEAT_COLORS=['rgba(23,18,10,0.05)','#FDE68A','#F59F00','#D97706'];
  const HEAT_GLOW  =['none','0 0 8px rgba(245,159,0,0.2)','0 0 12px rgba(245,159,0,0.35)','0 0 18px rgba(217,119,6,0.5)'];

  function handleSave(){
    if(!draft.trim()) return;
    const wc=draft.trim().split(/\s+/).length;
    const entry:DailyEntry={date:todayStr,type:activeType,text:draft.trim(),wordCount:wc};
    const next={...dailyStore,[todayStr]:entry};
    setDailyStore(next);
    localStorage.setItem(DAILY_KEY,JSON.stringify(next));
    setSaved(true);
    setDraft('');
    setTimeout(()=>setSaved(false),3000);
  }

  const wc = draft.trim()===''?0:draft.trim().split(/\s+/).length;
  const pastKeys = Object.keys(dailyStore).filter(k=>k!==todayStr).sort((a,b)=>b.localeCompare(a)).slice(0,4);
  const ORB_COLORS=['#D97706','#7048E8','#0CA678','#E64980'];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>

      {/* Prompt card */}
      <div style={{borderRadius:24,padding:22,background:'#17120A',border:'1px solid rgba(255,255,255,0.06)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(245,159,0,0.22) 0%,transparent 70%)',top:-60,right:-60,pointerEvents:'none'}}/>
        <div style={{position:'absolute',width:130,height:130,borderRadius:'50%',background:'radial-gradient(circle,rgba(112,72,232,0.16) 0%,transparent 70%)',bottom:-30,left:-20,pointerEvents:'none'}}/>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(245,159,0,0.65)',marginBottom:12}}>
          {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dayOfWeek]}'s reflection
        </div>
        <div style={{display:'flex',gap:0,marginBottom:14,alignItems:'center'}}>
          {['#D97706','#7048E8','#0CA678'].map((c,i)=>(
            <div key={c} style={{width:i===0?42:i===1?32:24,height:i===0?42:i===1?32:24,borderRadius:'50%',background:`radial-gradient(circle at 35% 35%,${lighten(c)},${c})`,boxShadow:`0 0 ${i===0?20:14}px ${c}70`,marginLeft:i>0?-8:0,flexShrink:0}}/>
          ))}
        </div>
        <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:18,fontWeight:700,color:'rgba(255,255,255,0.92)',lineHeight:1.4,marginBottom:8}}>"{prompt}"</div>
        <div style={{fontSize:13,color:'rgba(255,255,255,0.38)',lineHeight:1.6}}>There's no right answer. This space holds whatever comes up — fragments, feelings, half-thoughts.</div>
      </div>

      {/* Type switchers */}
      <div style={{display:'flex',gap:7,overflowX:'auto',scrollbarWidth:'none',paddingBottom:2}}>
        {DAILY_TYPES.map(t=>(
          <button key={t.id} onClick={()=>setActiveType(t.id)} style={{flexShrink:0,display:'flex',alignItems:'center',gap:7,padding:'7px 14px',borderRadius:20,border:`1.5px solid ${activeType===t.id?t.color+'50':'rgba(23,18,10,0.08)'}`,background:activeType===t.id?t.color+'0D':'white',color:activeType===t.id?t.color:'#4A3F32',fontSize:12,fontWeight:700,fontFamily:"'Space Grotesk',sans-serif",cursor:'pointer',transition:'all 0.2s',boxShadow:activeType===t.id?`0 4px 14px ${t.color}30`:'0 2px 8px rgba(0,0,0,0.05)'}}>
            <OrbDot color={t.color} size={8} glow={activeType===t.id}/>
            {t.label}
          </button>
        ))}
      </div>

      {/* Write area */}
      {saved?(
        <div style={{background:'white',borderRadius:22,border:'1.5px solid rgba(12,166,120,0.25)',padding:18,textAlign:'center',boxShadow:'0 4px 18px rgba(12,166,120,0.12)'}}>
          <OrbDot color="#0CA678" size={28} glow/>
          <div style={{marginTop:10,fontFamily:"'Space Grotesk',sans-serif",fontSize:15,fontWeight:700,color:'#0CA678'}}>Entry saved</div>
          <div style={{fontSize:12,color:'#8C7D6C',marginTop:4}}>Well done for showing up today.</div>
        </div>
      ):(
        <div style={{background:'white',borderRadius:22,border:'1.5px solid rgba(23,18,10,0.06)',padding:18,boxShadow:'0 4px 18px rgba(0,0,0,0.06)'}}>
          <textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder={todayEntry?`You wrote ${todayEntry.wordCount} words today. Add more?`:TYPE_PLACEHOLDERS[activeType]} rows={4}
            style={{width:'100%',resize:'none',border:'none',outline:'none',fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,color:'#17120A',lineHeight:1.8,background:'transparent',boxSizing:'border-box'}}/>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:10,paddingTop:10,borderTop:'1px solid rgba(23,18,10,0.05)'}}>
            <span style={{fontSize:11,color:'#C2B5A3',fontFamily:"'JetBrains Mono',monospace"}}>{wc} word{wc!==1?'s':''}</span>
            <button onClick={handleSave} disabled={!draft.trim()} style={{height:36,padding:'0 20px',borderRadius:12,border:'none',cursor:draft.trim()?'pointer':'not-allowed',background:draft.trim()?'linear-gradient(135deg,#D97706,#F59F00)':'rgba(23,18,10,0.07)',color:draft.trim()?'white':'#C2B5A3',fontFamily:"'Space Grotesk',sans-serif",fontSize:13,fontWeight:700,boxShadow:draft.trim()?'0 4px 14px rgba(217,119,6,0.3)':'none',transition:'all 0.2s'}}>
              Save entry
            </button>
          </div>
        </div>
      )}

      {/* Weekly heatmap */}
      <div style={{background:'white',borderRadius:22,border:'1px solid rgba(23,18,10,0.06)',padding:18,boxShadow:'0 2px 10px rgba(0,0,0,0.04)'}}>
        <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#C2B5A3',marginBottom:14}}>Your week</div>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          {weekDays.map(d=>(
            <div key={d.key} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
              <div style={{width:34,height:34,borderRadius:'50%',background:d.intensity===0?HEAT_COLORS[0]:`radial-gradient(circle at 35% 35%,${lighten(HEAT_COLORS[d.intensity])},${HEAT_COLORS[d.intensity]})`,boxShadow:HEAT_GLOW[d.intensity],border:d.key===todayStr?`2.5px solid ${HEAT_COLORS[3]}`:'none',transition:'all 0.3s'}}/>
              <span style={{fontSize:8,fontWeight:700,color:d.label==='TODAY'?'#D97706':'#C2B5A3',fontFamily:"'Space Grotesk',sans-serif",letterSpacing:'0.04em'}}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Past entries */}
      {pastKeys.length>0&&(
        <>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'#C2B5A3'}}>Past entries</div>
          </div>
          {pastKeys.map((key,i)=>{
            const e=dailyStore[key];
            return (
              <div key={key} style={{background:'white',borderRadius:18,border:'1px solid rgba(23,18,10,0.06)',padding:'14px 16px',display:'flex',alignItems:'center',gap:13,boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                <div style={{width:38,height:38,borderRadius:'50%',background:`radial-gradient(circle at 35% 35%,${lighten(ORB_COLORS[i%4])},${ORB_COLORS[i%4]})`,boxShadow:`0 4px 14px ${ORB_COLORS[i%4]}40`,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,fontWeight:700,color:'#17120A'}}>{formatShortDate(key).split(',').slice(0,2).join(',')}</div>
                  <div style={{fontSize:11,color:'#8C7D6C',marginTop:2}}>{e.wordCount} words · {DAILY_TYPES.find(t=>t.id===e.type)?.label||'Entry'}</div>
                  <div style={{fontSize:12,color:'#4A3F32',marginTop:3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.text.slice(0,52)}…</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C2B5A3" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — DREAM JOURNAL
// ══════════════════════════════════════════════════════════════════════════════
interface DreamEntry { date:string; lucidity:number; emotions:string[]; symbols:string[]; text:string; }
type DreamStore = Record<string,DreamEntry>;
const DREAM_KEY = 'anahata_dreams';

const EMOTIONS = [
  { id:'joy',     label:'Joy',     color:'#F59F00' },
  { id:'fear',    label:'Fear',    color:'#E64980' },
  { id:'calm',    label:'Calm',    color:'#0CA678' },
  { id:'intense', label:'Intense', color:'#F87171' },
  { id:'surreal', label:'Surreal', color:'#A78BFA' },
  { id:'wonder',  label:'Wonder',  color:'#3B5BDB' },
  { id:'sorrow',  label:'Sorrow',  color:'#748FFC' },
  { id:'peace',   label:'Peace',   color:'#63E6BE' },
];
const SYMBOLS = [
  { id:'water',   label:'Water'   },
  { id:'house',   label:'House'   },
  { id:'flying',  label:'Flying'  },
  { id:'chase',   label:'Chase'   },
  { id:'forest',  label:'Forest'  },
  { id:'key',     label:'Key'     },
  { id:'mirror',  label:'Mirror'  },
  { id:'bridge',  label:'Bridge'  },
  { id:'spiral',  label:'Spiral'  },
  { id:'light',   label:'Light'   },
  { id:'falling', label:'Falling' },
  { id:'door',    label:'Door'    },
];
const LUCID_LABELS = ['','Hazy','Faint','Clear','Vivid','Lucid'];

// Moon phase helper (simplified)
function getMoonPhase(date:Date){ const d=Math.abs(date.getTime()-new Date('2000-01-06').getTime())/864e5%29.53; return d<7.4?'🌒':d<14.8?'🌔':d<22.1?'🌖':'🌘'; }

function DreamsTab() {
  const [dreamStore, setDreamStore] = useState<DreamStore>(()=>{ try{return JSON.parse(localStorage.getItem(DREAM_KEY)||'{}')}catch{return{}} });
  const [lucidity,   setLucidity]   = useState(0);
  const [emotions,   setEmotions]   = useState<string[]>([]);
  const [symbols,    setSymbols]    = useState<string[]>([]);
  const [draft,      setDraft]      = useState('');
  const [saved,      setSaved]      = useState(false);
  const todayStr = todayKey();

  const toggleEmo = (id:string) => setEmotions(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const toggleSym = (id:string) => setSymbols(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  function handleSave(){
    if(!draft.trim()) return;
    const entry:DreamEntry={date:todayStr,lucidity,emotions,symbols,text:draft.trim()};
    const next={...dreamStore,[todayStr]:entry};
    setDreamStore(next);
    localStorage.setItem(DREAM_KEY,JSON.stringify(next));
    setSaved(true);
    setDraft('');
    setTimeout(()=>setSaved(false),3000);
  }

  const pastKeys = Object.keys(dreamStore).filter(k=>k!==todayStr).sort((a,b)=>b.localeCompare(a)).slice(0,4);

  // Moon strip for this week
  const moonDays: Array<{label:string;phase:string;isToday:boolean}> = [];
  const DAY_ABBR=['SUN','MON','TUE','WED','THU','FRI','SAT'];
  for(let i=6;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    moonDays.push({label:i===0?'NOW':DAY_ABBR[d.getDay()],phase:getMoonPhase(d),isToday:i===0});
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>

      {/* Cosmic header card */}
      <div style={{borderRadius:24,padding:20,background:'linear-gradient(135deg,#0D0720,#1A0F3C)',border:'1px solid rgba(167,139,250,0.15)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',width:180,height:180,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.2),transparent 70%)',top:-50,right:-50,pointerEvents:'none'}}/>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(167,139,250,0.6)',marginBottom:14}}>Moon this week</div>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          {moonDays.map(d=>(
            <div key={d.label} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <div style={{fontSize:d.isToday?26:20,filter:d.isToday?'drop-shadow(0 0 8px rgba(167,139,250,0.8))':'none',transition:'all 0.3s'}}>{d.phase}</div>
              <span style={{fontSize:7,fontWeight:700,color:d.isToday?'#A78BFA':'rgba(167,139,250,0.35)',fontFamily:"'Space Grotesk',sans-serif",letterSpacing:'0.06em'}}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lucidity */}
      <div style={{background:'white',borderRadius:22,border:'1px solid rgba(23,18,10,0.06)',padding:18,boxShadow:'0 2px 10px rgba(0,0,0,0.04)'}}>
        <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#C2B5A3',marginBottom:12}}>Dream lucidity</div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {[1,2,3,4,5].map(v=>(
            <button key={v} onClick={()=>setLucidity(v)} style={{width:36,height:36,borderRadius:'50%',border:'none',cursor:'pointer',transition:'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',transform:lucidity===v?'scale(1.15)':'scale(1)',background:v<=lucidity?`radial-gradient(circle at 35% 35%,${lighten('#6366F1')},#6366F1)`:'rgba(23,18,10,0.06)',boxShadow:v<=lucidity?'0 0 16px rgba(99,102,241,0.45)':'none',color:v<=lucidity?'white':'#C2B5A3',fontFamily:"'Space Grotesk',sans-serif",fontSize:11,fontWeight:700}}>
              {v}
            </button>
          ))}
          {lucidity>0&&<span style={{marginLeft:'auto',fontSize:12,fontWeight:700,color:'#6366F1',background:'rgba(99,102,241,0.08)',padding:'4px 12px',borderRadius:12,border:'1px solid rgba(99,102,241,0.18)',fontFamily:"'Space Grotesk',sans-serif"}}>{LUCID_LABELS[lucidity]}</span>}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
          {['Hazy','','','','Lucid'].map((l,i)=><span key={i} style={{fontSize:9,color:'#C2B5A3',fontWeight:600,fontFamily:"'Space Grotesk',sans-serif"}}>{l}</span>)}
        </div>
      </div>

      {/* Emotions */}
      <div style={{background:'white',borderRadius:22,border:'1px solid rgba(23,18,10,0.06)',padding:18,boxShadow:'0 2px 10px rgba(0,0,0,0.04)'}}>
        <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#C2B5A3',marginBottom:12}}>How did it feel?</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {EMOTIONS.map(e=>{
            const active=emotions.includes(e.id);
            return (
              <button key={e.id} onClick={()=>toggleEmo(e.id)} style={{display:'flex',alignItems:'center',gap:7,padding:'7px 14px',borderRadius:20,border:`1.5px solid ${active?e.color+'60':'rgba(23,18,10,0.08)'}`,background:active?e.color+'12':'white',color:active?e.color:'#4A3F32',fontSize:12,fontWeight:700,fontFamily:"'Space Grotesk',sans-serif",cursor:'pointer',transition:'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',boxShadow:active?`0 0 14px ${e.color}30`:'none'}}>
                <OrbDot color={e.color} size={8} glow={active}/>
                {e.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Symbols */}
      <div style={{background:'white',borderRadius:22,border:'1px solid rgba(23,18,10,0.06)',padding:18,boxShadow:'0 2px 10px rgba(0,0,0,0.04)'}}>
        <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#C2B5A3',marginBottom:12}}>Symbols & themes</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
          {SYMBOLS.map(s=>{
            const active=symbols.includes(s.id);
            return (
              <button key={s.id} onClick={()=>toggleSym(s.id)} style={{padding:'6px 13px',borderRadius:18,border:`1.5px solid ${active?'rgba(99,102,241,0.4)':'rgba(23,18,10,0.08)'}`,background:active?'rgba(99,102,241,0.08)':'white',color:active?'#6366F1':'#4A3F32',fontSize:12,fontWeight:600,fontFamily:"'Plus Jakarta Sans',sans-serif",cursor:'pointer',transition:'all 0.18s',boxShadow:active?'0 0 12px rgba(99,102,241,0.2)':'none'}}>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Describe */}
      {saved?(
        <div style={{background:'white',borderRadius:22,border:'1.5px solid rgba(99,102,241,0.25)',padding:18,textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:8,boxShadow:'0 4px 18px rgba(99,102,241,0.12)'}}>
          <OrbDot color="#6366F1" size={28} glow/>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:15,fontWeight:700,color:'#6366F1'}}>Dream logged</div>
          <div style={{fontSize:12,color:'#8C7D6C'}}>The archive grows. Sleep well.</div>
        </div>
      ):(
        <div style={{background:'white',borderRadius:22,border:'1.5px solid rgba(23,18,10,0.06)',padding:18,boxShadow:'0 4px 18px rgba(0,0,0,0.06)'}}>
          <textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Describe your dream while it's still close — even fragments count. The image, the feeling, the place…" rows={4}
            style={{width:'100%',resize:'none',border:'none',outline:'none',fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,color:'#17120A',lineHeight:1.8,background:'transparent',boxSizing:'border-box'}}
            onFocus={e=>{e.currentTarget.parentElement!.style.borderColor='rgba(99,102,241,0.35)';}} onBlur={e=>{e.currentTarget.parentElement!.style.borderColor='rgba(23,18,10,0.06)';}}/>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:10,paddingTop:10,borderTop:'1px solid rgba(23,18,10,0.05)'}}>
            <span style={{fontSize:11,color:'#C2B5A3',fontFamily:"'JetBrains Mono',monospace"}}>{draft.trim()===''?0:draft.trim().split(/\s+/).length} words</span>
            <button onClick={handleSave} disabled={!draft.trim()} style={{height:36,padding:'0 20px',borderRadius:12,border:'none',cursor:draft.trim()?'pointer':'not-allowed',background:draft.trim()?'linear-gradient(135deg,#6366F1,#A78BFA)':'rgba(23,18,10,0.07)',color:draft.trim()?'white':'#C2B5A3',fontFamily:"'Space Grotesk',sans-serif",fontSize:13,fontWeight:700,boxShadow:draft.trim()?'0 4px 16px rgba(99,102,241,0.35)':'none',transition:'all 0.2s'}}>
              Log dream
            </button>
          </div>
        </div>
      )}

      {/* Dream archive */}
      {pastKeys.length>0&&(
        <>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'#C2B5A3'}}>Dream archive</div>
          {pastKeys.map(key=>{
            const e=dreamStore[key];
            return (
              <div key={key} style={{background:'white',borderRadius:18,border:'1px solid rgba(23,18,10,0.06)',padding:'14px 16px',display:'flex',alignItems:'center',gap:13,boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                <div style={{width:38,height:38,borderRadius:'50%',background:'radial-gradient(circle at 35% 35%,#818CF8,#4F46E5)',boxShadow:'0 4px 14px rgba(79,70,229,0.3)',flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,fontWeight:700,color:'#17120A'}}>{formatShortDate(key).split(',').slice(0,2).join(',')}</div>
                  <div style={{fontSize:11,color:'#8C7D6C',marginTop:2}}>{e.emotions.map(id=>EMOTIONS.find(em=>em.id===id)?.label).filter(Boolean).join(' · ')||'No emotions tagged'}</div>
                  <div style={{fontSize:12,color:'#4A3F32',marginTop:3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.text.slice(0,52)}…</div>
                </div>
                <span style={{fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:12,background:'rgba(99,102,241,0.08)',color:'#6366F1',border:'1px solid rgba(99,102,241,0.18)',flexShrink:0,fontFamily:"'Space Grotesk',sans-serif"}}>{LUCID_LABELS[e.lucidity]||'Hazy'}</span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT=['S','M','T','W','T','F','S'];

function MiniCalendar({ year,month,store,onSelect,onPrev,onNext }:{ year:number;month:number;store:JournalStore;onSelect:(d:string)=>void;onPrev:()=>void;onNext:()=>void; }){
  const today=todayKey();
  const days=getDaysInMonth(year,month); const first=getFirstDayOfMonth(year,month);
  const cells:(number|null)[]=[];
  for(let i=0;i<first;i++) cells.push(null);
  for(let d=1;d<=days;d++) cells.push(d);
  while(cells.length%7!==0) cells.push(null);
  const MOOD_COLORS=['','#E64980','#F59F00','#0CA678','#3B5BDB','#7048E8'];
  return (
    <div style={{background:'white',borderRadius:20,border:'1px solid rgba(23,18,10,0.07)',padding:18,boxShadow:'0 2px 12px rgba(23,18,10,0.07)',animation:'slideDown 0.3s cubic-bezier(0.34,1.56,0.64,1)'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <button onClick={onPrev} style={{background:'none',border:'none',cursor:'pointer',color:'#8C7D6C',padding:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,fontWeight:700,color:'#17120A'}}>{MONTHS[month]} {year}</span>
        <button onClick={onNext} style={{background:'none',border:'none',cursor:'pointer',color:'#8C7D6C',padding:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg></button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:6}}>
        {DAYS_SHORT.map((d,i)=><div key={i} style={{textAlign:'center',fontSize:10,fontWeight:700,color:'#C2B5A3',paddingBottom:4}}>{d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'3px 0'}}>
        {cells.map((day,idx)=>{
          if(day===null) return <div key={`e${idx}`}/>;
          const k=toKey(year,month,day); const entry=store[k]; const isToday=k===today;
          const mc=entry?.mood?MOOD_COLORS[entry.mood]:undefined;
          return (
            <div key={k} onClick={()=>onSelect(k)} style={{display:'flex',justifyContent:'center',padding:'2px 0',cursor:'pointer'}}>
              <div style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:500,background:mc?`radial-gradient(circle at 35% 35%,${lighten(mc)},${mc})`:'transparent',color:mc?'white':'#4A3F32',border:isToday&&!mc?'2px solid #7048E8':'none',boxShadow:mc?`0 0 8px ${mc}60`:'none'}}>{day}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function JournalPage() {
  const [activeTab,  setActiveTab]  = useState<JournalTab>('checkin');
  const [store,      setStore]      = useState<JournalStore>(loadStore);
  const [showCal,    setShowCal]    = useState(false);
  const [calYear,    setCalYear]    = useState(new Date().getFullYear());
  const [calMonth,   setCalMonth]   = useState(new Date().getMonth());

  const todayStr = todayKey();
  const streak   = calcStreak(store);
  const today    = new Date();

  const formattedDate = today.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});

  return (
    <div className="dashboard fade-in" style={{gap:0,padding:0}}>
      <style>{`
        @keyframes dotBounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'0 0 10px'}}>
        <div>
          <h1 style={{margin:0,fontFamily:"'Space Grotesk',sans-serif",fontSize:26,fontWeight:800,color:'#17120A',letterSpacing:'-0.02em'}}>Journal</h1>
          <p style={{margin:'3px 0 0',fontSize:12,color:'#8C7D6C'}}>{formattedDate}</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,paddingTop:4}}>
          {streak>=2&&(
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:20,background:'rgba(245,159,0,0.1)',border:'1px solid rgba(245,159,0,0.2)'}}>
              <OrbDot color="#F59F00" size={10} glow/>
              <span style={{fontSize:12,fontWeight:700,color:'#D97706',fontFamily:"'Space Grotesk',sans-serif"}}>{streak}-day streak</span>
            </div>
          )}
          <button onClick={()=>setShowCal(v=>!v)} style={{width:36,height:36,borderRadius:12,border:'1px solid rgba(23,18,10,0.08)',background:showCal?'#7048E8':'white',color:showCal?'white':'#8C7D6C',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 8px rgba(23,18,10,0.07)',transition:'all 0.2s'}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </button>
        </div>
      </div>

      {showCal&&(
        <div style={{marginBottom:14}}>
          <MiniCalendar year={calYear} month={calMonth} store={store}
            onSelect={()=>setShowCal(false)}
            onPrev={()=>{if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1);}}
            onNext={()=>{if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1);}}
          />
        </div>
      )}

      {/* Segment */}
      <div style={{marginBottom:18}}>
        <SegControl active={activeTab} onChange={setActiveTab}/>
      </div>

      {/* Tab content */}
      {activeTab==='checkin' && <CheckinTab store={store} setStore={setStore} todayStr={todayStr}/>}
      {activeTab==='daily'   && <DailyTab/>}
      {activeTab==='dreams'  && <DreamsTab/>}
    </div>
  );
}
