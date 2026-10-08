const fs = require('fs');
let path = 'src/components/ui/AppLayout.jsx';
let content = fs.readFileSync(path, 'utf-8');

content = content.replace('{activeItem?.label ?? "E-DRL"}', '{activeItem?.label ?? ""}');
fs.writeFileSync(path, content);
