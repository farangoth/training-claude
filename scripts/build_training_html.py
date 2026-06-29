import re

with open('training-plan.jsx', 'r', encoding='utf-8') as f:
    jsx = f.read()

# Strip ES module imports
lines = jsx.split('\n')
body_lines = []
skip = True
for line in lines:
    if skip and line.startswith('import '):
        continue
    skip = False
    body_lines.append(line)
jsx_body = '\n'.join(body_lines)

# Swap localStorage for in-memory window store
jsx_body = jsx_body.replace(
    'const STORAGE_KEY = "clement_training_v2";',
    'const STORAGE_KEY = "clement_training_v2";\nif (!window._trainingStore) window._trainingStore = {};'
)
jsx_body = re.sub(
    r'function loadState\(\) \{[^}]+\}',
    'function loadState() {\n  try { return window._trainingStore[STORAGE_KEY] ? JSON.parse(window._trainingStore[STORAGE_KEY]) : null; } catch { return null; }\n}',
    jsx_body
)
jsx_body = re.sub(
    r'function saveState\(s\) \{[^}]+\}',
    'function saveState(s) {\n  try { window._trainingStore[STORAGE_KEY] = JSON.stringify(s); } catch {}\n}',
    jsx_body
)
jsx_body = jsx_body.replace('export default function App() {', 'function App() {')
jsx_body += '\n\nconst { useState, useEffect } = React;\nReactDOM.render(<App />, document.getElementById(\'root\'));'

html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Snowdon SkyRace Training Plan</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js"></script>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; background: #080b12; }
  #root { min-height: 100vh; }
  input, textarea, button, select { font-family: inherit; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #0d1018; }
  ::-webkit-scrollbar-thumb { background: #1e2535; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #2d3748; }
</style>
</head>
<body>
<div id="root">
  <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#080b12;color:#475569;font-family:monospace;font-size:13px;letter-spacing:0.08em;">
    LOADING TRAINING PLAN...
  </div>
</div>
<script type="text/babel">
""" + jsx_body + """
</script>
</body>
</html>"""

with open('training-plan.html', 'w', encoding='utf-8') as f:
    f.write(html)

print(f"Built training-plan.html ({len(html):,} chars)")
