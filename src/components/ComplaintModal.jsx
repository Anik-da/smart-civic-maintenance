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
      const updates = {
        status,
        assignedTo,
        operatorFeedback: feedback,
        updatedAt: new Date()
      };
      
      await updateDoc(complaintRef, updates);
      alert('Complaint updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating complaint:', error);
      alert('Failed to update complaint.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <Card className="w-full max-w-2xl relative my-8 animate-in fade-in zoom-in" title="Manage Complaint">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Details Column */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Original Report</h3>
              <p className="text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg text-sm">
                {complaint.description}
              </p>
            </div>
            
            {complaint.imageUrl && (
              <div>
                 <a href={complaint.imageUrl} target="_blank" rel="noreferrer">
                  <img 
                    src={complaint.imageUrl} 
                    alt="Issue" 
                    className="w-full h-40 object-cover rounded-xl neu-raised-sm" 
                  />
                </a>
              </div>
            )}

            <div className="flex gap-2 text-sm">
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full capitalize font-medium">
                {complaint.category || 'Uncategorized'}
              </span>
              <span className={`px-2 py-1 rounded-full font-medium ${
                complaint.priority === 'High' ? 'bg-red-100 text-red-800' :
                complaint.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {complaint.priority || 'Low'}
              </span>
            </div>
          </div>

          {/* Action Column */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Activity className="w-4 h-4" />
                Status
              </label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 rounded-xl text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              >
                <option value="Pending">Pending</option>
                <option value="Dispatched">Dispatched</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <User className="w-4 h-4" />
                Assign To
              </label>
              <input 
                type="text"
                placeholder="e.g. Team Alpha, John Doe"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-4 py-2 rounded-xl text-sm neu-inset focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <MessageSquare className="w-4 h-4" />
                Feedback to User
              </label>
              <textarea 
                placeholder="Message the reporter (they will receive a push notification)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-4 py-2 rounded-xl text-sm neu-inset focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none h-24"
              />
            </div>

            <Button onClick={handleSave} isLoading={isSaving} variant="primary" className="w-full">
              <Save className="w-4 h-4" />
              Save Updates
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
