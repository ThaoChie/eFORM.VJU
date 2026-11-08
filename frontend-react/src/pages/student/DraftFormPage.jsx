import React, { useState } from 'react';
import { ArrowLeft, Save, Send, UploadCloud, FileText } from 'lucide-react';
import Button from '../../components/ui/Button';

const DraftFormPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDayDuyet = () => {
    setIsSubmitting(true);
    // Yêu cầu: Đẩy duyệt sẽ thực hiện ngầm tiến trình ký số
    alert("Hệ thống đang thực hiện Ký số ngầm bằng chứng thư số cá nhân (SHA-256)...");
    setTimeout(() => {
      alert("Đẩy duyệt và Ký số thành công! Chuyển sang Danh sách chờ duyệt.");
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <button className="text-slate-500 hover:text-slate-800 flex items-center">
            <ArrowLeft size={20} className="mr-1"/> Quay lại
          </button>
          <h2 className="text-lg font-bold text-slate-800 border-l pl-4 border-slate-300">
            Soạn thảo Phiếu Điểm Rèn Luyện
          </h2>
        </div>
        <div className="flex space-x-2">
          <Button type="default"><UploadCloud size={16} className="mr-2"/> Tải minh chứng</Button>
          <Button type="default"><Save size={16} className="mr-2"/> Lưu nháp</Button>
          <Button type="primary" onClick={handleDayDuyet} disabled={isSubmitting}>
            <Send size={16} className="mr-2"/> {isSubmitting ? 'Đang ký số...' : 'Đẩy duyệt (Ký số)'}
          </Button>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="flex-1 flex gap-4 h-full overflow-hidden">
        {/* Phần Trái: Form Input */}
        <div className="w-1/2 bg-white rounded-lg shadow-sm border border-slate-200 p-6 overflow-y-auto">
          <h3 className="font-semibold text-blue-700 mb-4 border-b pb-2">Thông tin tự đánh giá</h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mã sinh viên *</label>
              <input type="text" className="w-full p-2 border rounded bg-slate-50" value="SV2023_001" disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Điểm Học tập (Tối đa 30) *</label>
              <input type="number" className="w-full p-2 border rounded focus:ring-blue-500" placeholder="Nhập điểm..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Minh chứng Học tập</label>
              <input type="file" className="w-full p-2 border rounded text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ghi chú thêm</label>
              <textarea className="w-full p-2 border rounded" rows="3"></textarea>
            </div>
          </form>
        </div>

        {/* Phần Phải: PDF Preview (Docword) */}
        <div className="w-1/2 bg-slate-600 rounded-lg shadow-sm border border-slate-200 flex flex-col p-2">
          <div className="bg-slate-800 text-white text-xs py-1 px-3 rounded-t flex justify-between">
            <span>Bản xem trước (PDF Viewer)</span>
            <span>Trang 1/1</span>
          </div>
          <div className="flex-1 bg-white mx-4 my-2 p-8 shadow-lg overflow-y-auto aspect-[1/1.414]">
            {/* Giả lập khung giấy A4 */}
            <div className="text-center mb-6">
              <h1 className="font-bold text-lg">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h1>
              <h2 className="font-semibold">Độc lập - Tự do - Hạnh phúc</h2>
              <h3 className="font-bold text-xl mt-6">PHIẾU ĐÁNH GIÁ KẾT QUẢ RÈN LUYỆN</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p>Họ và tên: ............................................ Mã SV: SV2023_001</p>
              <p>Lớp: ...................................................... Khoa: ...................</p>
              {/* Dữ liệu sẽ binding realtime từ form bên trái sang đây */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DraftFormPage;
