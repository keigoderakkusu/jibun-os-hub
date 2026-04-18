import os
import glob

target_dir = "/Users/nagahamakeigo/Desktop/windowsパソコン/【仕事用】/アンチグラビティ　２/n8n_sns_affiliate"
files = glob.glob(os.path.join(target_dir, "*"))

for f in files:
    if os.path.isfile(f) and f.endswith(('.command', '.sh', '.md', '.plist')):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        new_content = content.replace("node@20", "node@22")
        
        if content != new_content:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f"Updated {f}")
