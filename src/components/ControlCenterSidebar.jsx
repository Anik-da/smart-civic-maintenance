import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Bell, 
  LogOut, 
  ChevronRight,
  ShieldAlert,
  Bot
} from 'lucide-react';

export function ControlCenterSidebar({ activeTab, setActiveTab, user, onLogout }) {
  const tabs = [
    { 
      id: 'incidents', 
      label: 'Dashboard', 
      subtitle: 'Overview & Stats', 
      icon: <LayoutDashboard className="w-5 h-5" /> 
    },
    { 
      id: 'staff', 
      label: 'Staff Hub', 
      subtitle: 'Personnel Management', 
      icon: <Users className="w-5 h-5" />,
      adminOnly: true 
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      subtitle: 'Performance Data', 
      icon: <BarChart3 className="w-5 h-5" /> 
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      subtitle: 'System Alerts', 
      icon: <Bell className="w-5 h-5" /> 
    },
    { 
      id: 'ai-assistant', 
      label: 'AI Assistant', 
      subtitle: 'Smart Chatbot', 
      icon: <Bot className="w-5 h-5" /> 
    }
  ];

  return (
    <nav className="tabs-nav professional-surface">
      <div className="nav-header">
        <h2 className="text-blue-100 font-black">Control Center</h2>
        <p className="text-blue-500 font-bold uppercase tracking-[0.2em] text-[10px]">Premium Dashboard</p>
      </div>
      
      <div className="space-y-1.5 flex-1 mt-8">
        {tabs.map((tab) => {
          if (tab.adminOnly && user?.role !== 'ADMIN') return null;
          
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              <div className="tab-icon">
                {tab.icon}
              </div>
              <div className="tab-text">
                <div className="tab-title">{tab.label}</div>
                <div className="tab-subtitle">{tab.subtitle}</div>
              </div>
              <div className="active-indicator"></div>
              {activeTab !== tab.id && <ChevronRight className="tab-arrow w-4 h-4 opacity-20" />}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xs text-white shadow-inner">
              {user?.name?.[0] || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-black uppercase truncate text-blue-50">{user?.name || 'Staff Member'}</div>
              <div className="text-[9px] text-blue-500 font-bold uppercase tracking-wider">{user?.role || 'Authorized User'}</div>
            </div>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="tab-btn group hover:bg-rose-500/10 hover:text-rose-500 border-transparent hover:border-rose-500/20"
        >
          <div className="tab-icon group-hover:bg-rose-500/20">
            <LogOut className="w-5 h-5" />
          </div>
          <div className="tab-text">
            <div className="tab-title">Logout</div>
            <div className="tab-subtitle">Terminate Session</div>
          </div>
        </button>
      </div>
    </nav>
  );
}
