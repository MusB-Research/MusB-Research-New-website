import os
import re

directory = r"d:\MusB Research Website-1\frontend\src\components\pi"
dashboard = r"d:\MusB Research Website-1\frontend\src\views\PIDashboard.tsx"

files_to_process = [dashboard]
for root, dirs, files in os.walk(directory):
    for fn in files:
        if fn.endswith((".tsx", ".ts")):
            files_to_process.append(os.path.join(root, fn))

pattern = re.compile(r'(?<![A-Za-z0-9-])(text|bg|border|shadow|ring|from|to|via)-(blue|indigo)-(\d{2,3})(/\d{1,3}|/\[[0-9.]+\])?\b')

def replace_match(match):
    return f"{match.group(1)}-teal-{match.group(3)}{match.group(4) or ''}"

for filepath in files_to_process:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = pattern.sub(replace_match, content)
    
    # Inline styles replacement for PITeamModule
    new_content = new_content.replace('rgba(99, 102, 241', 'rgba(20, 184, 166')
    new_content = new_content.replace('#6366f1', '#14b8a6')
    new_content = new_content.replace('#4f46e5', '#0d9488')
    new_content = new_content.replace('#818cf8', '#2dd4bf')
    new_content = new_content.replace('rgba(59, 130, 246', 'rgba(20, 184, 166')
    new_content = new_content.replace('#3b82f6', '#14b8a6')
    new_content = new_content.replace('#2563eb', '#0d9488')
    new_content = new_content.replace('#60a5fa', '#2dd4bf')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {os.path.basename(filepath)}")

print("Done.")
