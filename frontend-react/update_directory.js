const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/directory/DirectoryPage.jsx', 'utf-8');

// Add states
content = content.replace(
  'const [deans, setDeans] = useState([])',
  'const [deans, setDeans] = useState([])\n  const [colConfig, setColConfig] = useState(false)\n  const [hiddenCols, setHiddenCols] = useState({})\n  const [importExcel, setImportExcel] = useState(false)'
);

// Filter columns
content = content.replace(
  '        <Table',
  '        <Table\n          columns={columns.filter(c => !hiddenCols[c.key])}'
);
content = content.replace(
  '          columns={columns}',
  '' // Removed this line since we added it above
);

// Update toolbar buttons for departments
content = content.replace(
  '<Settings className="size-4" /> Cấu hình cột',
  '<Settings className="size-4" /> Cấu hình cột\n          </Button>'
);
content = content.replace(
  '<Button>\n            <Settings className="size-4" /> Cấu hình cột\n          </Button>',
  '<Button onClick={() => setColConfig(true)}>\n            <Settings className="size-4" /> Cấu hình cột\n          </Button>'
);

content = content.replace(
  '<Button>\n            <Upload className="size-4" /> Nhập từ Excel\n          </Button>',
  '<Button onClick={() => setImportExcel(true)}>\n            <Upload className="size-4" /> Nhập từ Excel\n          </Button>'
);

content = content.replace(
  '<Button>\n            <Download className="size-4" /> Tải file mẫu\n          </Button>',
  '<Button onClick={() => window.open("/api/v1/directory/users/template-excel", "_blank")}>\n            <Download className="size-4" /> Tải file mẫu\n          </Button>'
);

// Add modals at the end
const modals = `
      <Modal
        open={colConfig}
        title="Cấu hình cột hiển thị"
        onClose={() => setColConfig(false)}
        footer={<Button variant="primary" onClick={() => setColConfig(false)}>Xong</Button>}
      >
        <div className="space-y-3">
          <p className="text-sm text-muted">Chọn các cột bạn muốn hiển thị trên lưới dữ liệu (Cột xuất Excel sẽ tải về tương ứng):</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {columns.map(c => (
              <label key={c.key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded border-line text-brand focus:ring-brand"
                  checked={!hiddenCols[c.key]}
                  onChange={(e) => setHiddenCols(prev => ({...prev, [c.key]: !e.target.checked}))}
                />
                {c.title.replace(" *", "")}
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
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
          <div className="rounded-lg border-2 border-dashed border-line p-8 text-center hover:bg-canvas cursor-pointer transition">
            <Upload className="size-8 text-muted mx-auto mb-3" />
            <p className="font-medium">Kéo thả file Excel vào đây</p>
            <p className="text-sm text-muted mt-1">hoặc click để chọn file từ máy tính</p>
          </div>
          <div className="text-sm text-muted">
            <ul className="list-disc pl-5 space-y-1">
              <li>Chỉ chấp nhận file .xlsx, .xls</li>
              <li>Dung lượng tối đa 50MB</li>
              <li>Vui lòng sử dụng file mẫu để đảm bảo đúng định dạng</li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  )
}
`;
content = content.replace('    </>\n  )\n}', modals);

fs.writeFileSync('src/pages/admin/directory/DirectoryPage.jsx', content);
