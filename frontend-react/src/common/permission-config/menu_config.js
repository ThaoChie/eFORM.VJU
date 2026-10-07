import { 
  FileEdit, ListTodo, FileText, Database, Users 
} from 'lucide-react';

export const MENU_CONFIG = {
  ADMIN: [
    { id: 'form-versions', label: 'Phiên bản biểu mẫu', icon: FileText, path: '/admin/form-versions' },
    { id: 'fields', label: 'Trường thông tin', icon: Database, path: '/admin/fields' },
    { id: 'users', label: 'Danh bạ đơn vị', icon: Users, path: '/admin/users' },
  ],
  DEAN: [
    { id: 'users', label: 'Danh bạ Khoa', icon: Users },
  ],
  CLASS_LEADER: [
    { id: 'users', label: 'Danh bạ Lớp', icon: Users },
  ],
STUDENT: [
    { id: 'draft-form', label: 'Soạn thảo mẫu biểu', icon: FileEdit, path: '/student/draft' },
    { id: 'pending-list', label: 'Danh sách chờ xử lý', icon: ListTodo, path: '/student/pending' },
  ]
};
