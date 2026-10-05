import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import { 
  Users, ShieldCheck, FileSpreadsheet, UploadCloud, 
  Download, Plus, Search, Bell, Menu, X, 
  CheckCircle2, XCircle, Edit, Trash2, FileOutput, 
  Check, FileDown, LogOut, KeyRound, AlertTriangle, Image as ImageIcon,
  Database, Lock, FileSignature, ChevronRight
} from 'lucide-react';


const MOCK_ACCOUNTS = {
  'admin': { username: 'admin', password: 'admin', role: 'ADMIN', name: 'Quản trị viên' },
  'dean': { username: 'dean', password: 'dean', role: 'DEAN', name: 'Trưởng Khoa CNTT' },
  'class': { username: 'class', password: 'class', role: 'CLASS_LEADER', name: 'Lớp trưởng K18A' },
  'student': { username: 'student', password: 'student', role: 'STUDENT', name: 'Sinh viên A' },
};

const MENU_CONFIG = {
  ADMIN: [
    { id: 'users', label: 'Quản lý Người dùng', icon: Users },
    { id: 'fields', label: 'Cấu hình Field Code', icon: Database },
  ],
  DEAN: [
    { id: 'users', label: 'Danh bạ Khoa', icon: Users },
  ],
  CLASS_LEADER: [
    { id: 'users', label: 'Danh bạ Lớp', icon: Users },
  ],
  STUDENT: [
    { id: 'my_scores', label: 'Điểm cá nhân', icon: FileSignature },
  ]
};

// Dữ liệu giả lập cho Filter liên hoàn
const DEPARTMENTS = [
  { id: 'cntt', name: 'Khoa CNTT', courses: [
    { id: 'k18', name: 'Khóa 18', classes: ['K18A', 'K18B'] },
    { id: 'k19', name: 'Khóa 19', classes: ['K19A', 'K19C'] }
  ]},
  { id: 'dtvt', name: 'Khoa ĐTVT', courses: [
    { id: 'k18', name: 'Khóa 18', classes: ['D18', 'D18B'] }
  ]}
];


const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = chưa đăng nhập

  const login = (username, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const account = MOCK_ACCOUNTS[username];
        if (account && account.password === password) {
          const userData = { ...account, token: 'mock-jwt-token-123' };
          setUser(userData);
          resolve(userData);
        } else {
          reject(new Error('Sai tài khoản hoặc mật khẩu'));
        }
      }, 500);
    });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuthStore = () => useContext(AuthContext);


const Badge = ({ type, text }) => {
  const styles = {
    NUMBER: 'bg-blue-50 text-blue-600 border-blue-200',
    STRING: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    FILE: 'bg-amber-50 text-amber-600 border-amber-200',
    SIGNATURE: 'bg-purple-50 text-purple-600 border-purple-200',
    DEFAULT: 'bg-slate-50 text-slate-600 border-slate-200'
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${styles[type] || styles.DEFAULT}`}>
      {text || type}
    </span>
  );
};

const Button = ({ children, type = 'default', className = '', ...props }) => {
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


const LoginView = () => {
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!username || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-xl mb-4">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">E-Form ĐRL</h1>
          <p className="text-slate-500 text-sm mt-2">Đăng nhập hệ thống quản trị</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center mb-4 border border-red-100">
            <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tài khoản</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-[#d9d9d9] rounded-md focus:outline-none focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff] transition-colors"
              value={username} onChange={e => setUsername(e.target.value)}
              placeholder="admin / dean / class / student"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
            <input 
              type="password" 
              className="w-full px-3 py-2 border border-[#d9d9d9] rounded-md focus:outline-none focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff] transition-colors"
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="primary" className="w-full mt-2" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>
        
        <div className="mt-6 text-xs text-slate-400 text-center">
          <p>Tài khoản test: admin/admin, dean/dean, class/class, student/student</p>
        </div>
      </div>
    </div>
  );
};


const Unauthorized = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
    <Lock size={64} className="text-slate-300 mb-4" />
    <h2 className="text-2xl font-bold text-slate-700 mb-2">403 - Không đủ quyền truy cập</h2>
    <p className="text-slate-500 mb-6">Bạn không có quyền truy cập vào chức năng này dựa trên phân quyền của hệ thống.</p>
  </div>
);


const UserDirectoryView = () => {
  // Cascading Filter States
  const [khoa, setKhoa] = useState('');
  const [khoaHoc, setKhoaHoc] = useState('');
  const [lop, setLop] = useState('');

  const availableCourses = DEPARTMENTS.find(d => d.id === khoa)?.courses || [];
  const availableClasses = availableCourses.find(c => c.id === khoaHoc)?.classes || [];

  // Handle cascading changes
  const handleKhoaChange = (e) => {
    setKhoa(e.target.value);
    setKhoaHoc('');
    setLop('');
  };
  const handleKhoaHocChange = (e) => {
    setKhoaHoc(e.target.value);
    setLop('');
  };

  const [users, setUsers] = useState([
    { id: 1, code: 'SV001', name: 'Nguyễn Văn A', email: 'nva@edu.vn', role: 'STUDENT', dept: 'Khoa CNTT', cls: 'K18A', hasSignature: true },
    { id: 2, code: 'CB001', name: 'Lê Văn B', email: 'lvb@edu.vn', role: 'DEAN', dept: 'Khoa CNTT', cls: '-', hasSignature: false },
  ]);

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
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

      {/* Cascading Filters (AntD Style Card) */}
      <div className="bg-white p-4 rounded-lg border border-[#f0f0f0] shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full space-y-1">
          <label className="text-xs font-medium text-slate-500 uppercase">Khoa / Đơn vị</label>
          <select 
            className="w-full px-3 py-2 border border-[#d9d9d9] rounded-md focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff] outline-none text-sm"
            value={khoa} onChange={handleKhoaChange}
          >
            <option value="">-- Tất cả Khoa --</option>
            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="flex-1 w-full space-y-1">
          <label className="text-xs font-medium text-slate-500 uppercase">Khóa học</label>
          <select 
            className="w-full px-3 py-2 border border-[#d9d9d9] rounded-md focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff] outline-none text-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
            value={khoaHoc} onChange={handleKhoaHocChange} disabled={!khoa}
          >
            <option value="">-- Tất cả Khóa --</option>
            {availableCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 w-full space-y-1">
          <label className="text-xs font-medium text-slate-500 uppercase">Lớp sinh hoạt</label>
          <select 
            className="w-full px-3 py-2 border border-[#d9d9d9] rounded-md focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff] outline-none text-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
            value={lop} onChange={(e) => setLop(e.target.value)} disabled={!khoaHoc}
          >
            <option value="">-- Tất cả Lớp --</option>
            {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
        </div>
        <div className="w-full md:w-auto">
          <Button type="primary" className="w-full">
            <Search size={16} className="mr-2"/> Tìm kiếm
          </Button>
        </div>
      </div>

      {/* AntD Style Table */}
      <div className="bg-white rounded-lg border border-[#f0f0f0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fafafa] border-b border-[#f0f0f0]">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-800">Mã NV/SV</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Họ tên</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Đơn vị / Lớp</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Phân quyền</th>
                <th className="px-4 py-3 font-semibold text-slate-800 text-center">Chữ ký mẫu</th>
                <th className="px-4 py-3 font-semibold text-slate-800 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1677ff]">{u.code}</td>
                  <td className="px-4 py-3 text-slate-700">{u.name}<br/><span className="text-xs text-slate-400">{u.email}</span></td>
                  <td className="px-4 py-3 text-slate-600">{u.dept}<br/><span className="text-xs font-medium">{u.cls}</span></td>
                  <td className="px-4 py-3"><Badge type="DEFAULT" text={u.role} /></td>
                  <td className="px-4 py-3 text-center">
                    {u.hasSignature ? 
                      <span className="inline-flex items-center text-emerald-600 text-xs"><Check size={14} className="mr-1"/> Đã tải lên</span> : 
                      <span className="inline-flex items-center text-slate-400 text-xs">-</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button className="text-[#1677ff] hover:text-blue-800 p-1"><Edit size={16}/></button>
                    <button className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-[#f0f0f0] flex justify-end text-sm text-slate-500">
          Hiển thị 1 - {users.length} trong {users.length} bản ghi
        </div>
      </div>

      {/* User Create/Edit Modal */}
      {isUserModalOpen && (
        <UserModal onClose={() => setIsUserModalOpen(false)} />
      )}

      {/* Import 2-Step Modal */}
      {isImportModalOpen && (
        <ImportExcelModal onClose={() => setIsImportModalOpen(false)} />
      )}
    </div>
  );
};

const UserModal = ({ onClose }) => {
  const [sigPreview, setSigPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSigPreview(url);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-[#f0f0f0] flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Thêm mới Người dùng</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mã định danh (SV/CB) *</label>
              <input type="text" className="w-full px-3 py-2 border border-[#d9d9d9] rounded-md" placeholder="VD: SV001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên *</label>
              <input type="text" className="w-full px-3 py-2 border border-[#d9d9d9] rounded-md" placeholder="Nguyễn Văn A" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phân quyền *</label>
              <select className="w-full px-3 py-2 border border-[#d9d9d9] rounded-md">
                <option>STUDENT</option>
                <option>CLASS_LEADER</option>
                <option>DEAN</option>
                <option>ADMIN</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" className="w-full px-3 py-2 border border-[#d9d9d9] rounded-md" placeholder="email@edu.vn" />
            </div>
          </div>

          <div className="border border-[#f0f0f0] rounded-md p-4 bg-slate-50 mt-4">
            <h4 className="text-sm font-medium text-slate-800 mb-3 flex items-center">
              <FileSignature size={16} className="mr-2 text-blue-600"/> Tải lên chữ ký mẫu (Dành cho Cán bộ/Lớp trưởng)
            </h4>
            <div className="flex items-start space-x-6">
              <div className="flex-1">
                <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors" />
                <p className="text-xs text-slate-400 mt-2">Định dạng PNG nền trong suốt, tối đa 2MB.</p>
              </div>
              <div className="w-32 h-20 bg-white border border-dashed border-[#d9d9d9] rounded flex items-center justify-center overflow-hidden">
                {sigPreview ? (
                  <img src={sigPreview} alt="Preview" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400 text-center"><ImageIcon size={16} className="mx-auto mb-1 opacity-50"/> Xem trước</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#f0f0f0] flex justify-end space-x-3 bg-[#fafafa]">
          <Button onClick={onClose}>Hủy bỏ</Button>
          <Button type="primary">Lưu thông tin</Button>
        </div>
      </div>
    </div>
  );
};

const ImportExcelModal = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);

  const mockPreviewData = [
    { stt: 1, code: 'SV101', name: 'Trần A', email: 'a@edu.vn', valid: true, error: '' },
    { stt: 2, code: 'SV001', name: 'Nguyễn B', email: 'b@edu.vn', valid: false, error: 'Trùng ID SV001' },
    { stt: 3, code: 'SV102', name: 'Lê C', email: 'c_edu.vn', valid: false, error: 'Sai định dạng Email' },
  ];

  const handleSimulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setStep(2);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-[#f0f0f0] flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">
            {step === 1 ? 'Bước 1: Upload File Excel' : 'Bước 2: Xác nhận dữ liệu (Preview)'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>

        <div className="p-6 overflow-y-auto">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-blue-50 p-4 rounded-md border border-blue-100">
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Tải file mẫu chuẩn</h4>
                  <p className="text-xs text-blue-600 mt-1">Vui lòng sử dụng template này để đảm bảo dữ liệu hợp lệ.</p>
                </div>
                <Button><Download size={16} className="mr-2"/> Tải Template.xlsx</Button>
              </div>

              <div 
                className="border-2 border-dashed border-[#d9d9d9] hover:border-[#1677ff] rounded-lg p-12 text-center transition-colors cursor-pointer bg-[#fafafa]"
                onClick={handleSimulateUpload}
              >
                {isUploading ? (
                  <div className="text-[#1677ff] animate-pulse">
                    <Database size={48} className="mx-auto mb-4 opacity-80" />
                    <p className="font-medium">Đang xử lý dữ liệu...</p>
                  </div>
                ) : (
                  <div>
                    <UploadCloud size={48} className="mx-auto text-[#1677ff] mb-4" />
                    <p className="text-base font-medium text-slate-700">Kéo thả file vào đây hoặc Click để chọn</p>
                    <p className="text-sm text-slate-500 mt-1">Hỗ trợ .xls, .xlsx (Tối đa 10MB)</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
             <div className="space-y-4">
               <div className="flex items-center space-x-2 text-sm">
                 <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-medium">Hợp lệ: 1</span>
                 <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-medium">Lỗi: 2</span>
               </div>
               <div className="border border-[#f0f0f0] rounded-lg overflow-hidden">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-[#fafafa] border-b border-[#f0f0f0]">
                     <tr>
                       <th className="px-4 py-2 font-medium">STT</th>
                       <th className="px-4 py-2 font-medium">Mã</th>
                       <th className="px-4 py-2 font-medium">Họ tên</th>
                       <th className="px-4 py-2 font-medium">Email</th>
                       <th className="px-4 py-2 font-medium">Trạng thái</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[#f0f0f0]">
                     {mockPreviewData.map((row, i) => (
                       <tr key={i} className={row.valid ? 'bg-white' : 'bg-red-50/50'}>
                         <td className="px-4 py-2 text-slate-500">{row.stt}</td>
                         <td className="px-4 py-2 font-medium text-slate-700">{row.code}</td>
                         <td className="px-4 py-2">{row.name}</td>
                         <td className="px-4 py-2">{row.email}</td>
                         <td className="px-4 py-2">
                           {row.valid ? 
                             <span className="text-emerald-600 text-xs flex items-center"><CheckCircle2 size={14} className="mr-1"/> Hợp lệ</span> : 
                             <span className="text-red-600 text-xs flex items-center font-medium"><XCircle size={14} className="mr-1"/> {row.error}</span>
                           }
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#f0f0f0] flex justify-end space-x-3 bg-[#fafafa]">
          <Button onClick={onClose}>Hủy bỏ</Button>
          {step === 2 && (
            <Button type="primary">Xác nhận Lưu dữ liệu Hợp lệ</Button>
          )}
        </div>
      </div>
    </div>
  );
};



const FieldCodeView = () => {
  const [fields, setFields] = useState([
    { id: 1, code: 'DIEM_HT', name: 'Điểm Học Tập', type: 'NUMBER', isUsed: true, meta: { min: 0, max: 10 } },
    { id: 2, code: 'EMAIL_SV', name: 'Email Sinh viên', type: 'STRING', isUsed: false, meta: { regex: '^[a-z]+@edu\\.vn$' } },
    { id: 3, code: 'MINH_CHUNG', name: 'Minh chứng ĐRL', type: 'FILE', isUsed: true, meta: {} },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);

  const openModal = (field = null) => {
    setEditingField(field);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Cấu hình Field Code Động</h2>
        <Button type="primary" onClick={() => openModal()}><Plus size={16} className="mr-2" /> Thêm Field Code</Button>
      </div>

      <div className="bg-white rounded-lg border border-[#f0f0f0] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fafafa] border-b border-[#f0f0f0]">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-800">Field Code</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Tên hiển thị</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Kiểu dữ liệu (Data Type)</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Ràng buộc (Validation)</th>
              <th className="px-4 py-3 font-semibold text-slate-800 text-center">Trạng thái Khóa</th>
              <th className="px-4 py-3 font-semibold text-slate-800 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0]">
            {fields.map(f => (
              <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-[#1677ff] font-medium">{f.code}</td>
                <td className="px-4 py-3 text-slate-700">{f.name}</td>
                <td className="px-4 py-3"><Badge type={f.type} /></td>
                <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                  {f.type === 'NUMBER' && `[Min: ${f.meta.min} - Max: ${f.meta.max}]`}
                  {f.type === 'STRING' && `Regex: ${f.meta.regex}`}
                  {f.type === 'FILE' && `N/A`}
                </td>
                <td className="px-4 py-3 text-center">
                  {f.isUsed ? (
                    <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs"><Lock size={12} className="mr-1"/> Đã dùng</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-xs border border-emerald-200">Mới</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => openModal(f)} className="text-[#1677ff] hover:text-blue-800 p-1"><Edit size={16}/></button>
                  <button className="text-red-500 hover:text-red-700 p-1 disabled:opacity-30 disabled:cursor-not-allowed" disabled={f.isUsed}><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && <FieldCodeModal initialData={editingField} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

const FieldCodeModal = ({ initialData, onClose }) => {
  const isUsed = initialData?.isUsed || false;
  const [type, setType] = useState(initialData?.type || 'STRING');

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#f0f0f0] flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">{initialData ? 'Cập nhật Field Code' : 'Thêm mới Field Code'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>
        
        <div className="p-6 space-y-4">
          {isUsed && (
            <div className="bg-amber-50 text-amber-700 p-3 rounded text-sm border border-amber-200 flex items-start mb-4">
              <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0"/>
              Trường dữ liệu này đã được sử dụng trong các Form. Bạn không thể thay đổi Mã (Field Code) và Kiểu dữ liệu.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mã Field Code (Định danh) *</label>
            <input 
              type="text" 
              className={`w-full px-3 py-2 border border-[#d9d9d9] rounded-md font-mono ${isUsed ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff]'}`}
              defaultValue={initialData?.code} 
              disabled={isUsed} 
              placeholder="VD: DIEM_REN_LUYEN" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên hiển thị *</label>
            <input type="text" className="w-full px-3 py-2 border border-[#d9d9d9] rounded-md focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff]" defaultValue={initialData?.name} placeholder="Nhập tên mô tả" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kiểu dữ liệu (Data Type) *</label>
            <select 
              className={`w-full px-3 py-2 border border-[#d9d9d9] rounded-md ${isUsed ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff]'}`}
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={isUsed}
            >
              <option value="STRING">Chuỗi văn bản (STRING)</option>
              <option value="NUMBER">Số học (NUMBER)</option>
              <option value="FILE">Tệp đính kèm (FILE)</option>
              <option value="SIGNATURE">Chữ ký (SIGNATURE)</option>
            </select>
          </div>

          {/* Dynamic Validation Fields */}
          <div className="pt-4 border-t border-[#f0f0f0]">
            <h4 className="text-sm font-medium text-slate-800 mb-3">Cấu hình Validate Động</h4>
            {type === 'NUMBER' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Giá trị Tối thiểu (Min)</label>
                  <input type="number" className="w-full px-3 py-2 border border-[#d9d9d9] rounded-md" defaultValue={initialData?.meta?.min} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Giá trị Tối đa (Max)</label>
                  <input type="number" className="w-full px-3 py-2 border border-[#d9d9d9] rounded-md" defaultValue={initialData?.meta?.max} />
                </div>
              </div>
            )}
            {type === 'STRING' && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Biểu thức chính quy (Regex Pattern)</label>
                <input type="text" className="w-full px-3 py-2 border border-[#d9d9d9] rounded-md font-mono text-sm" placeholder="^.*$" defaultValue={initialData?.meta?.regex} />
              </div>
            )}
            {(type === 'FILE' || type === 'SIGNATURE') && (
               <p className="text-sm text-slate-500 italic">Không có cấu hình validate bổ sung cho kiểu dữ liệu này.</p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#f0f0f0] flex justify-end space-x-3 bg-[#fafafa]">
          <Button onClick={onClose}>Hủy bỏ</Button>
          <Button type="primary">Lưu cấu hình</Button>
        </div>
      </div>
    </div>
  );
};


const AppShell = () => {
  const { user, logout } = useAuthStore();
  const allowedMenus = MENU_CONFIG[user.role] || [];
  
  const [activeTab, setActiveTab] = useState(allowedMenus.length > 0 ? allowedMenus[0].id : '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Route Guard Check
  const isAuthorized = allowedMenus.some(m => m.id === activeTab) || activeTab === 'unauthorized';

  // Chuyển hướng nếu vào tab không có quyền
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
        return <div className="p-10 text-center text-slate-500">Giao diện tự đánh giá ĐRL cho Sinh viên (Mockup)</div>;
      default: return <Unauthorized />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex text-slate-900 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-[260px] bg-[#001529] text-white fixed h-full z-10 transition-all shadow-xl">
        <div className="p-5 flex items-center space-x-3 bg-[#002140]">
          <ShieldCheck size={28} className="text-[#1677ff]" />
          <span className="text-xl font-bold tracking-tight">E-Form ĐRL</span>
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
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-6 py-3 transition-colors ${
                      isActive ? 'bg-[#1677ff] text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon size={18} className={`mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        
        {/* User Info & Logout */}
        <div className="p-4 bg-[#002140] border-t border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#1677ff] flex items-center justify-center font-bold text-sm">
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
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 md:ml-[260px] relative">
        {/* Header */}
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
            {/* Cố tình tạo nút giả lập điều hướng sai quyền để test Route Guard */}
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

        {/* Content Body */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Sidebar Overlay (Simplified for Mockup) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-64 bg-[#001529] h-full flex flex-col">
             {/* Same mobile sidebar content omitted for brevity, focusing on core tasks */}
             <div className="p-4 flex justify-end">
               <button onClick={() => setIsMobileMenuOpen(false)} className="text-white"><X size={24} /></button>
             </div>
             <ul className="space-y-1">
              {allowedMenus.map(item => (
                <li key={item.id}>
                  <button 
                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center px-6 py-3 text-white ${activeTab === item.id ? 'bg-[#1677ff]' : ''}`}
                  >
                    <item.icon size={18} className="mr-3" /> {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};


export default function App() {
  return (
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

const AuthConsumer = () => {
  const { user } = useAuthStore();
  return user ? <AppShell /> : <LoginView />;
};
