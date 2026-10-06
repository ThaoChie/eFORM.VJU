import React, { useState } from 'react';
import { Plus, Edit, Trash2, Lock, X, AlertTriangle } from 'lucide-react';
import { Button, Badge } from '../components/SharedUI';

const FieldCodeView = () => {
  const [fields] = useState([
    { id: 1, code: 'DIEM_HT', name: 'Điểm Học Tập', type: 'NUMBER', isUsed: true },
    { id: 2, code: 'EMAIL_SV', name: 'Email Sinh viên', type: 'STRING', isUsed: false },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Cấu hình Field Code Động</h2>
        <Button type="primary" onClick={() => setIsModalOpen(true)}><Plus size={16} className="mr-2" /> Thêm Field</Button>
      </div>

      <div className="bg-white rounded-lg border border-[#f0f0f0] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fafafa] border-b border-[#f0f0f0]">
            <tr>
              <th className="px-4 py-3 font-semibold">Field Code</th>
              <th className="px-4 py-3 font-semibold">Tên hiển thị</th>
              <th className="px-4 py-3 font-semibold">Kiểu dữ liệu</th>
              <th className="px-4 py-3 font-semibold text-center">Trạng thái Khóa</th>
              <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0]">
            {fields.map(f => (
              <tr key={f.id}>
                <td className="px-4 py-3 font-mono text-[#1677ff]">{f.code}</td>
                <td className="px-4 py-3">{f.name}</td>
                <td className="px-4 py-3"><Badge type={f.type} /></td>
                <td className="px-4 py-3 text-center">
                  {f.isUsed ? <span className="text-slate-500 text-xs"><Lock size={12} className="inline"/> Đã dùng</span> : 'Mới'}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button className="text-[#1677ff]"><Edit size={16}/></button>
                  <button disabled={f.isUsed} className="text-red-500 disabled:opacity-30"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
             <div className="flex justify-between mb-4"><h3 className="font-bold">Form Field Code</h3><button onClick={() => setIsModalOpen(false)}><X/></button></div>
             <p className="text-slate-500 mb-4">Demo Modal Form...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldCodeView;
