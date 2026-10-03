import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, MessageSquare, Check, User, Clock, ArrowRight } from 'lucide-react';

import { api } from '../lib/api.ts';

export const TalkToAgentSection: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; time?: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions: string[] = [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { sender: 'user', text: queryText, time: timeNow }]);
    setIsLoading(true);

    try {
      const token = api.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: queryText
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { 
          sender: 'agent', 
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        setMessages(prev => [...prev, { 
          sender: 'agent', 
          text: 'Veuillez configurer votre Agent IA dans le Tableau de Bord pour activer les réponses.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { 
        sender: 'agent', 
        text: 'Erreur de connexion au serveur.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const q = input;
    setInput('');
    sendQuery(q);
  };

  return (
    <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2 mb-8 animate-fade-down">
        <span className="text-xs font-mono font-bold text-sky-700 uppercase tracking-wider inline-flex items-center gap-1.5 neu-pressed px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>Assistant Conversationnel Actif</span>
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Discutez en direct avec un Agent IA
        </h2>
        <p className="text-xs text-slate-500">
          Réactivité instantanée propulsée par notre moteur d'intelligence artificielle
        </p>
      </div>

      <div className="bg-[#ECF0F3] rounded-3xl p-4 sm:p-6 neu-flat-lg border border-white/80 space-y-4 shadow-xl animate-fade-up">
        {/* Chat header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D1D9E6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-pressed flex items-center justify-center text-sky-600">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Assistant IA</h3>
              <span className="text-[10px] text-emerald-700 font-mono font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-glow" />
                <span>Prêt à répondre</span>
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 font-mono neu-pill px-2.5 py-1 rounded-full">
            <Clock className="w-3 h-3 text-sky-600" />
            <span>24/7 Autonome</span>
          </div>
        </div>

        {/* Messages */}
        <div className="h-64 overflow-y-auto space-y-3 p-2 no-scrollbar">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}
            >
              {m.sender === 'agent' && (
                <div className="w-7 h-7 rounded-xl neu-pressed flex items-center justify-center text-sky-600 shrink-0 text-xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${
                  m.sender === 'user'
                    ? 'neu-btn-primary text-white rounded-tr-sm'
                    : 'neu-pressed text-slate-800 rounded-tl-sm'
                }`}
              >
                <div>{m.text}</div>
                {m.time && (
                  <div className={`text-[9px] mt-1 text-right font-mono ${m.sender === 'user' ? 'text-sky-100' : 'text-slate-400'}`}>
                    {m.time}
                  </div>
                )}
              </div>
              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-xl neu-pressed flex items-center justify-center text-slate-500 shrink-0 text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium p-2 animate-fade-in">
              <div className="w-7 h-7 rounded-xl neu-pressed flex items-center justify-center text-sky-600 shrink-0 text-xs">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="p-3 rounded-2xl rounded-tl-none neu-pressed flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600 typing-dot-1" />
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600 typing-dot-2" />
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600 typing-dot-3" />
                <span className="text-[11px] text-slate-400 ml-1">Nova formule sa réponse...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="pt-2 border-t border-[#D1D9E6]/60">
          <div className="text-[10px] text-slate-400 font-mono mb-1.5">Suggestions rapides :</div>
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendQuery(q)}
                disabled={isLoading}
                className="neu-flat px-2.5 py-1 rounded-xl text-[10px] font-bold text-slate-600 hover:text-sky-700 hover:scale-102 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex gap-2 pt-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: Avez-vous une table pour 4 ce soir à 20h ?"
            className="flex-1 neu-input rounded-2xl px-4 py-3 text-xs text-slate-800 bg-transparent placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="neu-btn-primary px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 hover:scale-102 active:scale-98 transition-all shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Envoyer</span>
          </button>
        </form>
      </div>
    </section>
  );
};
