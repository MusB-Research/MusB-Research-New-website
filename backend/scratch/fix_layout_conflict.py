import re
import os

def fix_layout():
    p = 'c:/Users/baren/OneDrive/Desktop/MusB Research Website-1/frontend/src/components/Layout.tsx'
    if not os.path.exists(p): return
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()
    
    pattern = r'<<<<<<< HEAD.*?=======.*?>>>>>>> [a-f0-9]+'
    replacement = 'className="w-[38px] h-[38px] rounded-full border-[1.5px] border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all shrink-0 ml-1"\n                                            title="Logout"'
    
    new_c = re.sub(pattern, replacement, c, flags=re.DOTALL)
    
    with open(p, 'w', encoding='utf-8') as f:
        f.write(new_c)

if __name__ == "__main__":
    fix_layout()
