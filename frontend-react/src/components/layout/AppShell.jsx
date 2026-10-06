import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../context/AuthContext';
import { MENU_CONFIG } from '../mock/data';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Unauthorized } from '../components/SharedUI';
import UserDirectoryView from '../pages/UserDirectory';
import FieldCodeView from '../pages/FieldCode';

const AppShell = () => {
  const { user, logout } = useAuthStore();
  const allowedMenus = MENU_CONFIG[user.role] || [];
  
  const [activeTab, setActiveTab] = useState(allowedMenus.length > 0 ? allowedMenus[0].id : '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAuthorized = allowedMenus.some(m => m.id === activeTab) || activeTab === 'unauthorized';

  useEffect(() => {
    if (activeTab && activeTab !== 'unauthorized' && !allowedMenus.some(m => m.id === activeTab)) {
       setActiveTab('unauthorized');
    }
  }, [activeTab, allowedMenus]);

  const renderContent = () => {
    if (!isAuthorized) return <Unauthorized />;
    switch (activeTab) {
      case 'users': return <UserDirectoryView />;
      case 'fields': return <FieldCodeView />;
      case 'my_scores': 
        return <div className="p-10 text-center text-slate-500">Giao diện ĐRL Sinh viên (Mockup)</div>;
      default: return <Unauthorized />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex text-slate-900 font-sans">
      <Sidebar 
        allowedMenus={allowedMenus} activeTab={activeTab} setActiveTab={setActiveTab} 
        user={user} logout={logout} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} 
      />
      <main className="flex-1 flex flex-col min-w-0 md:ml-[260px] relative">
        <Header 
          setIsMobileMenuOpen={setIsMobileMenuOpen} allowedMenus={allowedMenus} 
          activeTab={activeTab} user={user} setActiveTab={setActiveTab} 
        />
        <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AppShell;
