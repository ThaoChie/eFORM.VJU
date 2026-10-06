import React from 'react';
import { Menu, ChevronRight, Bell } from 'lucide-react';

const Header = ({ setIsMobileMenuOpen, allowedMenus, activeTab, user, setActiveTab }) => {
  return (
    <header className="bg-white border-b border-[#f0f0f0] sticky top-0 z-20 px-4 sm:px-6 h-16 flex justify-between items-center shadow-sm">
      <div className="flex items-center">
        <button className="md:hidden mr-4 text-slate-500" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="hidden sm:flex items-center text-sm text-slate-500">
          <span>Trang chủ</span> <ChevronRight size={14} className="mx-2"/> 
          <span className="font-medium text-slate-800">
            {allowedMenus.find(m => m.id === activeTab)?.label || 'Không đủ quyền'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {user.role === 'STUDENT' && (
          <button 
            onClick={() => setActiveTab('users')} 
            className="text-xs px-2 py-1 bg-red-100 text-red-600 border border-red-200 rounded hover:bg-red-200"
            title="Test truy cập URL trái phép"
          >
            Test Guard
          </button>
        )}
        <button className="text-slate-400 hover:text-[#1677ff] transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
