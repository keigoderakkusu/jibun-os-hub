import json
import subprocess

filepath = "/Users/nagahamakeigo/Desktop/windowsパソコン/【仕事用】/アンチグラビティ　２/n8n_sns_affiliate/n8n_workflow.json"
with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

for node in data['nodes']:
    if node['name'] == 'Google Sheets':
        node['parameters']['documentId']['value'] = "1AKQuY8swWLQjSjV-5A5o0cejtI7WBQ-j6K4GIoj9W7M"

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
