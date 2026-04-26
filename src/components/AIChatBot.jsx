import React, { useState, useRef, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Bot, Send, Sparkles, User, Loader2, Lightbulb, Wrench, MapPin, AlertTriangle } from 'lucide-react';

const CIVIC_KNOWLEDGE = {
  greetings: [
    "Hello! I'm your Smart Civic AI Assistant. I can help you with infrastructure issues, maintenance queries, and civic services. How can I help you today?",
  ],
  road: "**Road Maintenance:**\n\nFor road-related issues like potholes, cracks, or damaged surfaces:\n1. 📸 Take a clear photo of the damage\n2. 📍 Use the GPS locator in the Report section\n3. 📝 Describe the severity and exact location\n4. ⚡ Our AI will auto-classify the urgency\n\nTypical response time: **24-72 hours** for assessment, repairs scheduled within **1-2 weeks** for non-critical issues.",
  garbage: "**Garbage & Waste Management:**\n\nFor waste collection issues:\n1. Report overflowing bins or illegal dumping via the Report tab\n2. Include photos for faster verification\n3. Specify if it's hazardous waste (chemicals, medical waste)\n\n♻️ Regular collection schedule: Mon/Wed/Fri\n🚛 Bulk waste pickup: Submit request 48hrs in advance",
  electricity: "**Electrical Infrastructure:**\n\nFor electrical issues (streetlights, exposed wiring, power outages):\n1. ⚠️ **Do NOT touch** any exposed wiring — report immediately\n2. Use the **SOS button** for dangerous situations\n3. Note the pole number or transformer ID if visible\n\n⚡ Emergency electrical issues are prioritized within **4 hours**",
  water: "**Water Supply & Drainage:**\n\nFor water-related issues:\n1. 🚰 Broken pipes or leaks — report with exact location\n2. 🌊 Flooding or drainage blockage — include photos\n3. 💧 Water quality concerns — specify the nature of contamination\n\nWater emergencies get **priority response** within **2-6 hours**.",
  emergency: "**Emergency Services:**\n\n🆘 For life-threatening situations:\n1. Use the **red SOS button** at the bottom-right corner\n2. Your GPS location will be automatically shared\n3. Emergency responders will be notified immediately\n\n📞 You can also call: **112** (National Emergency) or **100** (Police)",
  status: "**Tracking Your Complaints:**\n\nGo to the **Dashboard** to:\n- View all submitted reports and their current status\n- See real-time updates on the map\n- Check complaint resolution progress\n\nStatus codes:\n- 🟡 **Pending** — Awaiting review\n- 🟣 **Dispatched** — Team assigned\n- 🔵 **In Progress** — Work underway\n- 🟢 **Resolved** — Issue fixed",
  about: "**About Smart Civic Maintenance:**\n\nThis is an AI-powered civic infrastructure management platform that enables citizens to:\n\n✅ Report maintenance issues with photos & GPS\n✅ Track repair progress in real-time on a live map\n✅ Get AI-powered complaint analysis and prioritization\n✅ Access emergency SOS services\n✅ Communicate with an AI assistant (that's me! 🤖)\n\nBuilt with ❤️ using React, Firebase, and Google Maps API."
};

function getAIResponse(message) {
  const lower = message.toLowerCase();
  
  if (lower.match(/^(hi|hello|hey|good morning|good evening|namaste)/)) {
    return CIVIC_KNOWLEDGE.greetings[0];
  }
  if (lower.match(/road|pothole|crack|street|highway|path|footpath|sidewalk/)) {
    return CIVIC_KNOWLEDGE.road;
  }
  if (lower.match(/garbage|waste|trash|dump|bin|clean|litter|rubbish/)) {
    return CIVIC_KNOWLEDGE.garbage;
  }
  if (lower.match(/electric|light|power|wire|pole|outage|streetlight|bulb/)) {
    return CIVIC_KNOWLEDGE.electricity;
  }
  if (lower.match(/water|pipe|drain|flood|leak|sewage|supply|tap/)) {
    return CIVIC_KNOWLEDGE.water;
  }
  if (lower.match(/emergency|sos|urgent|danger|accident|fire|help me/)) {
    return CIVIC_KNOWLEDGE.emergency;
  }
  if (lower.match(/status|track|complaint|report|progress|update|where|when/)) {
    return CIVIC_KNOWLEDGE.status;
  }
  if (lower.match(/about|what is|who|how does|features|purpose/)) {
    return CIVIC_KNOWLEDGE.about;
  }
  if (lower.match(/thank|thanks|ok|great|good/)) {
    return "You're welcome! 😊 Is there anything else I can help you with regarding civic maintenance?";
  }

  return `I understand you're asking about: **"${message}"**\n\nI can help you with the following civic maintenance topics:\n\n🛣️ **Road issues** — potholes, cracks, damaged surfaces\n🗑️ **Garbage** — waste collection, illegal dumping\n⚡ **Electricity** — streetlights, wiring, outages\n💧 **Water** — pipes, drainage, flooding\n🆘 **Emergency** — SOS services, urgent help\n📊 **Status** — track your complaints\nℹ️ **About** — platform features\n\nTry asking about any of these topics!`;
}

export function AIChatBot({ user }) {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: `Welcome, ${user?.phoneNumber || 'Citizen'}! 👋\n\nI'm your **Smart Civic AI Assistant**. I can help you with:\n\n🛣️ Road & infrastructure issues\n🗑️ Waste management queries\n⚡ Electrical complaints\n💧 Water & drainage problems\n🆘 Emergency guidance\n📊 Complaint tracking help\n\nWhat would you like to know?`,
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

    // Simulate AI thinking delay
    setTimeout(() => {
      const response = getAIResponse(userMessage.content);
      setMessages(prev => [...prev, { role: 'bot', content: response, time: new Date() }]);
      setIsTyping(false);
    }, 800 + Math.random() * 1200);
  };

  const quickActions = [
    { label: 'Road Issue', icon: <Wrench className="w-3 h-3" />, msg: 'How do I report a road pothole?' },
    { label: 'Track Status', icon: <MapPin className="w-3 h-3" />, msg: 'How do I track my complaint status?' },
    { label: 'Emergency', icon: <AlertTriangle className="w-3 h-3" />, msg: 'How do I use emergency services?' },
    { label: 'About', icon: <Lightbulb className="w-3 h-3" />, msg: 'What is Smart Civic Maintenance?' },
  ];

  const handleQuickAction = (msg) => {
    setInput(msg);
    setTimeout(() => {
      inputRef.current?.form?.requestSubmit();
    }, 50);
  };

  return (
    <div className="max-w-3xl mx-auto w-full animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <span className="hero__kicker">AI-Powered Assistance</span>
          <h1 className="hero__title" style={{ fontSize: '2.5rem', textAlign: 'left', marginBottom: 0 }}>
            Civic AI Bot
          </h1>
          <p className="text-slate-400 text-sm mt-2">Ask me anything about civic maintenance, report issues, or get help.</p>
        </div>
        <div className="glass px-4 py-2 rounded-2xl flex items-center gap-2">
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
                <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${msg.role === 'bot' ? 'bg-aqua/10 border border-aqua/20' : 'bg-violet/10 border border-violet/20'}`}>
                  {msg.role === 'bot' ? <Bot className="w-4 h-4 text-aqua" /> : <User className="w-4 h-4 text-violet" />}
                </div>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`glass p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-violet/10 border-violet/20 rounded-tr-md' : 'bg-white/5 border-white/5 rounded-tl-md'}`}>
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
                <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center bg-aqua/10 border border-aqua/20">
                  <Bot className="w-4 h-4 text-aqua" />
                </div>
                <div className="glass p-4 rounded-2xl rounded-tl-md bg-white/5 border-white/5">
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
                placeholder="Ask about roads, garbage, electricity, water..."
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
