export function escapeXml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  // Keep the object URL alive so the browser download manager has sufficient time to read
  setTimeout(() => {
    try {
      window.URL.revokeObjectURL(url);
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    } catch {
      // Ignore cleanup error
    }
  }, 2500);
}

export function generateHtmlExcel(headers, rows, sheetName = "Sheet1") {
  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${escapeXml(sheetName)}</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        th { background-color: #2563eb; color: #ffffff; font-weight: bold; height: 35px; border: 0.5pt solid #cbd5e1; text-align: left; padding: 4px 8px; }
        td { height: 28px; border: 0.5pt solid #cbd5e1; padding: 4px 8px; font-family: Arial, sans-serif; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${escapeXml(h)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              ${r.map(cell => `<td>${escapeXml(cell)}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

export const TEMPLATE_CONFIGS = {
  departments: {
    fileName: "mau_nhap_khoa",
    sheetName: "Khoa",
    backendPath: "/departments/template-excel",
    headers: ["Mã Khoa (*)", "Tên Khoa (*)", "Trạng thái (1=Hoạt động, 0=Vô hiệu hóa)"],
    sampleRows: [
      ["CNTT", "Khoa Công nghệ Thông tin & Truyền thông", "1"],
      ["KT", "Khoa Kinh tế & Quản lý", "1"],
      ["NN", "Khoa Ngôn ngữ & Văn hóa Nhật Bản", "1"]
    ]
  },
  offices: {
    fileName: "mau_nhap_phong_ban",
    sheetName: "Phong_ban",
    backendPath: "/offices/template-excel",
    headers: ["Mã phòng ban (*)", "Tên phòng ban (*)", "Mã trưởng phòng (admin)", "Trạng thái (1=Hoạt động, 0=Vô hiệu hóa)"],
    sampleRows: [
      ["PDT", "Phòng Đào tạo", "admin001", "1"],
      ["PCTSV", "Phòng Công tác Sinh viên", "admin002", "1"],
      ["PTH", "Phòng Tổng hợp", "", "1"]
    ]
  },
  classes: {
    fileName: "mau_nhap_lop",
    sheetName: "Lop",
    backendPath: "/classes/template-excel",
    headers: ["Mã lớp (*)", "Tên lớp (*)", "Mã Khoa (*)", "Niên khóa", "Mã Lớp trưởng (cách nhau dấu phẩy)", "Mã Lớp phó (cách nhau dấu phẩy)", "Trạng thái (1=Hoạt động, 0=Vô hiệu hóa)"],
    sampleRows: [
      ["K21_CNTT01", "Lớp K21 Công nghệ thông tin 01", "CNTT", "K21", "SV21001, SV21002", "SV21003", "1"],
      ["K22_KT01", "Lớp K22 Kinh tế 01", "KT", "K22", "SV22001", "", "1"]
    ]
  },
  users: {
    fileName: "mau_nhap_nguoi_dung",
    sheetName: "Nguoi_dung",
    backendPath: "/directory/users/template-excel",
    headers: ["Mã người dùng (*)", "Họ và tên (*)", "Email (*)", "Vai trò (*)", "Mã khoa", "Mã phòng ban", "Mã lớp", "Niên khóa", "Trạng thái (1=Hoạt động, 0=Vô hiệu hóa)"],
    sampleRows: [
      ["SV2026001", "Nguyễn Văn A", "nguyenvana@vju.ac.vn", "STUDENT", "CNTT", "", "K21_CNTT01", "K21", "1"],
      ["GV2026001", "Trần Thị B", "tranthib@vju.ac.vn", "DEAN", "CNTT", "", "", "", "1"],
      ["CB2026001", "Lê Văn C", "levanc@vju.ac.vn", "ADMIN", "", "PDT", "", "", "1"],
      ["SV2026002", "Hoàng Văn D", "hoangvand@vju.ac.vn", "CLASS_LEADER", "CNTT", "", "K21_CNTT01", "K21", "1"]
    ]
  },
  "field-codes": {
    fileName: "mau_nhap_truong_thong_tin",
    sheetName: "Truong_thong_tin",
    backendPath: "/fields/template-excel",
    headers: ["Mã trường (*)", "Tên trường (*)", "Kiểu dữ liệu (*)", "Nhóm trường", "Bắt buộc (1/0)", "Giá trị min", "Giá trị max", "Regex kiểm tra", "Mô tả", "Trạng thái (1/0)"],
    sampleRows: [
      ["HO_TEN_SV", "Họ và tên sinh viên", "TEXT", "COMMON", "1", "", "100", "", "Họ tên đầy đủ theo hồ sơ sinh viên", "1"],
      ["DIEM_TB", "Điểm trung bình học tập", "NUMBER", "ACADEMIC", "0", "0", "10", "", "Điểm thang 10", "1"],
      ["XEP_LOAI_RL", "Xếp loại rèn luyện", "SELECT", "DISCIPLINE", "1", "", "", "", "Xuất sắc, Tốt, Khá, TB", "1"],
      ["NGAY_CAP_THE", "Ngày cấp thẻ sinh viên", "DATE", "COMMON", "0", "", "", "", "Định dạng YYYY-MM-DD", "1"]
    ]
  }
};

export async function downloadExcelTemplate(type, client = null) {
  const config = TEMPLATE_CONFIGS[type];
  if (!config) {
    throw new Error(`Không tìm thấy cấu hình template cho loại: ${type}`);
  }

  // Fallback function: client-side formatted HTML Excel table
  const downloadClientFallback = () => {
    const html = generateHtmlExcel(config.headers, config.sampleRows, config.sheetName);
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
    downloadBlob(blob, `${config.fileName}.xls`);
  };

  // Try backend first if endpoint exists and client provided
  if (config.backendPath && client) {
    try {
      const res = await client.get(config.backendPath, {
        responseType: "blob",
        timeout: 6000
      });
      if (res) {
        const blob = res instanceof Blob
          ? res
          : new Blob([res], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        downloadBlob(blob, `${config.fileName}.xlsx`);
        return;
      }
    } catch (e) {
      console.warn(`Tải template từ backend thất bại (${config.backendPath}), chuyển sang fallback client-side:`, e);
      // Fallback to client-side generation
      downloadClientFallback();
      return;
    }
  }

  // Fallback direct generation
  downloadClientFallback();
}
