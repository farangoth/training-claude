import re, subprocess, sys, os

with open('training-plan.jsx', 'r', encoding='utf-8') as f:
    jsx = f.read()

# ── 1. Strip ES module imports ────────────────────────────────────────────────
lines = jsx.split('\n')
body_lines = []
skip = True
for line in lines:
    if skip and line.startswith('import '):
        continue
    skip = False
    body_lines.append(line)
jsx_body = '\n'.join(body_lines)

# ── 2. Swap localStorage for in-memory window store ───────────────────────────
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

# ── 3. Remove export default, add ReactDOM.render ────────────────────────────
jsx_body = jsx_body.replace('export default function App() {', 'function App() {')
jsx_body += '\n\nconst { useState, useEffect } = React;\nReactDOM.render(<App />, document.getElementById(\'root\'));'

# ── 4. Write JSX to temp file ─────────────────────────────────────────────────
with open('/tmp/_training_plan_input.jsx', 'w', encoding='utf-8') as f:
    f.write(jsx_body)

# ── 5. Compile JSX → plain JS via Babel CLI ───────────────────────────────────
print('Compiling JSX with Babel...')
result = subprocess.run(
    [
        'node_modules/.bin/babel',
        '/tmp/_training_plan_input.jsx',
        '--presets', '@babel/preset-react',
        '--out-file', '/tmp/_training_plan_compiled.js',
        '--no-babelrc',
    ],
    capture_output=True, text=True
)
if result.returncode != 0:
    print('Babel error:', result.stderr)
    sys.exit(1)
print('Babel compilation successful.')

with open('/tmp/_training_plan_compiled.js', 'r', encoding='utf-8') as f:
    compiled_js = f.read()

print(f'Compiled JS size: {len(compiled_js):,} chars')

# ── 6. Assemble final HTML ────────────────────────────────────────────────────
html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Training Plan \u2014 Cl\u00e9ment Savalle-Anthonioz</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
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
<script>
""" + compiled_js + """
</script>
</body>
</html>"""

with open('training-plan.html', 'w', encoding='utf-8') as f:
    f.write(html)

print(f'Built training-plan.html ({len(html):,} chars)')
