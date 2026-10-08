const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/directory/DirectoryPage.jsx', 'utf-8');

// add import ReactSelect from 'react-select';
content = content.replace(
  'import { useDirectoryStore } from "../../../stores/useDirectoryStore"',
  'import { useDirectoryStore } from "../../../stores/useDirectoryStore"\nimport ReactSelect from "react-select";'
);

// find the render part of leaders and deputies
// Original:
/*
              <div>
                <label className="mb-1 block text-sm font-medium">Lớp trưởng</label>
                <select multiple className="w-full rounded border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none" value={classForm.leaderIds} onChange={(e) => setClassForm({...classForm, leaderIds: Array.from(e.target.selectedOptions, option => Number(option.value))})}>
                  {students.map(s => <option key={s.id} value={s.id}>{s.userCode || s.email} - {s.fullName}</option>)}
                </select>
                <span className="text-xs text-muted">Giữ Ctrl hoặc Cmd để chọn nhiều</span>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Lớp phó</label>
                <select multiple className="w-full rounded border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none" value={classForm.deputyIds} onChange={(e) => setClassForm({...classForm, deputyIds: Array.from(e.target.selectedOptions, option => Number(option.value))})}>
                  {students.map(s => <option key={s.id} value={s.id}>{s.userCode || s.email} - {s.fullName}</option>)}
                </select>
                <span className="text-xs text-muted">Giữ Ctrl hoặc Cmd để chọn nhiều</span>
              </div>
*/

let newSelects = `
              {(() => {
                const studentOptions = students.map(s => ({
                  value: s.id,
                  label: \`\${s.userCode || s.email} - \${s.fullName}\`
                }));
                const leaderOptions = studentOptions.filter(opt => !(classForm.deputyIds || []).includes(opt.value));
                const selectedLeaders = studentOptions.filter(opt => (classForm.leaderIds || []).includes(opt.value));
                
                const deputyOptions = studentOptions.filter(opt => !(classForm.leaderIds || []).includes(opt.value));
                const selectedDeputies = studentOptions.filter(opt => (classForm.deputyIds || []).includes(opt.value));

                return (
                  <>
                    <div className="z-20 relative">
                      <label className="mb-1 block text-sm font-medium">Lớp trưởng</label>
                      <ReactSelect 
                        isMulti 
                        options={leaderOptions} 
                        value={selectedLeaders}
                        onChange={(selected) => setClassForm({...classForm, leaderIds: selected ? selected.map(s => s.value) : []})}
                        placeholder="Tìm kiếm và chọn lớp trưởng..."
                        noOptionsMessage={() => "Không tìm thấy kết quả"}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                    </div>
                    <div className="z-10 relative">
                      <label className="mb-1 block text-sm font-medium">Lớp phó</label>
                      <ReactSelect 
                        isMulti 
                        options={deputyOptions} 
                        value={selectedDeputies}
                        onChange={(selected) => setClassForm({...classForm, deputyIds: selected ? selected.map(s => s.value) : []})}
                        placeholder="Tìm kiếm và chọn lớp phó..."
                        noOptionsMessage={() => "Không tìm thấy kết quả"}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                    </div>
                  </>
                );
              })()}
`;

// regex to replace both divs:
content = content.replace(/<div>\s*<label className="mb-1 block text-sm font-medium">Lớp trưởng[\s\S]*?<span className="text-xs text-muted">Giữ Ctrl hoặc Cmd để chọn nhiều<\/span>\s*<\/div>\s*<div>\s*<label className="mb-1 block text-sm font-medium">Lớp phó[\s\S]*?<span className="text-xs text-muted">Giữ Ctrl hoặc Cmd để chọn nhiều<\/span>\s*<\/div>/, newSelects.trim());

fs.writeFileSync('src/pages/admin/directory/DirectoryPage.jsx', content);
