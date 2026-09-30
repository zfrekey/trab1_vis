import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove single line comments that start with // 
    # but not inside strings or URLs. 
    # Actually, a simpler way: if // is the first non-whitespace character on a line, remove the whole line.
    # Or if it's at the end of a line, remove it.
    
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('//'):
            continue # skip full line comments
        if ' // ' in line:
            # strip trailing comment
            line = line.split(' // ')[0].rstrip()
        elif ';// ' in line:
            line = line.split(';// ')[0] + ';'
        new_lines.append(line)
        
    new_content = '\n'.join(new_lines)
    
    # Remove multiple blank lines
    new_content = re.sub(r'\n{3,}', '\n\n', new_content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Cleaned {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.js') or file.endswith('.css'):
            process_file(os.path.join(root, file))
