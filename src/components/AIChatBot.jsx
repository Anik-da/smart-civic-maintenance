import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Bot, Send, Sparkles, User, Lightbulb, Wrench, MapPin, AlertTriangle } from 'lucide-react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are a highly intelligent, versatile AI Assistant. 
You are part of the Smart Civic portal, but you are NOT limited to civic topics.

Your mission:
1. Answer ANY question the user asks (Web development, History, Science, Coding, Math, etc.).
2. If the user asks about civic maintenance (roads, garbage, etc.), provide specialized advice.
3. Remind users that for civic issues, they can use the "Report" tab.
4. For emergencies, mention the SOS button.
5. Be helpful, professional, and friendly. Never say "I can only answer civic questions".`;

const FALLBACK_RESPONSES = {
  greet: "Hello! I'm your Smart Civic AI Assistant. I can help you report infrastructure issues, track complaints, and guide you through our services. What's the problem you're facing?",
  road: "**Road Maintenance:**\n\nFor potholes, cracks, or damaged surfaces:\n1. 📸 Take a photo of the damage\n2. Go to the **Report** tab\n3. Describe the location and severity\n4. Our AI will auto-classify the urgency\n\nTypical response: **24–72 hrs** assessment, repairs within **1–2 weeks**.",
  garbage: "**Garbage & Waste:**\n\nFor overflowing bins or illegal dumping:\n1. Go to **Report** tab\n2. Upload a photo\n3. Mark the GPS location\n\n♻️ Regular collection: Mon/Wed/Fri\n🚛 Bulk waste pickup: Request 48hrs in advance",
  electricity: "**Electrical Issues:**\n\n⚠️ Do NOT touch exposed wiring.\n1. Note the pole number if visible\n2. Go to **Report** tab → select Electricity\n3. For dangerous situations, use the **SOS button**\n\n⚡ Emergency electrical issues: **4 hour** priority response",
  emergency: "🆘 **Emergency Services:**\n\n1. Tap the **red SOS button** (bottom-right corner)\n2. Your GPS location is shared automatically\n3. Responders are notified immediately\n\nAlso call:\n📞 **112** — National Emergency\n📞 **100** — Police",
  default: "I can help you with:\n\n🛣️ **Road issues** — potholes, cracks\n🗑️ **Garbage** — waste collection\n⚡ **Electricity** — lights, outages\n💧 **Water** — pipes, drainage\n🆘 **Emergency** — SOS services\n📊 **Status** — track complaints\n\nWhat would you like to know?",
};

function getLocalResponse(message) {
  const lower = message.toLowerCase();
  if (lower.match(/^(hi|hello|hey|good|namaste)/)) return FALLBACK_RESPONSES.greet;
  if (lower.match(/road|pothole|crack|street|pavement/)) return FALLBACK_RESPONSES.road;
  if (lower.match(/garbage|waste|trash|dump|bin|litter/)) return FALLBACK_RESPONSES.garbage;
  if (lower.match(/electric|light|power|wire|outage/)) return FALLBACK_RESPONSES.electricity;
  if (lower.match(/emergency|sos|urgent|danger|accident|fire/)) return FALLBACK_RESPONSES.emergency;
  return FALLBACK_RESPONSES.default;
}

export function AIChatBot({ user }) {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: `Welcome, ${user?.phoneNumber || 'Citizen'}! 👋\n\nI'm your **Universal AI Assistant**${GEMINI_API_KEY ? ' powered by Gemini' : ''}. \n\nI specialize in **Civic Maintenance**, but I can answer **ANY** questions you have about technology, web development, history, or anything else! \n\nHow can I help you today?`,
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatSession, setChatSession] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize Gemini chat session once
  useEffect(() => {
    if (GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const geminiModel = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
          systemInstruction: SYSTEM_PROMPT,
        });
        const session = geminiModel.startChat({
          history: [],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
        });
        setChatSession(session);
      } catch (err) {
        console.error('Failed to init Gemini chat:', err);
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = { role: 'user', content: input.trim(), time: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      let responseText;

      if (chatSession) {
        // Real Gemini API call
        const result = await chatSession.sendMessage(userMessage.content);
        responseText = result.response.text();
      } else {
        // Local fallback with simulated delay
        await new Promise(r => setTimeout(r, 800 + Math.random() * 800));
        responseText = getLocalResponse(userMessage.content);
      }

      setMessages(prev => [...prev, { role: 'bot', content: responseText, time: new Date() }]);
    } catch (err) {
      console.error('Chat error:', err);
      const fallback = getLocalResponse(userMessage.content);
      setMessages(prev => [...prev, { role: 'bot', content: fallback, time: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickActions = [
    { label: 'Road Issue', icon: <Wrench className="w-3 h-3" />, msg: 'How do I report a road pothole?' },
    { label: 'Track Status', icon: <MapPin className="w-3 h-3" />, msg: 'How do I track my complaint status?' },
    { label: 'Emergency', icon: <AlertTriangle className="w-3 h-3" />, msg: 'How do I use emergency services?' },
    { label: 'About', icon: <Lightbulb className="w-3 h-3" />, msg: 'What can this app do?' },
  ];

  const handleQuickAction = (msg) => {
    setInput(msg);
    setTimeout(() => inputRef.current?.form?.requestSubmit(), 50);
  };

  return (
    <div className="max-w-3xl mx-auto w-full animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <span className="hero__kicker">AI-Powered Assistance</span>
          <h1 className="hero__title" style={{ fontSize: '2.5rem', textAlign: 'left', marginBottom: 0 }}>
            Civic AI Bot
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {GEMINI_API_KEY ? '✨ Powered by Gemini 1.5 Flash' : 'Ask me anything about civic maintenance.'}
          </p>
        </div>
        <div className="glass px-4 py-2 rounded-md flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-lime animate-pulse shadow-[0_0_10px_#a8f08a]"></div>
          <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">Online</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickActions.map((action, i) => (
          <button
            key={i}
            onClick={() => handleQuickAction(action.msg)}
            className="glass glass-btn glass-btn--ghost text-xs px-3 py-2 flex items-center gap-2 hover:border-aqua/30 transition-colors"
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

      {/* Chat Window */}
      <Card className="w-full" title="AI CONVERSATION">
        <div className="flex flex-col h-[500px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar mb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-md flex-shrink-0 flex items-center justify-center ${msg.role === 'bot' ? 'bg-aqua/10 border border-aqua/20' : 'bg-violet/10 border border-violet/20'}`}>
                  {msg.role === 'bot' ? <Bot className="w-4 h-4 text-aqua" /> : <User className="w-4 h-4 text-violet" />}
                </div>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`glass p-4 rounded-md text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-violet/10 border-violet/20' : 'bg-white/5 border-white/5'}`}>
                    {msg.content}
                  </div>
                  <span className="text-[9px] opacity-30 font-bold mt-1 inline-block px-2">
                    {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-md flex-shrink-0 flex items-center justify-center bg-aqua/10 border border-aqua/20">
                  <Bot className="w-4 h-4 text-aqua" />
                </div>
                <div className="glass p-4 rounded-md bg-white/5 border-white/5">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-aqua/50 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-aqua/50 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-aqua/50 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex gap-3 pt-4 border-t border-white/5">
            <div className="relative flex-1">
              <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-aqua/40" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={GEMINI_API_KEY ? "Ask Gemini anything about your city..." : "Ask about roads, garbage, electricity, water..."}
                className="glass-input pl-12 w-full"
                disabled={isTyping}
              />
            </div>
            <Button type="submit" variant="primary" className="px-6" disabled={isTyping || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
