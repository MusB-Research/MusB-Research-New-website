import os
import re

directory = r"d:\MusB Research Website-1\frontend\src\components\pi"
dashboard = r"d:\MusB Research Website-1\frontend\src\views\PIDashboard.tsx"

files_to_process = [dashboard]
for root, dirs, files in os.walk(directory):
    for fn in files:
        if fn.endswith((".tsx", ".ts")):
            files_to_process.append(os.path.join(root, fn))

def bump_text_size(content):
    import re
    def repl(m):
        size = m.group(1)
        if size == '9px': return 'text-xs'
        if size == '10px': return 'text-xs'
        if size == '11px': return 'text-[13px]'
        if size == '12px': return 'text-sm'
        if size == '13px': return 'text-base'
        return m.group(0)
    return re.sub(r'text-\[(9px|10px|11px|12px|13px)\]', repl, content)

for filepath in files_to_process:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = bump_text_size(content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Bumped text sizes in {os.path.basename(filepath)}")

print("Done.")
