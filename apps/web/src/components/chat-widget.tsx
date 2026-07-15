'use client';

import { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import type { ChatMessage } from '@meghjatra/shared';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const GREETING: ChatMessage = {
  role: 'assistant',
  content: "Hi! I'm Megh, your AI travel assistant. Ask me about destinations, itineraries, or packing tips.",
};

export function ChatWidget() {
  const { user, accessToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  async function handleSend() {
    const content = input.trim();
    if (!content || !accessToken) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);
    setError(null);

    try {
      const { message } = await apiClient.post<{ message: ChatMessage }>(
        '/chat',
        { messages: nextMessages },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Megh is unavailable right now.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <Card className="flex h-96 w-80 flex-col overflow-hidden">
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b py-3">
            <CardTitle className="text-sm">Megh · Travel Assistant</CardTitle>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close chat">
              <X className="size-4" />
            </button>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto py-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                  message.role === 'user'
                    ? 'self-end bg-primary text-primary-foreground'
                    : 'self-start bg-muted text-muted-foreground',
                )}
              >
                {message.content}
              </div>
            ))}
            {isSending && <p className="text-xs text-muted-foreground">Megh is typing...</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </CardContent>
          <div className="flex gap-2 border-t p-3">
            <Input
              placeholder="Ask Megh anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              disabled={isSending}
            />
            <Button size="icon" onClick={handleSend} disabled={isSending || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </div>
        </Card>
      )}

      <Button
        size="icon"
        className="size-12 rounded-full shadow-lg"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close chat' : 'Open chat with Megh'}
      >
        <MessageCircle className="size-5" />
      </Button>
    </div>
  );
}
