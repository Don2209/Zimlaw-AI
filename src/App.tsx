/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Scale, 
  BookOpen, 
  FileText, 
  Lightbulb, 
  Search, 
  Send, 
  ChevronRight, 
  History,
  Info,
  ExternalLink,
  Loader2,
  Gavel,
  ShieldAlert
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateLegalResponse, type ResearchMode } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: ResearchMode;
  sources?: { title: string; uri: string }[];
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<ResearchMode>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      mode: activeMode,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateLegalResponse(input, activeMode);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        mode: activeMode,
        sources: response.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
          title: chunk.web?.title || 'Source',
          uri: chunk.web?.uri || '#'
        }))
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an error while processing your legal research request. Please try again later.",
        mode: activeMode,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const modes = [
    { id: 'chat', label: 'General Q&A', icon: Scale, description: 'Ask any legal question' },
    { id: 'paper', label: 'Research Paper', icon: FileText, description: 'Draft academic legal papers' },
    { id: 'case', label: 'Case Analysis', icon: Gavel, description: 'Analyze cases using IRAC' },
    { id: 'tips', label: 'Research Tips', icon: Lightbulb, description: 'Methodology & tips' },
  ] as const;

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-slate-900 p-2 rounded-lg">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">ZimLaw AI</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Legal Research Assistant</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                activeMode === mode.id 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <mode.icon className={cn("w-5 h-5", activeMode === mode.id ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
              <div className="text-left">
                <div className="font-semibold text-sm">{mode.label}</div>
                <div className={cn("text-[10px] opacity-70", activeMode === mode.id ? "text-slate-200" : "text-slate-400")}>
                  {mode.description}
                </div>
              </div>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5" />
              <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                DISCLAIMER: This AI is for research purposes only and does not constitute legal advice. Consult a registered legal practitioner in Zimbabwe for official counsel.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Current Mode:</span>
            <span className="bg-slate-100 text-slate-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              {modes.find(m => m.id === activeMode)?.label}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <History className="w-5 h-5" />
            </button>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <Info className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-6">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-10 h-10 text-slate-300" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">How can I assist your legal research today?</h2>
              <p className="text-slate-500 text-lg leading-relaxed">
                I am specialized in Zimbabwean and African law. I can help you draft papers, analyze cases, or answer complex legal questions.
              </p>
              <div className="grid grid-cols-2 gap-4 w-full mt-8">
                {[
                  "What are the grounds for divorce in Zimbabwe?",
                  "Explain the IRAC analysis for S v Chogugudza",
                  "Draft an outline for a paper on Land Law in Zim",
                  "How to cite Zimbabwean statutes in OSCOLA?"
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="p-4 text-left text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.map((message) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={message.id}
                  className={cn(
                    "flex gap-6",
                    message.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    message.role === 'user' ? "bg-slate-900" : "bg-white border border-slate-200"
                  )}>
                    {message.role === 'user' ? (
                      <span className="text-white text-xs font-bold">YOU</span>
                    ) : (
                      <Scale className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div className={cn(
                    "flex-1 space-y-4",
                    message.role === 'user' ? "text-right" : "text-left"
                  )}>
                    <div className={cn(
                      "inline-block rounded-2xl p-6 text-left",
                      message.role === 'user' 
                        ? "bg-slate-900 text-white shadow-xl" 
                        : "bg-white border border-slate-200 shadow-sm"
                    )}>
                      {message.role === 'user' ? (
                        <p className="text-lg leading-relaxed">{message.content}</p>
                      ) : (
                        <div className="markdown-body">
                          <Markdown>{message.content}</Markdown>
                        </div>
                      )}
                    </div>

                    {message.sources && message.sources.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {message.sources.map((source, i) => (
                          <a
                            key={i}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors uppercase tracking-wider"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-6">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-slate-200 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-slate-200 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 bg-slate-200 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-8 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA] to-transparent">
          <div className="max-w-4xl mx-auto relative">
            <div className="absolute -top-10 left-0 right-0 flex justify-center">
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2"
                  >
                    <Search className="w-3 h-3 text-slate-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Grounding with Google Search</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="relative group">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={`Ask a legal question in ${modes.find(m => m.id === activeMode)?.label} mode...`}
                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-5 pr-16 shadow-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all resize-none min-h-[80px] text-lg"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "absolute right-4 bottom-4 p-3 rounded-xl transition-all duration-200",
                  input.trim() && !isLoading 
                    ? "bg-slate-900 text-white shadow-lg hover:scale-105 active:scale-95" 
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-4 text-center text-[10px] text-slate-400 font-medium uppercase tracking-widest">
              Press Enter to send • Shift + Enter for new line
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
