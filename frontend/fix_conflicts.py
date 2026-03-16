import os

def fix_conflicts():
    src_dir = r"c:\Users\baren\OneDrive\Desktop\MusB Research Website\frontend\src"
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if not file.endswith(('.tsx', '.ts', '.css', '.html')): continue
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            new_lines = []
            in_ours = False
            in_theirs = False
            modified = False
            for line in lines:
                if line.startswith('<<<<<<< HEAD'):
                    in_ours = True
                    modified = True
                    continue
                elif line.startswith('======='):
                    if in_ours: # we were in ours
                        in_ours = False
                        in_theirs = True
                    continue
                elif line.startswith('>>>>>>>'):
                    if in_theirs: # we were in theirs
                        in_theirs = False
                    continue
                
                if in_ours:
                    new_lines.append(line)
                elif in_theirs:
                    pass
                else:
                    new_lines.append(line)
            
            if modified:
                with open(path, 'w', encoding='utf-8') as f:
                    f.writelines(new_lines)
                print(f"Fixed {path}")

if __name__ == '__main__':
    fix_conflicts()
