import React, { useState, useRef } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { MapPin, Camera, Send, Sparkles } from 'lucide-react';
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
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
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
    if (!image) {
      alert("Please upload an image of the issue.");
      return;
    }
    if (!location) {
      alert("Please provide the GPS location of the issue.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload Image
      const storageRef = ref(storage, `complaints/${user.uid}/${Date.now()}_${image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, image);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          setIsSubmitting(false);
          alert("Image upload failed.");
        },
        async () => {
          // 2. Get Download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // 3. Save to Firestore
          await addDoc(collection(db, 'complaints'), {
            userId: user.uid,
            phone: user.phoneNumber,
            description,
            category: category || 'Uncategorized',
            imageUrl: downloadURL,
            location,
            status: 'Pending',
            priority: aiUrgency || 'Unclassified', // Use AI suggested or fallback
            createdAt: serverTimestamp()
          });

          // Reset Form
          setDescription('');
          setCategory('');
          setAiUrgency('');
          setImage(null);
          setImagePreview('');
          setLocation(null);
          setProgress(0);
          setIsSubmitting(false);
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
        
        {/* Image Upload Area */}
        <div 
          className="border-2 border-dashed border-purple-300 dark:border-purple-700/50 rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-purple-500 neu-inset bg-transparent relative min-h-[200px] flex flex-col justify-center items-center overflow-hidden"
          onClick={() => fileInputRef.current.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            className="hidden" 
            accept="image/*"
            capture="environment"
          />
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 neu-raised">
                <Camera className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Tap to take a photo or upload</p>
            </>
          )}
        </div>

        {/* Description & AI Enhance */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Description</label>
            <Button type="button" onClick={handleEnhanceWithAI} variant="default" isLoading={isEnhancing} className="py-1 px-3 text-xs">
              <Sparkles className="w-3 h-3 text-purple-500" />
              AI Enhance
            </Button>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue (e.g. huge hole in street cars swerving)"
            className="w-full px-4 py-3 rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none neu-inset bg-transparent h-24"
            required
          />
          {(category || aiUrgency) && (
            <div className="flex gap-2 mt-1">
              {category && <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium capitalize">Category: {category}</span>}
              {aiUrgency && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">Urgency: {aiUrgency}</span>}
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-4 p-4 rounded-xl neu-flat">
          <Button type="button" onClick={getLocation} variant="default" isLoading={isLocating}>
            <MapPin className="w-4 h-4 text-purple-500" />
            {location ? 'Location Captured' : 'Get GPS Location'}
          </Button>
          {location && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium truncate flex-1">
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {isSubmitting && (
          <div className="h-2 rounded-full overflow-hidden neu-inset">
            <div className="h-full rounded-full progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        {/* Submit Button */}
        <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>
          <Send className="w-4 h-4" />
          Submit Complaint
        </Button>
      </form>
    </Card>
  );
}
