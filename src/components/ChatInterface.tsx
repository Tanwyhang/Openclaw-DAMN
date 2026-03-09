"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "@/components/ui/sonner";

interface ChatMessage {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Initial greeting
  useEffect(() => {
    const initMessages = async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setMessages([
        {
          id: Date.now(),
          role: "system",
          content: "Connected to relay-bot-aewo",
          timestamp: new Date(),
        },
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "Hello! I'm your RELAY agent. How can I help you today?",
          timestamp: new Date(),
        },
      ]);
      toast.info("Agent online", { description: "Connected to relay-bot-aewo" });
    };
    initMessages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "user",
        content: userMessage,
        timestamp: new Date(),
      },
    ]);

    setIsTyping(true);

    // Simulate agent response
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 500));

    const responses = [
      "I've indexed that information. Is there anything else you'd like me to look up?",
      "Processing your request... Done! The knowledge has been updated.",
      "I found several relevant entries in my knowledge base. Would you like me to elaborate?",
      "Understood. I've noted that for future reference.",
      "I'm continuously learning and improving. Thanks for the input!",
    ];

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      },
    ]);

    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "system" ? (
              <div className="text-[10px] text-white/70 text-center w-full py-1">
                {msg.content}
              </div>
            ) : (
              <div
                className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-black font-medium"
                    : "bg-white/10 text-foreground border border-white/10"
                }`}
              >
                {msg.content}
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/10 text-white/70 px-3 py-2 rounded-lg text-sm border border-white/10">
              <span className="animate-pulse">...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-white/10 p-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder={isTyping ? "Agent is typing..." : "Type a message..."}
            className="flex-1 bg-black/40 text-white px-3 py-2 rounded-md text-sm border border-white/10 focus:outline-none focus:border-primary/50 placeholder:text-white/70 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className="px-4 py-2 bg-primary text-black font-bold text-sm rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
