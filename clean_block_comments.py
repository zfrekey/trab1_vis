import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
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
