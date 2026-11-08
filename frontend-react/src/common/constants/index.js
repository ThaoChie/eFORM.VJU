export * from './static-data.js';

export const rankScore = (total) => {
  if (total >= 90) return 'Xuất sắc';
  if (total >= 80) return 'Tốt';
  if (total >= 65) return 'Khá';
  if (total >= 50) return 'Trung bình';
  if (total >= 35) return 'Yếu';
  return 'Kém';
};
