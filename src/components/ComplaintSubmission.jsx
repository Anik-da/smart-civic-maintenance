import React, { useState, useRef } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { MapPin, Camera, Send, Sparkles, ImagePlus } from 'lucide-react';
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
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [progress, setProgress] = useState(0);
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
          setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not get your location. Please ensure location services are enabled.");
          setIsLocating(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
      setIsLocating(false);
    }
  };

  const handleEnhanceWithAI = async () => {
    if (!description || description.trim().length < 5) {
      alert("Please enter a basic description first (at least 5 characters).");
      return;
    }
    setIsEnhancing(true);
    try {
      const result = await analyzeComplaintText(description);
      if (result.structuredText) setDescription(result.structuredText);
      if (result.category) setCategory(result.category);
      if (result.urgency) setAiUrgency(result.urgency);
    } catch (err) {
      console.error(err);
      alert("AI Enhancement failed. " + err.message);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) { alert("Please upload an image of the issue."); return; }
    if (!location) { alert("Please provide the GPS location of the issue."); return; }

    setIsSubmitting(true);
    try {
      const storageRef = ref(storage, `complaints/${user.uid}/${Date.now()}_${image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, image);

      uploadTask.on('state_changed',
        (snapshot) => setProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        (error) => { console.error("Upload error:", error); setIsSubmitting(false); alert("Image upload failed."); },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await addDoc(collection(db, 'complaints'), {
            userId: user.uid, phone: user.phoneNumber, description,
            category: category || 'Uncategorized', imageUrl: downloadURL,
            location, status: 'Pending', priority: aiUrgency || 'Unclassified',
            createdAt: serverTimestamp()
          });
          setDescription(''); setCategory(''); setAiUrgency('');
          setImage(null); setImagePreview(''); setLocation(null);
          setProgress(0); setIsSubmitting(false);
          alert("Complaint submitted successfully!");
        }
      );
    } catch (error) {
      console.error("Submission error:", error);
      setIsSubmitting(false);
      alert("Failed to submit complaint.");
    }
  };

  return (
    <Card className="max-w-xl w-full mx-auto" title="Report an Issue">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Image Upload */}
        <div 
          className="border-2 border-dashed border-purple-500/20 rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-purple-500/40 hover:bg-purple-500/5 relative min-h-[180px] flex flex-col justify-center items-center overflow-hidden group"
          onClick={() => fileInputRef.current.click()}
        >
          <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" capture="environment" />
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ImagePlus className="w-7 h-7 text-purple-400" />
              </div>
              <p className="text-sm font-medium text-slate-400">Tap to take a photo or upload</p>
              <p className="text-xs text-slate-500 mt-1">JPG, PNG up to 10MB</p>
            </>
          )}
        </div>

        {/* Description + AI */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-purple-300 ml-1">Description</label>
            <Button type="button" onClick={handleEnhanceWithAI} variant="default" isLoading={isEnhancing} className="py-1.5 px-3 text-xs rounded-xl">
              <Sparkles className="w-3 h-3 text-purple-400" />
              AI Enhance
            </Button>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue (e.g. huge pothole near main road, cars swerving)"
            className="w-full px-5 py-4 rounded-2xl text-base text-white placeholder-slate-500 bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 resize-none h-28 transition-all"
            required
          />
          {(category || aiUrgency) && (
            <div className="flex gap-2 mt-1">
              {category && <span className="px-3 py-1 bg-purple-500/15 text-purple-300 text-xs rounded-full font-semibold capitalize border border-purple-500/20">📂 {category}</span>}
              {aiUrgency && <span className="px-3 py-1 bg-blue-500/15 text-blue-300 text-xs rounded-full font-semibold border border-blue-500/20">⚡ {aiUrgency}</span>}
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/3 border border-white/5">
          <Button type="button" onClick={getLocation} variant="default" isLoading={isLocating}>
            <MapPin className="w-4 h-4 text-purple-400" />
            {location ? '✅ Location Captured' : 'Get GPS Location'}
          </Button>
          {location && (
            <span className="text-xs text-emerald-400 font-mono truncate flex-1">
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </span>
          )}
        </div>

        {/* Progress */}
        {isSubmitting && (
          <div className="h-2 rounded-full overflow-hidden bg-white/5">
            <div className="h-full rounded-full progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        {/* Submit */}
        <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>
          <Send className="w-4 h-4" />
          Submit Complaint
        </Button>
      </form>
    </Card>
  );
}
