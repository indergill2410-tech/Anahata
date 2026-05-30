import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

const SUGGESTIONS = [
  'Help me sleep after a stressful day',
  'Deep focus for coding',
  'Heal anxiety and tension',
  'Morning energy boost',
  'Deep meditation session',
  'Creative flow state',
];

interface AIMusicAssistantProps {
  onApplyMix?: (mix: Record<string, unknown>) => void;
  isPlaying?: boolean;
}

export default function AIMusicAssistant({ onApplyMix, isPlaying }: AIMusicAssistantProps) {
  interface AIResponse { message: string; mix?: { name?: string; tags?: string[] } & Record<string, unknown>; }
  const [prompt,   setPrompt]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const { success, error } = useToast();

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResponse(null);
    try {
      const res  = await fetch('/api/ai/mix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text.trim() }),
      });
      if (!res.ok) throw new Error('AI unavailable');
      const data = await res.json();
      setResponse(data);
    } catch (_e) {
      error('AI assistant is currently unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!response?.mix) return;
    onApplyMix?.(response.mix);
    success(`Mix applied: ${response.mix.name || 'AI Mix'}`);
  };

  return (
    <div className="ai-assistant">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #9B6B9A, #4A7FA5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
            <path d="M12 8v4l3 3"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', fontFamily: 'Lora, serif' }}>AI Music Guide</div>
          <div style={{ fontSize: 10, color: 'var(--t3)' }}>Describe your mood or goal</div>
        </div>
      </div>

      {/* Prompt input */}
      <div className="ai-prompt-row">
        <textarea
          className="ai-prompt-input"
          placeholder="e.g. I need help focusing after a difficult meeting…"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(prompt); } }}
          rows={2}
        />
        <button
          className="ai-send-btn"
          onClick={() => send(prompt)}
          disabled={loading || !prompt.trim()}
        >
          {loading
            ? <div className="spinner" style={{ width: 16, height: 16, borderTopColor: 'white' }} />
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          }
        </button>
      </div>

      {/* Suggestion chips */}
      {!response && !loading && (
        <div className="ai-suggestion-chips">
          {SUGGESTIONS.map(s => (
            <button key={s} className="ai-chip" onClick={() => { setPrompt(s); send(s); }}>{s}</button>
          ))}
        </div>
      )}

      {/* AI response */}
      {response && (
        <div>
          <div className="ai-message">{response.message}</div>

          {response.mix && (
            <div style={{ marginTop: 10, padding: '12px 14px', background: '#fff', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 4 }}>
                    {response.mix.name}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(response.mix.tags as string[] | undefined)?.map(tag => (
                      <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-1)', color: 'var(--t3)' }}>{tag}</span>
                    ))}
                  </div>
                </div>
                <button
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: 12, flexShrink: 0 }}
                  onClick={handleApply}
                >
                  Apply Mix
                </button>
              </div>
            </div>
          )}

          <button
            className="btn-ghost"
            style={{ marginTop: 8, fontSize: 11 }}
            onClick={() => { setResponse(null); setPrompt(''); }}
          >
            Try another prompt
          </button>
        </div>
      )}
    </div>
  );
}
