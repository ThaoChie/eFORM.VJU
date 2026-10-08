const fs = require('fs');
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

// Add ChevronLeft, ChevronRight to lucide-react imports if not there
if (!content.includes('ChevronLeft')) {
    content = content.replace(
        'import { AlertTriangle, CircleOff, CheckCircle, Download, Pencil, Plus, Search, Settings, Upload } from "lucide-react"',
        'import { AlertTriangle, CircleOff, CheckCircle, Download, Pencil, Plus, Search, Settings, Upload, ChevronLeft, ChevronRight } from "lucide-react"'
    );
}

// Add state for page
if (!content.includes('const [page, setPage] = useState(1);')) {
    content = content.replace(
        'const [filters, setFilters] = useState({ query: "", status: "Tất cả" });',
        'const [filters, setFilters] = useState({ query: "", status: "Tất cả" });\n  const [page, setPage] = useState(1);'
    );
}

// Add effect to reset page
if (!content.includes('setPage(1);')) {
    content = content.replace(
        'useEffect(() => {\n    fetchItems(active);',
        'useEffect(() => {\n    setPage(1);\n  }, [active, filters]);\n\n  useEffect(() => {\n    fetchItems(active);'
    );
}

// Replace the Table render to use pagination
const tableRenderStr = `<Card className="p-0">
        <Table columns={columns.filter(c => !hiddenCols[c.key])} rows={rows} loading={loading} emptyMessage="Không có dữ liệu danh mục" />
      </Card>`;

const newTableRenderStr = `{(() => {
        const pageSize = 10;
        const totalPages = Math.ceil(rows.length / pageSize) || 1;
        const currentData = rows.slice((page - 1) * pageSize, page * pageSize);
        return (
          <Card className="p-0">
            <Table columns={columns.filter(c => !hiddenCols[c.key])} rows={currentData} loading={loading} emptyMessage="Không có dữ liệu danh mục" />
            <div className="flex items-center justify-between border-t border-line px-4 py-3">
              <span className="text-sm text-muted">
                Hiển thị {rows.length === 0 ? 0 : (page - 1) * pageSize + 1} đến {Math.min(page * pageSize, rows.length)} trong số {rows.length} mục
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm font-medium px-2">Trang {page} / {totalPages}</span>
                <Button variant="ghost" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })()}`;

if (content.includes(tableRenderStr)) {
    content = content.replace(tableRenderStr, newTableRenderStr);
}

fs.writeFileSync(path, content);
