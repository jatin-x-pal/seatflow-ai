"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AIPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = query;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setQuery("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: "Error formulating response." }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: "Network Error: Could not reach SeatFlow AI Server." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      <h1 className="text-3xl font-bold tracking-tight mb-6">SeatFlow AI Assistant</h1>
      
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-lg">Chat with your Data</CardTitle>
          <p className="text-sm text-slate-500">Ask about employees, floors, or project managers in natural language.</p>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-400">
              Try asking: &quot;Find all Java developers&quot; or &quot;How many seats are free?&quot;
            </div>
          )}
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-4 py-2 max-w-[70%] rounded-lg ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-900 rounded-bl-none shadow-sm'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-2 rounded-lg bg-slate-100 text-slate-500 rounded-bl-none animate-pulse">
                Thinking...
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-4 border-t bg-white">
          <form onSubmit={handleSend} className="flex w-full space-x-2">
            <Input 
              autoFocus
              value={query} 
              onChange={e => setQuery(e.target.value)} 
              placeholder="Who is working on Project Apollo?..." 
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !query.trim()}>Send</Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
