import { Users, Database, FileSignature } from 'lucide-react';

export const MOCK_ACCOUNTS = {
  'admin': { username: 'admin', password: 'admin', role: 'ADMIN', name: 'Quản trị viên' },
  'dean': { username: 'dean', password: 'dean', role: 'DEAN', name: 'Trưởng Khoa CNTT' },
  'class': { username: 'class', password: 'class', role: 'CLASS_LEADER', name: 'Lớp trưởng K18A' },
  'student': { username: 'student', password: 'student', role: 'STUDENT', name: 'Sinh viên A' },
};

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

export const DEPARTMENTS = [
  { id: 'cntt', name: 'Khoa CNTT', courses: [
    { id: 'k18', name: 'Khóa 18', classes: ['K18A', 'K18B'] },
    { id: 'k19', name: 'Khóa 19', classes: ['K19A', 'K19C'] }
  ]},
  { id: 'dtvt', name: 'Khoa ĐTVT', courses: [
    { id: 'k18', name: 'Khóa 18', classes: ['D18', 'D18B'] }
  ]}
];
