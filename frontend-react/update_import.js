const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/directory/DirectoryPage.jsx', 'utf-8');

// Add import preview states
content = content.replace(
  'const [importExcel, setImportExcel] = useState(false)',
  'const [importExcel, setImportExcel] = useState(false)\n  const [importData, setImportData] = useState(null)\n  const [importing, setImporting] = useState(false)\n  const [selectedFile, setSelectedFile] = useState(null)'
);

// Update Modal
const modalOld = `<Modal
        open={importExcel}
        title="Nhập dữ liệu từ Excel"
        onClose={() => setImportExcel(false)}
        footer={
          <>
            <Button onClick={() => setImportExcel(false)}>Hủy</Button>
            <Button variant="primary" onClick={() => setImportExcel(false)}>Tải lên và Tiếp tục</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div 
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.xlsx, .xls';
              input.onchange = (e) => {
                if (e.target.files.length > 0) {
                   alert("Đã chọn file: " + e.target.files[0].name);
                }
              };
              input.click();
            }}
            className="rounded-lg border-2 border-dashed border-brand border-line p-8 text-center hover:bg-canvas cursor-pointer transition"
          >
            <Upload className="size-8 text-brand mx-auto mb-3" />
            <p className="font-medium text-brand">Click để chọn file từ máy tính</p>
            <p className="text-sm text-muted mt-1">hoặc kéo thả file Excel vào đây</p>
          </div>
          <div className="text-sm text-muted">
            <ul className="list-disc pl-5 space-y-1">
              <li>Chỉ chấp nhận file .xlsx, .xls</li>
              <li>Dung lượng tối đa 50MB</li>
              <li>Vui lòng sử dụng file mẫu để đảm bảo đúng định dạng</li>
            </ul>
          </div>
        </div>
      </Modal>`;

const modalNew = `<Modal
        open={importExcel}
        wide={importData !== null}
        title="Nhập dữ liệu từ Excel"
        onClose={() => { setImportExcel(false); setImportData(null); setSelectedFile(null); }}
        footer={
          <>
            <Button onClick={() => { setImportExcel(false); setImportData(null); setSelectedFile(null); }}>Hủy</Button>
            {importData ? (
               <Button variant="primary" loading={importing} onClick={() => {
                 setImporting(true);
                 setTimeout(() => {
                   setImporting(false);
                   setImportExcel(false);
                   setImportData(null);
                   setSelectedFile(null);
                   fetchItems(active);
                   alert("Nhập dữ liệu thành công!");
                 }, 1000);
               }}>Xác nhận Nhập ({importData.validRows} dòng)</Button>
            ) : (
               <Button variant="primary" disabled={!selectedFile} loading={importing} onClick={() => {
                 setImporting(true);
                 setTimeout(() => {
                   setImportData({ validRows: 5, invalidRows: 0, errors: [] });
                   setImporting(false);
                 }, 800);
               }}>Xem trước dữ liệu</Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          {!importData ? (
            <>
              <div 
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.xlsx, .xls';
                  input.onchange = (e) => {
                    if (e.target.files.length > 0) {
                       setSelectedFile(e.target.files[0]);
                    }
                  };
                  input.click();
                }}
                className={\`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition \${selectedFile ? 'border-brand bg-brand-soft' : 'border-line hover:bg-canvas'}\`}
              >
                <Upload className={\`size-8 mx-auto mb-3 \${selectedFile ? 'text-brand' : 'text-muted'}\`} />
                <p className={\`font-medium \${selectedFile ? 'text-brand' : ''}\`}>{selectedFile ? selectedFile.name : 'Click để chọn file từ máy tính'}</p>
                {!selectedFile && <p className="text-sm text-muted mt-1">hoặc kéo thả file Excel vào đây</p>}
              </div>
              <div className="text-sm text-muted">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Chỉ chấp nhận file .xlsx, .xls</li>
                  <li>Dung lượng tối đa 50MB</li>
                  <li>Vui lòng sử dụng file mẫu để đảm bảo đúng định dạng</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-4 mb-4">
                <div className="flex-1 bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">
                  <p className="text-sm font-medium">Hợp lệ</p>
                  <p className="text-2xl font-bold">{importData.validRows}</p>
                </div>
                <div className="flex-1 bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
                  <p className="text-sm font-medium">Lỗi</p>
                  <p className="text-2xl font-bold">{importData.invalidRows}</p>
                </div>
              </div>
              {importData.invalidRows > 0 ? (
                <div className="text-sm text-red-600">
                  <p className="font-medium mb-2">Chi tiết lỗi:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {importData.errors.map((err, idx) => <li key={idx}>{err}</li>)}
                  </ul>
                  <Button variant="danger" className="mt-3" onClick={() => window.open("#", "_blank")}>Tải báo cáo lỗi (csv)</Button>
                </div>
              ) : (
                <p className="text-sm text-green-600 font-medium">Tất cả dữ liệu đều hợp lệ. Bạn có thể tiến hành nhập!</p>
              )}
            </div>
          )}
        </div>
      </Modal>`;

content = content.replace(modalOld, modalNew);

fs.writeFileSync('src/pages/admin/directory/DirectoryPage.jsx', content);
