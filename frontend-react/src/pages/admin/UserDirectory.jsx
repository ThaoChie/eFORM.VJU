import React, { useState } from 'react';
import { UploadCloud, Plus, Search, Check, Edit, Trash2, X, FileSignature, Database, Download, CheckCircle2, XCircle, Image as ImageIcon } from 'lucide-react';
import { Button, Badge } from '../components/SharedUI';
import { DEPARTMENTS } from '../mock/data';

const UserDirectoryView = () => {
  const [khoa, setKhoa] = useState('');
  const [khoaHoc, setKhoaHoc] = useState('');
  const [lop, setLop] = useState('');
  
  const availableCourses = DEPARTMENTS.find(d => d.id === khoa)?.courses || [];
  const availableClasses = availableCourses.find(c => c.id === khoaHoc)?.classes || [];

  const [users] = useState([
    { id: 1, code: 'SV001', name: 'Nguyễn Văn A', email: 'nva@edu.vn', role: 'STUDENT', dept: 'Khoa CNTT', cls: 'K18A', hasSignature: true },
    { id: 2, code: 'CB001', name: 'Lê Văn B', email: 'lvb@edu.vn', role: 'DEAN', dept: 'Khoa CNTT', cls: '-', hasSignature: false },
  ]);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">Danh bạ Đơn vị</h2>
        <div className="flex space-x-2">
          <Button onClick={() => setIsImportModalOpen(true)}>
            <UploadCloud size={16} className="mr-2" /> Import Excel
          </Button>
          <Button type="primary" onClick={() => setIsUserModalOpen(true)}>
            <Plus size={16} className="mr-2" /> Thêm người dùng
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-[#f0f0f0] shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full space-y-1">
          <label className="text-xs font-medium text-slate-500 uppercase">Khoa</label>
          <select className="w-full px-3 py-2 border border-[#d9d9d9] rounded-md outline-none" value={khoa} onChange={(e) => {setKhoa(e.target.value); setKhoaHoc(''); setLop('');}}>
            <option value="">-- Tất cả --</option>
            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="flex-1 w-full space-y-1">
          <label className="text-xs font-medium text-slate-500 uppercase">Khóa</label>
          <select className="w-full px-3 py-2 border border-[#d9d9d9] rounded-md outline-none disabled:bg-slate-50" value={khoaHoc} onChange={(e) => {setKhoaHoc(e.target.value); setLop('');}} disabled={!khoa}>
            <option value="">-- Tất cả --</option>
            {availableCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 w-full space-y-1">
          <label className="text-xs font-medium text-slate-500 uppercase">Lớp</label>
          <select className="w-full px-3 py-2 border border-[#d9d9d9] rounded-md outline-none disabled:bg-slate-50" value={lop} onChange={(e) => setLop(e.target.value)} disabled={!khoaHoc}>
            <option value="">-- Tất cả --</option>
            {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
        </div>
        <Button type="primary" className="w-full md:w-auto"><Search size={16} className="mr-2"/> Tìm kiếm</Button>
      </div>

      <div className="bg-white rounded-lg border border-[#f0f0f0] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fafafa] border-b border-[#f0f0f0]">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-800">Mã</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Họ tên</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Đơn vị</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Phân quyền</th>
              <th className="px-4 py-3 font-semibold text-slate-800 text-center">Chữ ký</th>
              <th className="px-4 py-3 font-semibold text-slate-800 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0]">
            {users.map(u => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-[#1677ff] font-medium">{u.code}</td>
                <td className="px-4 py-3">{u.name}<br/><span className="text-xs text-slate-400">{u.email}</span></td>
                <td className="px-4 py-3">{u.dept}<br/><span className="text-xs font-medium">{u.cls}</span></td>
                <td className="px-4 py-3"><Badge type="DEFAULT" text={u.role} /></td>
                <td className="px-4 py-3 text-center">
                  {u.hasSignature ? <span className="text-emerald-600 text-xs flex justify-center"><Check size={14}/></span> : '-'}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button className="text-[#1677ff]"><Edit size={16}/></button>
                  <button className="text-red-500"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isUserModalOpen && <UserModal onClose={() => setIsUserModalOpen(false)} />}
      {isImportModalOpen && <ImportExcelModal onClose={() => setIsImportModalOpen(false)} />}
    </div>
  );
};

// Modals (Được thu gọn để hiển thị cấu trúc)
const UserModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
      <div className="flex justify-between mb-4"><h3 className="font-bold">Thêm Người dùng</h3><button onClick={onClose}><X/></button></div>
      <p className="text-slate-500 mb-4">Form nhập liệu (Đã rút gọn trong Demo này để tập trung cấu trúc file)</p>
      <div className="flex justify-end space-x-2"><Button onClick={onClose}>Hủy</Button><Button type="primary">Lưu</Button></div>
    </div>
  </div>
);

const ImportExcelModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg p-6 w-full max-w-2xl text-center">
      <div className="flex justify-between mb-4"><h3 className="font-bold">Import Excel</h3><button onClick={onClose}><X/></button></div>
      <UploadCloud size={48} className="mx-auto text-blue-500 mb-4" />
      <p>Kéo thả file vào đây...</p>
    </div>
  </div>
);

export default UserDirectoryView;
