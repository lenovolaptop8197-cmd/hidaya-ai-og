import { useEffect, useMemo, useState } from "react";
import { Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import ChatSkeleton from "@/components/ChatSkeleton";
import { sendSecureChatMessage, getSecureChatHistory } from "@/lib/api";
import { hasArabic, renderStructuredText } from "@/lib/textFormat";

const SESSION_STORAGE_KEY = "hidaya-chat-session";

const getSessionId = () => {
  const existing = localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }
  const created = `hidaya-${crypto.randomUUID?.() || Date.now()}`;
  localStorage.setItem(SESSION_STORAGE_KEY, created);
  return created;
};

export default function ChatPage() {
  const [sessionId] = useState(getSessionId);
  const [messages, setMessages] = useState([]);
  const messageGroups = useMemo(
    () => messages.map((msg) => ({ 
      ...msg, 
      displayTime: msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
      text: msg.content || msg.text  // Support both old and new format
    })),
    [messages],
  );

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getSecureChatHistory(sessionId);
        setMessages(data.messages || []);
      } catch {
        toast.error("Could not load previous chat history.");
      }
    };
    loadHistory();
  }, [sessionId]);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!input.trim() || loading) {
      return;
    }

    setLoading(true);
    const language = hasArabic(input) ? "ar" : "en";
    
    // Get last 6 messages for context (3 conversation pairs)
    const recentHistory = messages.slice(-6).map(msg => ({
      role: msg.role,
      content: msg.content || msg.text,
      timestamp: msg.timestamp
    }));
    
    try {
      const response = await sendSecureChatMessage({
        message: input,
        session_id: sessionId,
        language,
        history: recentHistory, // Send last 6 messages for context
      });
      setMessages(response.messages || []);
      setInput("");
    } catch (error) {
      const errorMsg = error?.response?.data?.detail || "Unable to send message right now.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6" data-testid="companion-page">
      {/* AI Disclaimer Warning */}
      <Card className="border-amber-500/30 bg-amber-50/50" data-testid="ai-disclaimer-card">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-500/20 p-2 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900 mb-1">⚠️ Important Disclaimer</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>AI can make mistakes.</strong> This is an AI-powered assistant and may provide incomplete or inaccurate Islamic guidance. 
                For matters of faith, worship, or Islamic rulings, <strong>always consult a certified Islamic scholar</strong> or trusted religious authority. 
                Do not rely solely on AI responses for important religious decisions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-[#23B574]/15 bg-white" data-testid="companion-chat-card">
        <div className="flex items-center justify-between bg-[#23B574] px-5 py-4 text-white" data-testid="companion-chat-header">
          <div>
            <h1 className="text-xl font-semibold" data-testid="companion-chat-title">
              Hidaya AI
            </h1>
            <p className="flex items-center gap-2 text-xs text-white/90" data-testid="companion-live-status">
              <span className="h-2 w-2 rounded-full bg-[#c9f4dc]" /> Live
            </p>
          </div>
          <div className="rounded-full bg-white/15 p-2">
            <ShieldCheck className="h-5 w-5" data-testid="companion-header-icon" />
          </div>
        </div>

        <CardContent className="space-y-4 bg-[#efeae2] p-4 md:p-6">
          <div className="max-h-[520px] space-y-3 overflow-y-auto" data-testid="chat-message-list">
            {messageGroups.length === 0 && !loading ? (
              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-[#4a5568]" data-testid="chat-empty-state">
                Ask an Islamic question and each response will include a Sources section.
              </div>
            ) : (
              <>
                {messageGroups.map((message, index) => {
                  const isUser = message.role === "user";
                  return (
                    <article
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm animate-fade-in ${
                        isUser
                          ? "ms-auto rounded-br-md bg-[#23B574] text-white"
                          : "rounded-bl-md border border-[#23B574]/10 bg-white text-[#1a202c]"
                      }`}
                      data-testid={`chat-message-${index}`}
                      dir="auto"
                      key={`${message.timestamp}-${index}`}
                    >
                      <div
                        className={`${hasArabic(message.text) ? "font-arabic leading-9" : "leading-7"}`}
                        data-testid={`chat-message-content-${index}`}
                        dangerouslySetInnerHTML={{ __html: renderStructuredText(message.text) }}
                      />
                      <p
                        className={`mt-2 text-[11px] ${isUser ? "text-white/80" : "text-[#718096]"}`}
                        data-testid={`chat-message-time-${index}`}
                      >
                        {message.displayTime}
                      </p>
                    </article>
                  );
                })}
                
                {/* Show skeleton loader while AI is thinking */}
                {loading && <ChatSkeleton />}
              </>
            )}
          </div>

          <form className="space-y-3 rounded-2xl bg-white p-3" data-testid="chat-form" onSubmit={onSubmit}>
            <Textarea
              className="min-h-24 rounded-xl border-[#23B574]/20 bg-[#fdfdfd]"
              data-testid="chat-input"
              dir="auto"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask an Islamic question..."
              value={input}
            />
            <div className="flex justify-end">
              <Button
                className="rounded-full bg-[#23B574] px-5 py-2 text-white hover:bg-[#1d9560]"
                data-testid="chat-submit-button"
                disabled={loading}
                type="submit"
              >
                {loading ? "Sending..." : "Send"}
                <Send className="ms-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="text-xs text-[#4a5568]" data-testid="chat-session-label">
        Session ID: {sessionId}
      </p>
    </section>
  );
}
