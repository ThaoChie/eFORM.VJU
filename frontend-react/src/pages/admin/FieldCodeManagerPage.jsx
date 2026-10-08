import React, { useState } from 'react';
import { Plus, Edit, Ban, CheckCircle, Search, UploadCloud, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const FieldCodeManagerPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // CREATE hoặc EDIT
  const [dataType, setDataType] = useState('STRING');

  const openEditModal = () => {
    setModalMode('EDIT');
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Quản lý Trường thông tin (Field Code)</h2>
        <div className="flex space-x-2">
          <Button type="default"><UploadCloud size={16} className="mr-2"/> Thêm mới theo lô (Excel)</Button>
          <Button type="primary" onClick={() => { setModalMode('CREATE'); setIsModalOpen(true); }}>
            <Plus size={16} className="mr-2"/> Thêm mới
          </Button>
        </div>
      </div>

      {/* Bảng Dữ liệu (Rút gọn) */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3">Mã Eform</th>
              <th className="px-4 py-3">Tên trường</th>
              <th className="px-4 py-3">Kiểu dữ liệu</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <td className="px-4 py-3 font-mono font-medium text-blue-600">DIEM_HT</td>
              <td className="px-4 py-3">Điểm Học Tập</td>
              <td className="px-4 py-3"><Badge type="NUMBER" text="SỐ (NUMBER)"/></td>
              <td className="px-4 py-3"><span className="text-green-600 bg-green-50 px-2 py-1 rounded">Hiệu lực</span></td>
              <td className="px-4 py-3 text-right space-x-2">
                <button className="text-blue-600 hover:underline" onClick={openEditModal}>Yêu cầu sửa</button>
                <button className="text-orange-600 hover:underline">Vô hiệu hóa</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* MODAL THÊM MỚI / CHỈNH SỬA FIELD CODE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
              <h3 className="font-bold text-lg">
                {modalMode === 'CREATE' ? 'Thêm mới Trường thông tin' : 'Yêu cầu sửa Trường thông tin'}
              </h3>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mã trường Eform *</label>
                  <input 
                    type="text" 
                    className={`w-full p-2 border rounded ${modalMode === 'EDIT' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                    defaultValue={modalMode === 'EDIT' ? 'DIEM_HT' : ''}
                    readOnly={modalMode === 'EDIT'} // Yêu cầu: Edit thì làm mờ, read-only
                  />
                  {modalMode === 'EDIT' && <p className="text-xs text-red-500 mt-1">Trường này bị khóa để đảm bảo nhất quán.</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tên trường *</label>
                  <input type="text" className="w-full p-2 border rounded" defaultValue={modalMode === 'EDIT' ? 'Điểm Học Tập' : ''} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kiểu dữ liệu *</label>
                  <select className="w-full p-2 border rounded" value={dataType} onChange={(e) => setDataType(e.target.value)}>
                    <option value="STRING">Chuỗi (STRING)</option>
                    <option value="NUMBER">Số (NUMBER)</option>
                    <option value="DATE">Ngày (DATE)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Trạng thái ban đầu</label>
                  <div className="flex items-center mt-2">
                    <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" defaultChecked />
                    <span className="ml-2 text-sm text-slate-700">Đang kích hoạt</span>
                  </div>
                </div>
              </div>

              {/* KHU VỰC THÊM QUY TẮC ĐỘNG (DYNAMIC VALIDATION) */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-blue-800">Quy tắc xác thực (Validation)</h4>
                  <select className="p-1 border rounded text-sm bg-white text-blue-600 border-blue-300">
                    <option>+ Thêm quy tắc</option>
                    <option>Bắt buộc nhập</option>
                    {dataType === 'STRING' && <option>Độ dài tối đa</option>}
                    {dataType === 'STRING' && <option>Mẫu định dạng (Regex)</option>}
                    {dataType === 'NUMBER' && <option>Giá trị tối đa</option>}
                  </select>
                </div>

                {/* Khung quy tắc động sinh ra */}
                <div className="bg-white p-3 border rounded border-l-4 border-l-blue-500 mb-3 flex items-start space-x-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {dataType === 'STRING' ? 'Mẫu định dạng (Regex)' : 'Giá trị Tối đa (Max)'}
                      </span>
                      <div className="flex items-center space-x-2 text-sm">
                        <span>Áp dụng khi (Điều kiện)</span>
                        <input type="checkbox" className="w-4 h-4 rounded text-blue-600" />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <input 
                        type={dataType === 'NUMBER' ? 'number' : 'text'} 
                        className="flex-1 p-2 border rounded text-sm" 
                        placeholder={dataType === 'STRING' ? 'VD: ^[\\w.+-]+@[\\w-]+\\.[\\w.-]+$' : 'Nhập số max...'} 
                      />
                      <input type="text" className="flex-1 p-2 border rounded text-sm text-red-500" placeholder="Câu cảnh báo khi lỗi..." />
                    </div>
                  </div>
                  <button className="text-red-400 hover:text-red-600 mt-1"><Trash2 size={18}/></button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Lý do yêu cầu (Gửi Checker)</label>
                <textarea className="w-full p-2 border rounded" rows="2" placeholder="Ghi chú giải trình..."></textarea>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end space-x-3 bg-slate-50 rounded-b-lg">
              <Button onClick={() => setIsModalOpen(false)}>Quay lại</Button>
              {modalMode === 'CREATE' ? (
                <>
                  <Button type="default">Lưu nháp</Button>
                  <Button type="primary">Đẩy duyệt</Button>
                </>
              ) : (
                <Button type="primary" onClick={() => {
                  if(window.confirm("Xác nhận thay đổi trường thông tin?")) {
                    alert("Cập nhật thành công!");
                    setIsModalOpen(false);
                  }
                }}>Thay đổi</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FieldCodeManagerPage;
