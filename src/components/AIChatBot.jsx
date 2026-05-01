import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Bot, Send, Sparkles, User, Lightbulb, Wrench, MapPin, AlertTriangle, Users, BarChart3 } from 'lucide-react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are a highly intelligent, versatile AI Assistant for the Smart Civic portal.
Your mission:
1. Answer ANY question the user asks (Web development, History, Science, Coding, Math, etc.).
2. If the user asks about civic maintenance (roads, garbage, etc.), provide specialized advice.
3. Remind users that for civic issues, they can use the "Report" tab.
4. For emergencies, mention the SOS button.
5. Be helpful, professional, and friendly. Never say "I can only answer civic questions".`;

const STAFF_SYSTEM_PROMPT = `You are the Smart Civic Operations Command AI.
Your mission:
1. Provide engineering-level infrastructure data: Asphalt compaction ratios, hydraulic pressure specs, HV grid safety.
2. Assist staff with shift coordination and resource dispatch protocols.
3. Use a technical, highly efficient, "Terminal" style tone.
4. Reference the "Incidents" and "Staff Hub" tabs in the dashboard for real-time management.
5. If an emergency is mentioned, immediately confirm the protocol for the Sidebar SOS button.`;

const FALLBACK_RESPONSES = {
  greet: "Hello! I'm your Smart Civic AI Assistant. I can help you report infrastructure issues, track complaints, and guide you through our services. What's the problem you're facing?",
  staffGreet: "Greetings, team. Operations Assistant online. How can I assist with today's maintenance schedule, resource allocation, or technical infrastructure queries?",
  road: "**Road Maintenance Ops:**\n\n- **Standard Repair:** Hot-mix asphalt for potholes > 50mm depth.\n- **SLA:** 48hr assessment, 7-day resolution.\n- **Safety:** Use Grade 3 high-vis gear and automatic lane-closure signage.\n- **Citizen View:** Reportable via 'Road Damage' category.",
  garbage: "**Sanitation & Logistics:**\n\n- **Route Optimization:** Real-time bin level tracking active in Sector 4.\n- **Vehicle Fleet:** 85% availability. Unit SAN-09 in shop for hydraulics.\n- **Hazmat:** Requires specialized containment team Alpha.",
  electricity: "**Grid Operations:**\n\n⚠️ **DANGER:** High-voltage line failure requires Phase-1 isolation.\n- **Repair:** Use insulated booms (33kV rated).\n- **Priority:** 4-hour hard deadline for residential grid restoration.\n- **System:** Check Transformer 8B in the Analytics tab for load spikes.",
  emergency: "🆘 **Emergency Command:**\n\n1. **Internal SOS:** Use the Sidebar SOS button for immediate team dispatch.\n2. **Protocol:** Signal broadcasts to all active units and local precinct.\n3. **GPS:** Precision mapping active within 5-meter radius.",
  default: "Operational Support Menu:\n\n\ud83d\udee3\ufe0f **Infrastructure** \u2014 Road and drainage technical specs\n\ud83d\uddd1\ufe0f **Logistics** \u2014 Waste management and fleet status\n\u26a1 **Power Systems** \u2014 Grid stability and electrical safety\n\ud83d\udcca **Analytics** \u2014 Performance bottlenecks and SLA data\n\ud83c\udd98 **Emergency** \u2014 SOS command and control\n\nWhat is your current operational requirement?",
};

function getLocalResponse(message, isStaff) {
  const lower = message.toLowerCase();
  if (lower.match(/^(hi|hello|hey|good|namaste)/)) return isStaff ? FALLBACK_RESPONSES.staffGreet : FALLBACK_RESPONSES.greet;
  if (lower.match(/road|pothole|crack|street|pavement/)) return FALLBACK_RESPONSES.road;
  if (lower.match(/garbage|waste|trash|dump|bin|litter/)) return FALLBACK_RESPONSES.garbage;
  if (lower.match(/electric|light|power|wire|outage/)) return FALLBACK_RESPONSES.electricity;
  if (lower.match(/emergency|sos|urgent|danger|accident|fire/)) return FALLBACK_RESPONSES.emergency;
  return FALLBACK_RESPONSES.default;
}

export function AIChatBot({ user, isStaff: isStaffProp = false }) {
  // Determine if user is staff based on prop OR user role (ADMIN/WORKER)
  const isStaff = isStaffProp || user?.role === 'ADMIN' || user?.role === 'WORKER';

  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: isStaff 
        ? `### OPERATIONS COMMAND AI \ud83d\udee0\ufe0f\nSecure line established. Greetings, ${user?.name || 'Officer'}.\n\nOperational Directives:\n- **Sector Analysis**: Technical specs for infrastructure repair.\n- **Logistics**: Crew deployment & shift coordination.\n- **Crisis Control**: SOS protocols & emergency dispatch.\n\nReady for technical input.`
        : `Welcome, ${user?.phoneNumber || 'Citizen'}! \ud83d\udc4b\nI'm your **Universal AI Assistant** powered by Gemini. \n\nI can help with **Civic Issues** (roads, garbage, etc.) or answer **ANY** question you have about the world! \n\nWhat's on your mind?`,
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
          model: 'gemini-2.5-flash',
          systemInstruction: isStaff ? STAFF_SYSTEM_PROMPT : SYSTEM_PROMPT,
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
  }, [isStaff, GEMINI_API_KEY]); // Added GEMINI_API_KEY to deps


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

  const citizenActions = [
    { label: 'Road Issue', icon: <Wrench className="w-3 h-3" />, msg: 'How do I report a road pothole?' },
    { label: 'Track Status', icon: <MapPin className="w-3 h-3" />, msg: 'How do I track my complaint status?' },
    { label: 'Emergency', icon: <AlertTriangle className="w-3 h-3" />, msg: 'How do I use emergency services?' },
    { label: 'About', icon: <Lightbulb className="w-3 h-3" />, msg: 'What can this app do?' },
  ];

  const staffActions = [
    { label: 'TRIGGER SOS', icon: <AlertTriangle className="w-3 h-3 text-rose animate-pulse" />, msg: 'TRIGGER SOS: I have an immediate infrastructure emergency that needs team broadcasting.' },
    { label: 'Technical Specs', icon: <Wrench className="w-3 h-3 text-aqua" />, msg: 'What are the technical specifications and safety protocols for current infrastructure repairs?' },
    { label: 'Crew Deployment', icon: <Users className="w-3 h-3 text-violet" />, msg: 'Propose an optimized crew deployment strategy for high-priority incidents in the central sector.' },
    { label: 'SLA Analysis', icon: <BarChart3 className="w-3 h-3 text-amber" />, msg: 'Analyze current SLA compliance rates and identify operational bottlenecks.' },
  ];

  const quickActions = isStaff ? staffActions : citizenActions;

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
            {isStaff ? 'Operations AI' : 'Civic AI Bot'}
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {GEMINI_API_KEY 
              ? `\u2728 ${isStaff ? 'Staff Support' : 'Citizen Helper'} via Gemini 1.5` 
              : `Ask me anything about ${isStaff ? 'infrastructure management' : 'civic maintenance'}.`}
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
                placeholder={GEMINI_API_KEY 
                  ? (isStaff ? "Consult Ops AI on infrastructure, safety, or coordination..." : "Ask Gemini anything about your city...") 
                  : (isStaff ? "Technical queries, safety protocols, or resource planning..." : "Ask about roads, garbage, electricity, water...")}
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
