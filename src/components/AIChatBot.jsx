import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Bot, Send, Sparkles, User, Lightbulb, Wrench, MapPin, AlertTriangle, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are "Smart Civic AI", a specialized assistant for the Smart Civic maintenance platform.

Your goal is to help citizens with infrastructure issues, reporting complaints, and tracking their status. You are professional, efficient, and highly knowledgeable about urban maintenance.

CORE COMPETENCIES:
1. INFRASTRUCTURE: Help users identify and describe issues like potholes, street light failures, water leaks, and sanitation problems.
2. REPORTING: Guide users to the "Report" section to file a new complaint with photo and GPS evidence.
3. TRACKING: Explain that users can track their complaints using the "Track Status" tab in the Report section by entering their registered phone number.
4. EMERGENCIES: For life-threatening emergencies, always emphasize using the "SOS" button.

CONSTRAINTS:
- Keep answers focused on civic services and city maintenance.
- Be precise and accurate. If you don't know something about a specific city policy, ask the user to contact the helpdesk.
- Use Markdown for clear, structured responses.`;

const FALLBACK_RESPONSES = {
  greet: "Greetings! I am **AI Answer**, your friendly universal assistant. It seems I am currently operating in offline mode, but I can still assist with basic infrastructure reporting. How can I help you today? 😊",
  road: "### 🛣️ Road Issue\n\nI understand you want to report a road issue. You can use the **Report** section to snap a photo and share the location of the pothole. The Road Department will look into it!",
  garbage: "### 🗑️ Sanitation Issue\n\nGarbage not collected? No problem. Please go to the **Report** section, select 'Garbage', and we'll dispatch a cleanup crew to your area.",
  electricity: "### ⚡ Power Issue\n\nPower outage or broken streetlights? Stay safe! You can report this in the **Report** section so the Electricity Department can fix it promptly.",
  emergency: "### 🆘 Emergency!\n\nIf this is a life-threatening emergency, please use the **SOS** button immediately to alert all authorities and your emergency contacts!",
  default: "I'm currently running in limited offline mode. Please try asking about specific issues like 'road', 'garbage', 'electricity', or 'emergency'.",
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
      content: `Hello! I am **Smart Civic AI**, your specialized assistant for city maintenance. 👋
        
I can help you report infrastructure issues, explain how to track your existing complaints, or provide information about our city services.

How can I assist you today?`,
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
          model: 'gemini-2.0-flash',
          systemInstruction: SYSTEM_PROMPT,
        });
        const session = geminiModel.startChat({
          history: [],
          generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
        });
        setChatSession(session);
      } catch (err) {
        console.error('Failed to init Gemini chat:', err);
      }
    }
  }, [GEMINI_API_KEY]);

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
            Smart Civic AI
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {GEMINI_API_KEY
              ? `✨ Official Maintenance Assistant`
              : `Ask me about report status or city services.`}
          </p>
        </div>
        <div className="flex items-center gap-3">

          <div className="glass px-4 py-2 rounded-md flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse bg-lime shadow-[0_0_10px_#a8f08a]"></div>
            <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Removed Quick Actions as requested */}

      {/* Chat Window */}
      <Card className="w-full" title="CIVIC ASSISTANT">
        <div className="flex flex-col h-[500px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar mb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-md flex-shrink-0 flex items-center justify-center ${
                  msg.role === 'bot' 
                    ? 'bg-aqua/10 border border-aqua/20' 
                    : 'bg-violet/10 border border-violet/20'
                }`}>
                  {msg.role === 'bot' ? <Bot className="w-4 h-4 text-aqua" /> : <User className="w-4 h-4 text-violet" />}
                </div>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`glass p-4 rounded-md text-sm leading-relaxed markdown-content ${
                    msg.role === 'user' 
                      ? 'bg-violet/10 border-violet/20' 
                      : 'bg-white/5 border-white/5'
                  }`}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
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
                placeholder={GEMINI_API_KEY
                  ? "Ask Gemini anything about your city..."
                  : "Ask about roads, garbage, electricity, water..."}
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
