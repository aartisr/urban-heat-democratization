import React, { useState, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, Loader2, BookOpen } from 'lucide-react';
import { LaTeXText } from './MathFormula';

interface AITutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  contextStep?: string;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export const AITutorModal: React.FC<AITutorModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = '',
  contextStep = 'General Urban Thermal Physics'
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: `Hello! I am your Urban Thermal Physics AI Tutor. How can I help you understand Urban Heat Island equations, Surface Energy Balance, Sky View Factor, or GMRF spatial thermal modeling?`
    }
  ]);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!prompt.trim() || loading) return;

    const userText = prompt.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await fetch('/api/explain-thermal-math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          contextStep,
          parameters: {}
        })
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: `Note: ${data.error || 'Could not reach Gemini server.'} Please configure GEMINI_API_KEY in secrets to enable live AI responses.`
          }
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `An error occurred: ${err.message || 'Server connection failed.'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl h-[580px] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Urban Thermal Science AI Tutor</h3>
              <p className="text-[11px] text-slate-400">Context: {contextStep}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${msg.sender === 'user' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
                {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div className={`p-3 rounded-xl max-w-[82%] leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30'
                  : 'bg-slate-950 text-slate-200 border border-slate-800'
              }`}>
                <LaTeXText text={msg.text} />
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Analyzing thermal equations with Gemini AI...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question about urban heat island physics, formulas, or microclimate..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !prompt.trim()}
            className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
