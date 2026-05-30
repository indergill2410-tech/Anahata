import React, { useState, useEffect, useRef, useCallback } from 'react';
import AnahataOrb, { OrbId } from '../components/AnahataOrb';

// ─── Types ────────────────────────────────────────────────────────────────────
interface JournalEntry {
  date: string;
  mood: number;
  text: string;
  sessionBw?: string;
  sessionMin?: number;
  sessionHz?: number;
  tags: string[];
  answers: string[];
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

const PROMPTS = [
  'How are you feeling right now, honestly?',
  'What was the highlight of your day?',
  'Something you want to release before sleep…',
  'One word that captures today.',
  'What are you grateful for today?',
];

const BW_COLORS: Record<string,string> = {
  Delta:'#7048E8', Theta:'#3B5BDB', Alpha:'#0CA678', Beta:'#F59F00', Gamma:'#E64980',
};
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['S','M','T','W','T','F','S'];

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

// ─── Tiny calendar ────────────────────────────────────────────────────────────
function MiniCalendar({ year,month,store,selectedDate,onSelect,onPrev,onNext }:{
  year:number; month:number; store:JournalStore; selectedDate:string;
  onSelect:(d:string)=>void; onPrev:()=>void; onNext:()=>void;
}){
  const today=todayKey();
  const days=getDaysInMonth(year,month);
  const first=getFirstDayOfMonth(year,month);
  const cells:(number|null)[]=[];
  for(let i=0;i<first;i++) cells.push(null);
  for(let d=1;d<=days;d++) cells.push(d);
  while(cells.length%7!==0) cells.push(null);

  return (
    <div style={{padding:'0 4px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <button onClick={onPrev} style={{background:'none',border:'none',cursor:'pointer',color:'#8C7D6C',padding:4}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,fontWeight:700,color:'#17120A'}}>{MONTHS[month]} {year}</span>
        <button onClick={onNext} style={{background:'none',border:'none',cursor:'pointer',color:'#8C7D6C',padding:4}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:4}}>
        {DAYS_SHORT.map((d,i)=><div key={i} style={{textAlign:'center',fontSize:10,fontWeight:700,color:'#C2B5A3',paddingBottom:4}}>{d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px 0'}}>
        {cells.map((day,idx)=>{
          if(day===null) return <div key={`e${idx}`}/>;
          const key=toKey(year,month,day);
          const entry=store[key];
          const isToday=key===today;
          const isSel=key===selectedDate;
          const moodColor=entry?.mood ? MOOD_CONFIG[entry.mood-1].color : undefined;
          return (
            <div key={key} onClick={()=>onSelect(key)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'2px 0',cursor:'pointer'}}>
              <div style={{
                width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:11,fontWeight:isSel?700:500,
                background: isSel?'#7048E8':(moodColor||'transparent'),
                color: isSel?'#fff':(moodColor?'#fff':'#4A3F32'),
                border: isToday&&!isSel?'2px solid #7048E8':'none',
                transition:'all 0.15s',
              }}>{day}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────
function Bubble({ text, delay=0 }:{ text:string; delay?:number }){
  const [vis,setVis]=useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setVis(true),delay); return ()=>clearTimeout(t); },[delay]);
  return (
    <div style={{
      display:'flex',alignItems:'flex-end',gap:10,
      opacity: vis?1:0, transform: vis?'translateY(0)':'translateY(12px)',
      transition:'all 0.45s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <div style={{flexShrink:0,marginBottom:2}}>
        <AnahataOrb id="int-peace" size={28}/>
      </div>
      <div style={{
        background:'#FFFFFF',border:'1px solid rgba(23,18,10,0.08)',
        borderRadius:'18px 18px 18px 4px',padding:'12px 16px',
        maxWidth:'80%',boxShadow:'0 2px 12px rgba(23,18,10,0.07)',
        fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,color:'#17120A',lineHeight:1.6,
      }}>
        {text}
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots(){
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:10}}>
      <AnahataOrb id="int-peace" size={28}/>
      <div style={{
        background:'#FFFFFF',border:'1px solid rgba(23,18,10,0.08)',
        borderRadius:'18px 18px 18px 4px',padding:'12px 16px',
        boxShadow:'0 2px 12px rgba(23,18,10,0.07)',
        display:'flex',gap:5,alignItems:'center',
      }}>
        {[0,1,2].map(i=>(
          <div key={i} style={{
            width:7,height:7,borderRadius:'50%',
            background:'#C2B5A3',
            animation:`dotBounce 1.2s ease-in-out ${i*0.2}s infinite`,
          }}/>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function JournalPage() {
  const today = new Date();
  const todayStr = todayKey();

  const [store,    setStore]    = useState<JournalStore>(loadStore);
  const [step,     setStep]     = useState<'greet'|'mood'|'tags'|'prompts'|'done'>('greet');
  const [mood,     setMood]     = useState(0);
  const [tags,     setTags]     = useState<string[]>([]);
  const [answers,  setAnswers]  = useState<string[]>([]);
  const [promptIdx,setPromptIdx]= useState(0);
  const [draft,    setDraft]    = useState('');
  const [typing,   setTyping]   = useState(false);
  const [showCal,  setShowCal]  = useState(false);
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [viewing,  setViewing]  = useState<string|null>(null); // past entry date

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const streak    = calcStreak(store);
  const todayEntry= store[todayStr];

  // Auto-scroll to bottom
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[step,typing,mood,answers]);

  // Load today's existing entry
  useEffect(()=>{
    if(todayEntry){ setStep('done'); setMood(todayEntry.mood); setTags(todayEntry.tags); setAnswers(todayEntry.answers||[]); }
    else { setStep('greet'); setMood(0); setTags([]); setAnswers([]); setPromptIdx(0); }
  },[todayStr]);

  const advanceAfterTyping = (nextStep:typeof step) => {
    setTyping(true);
    setTimeout(()=>{ setTyping(false); setStep(nextStep); },900);
  };

  const handleMoodPick = (v:number) => {
    setMood(v);
    advanceAfterTyping('tags');
  };

  const toggleTag = (tag:string) => setTags(prev=>prev.includes(tag)?prev.filter(t=>t!==tag):[...prev,tag]);

  const handleTagsDone = () => advanceAfterTyping('prompts');

  const handleAnswer = () => {
    const trimmed = draft.trim();
    const next = [...answers, trimmed];
    setAnswers(next);
    setDraft('');
    if(promptIdx+1 < PROMPTS.length){ setTyping(true); setTimeout(()=>{ setTyping(false); setPromptIdx(i=>i+1); },800); }
    else { setTyping(true); setTimeout(()=>{ setTyping(false); handleSave(next); },900); }
  };

  const handleSave = useCallback((finalAnswers?:string[]) => {
    const entry:JournalEntry = {
      date:todayStr, mood, tags,
      text:(finalAnswers??answers).filter(Boolean).join('\n\n'),
      answers: finalAnswers??answers,
    };
    setStore(prev=>{ const next={...prev,[todayStr]:entry}; saveStore(next); return next; });
    setStep('done');
  },[todayStr,mood,tags,answers]);

  const moodCfg  = MOOD_CONFIG[mood-1];
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  // ── Viewing a past entry ──────────────────────────────────────────────────
  if(viewing){
    const e=store[viewing];
    const mc=e?MOOD_CONFIG[e.mood-1]:undefined;
    return (
      <div className="dashboard fade-in">
        <style>{STYLES}</style>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <button onClick={()=>setViewing(null)} style={{
            alignSelf:'flex-start',display:'flex',alignItems:'center',gap:6,
            background:'none',border:'none',cursor:'pointer',color:'#8C7D6C',fontSize:13,padding:'4px 0',fontFamily:'inherit',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          {e ? (
            <div style={{background:'#fff',borderRadius:20,border:'1px solid rgba(23,18,10,0.07)',padding:20,display:'flex',flexDirection:'column',gap:14,boxShadow:'0 2px 12px rgba(23,18,10,0.07)'}}>
              <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:17,fontWeight:700,color:'#17120A'}}>{formatShortDate(viewing)}</div>
              {mc&&(
                <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'7px 14px',borderRadius:24,background:mc.color+'18',alignSelf:'flex-start'}}>
                  <AnahataOrb id={mc.orbId} size={24}/><span style={{fontSize:13,fontWeight:700,color:mc.color}}>{mc.label}</span>
                </div>
              )}
              {e.tags.length>0&&(
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {e.tags.map(t=><span key={t} style={{padding:'4px 11px',borderRadius:20,fontSize:11,fontWeight:600,background:'rgba(112,72,232,0.1)',color:'#7048E8'}}>{t}</span>)}
                </div>
              )}
              {(e.answers??[]).map((ans,i)=>(
                <div key={i}>
                  <div style={{fontSize:11,fontWeight:700,color:'#C2B5A3',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:4}}>{PROMPTS[i]||'Reflection'}</div>
                  <p style={{margin:0,fontSize:14,color:'#4A3F32',lineHeight:1.7}}>{ans||<em style={{color:'#C2B5A3'}}>skipped</em>}</p>
                </div>
              ))}
            </div>
          ) : <p style={{color:'#8C7D6C',fontSize:14}}>No entry for this day.</p>}
        </div>
      </div>
    );
  }

  // ── Main journal chat ─────────────────────────────────────────────────────
  return (
    <div className="dashboard fade-in">
      <style>{STYLES}</style>

      {/* ── Top strip ── */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <h1 style={{margin:0,fontFamily:"'Space Grotesk',sans-serif",fontSize:22,fontWeight:700,color:'#17120A',letterSpacing:'-0.02em'}}>Journal</h1>
          <p style={{margin:'2px 0 0',fontSize:12,color:'#8C7D6C'}}>{formatShortDate(todayStr)}</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {streak>=2&&(
            <div style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:20,background:'rgba(245,159,0,0.1)',border:'1px solid rgba(245,159,0,0.2)'}}>
              <span style={{fontSize:13}}>🔥</span>
              <span style={{fontSize:12,fontWeight:700,color:'#F59F00'}}>{streak}d</span>
            </div>
          )}
          <button
            onClick={()=>setShowCal(v=>!v)}
            style={{
              width:36,height:36,borderRadius:12,border:'1px solid rgba(23,18,10,0.08)',
              background: showCal?'#7048E8':'#fff',color:showCal?'#fff':'#8C7D6C',
              display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
              transition:'all 0.2s',boxShadow:'0 2px 8px rgba(23,18,10,0.07)',
            }}
            title="Toggle calendar"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mini calendar (collapsed by default) ── */}
      {showCal&&(
        <div style={{
          background:'#fff',borderRadius:16,border:'1px solid rgba(23,18,10,0.08)',
          padding:16,boxShadow:'0 2px 12px rgba(23,18,10,0.07)',
          animation:'slideDown 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <MiniCalendar
            year={calYear} month={calMonth} store={store} selectedDate={todayStr}
            onSelect={d=>{ setViewing(d===todayStr?null:d); setShowCal(false); }}
            onPrev={()=>{ if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1); }}
            onNext={()=>{ if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1); }}
          />
        </div>
      )}

      {/* ── Chat thread ── */}
      <div style={{display:'flex',flexDirection:'column',gap:16,paddingBottom:8}}>

        {/* Greeting */}
        <Bubble text={`${greeting} ✨ Ready to check in?`} delay={0}/>

        {/* Mood step */}
        {(step==='mood'||step==='tags'||step==='prompts'||step==='done')&&(
          <Bubble text="First — how are you feeling right now?" delay={100}/>
        )}
        {mood>0&&(
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <div style={{
              display:'flex',alignItems:'center',gap:8,padding:'8px 16px',
              background:moodCfg.color+'18',borderRadius:'18px 18px 4px 18px',
              border:`1px solid ${moodCfg.color}30`,
            }}>
              <AnahataOrb id={moodCfg.orbId} size={22}/>
              <span style={{fontSize:13,fontWeight:700,color:moodCfg.color,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{moodCfg.label}</span>
            </div>
          </div>
        )}

        {/* Tags step */}
        {(step==='tags'||step==='prompts'||step==='done')&&!typing&&(
          <Bubble text="Nice. Pick a few words that describe today 👇" delay={0}/>
        )}
        {tags.length>0&&(step==='prompts'||step==='done')&&(
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <div style={{display:'flex',flexWrap:'wrap',gap:5,justifyContent:'flex-end',maxWidth:'80%'}}>
              {tags.map(t=>(
                <span key={t} style={{padding:'4px 11px',borderRadius:20,fontSize:12,fontWeight:600,background:'rgba(112,72,232,0.12)',color:'#7048E8',border:'1px solid rgba(112,72,232,0.2)'}}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Prompts step — show answered ones */}
        {(step==='prompts'||step==='done')&&answers.map((ans,i)=>(
          <React.Fragment key={i}>
            <Bubble text={PROMPTS[i]} delay={0}/>
            {ans&&(
              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <div style={{
                  background:'#7048E8',color:'#fff',borderRadius:'18px 18px 4px 18px',
                  padding:'10px 16px',maxWidth:'80%',fontSize:14,lineHeight:1.6,
                  fontFamily:"'Plus Jakarta Sans',sans-serif",boxShadow:'0 4px 14px rgba(112,72,232,0.25)',
                }}>
                  {ans}
                </div>
              </div>
            )}
          </React.Fragment>
        ))}

        {/* Typing indicator */}
        {typing&&<TypingDots/>}

        {/* Done */}
        {step==='done'&&!typing&&(
          <Bubble text="Beautiful. Your entry is saved 🌙" delay={0}/>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* ── Input area ── */}
      {step==='greet'&&!typing&&(
        <button
          onClick={()=>advanceAfterTyping('mood')}
          style={{
            background:'linear-gradient(135deg,#7048E8,#3B5BDB)',color:'#fff',border:'none',
            borderRadius:16,padding:'14px 24px',fontSize:15,fontWeight:700,
            fontFamily:"'Space Grotesk',sans-serif",cursor:'pointer',
            boxShadow:'0 4px 20px rgba(112,72,232,0.35)',
            animation:'pulseGlow 2.5s ease-in-out infinite',
            transition:'transform 0.15s',
          }}
          onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.03)')}
          onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}
        >
          Let's check in ✨
        </button>
      )}

      {step==='mood'&&!typing&&(
        <div style={{display:'flex',gap:8,justifyContent:'center',padding:'4px 0'}}>
          {MOOD_CONFIG.map(m=>(
            <button
              key={m.value}
              onClick={()=>handleMoodPick(m.value)}
              style={{
                flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,
                padding:'12px 4px',border:'2px solid',borderRadius:16,cursor:'pointer',
                borderColor: mood===m.value?m.color:'rgba(23,18,10,0.08)',
                background: mood===m.value?m.color+'18':'#fff',
                transition:'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                transform: mood===m.value?'scale(1.08)':'scale(1)',
              }}
            >
              <AnahataOrb id={m.orbId} size={42} selected={mood===m.value}/>
              <span style={{fontSize:10,fontWeight:700,color:mood===m.value?m.color:'#8C7D6C',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{m.label}</span>
            </button>
          ))}
        </div>
      )}

      {step==='tags'&&!typing&&(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
            {PRESET_TAGS.map(tag=>{
              const active=tags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={()=>toggleTag(tag)}
                  style={{
                    padding:'7px 14px',borderRadius:24,border:'1.5px solid',cursor:'pointer',
                    fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,
                    borderColor: active?'#7048E8':'rgba(23,18,10,0.1)',
                    background: active?'#7048E8':'#fff',
                    color: active?'#fff':'#4A3F32',
                    transition:'all 0.15s cubic-bezier(0.34,1.56,0.64,1)',
                    transform: active?'scale(1.05)':'scale(1)',
                    boxShadow: active?'0 3px 12px rgba(112,72,232,0.25)':'none',
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleTagsDone}
            style={{
              padding:'12px',borderRadius:14,border:'none',cursor:'pointer',
              background:'linear-gradient(135deg,#7048E8,#3B5BDB)',color:'#fff',
              fontFamily:"'Space Grotesk',sans-serif",fontSize:14,fontWeight:700,
              boxShadow:'0 4px 16px rgba(112,72,232,0.3)',transition:'all 0.15s',
            }}
          >
            {tags.length>0?`Continue with ${tags.length} tag${tags.length>1?'s':''}…`:'Skip →'}
          </button>
        </div>
      )}

      {step==='prompts'&&!typing&&promptIdx<PROMPTS.length&&(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <textarea
            ref={inputRef}
            value={draft}
            onChange={e=>setDraft(e.target.value)}
            placeholder="Type your answer… (or leave blank to skip)"
            rows={2}
            onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleAnswer();} }}
            style={{
              width:'100%',resize:'none',borderRadius:16,padding:'12px 16px',
              border:'1.5px solid rgba(23,18,10,0.1)',fontFamily:"'Plus Jakarta Sans',sans-serif",
              fontSize:14,color:'#17120A',background:'#fff',outline:'none',
              lineHeight:1.6,boxSizing:'border-box',
              transition:'border-color 0.15s',
              boxShadow:'0 2px 8px rgba(23,18,10,0.06)',
            }}
            onFocus={e=>(e.target.style.borderColor='#7048E8')}
            onBlur={e=>(e.target.style.borderColor='rgba(23,18,10,0.1)')}
            autoFocus
          />
          <div style={{display:'flex',gap:8}}>
            <button
              onClick={handleAnswer}
              style={{
                flex:1,padding:'12px',borderRadius:14,border:'none',cursor:'pointer',
                background:'linear-gradient(135deg,#7048E8,#3B5BDB)',color:'#fff',
                fontFamily:"'Space Grotesk',sans-serif",fontSize:14,fontWeight:700,
                boxShadow:'0 4px 14px rgba(112,72,232,0.28)',transition:'all 0.15s',
              }}
            >
              {promptIdx<PROMPTS.length-1?'Next →':'Save entry ✨'}
            </button>
          </div>
          <div style={{display:'flex',gap:6,justifyContent:'center'}}>
            {PROMPTS.map((_,i)=>(
              <div key={i} style={{width:i===promptIdx?18:6,height:6,borderRadius:3,background:i<promptIdx?'#7048E8':i===promptIdx?'#7048E8':'rgba(23,18,10,0.12)',transition:'all 0.3s'}}/>
            ))}
          </div>
        </div>
      )}

      {step==='done'&&!typing&&(
        <button
          onClick={()=>{ setStep('mood'); setMood(0); setTags([]); setAnswers([]); setPromptIdx(0); setDraft(''); }}
          style={{
            padding:'11px 20px',borderRadius:14,border:'1px solid rgba(112,72,232,0.2)',cursor:'pointer',
            background:'rgba(112,72,232,0.06)',color:'#7048E8',
            fontFamily:"'Space Grotesk',sans-serif",fontSize:13,fontWeight:700,
            transition:'all 0.15s',alignSelf:'center',
          }}
        >
          Edit today's entry
        </button>
      )}

      {/* ── Past entries ── */}
      {Object.keys(store).filter(k=>k!==todayStr).length>0&&(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'#C2B5A3',fontFamily:"'Space Grotesk',sans-serif"}}>
            Past entries
          </div>
          {Object.keys(store).filter(k=>k!==todayStr).sort((a,b)=>b.localeCompare(a)).slice(0,7).map(key=>{
            const e=store[key]; const mc=MOOD_CONFIG[e.mood-1];
            return (
              <button
                key={key}
                onClick={()=>setViewing(key)}
                style={{
                  display:'flex',alignItems:'center',gap:12,padding:'12px 14px',
                  background:'#fff',border:'1px solid rgba(23,18,10,0.07)',
                  borderRadius:14,cursor:'pointer',textAlign:'left',width:'100%',
                  fontFamily:'inherit',boxShadow:'0 2px 8px rgba(23,18,10,0.05)',
                  transition:'all 0.15s',
                }}
                onMouseEnter={e2=>(e2.currentTarget.style.boxShadow='0 4px 16px rgba(23,18,10,0.1)')}
                onMouseLeave={e2=>(e2.currentTarget.style.boxShadow='0 2px 8px rgba(23,18,10,0.05)')}
              >
                <AnahataOrb id={mc.orbId} size={28}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:'#17120A',fontFamily:"'Space Grotesk',sans-serif"}}>
                    {formatShortDate(key).split(',').slice(0,2).join(',')}
                  </div>
                  {e.text&&<div style={{fontSize:11,color:'#8C7D6C',marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.text.slice(0,60)}</div>}
                </div>
                <span style={{fontSize:11,fontWeight:700,color:mc.color,background:mc.color+'18',padding:'3px 9px',borderRadius:12,flexShrink:0}}>{mc.label}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C2B5A3" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
@keyframes dotBounce {
  0%,80%,100% { transform: translateY(0); opacity:0.4; }
  40%         { transform: translateY(-6px); opacity:1; }
}
@keyframes slideDown {
  from { opacity:0; transform:translateY(-8px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes pulseGlow {
  0%,100% { box-shadow: 0 4px 20px rgba(112,72,232,0.35); }
  50%     { box-shadow: 0 8px 32px rgba(112,72,232,0.55); }
}
`;
