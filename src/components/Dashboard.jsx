import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Card } from './ui/Card';
import { MapPin, AlertCircle, Clock, CheckCircle, List, Map } from 'lucide-react';
import { DashboardMap } from './DashboardMap';
import { ComplaintModal } from './ComplaintModal';

export function Dashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  
  // Filters
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const issues = [];
      querySnapshot.forEach((doc) => {
        issues.push({ id: doc.id, ...doc.data() });
      });
      setComplaints(issues);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const catMatch = filterCategory === 'All' || (c.category && c.category.toLowerCase() === filterCategory.toLowerCase());
      const prioMatch = filterPriority === 'All' || c.priority === filterPriority;
      return catMatch && prioMatch;
    });
  }, [complaints, filterCategory, filterPriority]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-700 bg-red-100 dark:bg-red-900/50 dark:text-red-300';
      case 'Medium': return 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'Low': return 'text-blue-700 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300';
      default: return 'text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <Card className="w-full max-w-7xl mx-auto" title="Operator Dashboard">
      
      {/* Controls: View Toggle and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex gap-2 p-1 rounded-xl neu-inset">
          <button 
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'list' ? 'neu-raised text-purple-600' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            <List className="w-4 h-4" /> List
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'map' ? 'neu-raised text-purple-600' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            <Map className="w-4 h-4" /> Map
          </button>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)}
            className="px-4 py-2 rounded-xl text-sm neu-inset bg-transparent outline-none focus:ring-2 focus:ring-purple-500 text-gray-700 dark:text-gray-200"
          >
            <option value="All">All Categories</option>
            <option value="road">Road</option>
            <option value="garbage">Garbage</option>
            <option value="electricity">Electricity</option>
            <option value="accident">Accident</option>
            <option value="other">Other</option>
          </select>

          <select 
            value={filterPriority} 
            onChange={e => setFilterPriority(e.target.value)}
            className="px-4 py-2 rounded-xl text-sm neu-inset bg-transparent outline-none focus:ring-2 focus:ring-purple-500 text-gray-700 dark:text-gray-200"
          >
            <option value="All">All Urgencies</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="overflow-x-auto rounded-xl neu-inset">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Image</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Description</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Priority</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Assignee</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">Loading complaints...</td></tr>
              ) : filteredComplaints.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No complaints match your filters.</td></tr>
              ) : (
                filteredComplaints.map(issue => (
                  <tr 
                    key={issue.id} 
                    onClick={() => setSelectedComplaint(issue)}
                    className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-white/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      {issue.imageUrl ? (
                        <img src={issue.imageUrl} alt="Issue" className="w-12 h-12 object-cover rounded-lg neu-raised-sm" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center text-xs">No Img</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200 max-w-[200px] truncate" title={issue.description}>
                      {issue.description}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 capitalize">
                        {issue.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                        {issue.priority || 'Unclassified'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-medium">
                        {getStatusIcon(issue.status)}
                        {issue.status}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-medium truncate max-w-[100px]">
                      {issue.assignedTo || 'Unassigned'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <DashboardMap 
          complaints={filteredComplaints} 
          onComplaintClick={(complaint) => setSelectedComplaint(complaint)} 
        />
      )}

      {selectedComplaint && (
        <ComplaintModal 
          complaint={selectedComplaint} 
          onClose={() => setSelectedComplaint(null)} 
        />
      )}
    </Card>
  );
}

