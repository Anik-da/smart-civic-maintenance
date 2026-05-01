import { useState, useMemo, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { X, Save, MessageSquare, User, Activity, ExternalLink, Search, Check, AlertTriangle } from 'lucide-react';

export function ComplaintModal({ complaint, onClose, staff = [], userRole }) {
  const [status, setStatus] = useState(complaint?.status || 'Pending');
  const [assignedTo, setAssignedTo] = useState(complaint?.assignedTo || '');
  const [selectedDept, setSelectedDept] = useState(complaint?.assignedDept || '');
  const [feedback, setFeedback] = useState(complaint?.operatorFeedback || '');
  const [isSaving, setIsSaving] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStaffDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!complaint) return null;

  const filteredStaff = useMemo(() => {
    const search = staffSearch.toLowerCase();
    const category = complaint.category?.toUpperCase() || '';
    
    return staff
      .filter(s => {
        const nameMatch = (s.name || '').toLowerCase().includes(search);
        const deptMatch = (s.department || '').toLowerCase().includes(search);
        return nameMatch || deptMatch;
      })
      .sort((a, b) => {
        // Prioritize staff in matching department
        const aMatch = a.department?.toUpperCase() === category ? 1 : 0;
        const bMatch = b.department?.toUpperCase() === category ? 1 : 0;
        return bMatch - aMatch;
      });
  }, [staff, staffSearch, complaint.category]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const collectionName = complaint.collectionName || 'complaints';
      const complaintRef = doc(db, collectionName, complaint.id);
      await updateDoc(complaintRef, {
        status, 
        assignedTo, 
        assignedDept: selectedDept,
        operatorFeedback: feedback, 
        updatedAt: new Date()
      });
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
      <Card className="w-full max-w-4xl relative animate-in zoom-in-95 duration-500 overflow-visible" title="INCIDENT CONTROL CENTER">
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
                <div className="rounded-2xl overflow-hidden glass border-white/10 group h-80 relative">
                  <img src={complaint.imageUrl} alt="Issue" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-4 left-4 flex gap-2">
                     <span className="glass-badge glass-badge--violet">{complaint.category}</span>
                     <span className={`glass-badge ${getPriorityBadge(complaint.priority)}`}>{complaint.priority} Priority</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">SUBMITTED BY</span>
                <span className="text-xs font-black text-aqua">{complaint.userName || 'Anonymous'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">LOCATION REF</span>
                <span className="text-xs font-black text-violet">
                  {typeof complaint.location?.lat === 'number' ? complaint.location.lat.toFixed(4) : 'N/A'}, 
                  {typeof complaint.location?.lng === 'number' ? complaint.location.lng.toFixed(4) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Section (2 cols) */}
          <div className="lg:col-span-2 space-y-6 border-l border-white/5 pl-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold opacity-30 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-3 h-3 text-aqua" /> MANAGEMENT STATUS
              </label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="glass-input">
                <option value="Pending">Pending Audit</option>
                <option value="Dispatched">Unit Dispatched</option>
                <option value="In Progress">Actively Repairing</option>
                <option value="Resolved">Incident Resolved</option>
              </select>
            </div>

            <div className="space-y-2 relative" ref={dropdownRef}>
              <label className="text-[10px] font-bold opacity-30 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3 h-3 text-violet" /> PERSONNEL ASSIGNMENT
              </label>
              
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search staff or type name..."
                  value={showStaffDropdown ? staffSearch : (assignedTo || '')} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setStaffSearch(val);
                    setAssignedTo(val);
                    setSelectedDept(''); // Clear department for manual entries
                    if (!showStaffDropdown) setShowStaffDropdown(true);
                  }}
                  onFocus={() => {
                    setStaffSearch(assignedTo || '');
                    setShowStaffDropdown(true);
                  }}
                  className="glass-input pr-10 focus:ring-2 focus:ring-violet/20"
                />
                <button 
                  type="button"
                  onClick={() => {
                    if (!showStaffDropdown) setStaffSearch(assignedTo || '');
                    setShowStaffDropdown(!showStaffDropdown);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded-md transition-all"
                >
                  <Search className={`w-3.5 h-3.5 transition-opacity ${showStaffDropdown ? 'opacity-100 text-violet' : 'opacity-20'}`} />
                </button>
              </div>

              {showStaffDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 glass-card p-2 bg-black/90 backdrop-blur-2xl border-white/10 z-[210] max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-300 shadow-2xl">
                  {filteredStaff.length > 0 ? (
                    filteredStaff.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onMouseDown={(e) => {
                          // Prevent input onBlur from closing dropdown before click
                          e.preventDefault();
                          setAssignedTo(s.name || '');
                          setSelectedDept(s.department || '');
                          setStaffSearch(s.name || '');
                          setShowStaffDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all text-left group ${assignedTo === s.name ? 'bg-violet/10 border border-violet/20' : ''}`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase group-hover:text-violet transition-colors">{s.name}</span>
                          <span className="text-[9px] opacity-40 font-bold tracking-wider">{s.department} • {s.role}</span>
                        </div>
                        {assignedTo === s.name && <Check className="w-3 h-3 text-violet" />}
                        {(s.department?.toUpperCase() === complaint.category?.toUpperCase()) && (
                          <span className="text-[7px] bg-violet/20 text-violet px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">DEPT MATCH</span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center opacity-30 text-[10px] font-bold uppercase tracking-widest">No matching personnel</div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold opacity-30 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-3 h-3 text-amber" /> LOGISTICAL FEEDBACK
              </label>
              <textarea 
                placeholder="Log internal notes or dispatch messages..."
                value={feedback} onChange={(e) => setFeedback(e.target.value)}
                className="glass-textarea"
                style={{ minHeight: '120px' }}
              />
            </div>

            {complaint.priority === 'High' && status === 'Pending' && (
              <div className="p-3 bg-rose/10 border border-rose/20 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-rose shrink-0 mt-0.5" />
                <p className="text-[10px] text-rose/80 font-bold leading-tight">CRITICAL: High priority incident requires immediate dispatch and personnel assignment.</p>
              </div>
            )}

            <div className="pt-2">
              <Button onClick={handleSave} isLoading={isSaving} variant="primary" className="w-full h-14 shadow-lg shadow-aqua/10">
                <Save className="w-4 h-4 mr-2" /> EXECUTE UPDATE
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
