import { Users, Database, FileSignature } from 'lucide-react';

export const MENU_CONFIG = {
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
