const fs = require('fs');
const file = 'frontend/src/components/coordinator/LaunchStudyForm.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
    { regex: /bg-\[#1a1a1a\]/g, replace: 'bg-[#0F172A]' },
    { regex: /bg-\[#2a2a2a\]/g, replace: 'bg-white/5' },
    { regex: /bg-\[#2a2d34\]/g, replace: 'bg-white/5' },
    { regex: /bg-\[#1e2025\]/g, replace: 'bg-[#0B101B]' },
    { regex: /border-\[#3a3a3a\]/g, replace: 'border-white/10' },
    { regex: /border-\[#3a3d45\]/g, replace: 'border-white/10' },
    { regex: /bg-\[#29a775\]/g, replace: 'bg-blue-600' },
    { regex: /text-\[#29a775\]/g, replace: 'text-blue-400' },
    { regex: /focus:border-\[#29a775\]/g, replace: 'focus:border-blue-500' },
    { regex: /focus:ring-\[#29a775\]/g, replace: 'focus:ring-blue-500' },
    { regex: /hover:bg-\[#32363e\]/g, replace: 'hover:bg-white/10' },
    { regex: /hover:bg-\[#333333\]/g, replace: 'hover:bg-white/10' },
    { regex: /hover:border-\[#29a775\]/g, replace: 'hover:border-blue-500' },
    { regex: /text-\[#e0d6c8\]/g, replace: 'text-slate-300' },
    { regex: /text-\[#a0a0a0\]/g, replace: 'text-slate-400' },
    { regex: /bg-\[#32363e\]/g, replace: 'bg-white/10' },
    { regex: /hover:bg-\[#3d424b\]/g, replace: 'hover:bg-white/20' }
];

replacements.forEach(({regex, replace}) => {
    content = content.replace(regex, replace);
});

fs.writeFileSync(file, content, 'utf8');
console.log('Colors replaced successfully!');
