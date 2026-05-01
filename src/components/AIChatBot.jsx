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
  greet: "Greetings! I am **Smart Civic AI**, your specialized urban maintenance assistant. I'm currently operating in a secure offline mode, but I can still guide you through reporting infrastructure issues. How can I help you improve our city today? 🏙️",
  road: "### 🛣️ Road & Infrastructure\n\nTo report potholes, damaged pavements, or road obstructions:\n1. Go to the **REPORT** tab.\n2. Upload a clear photo of the damage.\n3. Use 'AUTO GPS' to lock the exact coordinates.\n\nOur road maintenance units usually respond within 48-72 hours.",
  garbage: "### 🗑️ Sanitation & Waste\n\nFor missed garbage collection or public litter issues:\n- File a report under the **Sanitation** category.\n- Providing a photo helps our crews bring the right equipment.\n- You can track the cleanup status in the **TRACK** tab.",
  electricity: "### ⚡ Power & Street Lighting\n\nIf you see broken streetlights or exposed wiring:\n- **Safety First:** Do not approach damaged electrical infrastructure.\n- Report it immediately in the **REPORT** tab.\n- For widespread blackouts, please contact the City Power Grid helpdesk.",
  water: "### 🚰 Water & Sewage\n\nFor water leaks, burst pipes, or drainage issues:\n- Select the **Water/Sewage** category when reporting.\n- Note if the leak is causing road damage or flooding.\n- Emergency repairs are prioritized by our central dispatch.",
  tracking: "### 🔍 Tracking Your Reports\n\nYou can monitor your reported issues in real-time:\n1. Switch to the **TRACK** tab at the top of this page.\n2. All reports associated with your phone number (**user.phoneNumber**) will appear there.\n3. You'll see status updates, assigned personnel, and estimated completion dates.",
  emergency: "### 🆘 Emergency Protocol\n\n**If this is a life-threatening situation (fire, gas leak, building collapse):**\n- Use the red **SOS** button on the home screen immediately.\n- This alerts all emergency services and shares your live location with first responders.",
  default: "I am currently in limited offline mode. I can help with issues related to **roads**, **garbage**, **electricity**, **water**, or **tracking** your complaints. Please specify the issue you'd like to report.",
};

function getLocalResponse(message) {
  const lower = message.toLowerCase();
  if (lower.match(/^(hi|hello|hey|good|namaste|greetings)/)) return FALLBACK_RESPONSES.greet;
  if (lower.match(/road|pothole|crack|street|pavement|highway/)) return FALLBACK_RESPONSES.road;
  if (lower.match(/garbage|waste|trash|dump|bin|litter|sanitation|smell|clean/)) return FALLBACK_RESPONSES.garbage;
  if (lower.match(/electric|light|power|wire|outage|dark|transformer/)) return FALLBACK_RESPONSES.electricity;
  if (lower.match(/water|leak|pipe|drain|sewage|flood|overflow/)) return FALLBACK_RESPONSES.water;
  if (lower.match(/track|status|check|progress|where|report|my cases/)) return FALLBACK_RESPONSES.tracking;
  if (lower.match(/emergency|sos|urgent|danger|accident|fire|help/)) return FALLBACK_RESPONSES.emergency;
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
    { label: 'Roads', icon: <Wrench className="w-3 h-3" />, msg: 'Tell me about road maintenance and reporting potholes.' },
    { label: 'Sanitation', icon: <Bot className="w-3 h-3" />, msg: 'How does garbage collection and sanitation reporting work?' },
    { label: 'Tracking', icon: <Search className="w-3 h-3" />, msg: 'How can I track the status of my reported issues?' },
    { label: 'Emergency', icon: <AlertTriangle className="w-3 h-3" />, msg: 'What should I do in case of a maintenance emergency?' },
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
          <Link to="/track" className="glass px-4 py-2 rounded-md flex items-center gap-2 hover:border-aqua/50 transition-all text-aqua/80 hover:text-aqua">
            <Search className="w-3 h-3" />
            <span className="text-[10px] font-bold tracking-widest uppercase">
              Track Status
            </span>
          </Link>

          <div className="glass px-4 py-2 rounded-md flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse bg-lime shadow-[0_0_10px_#a8f08a]"></div>
            <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">
              Online
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {quickActions.map((action, i) => (
          <button
            key={i}
            onClick={() => handleQuickAction(action.msg)}
            className="glass p-4 rounded-md flex flex-col items-center gap-2 hover:border-aqua/50 transition-all group text-center"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-aqua/60 group-hover:text-aqua transition-colors">
              {action.icon}
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase opacity-60 group-hover:opacity-100 transition-opacity">
              {action.label}
            </span>
          </button>
        ))}
      </div>

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
