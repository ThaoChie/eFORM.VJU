const fs = require('fs');
let path = 'src/components/ui/AppLayout.jsx';
let content = fs.readFileSync(path, 'utf-8');

const regex = /<img src="\/logoVJU\.png" alt="VJU Logo" className="h-\[46px\] object-contain" \/>/;
const newLogo = `<img src="/logoVJU.png" alt="VJU Logo" className="h-[46px] object-contain" />
          <span className="min-w-0 font-semibold leading-5 text-brand">
            E-Form Điểm
            <br />
            Rèn Luyện
          </span>`;

content = content.replace(regex, newLogo);
fs.writeFileSync(path, content);
