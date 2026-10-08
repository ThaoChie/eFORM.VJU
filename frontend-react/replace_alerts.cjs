const fs = require('fs');

let jsx = fs.readFileSync('src/pages/admin/directory/DirectoryPage.jsx', 'utf-8');

if (!jsx.includes('import toast')) {
    jsx = jsx.replace('import { Search, Plus', 'import toast from "react-hot-toast";\nimport { Search, Plus');
}

// 100: alert("Lỗi kích hoạt");
jsx = jsx.replace('alert("Lỗi kích hoạt");', 'toast.error("Lỗi kích hoạt");');

// 437: if (!deptCode || !deptName) return alert("Vui lòng nhập đủ mã và tên khoa");
jsx = jsx.replace('return alert("Vui lòng nhập đủ mã và tên khoa");', 'return toast.error("Vui lòng nhập đủ mã và tên khoa");');

// 439: alert("Tạo Khoa thành công!");
jsx = jsx.replace('alert("Tạo Khoa thành công!");', 'toast.success("Tạo Khoa thành công!");');

// 443: alert(e.message || "Lỗi tạo Khoa");
jsx = jsx.replace('alert(e.message || "Lỗi tạo Khoa");', 'toast.error(e.response?.data?.message || e.message || "Lỗi tạo Khoa");');

// 533: alert("Nhập dữ liệu thành công! Đã thêm " + (res?.validRows || 0) + " dòng.");
jsx = jsx.replace('alert("Nhập dữ liệu thành công! Đã thêm " + (res?.validRows || 0) + " dòng.");', 'toast.success("Nhập dữ liệu thành công! Đã thêm " + (res?.validRows || 0) + " dòng.");');

// 539: alert("Có lỗi xảy ra khi nhập dữ liệu!");
jsx = jsx.replace('alert("Có lỗi xảy ra khi nhập dữ liệu!");', 'toast.error("Có lỗi xảy ra khi nhập dữ liệu!");');

// 552: alert("Lỗi đọc file Excel!");
jsx = jsx.replace('alert("Lỗi đọc file Excel!");', 'toast.error("Lỗi đọc file Excel!");');

fs.writeFileSync('src/pages/admin/directory/DirectoryPage.jsx', jsx);
