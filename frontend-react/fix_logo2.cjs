const fs = require('fs');
let path = 'src/components/ui/AppLayout.jsx';
let content = fs.readFileSync(path, 'utf-8');

const regex = /<span className="flex size-9[\s\S]*?Rèn Luyện\s*<\/span>/m;
const newLogo = `<img src="/logoVJU.png" alt="VJU Logo" className="h-[46px] object-contain" />`;

content = content.replace(regex, newLogo);
fs.writeFileSync(path, content);
