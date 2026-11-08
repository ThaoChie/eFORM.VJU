import React from 'react';
import { ShieldCheck, LogOut, X } from 'lucide-react';

const Sidebar = ({ allowedMenus, activeTab, setActiveTab, user, logout, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const SidebarContent = () => (
    <>
      <div className="p-5 flex items-center justify-between bg-[#002140]">
        <div className="flex items-center space-x-3">
          <ShieldCheck size={28} className="text-[#1677ff]" />
          <span className="text-xl font-bold tracking-tight text-white">E-Form ĐRL</span>
        </div>
        {isMobileMenuOpen && (
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-white"><X size={24} /></button>
        )}
      </div>
      
      <div className="flex-1 py-4">
        <div className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Chức năng ({user.role})</div>
        <ul className="space-y-1 mt-2">
          {allowedMenus.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button 
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center px-6 py-3 transition-colors ${isActive ? 'bg-[#1677ff] text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                >
                  <Icon size={18} className={`mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      
      <div className="p-4 bg-[#002140] border-t border-white/10">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#1677ff] flex items-center justify-center font-bold text-sm text-white">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.role}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-300 py-2 rounded-md transition-colors text-sm"
        >
          <LogOut size={16} /> <span>Đăng xuất</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden md:flex flex-col w-[260px] bg-[#001529] fixed h-full z-10 transition-all shadow-xl">
        <SidebarContent />
      </aside>
      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-64 bg-[#001529] h-full flex flex-col">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
