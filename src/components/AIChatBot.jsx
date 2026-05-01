import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Bot, Send, Sparkles, User, Lightbulb, Wrench, MapPin, AlertTriangle, Users, BarChart3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are "Civic-IQ", the sophisticated AI Urban Concierge for the Smart Civic platform. Your role is to provide a premium, highly professional assistance experience for the modern citizen.

Writing Protocol:
1. **Linguistic Excellence**: Maintain an elegant, sophisticated tone. Use articulate vocabulary (e.g., "orchestrate," "prioritize," "seamlessly," "infrastructure optimization").
2. **Empathetic Precision**: Acknowledge citizen concerns with professional empathy. Your goal is to instill confidence that the city is working proactively for them.
3. **Architectural Clarity**: Structure your intelligence using crisp markdown. Use elegant headers, bulleted lists for scannability, and bold text for critical data points.
4. **Proactive Urban Intelligence**: Antiticipate needs. If a user reports a localized issue, explain the engineering workflow, the assigned priority tier, and the expected resolution trajectory.
5. **Safety Protocols**: For immediate threats or emergencies, pivot instantly to a clear, high-priority directive guiding the user to the "SOS Emergency Command" interface.
6. **Premium Experience**: Every interaction should feel like a high-end service encounter, reflecting the state-of-the-art nature of our digital city.`;

const STAFF_SYSTEM_PROMPT = `You are "ARES-01" (Advanced Response & Engineering System), the tactical command intelligence for Smart Civic Operations. You interface exclusively with specialized engineering units and field officers.

Operational Protocols:
1. **Tactical Authority**: Your tone must be concise, technical, and authoritative. Use engineering-grade terminology (e.g., "telemetry," "load balancing," "structural integrity," "SLA compliance").
2. **Actionable Intelligence Matrix**: Organize all reports into a rigid, high-efficiency structure:
   - **[STATUS]**: Current operational state or detected anomaly.
   - **[ANALYSIS]**: Technical breakdown of cause and secondary implications.
   - **[DIRECTIVE]**: Immediate tactical steps for field teams.
3. **Engineering Specifications**:
   - **Civil**: Reference specific materials (e.g., HMA Grade 1, concrete compressive strength), compaction standards, and drainage gradient specs.
   - **Electrical**: Focus on phase balancing, reactive power monitoring, and distribution grid telemetry.
   - **Sanitation**: Address biochemical filtration, route optimization algorithms, and equipment mechanical stress.
4. **Command Synergy**: Seamlessly integrate with the "Control Center" and "Staff Hub" data overlays. Direct staff to real-time analytics for comprehensive situational awareness.
5. **Operational Integrity**: Every byte of information must contribute to mission success and public safety.`;

const FALLBACK_RESPONSES = {
  greet: "Greetings! I am **Civic-IQ**, your next-gen urban companion. I can assist with infrastructure reporting, real-time tracking, or any general knowledge query you might have. How can I enhance your city experience today?",
  staffGreet: "ARES-01 Online. Secure link established. Greetings, Officer. Monitoring local grid stability and crew telemetry. State your operational requirement for immediate processing.",
  road: "### 🛣️ INFRASTRUCTURE ENGINEERING REPORT\n\n- **Analysis**: Detected asphalt degradation on primary arterial routes.\n- **Directive**: Proposing cold-milled HMA (Hot Mix Asphalt) patching.\n- **SLA**: Category A defects require 4hr assessment. Resolution window: 48-72 hours.\n- **Safety**: Zone-4 buffer protocols mandatory. Verify TM-1 traffic planning.",
  garbage: "### 🗑️ LOGISTICS & SANITATION OPS\n\n- **Telemetry**: Dynamic route optimization engaged. Fleet efficiency at 98%.\n- **Alert**: Unit SAN-09 reports hydraulic pressure drop (15%). Rerouting to maintenance.\n- **Hazard**: Alpha-6 containment protocol active for Sector 9 runoff. Dispatching sanitation hazmat.",
  electricity: "### ⚡ GRID CONTROL & POWER SYSTEMS\n\n- **Status**: CRITICAL. 33kV feeder fault detected in Substation 7.\n- **Procedure**: Immediate Phase-1 isolation recommended. Use hot-stick protocols only.\n- **Load Management**: Transformer 8B at 88% capacity. Initiating non-essential load shedding.\n- **Action**: Monitor 'Analytics' for real-time harmonic distortion maps.",
  emergency: "### 🆘 COMMAND SOS PROTOCOL\n\n1. **Geolocation**: User localized via Precision GPS (Margin: <2m).\n2. **Dispatch**: Automated multi-agency broadcast initiated (EMS, Fire, Police).\n3. **Directive**: Use the **ROSE** SOS button in the Sidebar for instant, high-priority command override.",
  default: "#### SYSTEM QUERY TREE (ARES-01 MODE)\n\n- **[ENG]** — Civil Engineering (Asphalt/Specs)\n- **[LOG]** — Logistics & Fleet Telemetry\n- **[PWR]** — Grid Stability & Electrical Isolation\n- **[OPS]** — SLA Bottlenecks & Workforce Metrics\n- **[SOS]** — Emergency Command Override\n\n*Please specify your sector or technical requirement.*",
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
        ? `### OPERATIONS COMMAND AI 🛠️
Secure line established. Greetings, ${user?.name || 'Officer'}.

Operational Directives:
- **Sector Analysis**: Technical specs for infrastructure repair.
- **Logistics**: Crew deployment & shift coordination.
- **Crisis Control**: SOS protocols & emergency dispatch.

Ready for technical input.`
        : `Welcome, ${user?.phoneNumber || 'Citizen'}! 👋
I'm your **Universal AI Assistant** powered by Gemini. 

I can help with **Civic Issues** (roads, garbage, etc.) or answer **ANY** question you have about the world! 

What's on your mind?`,
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
  }, [isStaff, GEMINI_API_KEY]); 


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
              ? `✨ ${isStaff ? 'SECURE OPERATIONS LINE' : 'Citizen Helper'} via Gemini 1.5` 
              : `Ask me anything about ${isStaff ? 'infrastructure management' : 'civic maintenance'}.`}
          </p>
        </div>
        <div className={`glass px-4 py-2 rounded-md flex items-center gap-2 ${isStaff ? 'border-rose/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : ''}`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${isStaff ? 'bg-rose shadow-[0_0_10px_#f43f5e]' : 'bg-lime shadow-[0_0_10px_#a8f08a]'}`}></div>
          <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">
            {isStaff ? 'ENCRYPTED LINE' : 'Online'}
          </span>
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
                <div className={`w-8 h-8 rounded-md flex-shrink-0 flex items-center justify-center ${
                  msg.role === 'bot' 
                    ? (isStaff ? 'bg-rose/10 border border-rose/20' : 'bg-aqua/10 border border-aqua/20') 
                    : 'bg-violet/10 border border-violet/20'
                }`}>
                  {msg.role === 'bot' ? <Bot className={`w-4 h-4 ${isStaff ? 'text-rose' : 'text-aqua'}`} /> : <User className="w-4 h-4 text-violet" />}
                </div>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`glass p-4 rounded-md text-sm leading-relaxed markdown-content ${
                    msg.role === 'user' 
                      ? 'bg-violet/10 border-violet/20' 
                      : (isStaff ? 'bg-rose/5 border-rose/10' : 'bg-white/5 border-white/5')
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
              {isStaff ? (
                <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose/40" />
              ) : (
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-aqua/40" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={GEMINI_API_KEY 
                  ? (isStaff ? "Consult Unit-01 on infrastructure, safety, or coordination..." : "Ask Gemini anything about your city...") 
                  : (isStaff ? "Technical queries, safety protocols, or resource planning..." : "Ask about roads, garbage, electricity, water...")}
                className={`glass-input pl-12 w-full ${isStaff ? 'border-rose/20 focus:border-rose/50 font-mono' : ''}`}
                disabled={isTyping}
              />
            </div>
            <Button type="submit" variant={isStaff ? 'outline' : 'primary'} className={`px-6 ${isStaff ? 'border-rose/50 text-rose hover:bg-rose/10' : ''}`} disabled={isTyping || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
