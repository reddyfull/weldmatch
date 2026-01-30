import { useState, useRef, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Sparkles, ArrowRight, Bot, User, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployerProfile } from "@/hooks/useUserProfile";
import { aiChat, Message, FeatureTrigger } from "@/lib/ai-phase2";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = "weldmatch_chat_history_employer";
const SESSION_KEY = "weldmatch_chat_session_employer";

export default function EmployerAIChatAssistant() {
  const { user } = useAuth();
  const { data: employerProfile } = useEmployerProfile();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [featureTriggers, setFeatureTriggers] = useState<FeatureTrigger[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to parse saved messages:", e);
      }
    }
    if (savedSession) {
      setSessionId(savedSession);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
    if (sessionId) {
      localStorage.setItem(SESSION_KEY, sessionId);
    }
  }, [messages, sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setFeatureTriggers([]);

    try {
      const response = await aiChat({
        message: userMessage,
        conversationHistory: messages,
        userType: 'employer',
        userId: user?.id,
        sessionId: sessionId || undefined,
        userContext: employerProfile ? {
          profile: {
            companyName: employerProfile.company_name || undefined,
            industry: employerProfile.industry || undefined,
            companySize: employerProfile.company_size || undefined,
            city: employerProfile.city || undefined,
            state: employerProfile.state || undefined,
          }
        } : undefined,
      });

      if (response.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
        setSessionId(response.sessionId);
        if (response.featureTriggers && response.featureTriggers.length > 0) {
          setFeatureTriggers(response.featureTriggers);
        }
      } else {
        throw new Error("Failed to get response");
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I encountered an error. Please try again in a moment." 
      }]);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, messages, sessionId, user?.id, employerProfile]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    setSessionId(null);
    setFeatureTriggers([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);
    toast({
      title: "Chat cleared",
      description: "Your conversation history has been cleared.",
    });
  };

  const handleFeatureClick = (trigger: FeatureTrigger) => {
    navigate(trigger.path);
  };

  const suggestedQuestions = [
    "How do I attract top welding talent?",
    "What salary should I offer for a 6G welder?",
    "Best practices for welder interviews",
    "How to reduce welder turnover?",
  ];

  return (
    <DashboardLayout userType="employer">
      <div className="p-4 lg:p-8 max-w-4xl mx-auto h-[calc(100vh-4rem)] lg:h-screen flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Hiring Assistant</h1>
              <p className="text-sm text-muted-foreground">Get help with welding recruitment</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearHistory}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Chat
            </Button>
          )}
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12">
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
                  <Bot className="w-10 h-10 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Welcome to your AI Hiring Assistant!</h3>
                  <p className="text-muted-foreground max-w-md">
                    I'm here to help with recruitment strategies, salary benchmarks, interview tips, and more.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
                  {suggestedQuestions.map((question, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-left justify-start h-auto py-3 px-4"
                      onClick={() => {
                        setInput(question);
                        inputRef.current?.focus();
                      }}
                    >
                      <Sparkles className="w-4 h-4 mr-2 shrink-0 text-accent" />
                      <span className="text-sm">{question}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-accent" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-accent" />
                    </div>
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {featureTriggers.length > 0 && (
            <div className="px-4 py-2 border-t bg-muted/50">
              <p className="text-xs text-muted-foreground mb-2">Suggested features:</p>
              <div className="flex flex-wrap gap-2">
                {featureTriggers.map((trigger, i) => (
                  <Button
                    key={i}
                    variant="secondary"
                    size="sm"
                    onClick={() => handleFeatureClick(trigger)}
                  >
                    {trigger.feature}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about hiring welders..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
