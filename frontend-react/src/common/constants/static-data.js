export const MOCK_ACCOUNTS = {
  'admin': { username: 'admin', password: 'admin', role: 'ADMIN', name: 'Quản trị viên' },
  'dean': { username: 'dean', password: 'dean', role: 'DEAN', name: 'Trưởng Khoa CNTT' },
  'class': { username: 'class', password: 'class', role: 'CLASS_LEADER', name: 'Lớp trưởng K18A' },
  'student': { username: 'student', password: 'student', role: 'STUDENT', name: 'Sinh viên A' },
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
