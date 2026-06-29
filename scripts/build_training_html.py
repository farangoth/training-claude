import re, subprocess, sys, os

with open('training-plan.jsx', 'r', encoding='utf-8') as f:
    jsx = f.read()

# 1. Strip ALL import lines
jsx_body = '\n'.join(l for l in jsx.split('\n') if not l.startswith('import '))

# 2. Swap localStorage for in-memory window store
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

# 3. Remove export default
jsx_body = jsx_body.replace('export default function App() {', 'function App() {')

# 4. Prepend React hook globals (var avoids const redeclaration under strict Babel)
jsx_body = '/* React globals from CDN */\nvar useState = React.useState;\nvar useEffect = React.useEffect;\n\n' + jsx_body

# 5. Add render call
jsx_body += "\n\nReactDOM.render(React.createElement(App, null), document.getElementById('root'));"

with open('/tmp/_training_plan_input.jsx', 'w', encoding='utf-8') as f:
    f.write(jsx_body)

# 6. Babel config: classic JSX runtime, modern browser targets (Chrome/FF/Safari 90+)
with open('/tmp/babel.config.json', 'w') as f:
    f.write('{"presets":[["@babel/preset-react",{"runtime":"classic"}],["@babel/preset-env",{"targets":{"chrome":"90","firefox":"90","safari":"14"},"modules":false}]]}')

print('Compiling JSX with Babel...')
babel_bin = next(
    (b for b in ['node_modules/.bin/babel', os.path.expanduser('~/.npm-global/bin/babel')]
     if os.path.exists(b)), None
)
if not babel_bin:
    print('ERROR: babel not found'); sys.exit(1)

result = subprocess.run(
    [babel_bin, '/tmp/_training_plan_input.jsx',
     '--config-file', '/tmp/babel.config.json',
     '--out-file', '/tmp/_training_plan_compiled.js'],
    capture_output=True, text=True
)
if result.returncode != 0:
    print(result.stderr[:3000]); sys.exit(1)

with open('/tmp/_training_plan_compiled.js', 'r', encoding='utf-8') as f:
    compiled_js = f.read()

compiled_js = re.sub(r'^export\s+', '', compiled_js, flags=re.MULTILINE)
print(f'Compiled: {len(compiled_js.encode())//1024} KB')

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
print(f'Built: {len(html.encode())//1024} KB')
