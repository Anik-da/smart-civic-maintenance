import { useState, useRef } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { MapPin, Send, Sparkles, ImagePlus, Loader2, Search, Bot, Clock } from 'lucide-react';
import { analyzeComplaintText } from '../lib/ai';
import { CitizenTracker } from './CitizenTracker';
import { AIChatBot } from './AIChatBot';

export function ComplaintSubmission({ user }) {
  const [activeTab, setActiveTab] = useState('report'); // 'report', 'track', 'ai'
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [aiUrgency, setAiUrgency] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [location, setLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignedTo, setAssignedTo] = useState('ADMIN');
  const [estimatedDays, setEstimatedDays] = useState(5);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const getLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          setLocation(coords);
          setIsLocating(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsLocating(false);
          alert("Could not get location. Using manual fallback.");
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleManualLocation = () => {
    const mockLat = 22.5726 + (Math.random() - 0.5) * 0.01;
    const mockLng = 88.3639 + (Math.random() - 0.5) * 0.01;
    setLocation({ lat: mockLat, lng: mockLng });
  };

  const handleEnhanceWithAI = async () => {
    if (!description || description.trim().length < 5) {
      alert("Please enter a basic description first.");
      return;
    }
    setIsEnhancing(true);
    try {
      const result = await analyzeComplaintText(description);
      if (result.structuredText) setDescription(result.structuredText);
      if (result.category) setCategory(result.category);
      if (result.urgency) setAiUrgency(result.urgency);
      if (result.assignedTo) setAssignedTo(result.assignedTo);
      if (result.estimatedDays) setEstimatedDays(result.estimatedDays);
    } catch (err) {
      console.error("AI Enhance Error:", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !location) {
      alert("Please provide an image and location.");
      return;
    }

    setIsSubmitting(true);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + estimatedDays);

    try {
      const storageRef = ref(storage, `complaints/${user.uid}/${Date.now()}_${image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, image);

      uploadTask.on('state_changed',
        (snapshot) => setProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        (error) => { 
          setIsSubmitting(false);
          alert("Upload failed.");
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          // Normalize phone to always store with +91 prefix
          const normalizedPhone = (() => {
            const raw = (user.phoneNumber || '').replace(/\s+/g, '');
            if (raw.startsWith('+91')) return raw;
            if (raw.startsWith('91') && raw.length > 10) return '+' + raw;
            if (/^\d{10}$/.test(raw)) return '+91' + raw;
            return raw;
          })();
          await addDoc(collection(db, 'complaints'), {
            userId: user.uid, 
            phone: normalizedPhone, 
            description,
            category: category || 'Uncategorized', 
            imageUrl: downloadURL,
            location, 
            status: 'Pending', 
            priority: aiUrgency || 'Unclassified',
            assignedTo: assignedTo,
            estimatedEndDate: endDate.toISOString(),
            createdAt: serverTimestamp()
          });

          await addDoc(collection(db, 'notifications'), {
            title: 'New Complaint Filed',
            message: `${category || 'General'}: ${description.substring(0, 50)}`,
            type: 'Info',
            status: 'Unread',
            createdAt: serverTimestamp(),
            userId: user.uid
          });

          setIsSubmitting(false);
          setIsSubmitted(true);
        }
      );
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-md w-full mx-auto py-8 animate-in zoom-in-95 duration-500">
        <Card title="SUBMISSION COMPLETE">
          <div className="flex flex-col items-center gap-8 py-8 px-4 text-center">
            <div className="w-24 h-24 rounded-full glass flex items-center justify-center border-aqua/30">
              <Send className="w-10 h-10 text-aqua" />
            </div>
            <h2 className="text-4xl font-display italic text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Success!</h2>
            <p className="text-sm text-slate-400">Your report has been logged and assigned for maintenance.</p>
            <div className="flex flex-col gap-3 w-full">
              <Button variant="primary" onClick={() => setIsSubmitted(false)}>LOG ANOTHER</Button>
              <Button variant="outline" onClick={() => { setIsSubmitted(false); setActiveTab('track'); }}>VIEW MY REPORTS</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div className="space-y-1">
          <span className="hero__kicker">Citizen Portal</span>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
            Smart <span className="text-aqua">Civic</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 glass p-1.5 rounded-2xl border-white/10 w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('report')}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'report' ? 'bg-aqua text-white shadow-lg shadow-aqua/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <MapPin className="w-3.5 h-3.5" /> REPORT
          </button>
          <button 
            onClick={() => setActiveTab('track')}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'track' ? 'bg-aqua text-white shadow-lg shadow-aqua/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Clock className="w-3.5 h-3.5" /> TRACK
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-aqua text-white shadow-lg shadow-aqua/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Bot className="w-3.5 h-3.5" /> AI CHAT
          </button>
        </div>
      </div>

      {activeTab === 'report' ? (
        <Card title="FILE NEW REPORT">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div 
              className="glass rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-white/10 border-dashed border-2 border-white/20 relative min-h-[200px] flex flex-col justify-center items-center overflow-hidden"
              onClick={() => fileInputRef.current.click()}
            >
              <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" capture="environment" />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <ImagePlus className="w-10 h-10 text-aqua mb-2" />
                  <p className="text-sm font-bold">Tap to add photo evidence</p>
                </>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black opacity-40 tracking-widest">DESCRIPTION</span>
                <button type="button" onClick={handleEnhanceWithAI} disabled={isEnhancing} className="text-aqua text-[10px] font-bold flex items-center gap-1">
                  {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI OPTIMIZE
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What issue are you seeing?"
                className="glass-textarea"
                required
              />
              {(category || aiUrgency) && (
                <div className="flex gap-2">
                  {category && <span className="glass-badge bg-violet/20 text-violet border-violet/30">{category}</span>}
                  {aiUrgency && <span className="glass-badge bg-amber/20 text-amber border-amber/30">{aiUrgency}</span>}
                </div>
              )}
            </div>

            <div className="glass p-5 rounded-2xl flex items-center justify-between border-white/5">
              <div className="flex items-center gap-3">
                <MapPin className={`w-5 h-5 ${location ? 'text-aqua' : 'opacity-20'}`} />
                <span className="text-xs font-bold">{location ? 'Location Locked' : 'GPS Required'}</span>
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={getLocation} variant="outline" size="sm" isLoading={isLocating}>AUTO GPS</Button>
                {!location && <Button type="button" onClick={handleManualLocation} variant="ghost" size="sm">MANUAL</Button>}
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full h-14" isLoading={isSubmitting}>
              SUBMIT COMPLAINT
            </Button>
          </form>
        </Card>
      ) : activeTab === 'track' ? (
        <CitizenTracker user={user} />
      ) : (
        <AIChatBot user={user} />
      )}
    </div>
  );
}
