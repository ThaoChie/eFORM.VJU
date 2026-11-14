import React from 'react';
import { Lock } from 'lucide-react';

export const Badge = ({ type, text }) => {
  return (
    <span className="text-xs font-medium text-slate-700">
      {text || type}
    </span>
  );
};

export const Button = ({ children, type = 'default', className = '', ...props }) => {
  const base = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
  const types = {
    primary: "bg-[#1677ff] text-white hover:bg-[#4096ff] border border-transparent",
    default: "bg-white text-slate-700 hover:text-[#1677ff] hover:border-[#1677ff] border border-[#d9d9d9]",
    danger: "bg-white text-red-600 hover:text-white hover:bg-red-500 hover:border-red-500 border border-red-200",
  };
  return (
    <button className={`${base} ${types[type]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Unauthorized = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
    <Lock size={64} className="text-slate-300 mb-4" />
    <h2 className="text-2xl font-bold text-slate-700 mb-2">403 - Không đủ quyền truy cập</h2>
    <p className="text-slate-500 mb-6">Bạn không có quyền truy cập vào chức năng này dựa trên phân quyền của hệ thống.</p>
  </div>
);
