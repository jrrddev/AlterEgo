"use client";

import { useState, useRef, useEffect } from "react";
import { PersonaSelector } from "@/components/chat/PersonaSelector";
import { MessageBubble, type Message } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { personas, personaList, PersonaId } from "@/lib/personas";
import { modelList } from "@/lib/models";
import { speechService } from "@/lib/speech";
import { logout } from "@/app/actions";
import { LogOut, Bug, Menu, X, History } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ChatClientUI({
  initialUsage
}: {
  initialUsage: { sent: number; limit: number }
}) {
  const [usage, setUsage] = useState(initialUsage);
  const [selectedPersona, setSelectedPersona] = useState(personaList[0]);
  const [selectedModelId, setSelectedModelId] = useState(modelList[0].id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved server preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('alterego_preferred_server');
    if (saved && modelList.find(m => m.id === saved)) {
      setSelectedModelId(saved);
    }
  }, []);

  const handleServerChange = (id: string) => {
    setSelectedModelId(id);
    localStorage.setItem('alterego_preferred_server', id);
  };

  // Load history from DB on persona change
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/chat?personaId=${selectedPersona.id}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    };
    fetchHistory();
  }, [selectedPersona.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectPersona = (id: PersonaId) => {
    setSelectedPersona(personas[id]);
    setIsSidebarOpen(false); // Close sidebar on mobile when selecting a persona
  };

  const handleSend = async (content: string) => {
    const newUserMsg: Message = { id: Date.now().toString(), role: "user", content };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          personaId: selectedPersona.id,
          modelId: selectedModelId,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errorToThrow = new Error(errData.error || "Failed to fetch response") as any;
        errorToThrow.details = errData.details;
        throw errorToThrow;
      }

      const data = await response.json();

      if (data.usage) {
        setUsage(data.usage);
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        personaId: selectedPersona.id,
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Speak the response if not muted
      speechService.speak(data.content, {
        pitch: selectedPersona.id === 'zen_master' ? 0.8 : selectedPersona.id === 'hype_coach' ? 1.2 : 1.0,
        rate: selectedPersona.id === 'zen_master' ? 0.8 : selectedPersona.id === 'hype_coach' ? 1.2 : 1.0,
      });

    } catch (error: any) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Oops! ${error.message || "Something went wrong."}\n\n💡 Tip: Try switching to a different Server Connection in the sidebar menu!`,
        errorPayload: JSON.stringify({ 
          error: error.message, 
          details: error.details ? JSON.parse(error.details) : undefined,
          time: new Date().toISOString() 
        }, null, 2),
        personaId: selectedPersona.id,
        isError: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    if (confirm("Are you sure you want to clear the chat history?")) {
      setMessages([]);
      await fetch(`/api/chat?personaId=${selectedPersona.id}`, { method: 'DELETE' });
    }
  };

  return (
    <div
      className="flex h-screen bg-background text-foreground overflow-hidden transition-colors duration-700"
      style={{
        '--color-primary-500': selectedPersona.primaryColor,
        '--color-primary-600': selectedPersona.secondaryColor,
      } as React.CSSProperties}
    >
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar / Persona Selection */}
      <aside className={`w-80 border-r border-white/5 bg-background/95 md:bg-surface/30 backdrop-blur-xl flex flex-col p-6 overflow-y-auto z-50 transition-transform duration-300 ${isSidebarOpen ? 'fixed inset-y-0 left-0 shadow-2xl translate-x-0' : 'fixed -translate-x-full md:relative md:translate-x-0 md:flex'}`}>
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden shrink-0">
              <Image src="/AlterEgoLogo.webp" alt="AlterEgo Logo" width={40} height={40} className="object-cover w-full h-full" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              AlterEgo
            </h1>
          </div>
          <button
            className="md:hidden text-white/50 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1">
          <PersonaSelector
            selectedPersona={selectedPersona}
            onSelect={handleSelectPersona}
          />
        </div>
        <div className="flex-1 mt-4">
          <ModelSelector
            selectedModelId={selectedModelId}
            onSelect={handleServerChange}
          />
        </div>

        <div className="flex flex-col gap-3 mt-8">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-1 items-center justify-center text-center">
              <span className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Plan Limit</span>
              <span className="text-white/90 text-sm font-medium">
                {Math.max(0, usage.limit - usage.sent)} Left
              </span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-1 items-center justify-center text-center">
              <span className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Saved History</span>
              <span className="text-white/90 text-sm font-medium">
                {messages.length} / 20
              </span>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="py-3 px-4 rounded-xl text-sm font-medium text-white/50 hover:text-white/90 hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
          >
            Clear Conversation / History
          </button>

          <Link
            href="/changelog"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-white/60 hover:text-white/90 hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
          >
            <History size={16} /> Changelog
          </Link>

          <a
            href="https://jrrd.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 transition-colors border border-primary-500/20 hover:border-primary-500/40"
          >
            <Bug size={16} /> Report Issue / Contact Dev
          </a>
          <button
            onClick={() => logout()}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Mobile Header */}
        <header className="md:hidden flex flex-col p-3 border-b border-white/5 bg-surface/50 backdrop-blur-md sticky top-0 z-30 gap-3">
          <div className="flex items-center justify-between">
            <button
              className="text-white/70 hover:text-white p-1 -ml-1"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="text-sm font-medium text-primary-400 flex items-center gap-2">
              {selectedPersona.name} {selectedPersona.avatar}
            </div>
          </div>
          <div className="flex items-center justify-center bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-[11px] uppercase tracking-wider font-medium">
            <span className="text-white/50">Messages Left: <span className="text-white/90 ml-1">{Math.max(0, usage.limit - usage.sent)}</span></span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-white/40 animate-fade-in my-auto">
                <div className="text-6xl mb-4 opacity-50">{selectedPersona.avatar}</div>
                <h3 className="text-xl font-medium text-white/70 mb-2">
                  Say hi to your {selectedPersona.name}
                </h3>
                <p className="max-w-md text-sm">
                  This persona will respond based on its unique behavioral traits.
                  Try sending a message!
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    currentPersona={selectedPersona}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            {messages.length >= 20 && (
              <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl">
                <span>History limit reached (20/20). Please clear your history to continue chatting.</span>
                <button onClick={clearChat} className="underline font-semibold hover:text-white transition-colors shrink-0 ml-4 text-red-300">
                  Clear All
                </button>
              </div>
            )}
            <ChatInput onSend={handleSend} isLoading={isLoading} disabled={messages.length >= 20} />
          </div>
        </div>
      </main>
    </div>
  );
}
