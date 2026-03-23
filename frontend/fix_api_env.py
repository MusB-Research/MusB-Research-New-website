import os
import re

def fix_files():
    src_dir = r"d:\MusB Research Website-1\frontend\src"
    
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                path = os.path.join(root, file)
                
                # Skip the file that defines API to avoid circular logic in my regex
                if file == 'auth.ts' and 'utils' in root:
                    continue
                
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if 'import.meta.env.VITE_API_URL' in content:
                    # 1. Replace the env usage with API
                    new_content = content.replace('import.meta.env.VITE_API_URL', 'API')
                    
                    # 2. Add import for API from utils/auth if not already there
                    # Determine how many levels up utils/auth is
                    rel_to_src = os.path.relpath(root, src_dir)
                    if rel_to_src == '.':
                        import_path = './utils/auth'
                    else:
                        levels = rel_to_src.count(os.sep) + 1
                        import_path = '../' * levels + 'utils/auth'
                    
                    # Check if any from utils/auth is imported
                    if 'utils/auth' in new_content:
                        # Existing import, just add API to it
                        new_content = re.sub(r'import\s+\{\s*([^}]*)\s*\}\s+from\s+[\'"]([^\'"]*utils/auth)[\'"]', 
                                            lambda m: f"import {{ {m.group(1)}, API }} from '{m.group(2)}'", 
                                            new_content)
                        # Clean up duplicate APIs in imports
                        new_content = new_content.replace(', API, API', ', API')
                        new_content = new_content.replace('{ API, API }', '{ API }')
                        new_content = new_content.replace('{ API,', '{ API,') # remove leading space if any
                    else:
                        # New import
                        new_content = f"import {{ API }} from '{import_path}';\n" + new_content
                    
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed: {path}")

if __name__ == "__main__":
    fix_files()
