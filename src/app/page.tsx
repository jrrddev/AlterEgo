"use client";

import { useState, useRef, useEffect } from "react";
import { PersonaSelector } from "@/components/chat/PersonaSelector";
import { MessageBubble, type Message } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { personas, personaList, PersonaId } from "@/lib/personas";
import { speechService } from "@/lib/speech";
import Image from "next/image";

export default function Home() {
  const [selectedPersona, setSelectedPersona] = useState(personaList[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("alterego_chat");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.messages) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setMessages(parsed.messages);
        }
        if (parsed.personaId && personas[parsed.personaId as PersonaId]) {
          setSelectedPersona(personas[parsed.personaId as PersonaId]);
        }
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    }
  }, []);

  // Save to local storage on changes
  useEffect(() => {
    localStorage.setItem(
      "alterego_chat",
      JSON.stringify({ messages, personaId: selectedPersona.id })
    );
  }, [messages, selectedPersona]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectPersona = (id: PersonaId) => {
    setSelectedPersona(personas[id]);
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
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          personaId: selectedPersona.id,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch response");
      }

      const data = await response.json();
      
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
        content: `Oops! ${error.message || "Something went wrong."}`,
        personaId: selectedPersona.id,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm("Are you sure you want to clear the chat history?")) {
      setMessages([]);
      localStorage.removeItem("alterego_chat");
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar / Persona Selection */}
      <aside className="w-80 border-r border-white/5 bg-surface/30 backdrop-blur-md hidden md:flex flex-col p-6 overflow-y-auto z-10 relative">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden shrink-0">
            <Image src="/AlterEgoLogo.webp" alt="AlterEgo Logo" width={40} height={40} className="object-cover w-full h-full" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            AlterEgo
          </h1>
        </div>
        
        <div className="flex-1">
          <PersonaSelector 
            selectedPersona={selectedPersona} 
            onSelect={handleSelectPersona} 
          />
        </div>

        <button 
          onClick={clearChat}
          className="mt-8 py-3 px-4 rounded-xl text-sm font-medium text-white/50 hover:text-white/90 hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
        >
          Clear Conversation
        </button>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-surface/50 backdrop-blur-md">
          <h1 className="font-bold text-lg">AlterEgo</h1>
          <div className="text-sm font-medium text-primary-400">
            {selectedPersona.name} {selectedPersona.avatar}
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
          <div className="max-w-3xl mx-auto">
            <ChatInput onSend={handleSend} isLoading={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
}
