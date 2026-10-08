const fs = require('fs');

let jsx = fs.readFileSync('src/pages/admin/directory/DirectoryPage.jsx', 'utf-8');

if (!jsx.includes('import toast from "react-hot-toast"')) {
    jsx = 'import toast from "react-hot-toast";\n' + jsx;
}

// remove setBlocked logic
jsx = jsx.replace('const [blocked, setBlocked] = useState(null)', '');

jsx = jsx.replace(/catch \(e\) \{\n              setBlocked\(e\.response\?\.data\?\.message \|\| "Không thể vô hiệu hóa"\);\n            \}/g, `catch (e) {
              toast.error(e.response?.data?.message || "Không thể vô hiệu hóa");
            }`);

let modalRegex = /<Modal\s+open=\{\!\!blocked\}[\s\S]*?<\/Modal>/g;
jsx = jsx.replace(modalRegex, '');

fs.writeFileSync('src/pages/admin/directory/DirectoryPage.jsx', jsx);
