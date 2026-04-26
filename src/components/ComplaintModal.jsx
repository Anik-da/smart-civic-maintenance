import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { X, Save, MessageSquare, User, Activity } from 'lucide-react';

export function ComplaintModal({ complaint, onClose }) {
  const [status, setStatus] = useState(complaint.status || 'Pending');
  const [assignedTo, setAssignedTo] = useState(complaint.assignedTo || '');
  const [feedback, setFeedback] = useState(complaint.operatorFeedback || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!complaint) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const complaintRef = doc(db, 'complaints', complaint.id);
      await updateDoc(complaintRef, {
        status, assignedTo, operatorFeedback: feedback, updatedAt: new Date()
      });
      alert('Complaint updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating complaint:', error);
      alert('Failed to update complaint.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectClasses = "w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all";
  const inputClasses = "w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <Card className="w-full max-w-2xl relative my-8" title="Manage Complaint">
        <button 
          onClick={onClose}
          className="absolute top-7 right-7 text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Original Report</h3>
              <p className="text-slate-200 bg-white/5 border border-white/5 p-4 rounded-xl text-sm leading-relaxed">
                {complaint.description}
              </p>
            </div>
            
            {complaint.imageUrl && (
              <a href={complaint.imageUrl} target="_blank" rel="noreferrer">
                <img src={complaint.imageUrl} alt="Issue" className="w-full h-40 object-cover rounded-xl border border-white/10 hover:border-purple-500/30 transition-all" />
              </a>
            )}

            <div className="flex gap-2 text-sm">
              <span className="px-3 py-1 bg-purple-500/15 text-purple-300 rounded-full capitalize font-semibold border border-purple-500/20 text-xs">
                {complaint.category || 'Uncategorized'}
              </span>
              <span className={`px-3 py-1 rounded-full font-semibold border text-xs ${
                complaint.priority === 'High' ? 'bg-red-500/15 text-red-300 border-red-500/20' :
                complaint.priority === 'Medium' ? 'bg-amber-500/15 text-amber-300 border-amber-500/20' :
                'bg-blue-500/15 text-blue-300 border-blue-500/20'
              }`}>
                {complaint.priority || 'Low'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5" /> Status
              </label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClasses}>
                <option value="Pending">Pending</option>
                <option value="Dispatched">Dispatched</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <User className="w-3.5 h-3.5" /> Assign To
              </label>
              <input 
                type="text" placeholder="e.g. Team Alpha, John Doe"
                value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                className={inputClasses}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <MessageSquare className="w-3.5 h-3.5" /> Feedback to User
              </label>
              <textarea 
                placeholder="Message the reporter (they will receive a push notification)"
                value={feedback} onChange={(e) => setFeedback(e.target.value)}
                className={`${inputClasses} resize-none h-24`}
              />
            </div>

            <Button onClick={handleSave} isLoading={isSaving} variant="primary" className="w-full">
              <Save className="w-4 h-4" /> Save Updates
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
