import { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { X, Save, MessageSquare, User, Activity, ExternalLink } from 'lucide-react';

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

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High': return 'glass-badge--rose';
      case 'Medium': return 'glass-badge--amber';
      case 'Low': return 'glass-badge--aqua';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <Card className="w-full max-w-3xl relative animate-in zoom-in-95 duration-500" title="REPORT MANAGEMENT">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 glass p-2 rounded-full hover:bg-white/10 transition-all border-white/10 z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-4">
          {/* Details Section (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">TRANSMITTED CONTENT</span>
              <div className="glass p-5 rounded-2xl border-white/5 bg-white/5 text-sm leading-relaxed italic opacity-90">
                "{complaint.description}"
              </div>
            </div>
            
            {complaint.imageUrl && (
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">VISUAL EVIDENCE</span>
                  <a href={complaint.imageUrl} target="_blank" rel="noreferrer" className="text-[10px] text-aqua font-bold flex items-center gap-1 hover:underline">
                    VIEW FULLRES <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="rounded-2xl overflow-hidden glass border-white/10 group h-64 relative">
                  <img src={complaint.imageUrl} alt="Issue" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-4 left-4 flex gap-2">
                     <span className="glass-badge glass-badge--violet">{complaint.category}</span>
                     <span className={`glass-badge ${getPriorityBadge(complaint.priority)}`}>{complaint.priority}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions Section (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold opacity-30 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-3 h-3" /> CURRENT STATUS
              </label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="glass-input">
                <option value="Pending">Pending Audit</option>
                <option value="Dispatched">Unit Dispatched</option>
                <option value="In Progress">Actively Repairing</option>
                <option value="Resolved">Incident Resolved</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold opacity-30 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3 h-3" /> ASSIGNMENT
              </label>
              <input 
                type="text" placeholder="Assignee ID or Team"
                value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                className="glass-input"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold opacity-30 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> OPERATOR FEEDBACK
              </label>
              <textarea 
                placeholder="Log internal notes or messages..."
                value={feedback} onChange={(e) => setFeedback(e.target.value)}
                className="glass-textarea"
                style={{ minHeight: '140px' }}
              />
            </div>

            <div className="pt-2">
              <Button onClick={handleSave} isLoading={isSaving} variant="primary" className="w-full h-14">
                <Save className="w-4 h-4 mr-2" /> COMMIT CHANGES
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
