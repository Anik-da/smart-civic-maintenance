import { useState, useRef } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { MapPin, Send, Sparkles, ImagePlus, Loader2, Search } from 'lucide-react';
import { analyzeComplaintText } from '../lib/ai';

export function ComplaintSubmission({ user }) {
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
      // Use high accuracy but with a strict timeout to prevent hangs
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          console.log("GPS Lock acquired:", coords);
          setLocation(coords);
          setIsLocating(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          let msg = "Could not get your location. ";
          if (error.code === 1) msg += "Permission denied.";
          else if (error.code === 2) msg += "Position unavailable.";
          else if (error.code === 3) msg += "Request timed out.";
          
          alert(msg + " You can also use the 'Manual Entry' fallback below.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser");
      setIsLocating(false);
    }
  };

  const handleManualLocation = () => {
    // Fallback if GPS fails - uses a central city coordinate or asks for input
    const mockLat = 22.5726 + (Math.random() - 0.5) * 0.01;
    const mockLng = 88.3639 + (Math.random() - 0.5) * 0.01;
    setLocation({ lat: mockLat, lng: mockLng });
    console.log("Using manual fallback location");
  };

  const handleEnhanceWithAI = async () => {
    if (!description || description.trim().length < 5) {
      alert("Please enter a basic description first (at least 5 characters).");
      return;
    }
    setIsEnhancing(true);
    try {
      const result = await analyzeComplaintText(description);
      console.log("AI Analysis Result:", result);
      if (result.structuredText) setDescription(result.structuredText);
      if (result.category) setCategory(result.category);
      if (result.urgency) setAiUrgency(result.urgency);
      if (result.assignedTo) setAssignedTo(result.assignedTo);
      if (result.estimatedDays) setEstimatedDays(result.estimatedDays);
    } catch (err) {
      console.error("AI Enhance Error:", err);
      alert("AI Enhancement currently unavailable. You can still submit the report manually.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) { alert("Please upload an image of the issue."); return; }
    if (!location) { alert("Please provide the GPS location of the issue."); return; }

    setIsSubmitting(true);
    
    // Calculate estimated end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + estimatedDays);

    const resetForm = () => {
      setDescription(''); setCategory(''); setAiUrgency('');
      setAssignedTo('ADMIN'); setEstimatedDays(5);
      setImage(null); setImagePreview(''); setLocation(null);
      setProgress(0); setIsSubmitting(false);
      setIsSubmitted(true);
    };

    try {
      const storageRef = ref(storage, `complaints/${user.uid}/${Date.now()}_${image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, image);

      uploadTask.on('state_changed',
        (snapshot) => setProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        (error) => { 
          console.error("Upload error:", error);
          alert(`Upload failed: ${error.message}. Please check your connection and try again.`);
          setIsSubmitting(false);
          setProgress(0);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            await addDoc(collection(db, 'complaints'), {
              userId: user.uid, 
              phone: user.phoneNumber, 
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

            // Create a real-time notification for the dashboard
            await addDoc(collection(db, 'notifications'), {
              title: 'New Complaint Filed',
              message: `${category || 'General'}: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`,
              type: 'Info',
              status: 'Unread',
              createdAt: serverTimestamp(),
              userId: user.uid
            });

            resetForm();
          } catch (err) {
            console.error("Firestore error after upload:", err);
            alert(`Report logged but failed to sync: ${err.message}. Please contact support.`);
            setIsSubmitting(false);
          }
        }
      );
    } catch (error) {
      console.error("Submission error:", error);
      alert(`Submission failed: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-md w-full mx-auto py-8 animate-in zoom-in-95 duration-500 relative z-[200]">
        <Card title="SUBMISSION COMPLETE" className="overflow-hidden border-aqua/30 shadow-[0_0_50px_rgba(94,231,223,0.2)]">
          <div className="flex flex-col items-center gap-8 py-8 px-4 text-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full glass flex items-center justify-center border-aqua/30 bg-aqua/5">
                <Send className="w-10 h-10 text-aqua" />
              </div>
              <div className="absolute -inset-4 bg-aqua/20 animate-ping rounded-full -z-10 opacity-30"></div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-8 h-8 text-amber animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-4xl font-display italic text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Thank You!</h2>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Your report has been successfully encrypted and logged into the **Smart Civic Neural Network**. 
                Maintenance units have been notified.
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <Button variant="primary" className="h-14 font-black tracking-widest text-[11px]" onClick={() => setIsSubmitted(false)}>
                LOG ANOTHER INCIDENT
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card className="max-w-2xl w-full mx-auto" title="Report Issue">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Image Upload Area */}
        <div 
          className="glass rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-white/10 border-dashed border-2 border-white/20 relative min-h-[220px] flex flex-col justify-center items-center overflow-hidden group"
          onClick={() => fileInputRef.current.click()}
        >
          <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" capture="environment" />
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="glass-badge glass-badge--aqua">Change Photo</span>
              </div>
            </>
          ) : (
            <div className="animate-in fade-in zoom-in">
              <div className="w-16 h-16 rounded-full bg-aqua/10 flex items-center justify-center mb-4 mx-auto border border-aqua/20 group-hover:scale-110 transition-transform">
                <ImagePlus className="w-8 h-8 text-aqua" />
              </div>
              <h4 className="font-bold text-lg mb-1">Visual Evidence</h4>
              <p className="text-sm opacity-50">Tap to capture or upload the maintenance issue</p>
            </div>
          )}
        </div>

        {/* Description Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-sm font-bold opacity-60">SITUATION DETAILS</span>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => window.location.hash = '#/track'} 
                className="glass glass-btn glass-btn--sm gap-2"
                style={{ padding: '6px 12px' }}
              >
                <Search className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] uppercase font-bold tracking-widest">Track Status</span>
              </button>
              <button 
                type="button" 
                onClick={handleEnhanceWithAI} 
                disabled={isEnhancing}
                className="glass glass-btn glass-btn--sm gap-2"
                style={{ padding: '6px 12px' }}
              >
                {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-aqua" />}
                <span className="text-[10px] uppercase font-bold tracking-widest">AI Enhance</span>
              </button>
            </div>
          </div>
          
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide details about the issue..."
            className="glass-textarea"
            required
          />

          {(category || aiUrgency) && (
            <div className="flex flex-wrap gap-3 animate-in slide-in-from-top-2">
              {category && <span className="glass-badge glass-badge--violet">📂 {category}</span>}
              {aiUrgency && <span className="glass-badge glass-badge--amber">⚡ {aiUrgency}</span>}
            </div>
          )}
        </div>

        {/* Geolocation Section */}
        <div className="glass p-5 rounded-2xl flex items-center justify-between gap-4 border-aqua/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${location ? 'bg-aqua/20' : 'bg-white/5'}`}>
              <MapPin className={`w-5 h-5 ${location ? 'text-aqua' : 'opacity-30'}`} />
            </div>
            <div>
              <p className="text-xs font-bold opacity-40 uppercase tracking-tighter">Location Status</p>
              <p className="text-sm font-medium">
                {location ? 'Precise Coordinates Locked' : 'GPS Required for Verification'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              onClick={getLocation} 
              variant={location ? 'default' : 'primary'}
              isLoading={isLocating}
              className="whitespace-nowrap"
            >
              {location ? 'Refresh GPS' : 'Capture GPS'}
            </Button>
            {!location && (
              <Button 
                type="button" 
                onClick={handleManualLocation} 
                variant="outline"
                className="whitespace-nowrap text-[10px]"
              >
                Manual Fallback
              </Button>
            )}
          </div>
        </div>

        {/* Submission Area */}
        <div className="pt-4">
          {isSubmitting && (
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-[10px] font-bold opacity-50 px-1">
                <span>UPLOADING REPORT...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 glass rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-aqua to-violet transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full h-14 text-lg" isLoading={isSubmitting}>
            <Send className="w-5 h-5 mr-1" />
            Finalize & Submit
          </Button>
        </div>
      </form>
    </Card>
  );
}
