#!/usr/bin/env python3
"""
Compile training-plan.jsx into a standalone, pre-compiled HTML page.

This script implements the proven build pipeline for farangoth/training-claude:
  1. Strip ES module `import` lines (React/ReactDOM are loaded as globals via CDN)
  2. Swap localStorage calls for an in-memory window store (artifacts can't use localStorage)
  3. Remove `export default` from the App component
  4. Prepend `var useState = React.useState;` etc. (avoids const-redeclaration errors
     under Babel's strict mode when the source file also has its own hook imports)
  5. Compile JSX -> plain JS with Babel using the CLASSIC runtime (React.createElement),
     NOT the automatic jsx-dev-runtime, which would require an extra import the browser
     can't resolve
  6. Target modern evergreen browsers (Chrome/Firefox 90+, Safari 14+) with
     @babel/preset-env so async/await and other modern syntax pass through natively
     instead of being polyfilled into a huge bundle
  7. Assemble the final single-file HTML with React 18 + ReactDOM 18 from cdnjs

USAGE:
    python3 compile_training_html.py <input.jsx> <output.html>

REQUIRES:
    Node.js + npm packages: @babel/core @babel/preset-react @babel/preset-env @babel/cli
    (install once with: npm install @babel/core @babel/preset-react @babel/preset-env @babel/cli --save-dev)

WHY NOT BABEL-IN-BROWSER:
    An earlier version of this pipeline shipped raw JSX + the Babel standalone runtime
    to the browser, transpiling on every page load. At ~150KB of JSX this made the page
    take so long to parse/transpile that GitHub's html preview reported the file as
    "too big to load". Pre-compiling at build time fixes this at the root: the browser
    only ever sees plain ES5-ish JS, React.createElement calls, no transpiler needed.
"""
import re
import subprocess
import sys
import os


def find_babel_binary():
    candidates = [
        'node_modules/.bin/babel',
        os.path.expanduser('~/.npm-global/bin/babel'),
        '/usr/local/bin/babel',
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    # Fall back to whatever's on PATH
    from shutil import which
    found = which('babel')
    if found:
        return found
    return None


def transform_jsx(jsx: str) -> str:
    """Apply the source transformations described in the module docstring."""
    # 1. Strip ALL import lines (React/ReactDOM become globals via CDN script tags)
    jsx_body = '\n'.join(l for l in jsx.split('\n') if not l.startswith('import '))

    # 2. Swap localStorage for an in-memory window store.
    #    Claude artifacts and many sandboxed iframes (incl. GitHub Pages previews
    #    embedded elsewhere) can throw on localStorage access — using a plain JS
    #    object on `window` sidesteps this entirely and still persists for the
    #    lifetime of the page.
    jsx_body = jsx_body.replace(
        'const STORAGE_KEY = "clement_training_v2";',
        'const STORAGE_KEY = "clement_training_v2";\n'
        'if (!window._trainingStore) window._trainingStore = {};'
    )
    jsx_body = re.sub(
        r'function loadState\(\) \{[^}]+\}',
        'function loadState() {\n'
        '  try { return window._trainingStore[STORAGE_KEY] ? '
        'JSON.parse(window._trainingStore[STORAGE_KEY]) : null; } catch { return null; }\n'
        '}',
        jsx_body,
    )
    jsx_body = re.sub(
        r'function saveState\(s\) \{[^}]+\}',
        'function saveState(s) {\n'
        '  try { window._trainingStore[STORAGE_KEY] = JSON.stringify(s); } catch {}\n'
        '}',
        jsx_body,
    )

    # 3. Remove `export default` from the App component (no ES modules in the output)
    jsx_body = jsx_body.replace('export default function App() {', 'function App() {')

    # 4. Prepend hook globals using `var` (not `const`) so re-declarations anywhere
    #    else in the file (e.g. a leftover `import { useState } from "react"` that
    #    step 1 already stripped, or a duplicate destructure) don't cause a
    #    "Identifier has already been declared" SyntaxError under Babel.
    jsx_body = (
        '/* React globals from CDN — see compile_training_html.py for why */\n'
        'var useState = React.useState;\n'
        'var useEffect = React.useEffect;\n\n'
    ) + jsx_body

    # 5. Render with React.createElement directly — no JSX needed for this one line,
    #    keeps the entry point unambiguous.
    jsx_body += (
        "\n\nReactDOM.render(React.createElement(App, null), "
        "document.getElementById('root'));"
    )

    return jsx_body


def compile_with_babel(input_jsx_path: str, output_js_path: str):
    babel_bin = find_babel_binary()
    if not babel_bin:
        print(
            "ERROR: babel binary not found. Install with:\n"
            "  npm install @babel/core @babel/preset-react @babel/preset-env @babel/cli --save-dev",
            file=sys.stderr,
        )
        sys.exit(1)

    babel_config_path = '/tmp/_training_babel.config.json'
    with open(babel_config_path, 'w') as f:
        # CLASSIC runtime = React.createElement output, no extra jsx-runtime import.
        # Modern targets = async/await and other ES2017+ syntax pass through natively
        # instead of being polyfilled, which keeps output size much smaller.
        f.write(
            '{"presets":[["@babel/preset-react",{"runtime":"classic"}],'
            '["@babel/preset-env",{"targets":{"chrome":"90","firefox":"90","safari":"14"},'
            '"modules":false}]]}'
        )

    result = subprocess.run(
        [babel_bin, input_jsx_path, '--config-file', babel_config_path,
         '--out-file', output_js_path],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print("Babel compilation FAILED:", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        sys.exit(1)


def assemble_html(compiled_js: str, title: str = "Training Plan") -> str:
    # Babel can occasionally leave a stray `export` on re-exported helpers;
    # strip any leading `export` keyword defensively since this is a plain
    # <script> tag, not an ES module.
    compiled_js = re.sub(r'^export\s+', '', compiled_js, flags=re.MULTILINE)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
<style>
* {{ box-sizing: border-box; }}
body {{ margin: 0; padding: 0; background: #080b12; }}
#root {{ min-height: 100vh; }}
input, textarea, button, select {{ font-family: inherit; }}
::-webkit-scrollbar {{ width: 6px; height: 6px; }}
::-webkit-scrollbar-track {{ background: #0d1018; }}
::-webkit-scrollbar-thumb {{ background: #1e2535; border-radius: 3px; }}
::-webkit-scrollbar-thumb:hover {{ background: #2d3748; }}
</style>
</head>
<body>
<div id="root">
  <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#080b12;color:#475569;font-family:monospace;font-size:13px;letter-spacing:0.08em;">
    LOADING TRAINING PLAN...
  </div>
</div>
<script>
{compiled_js}
</script>
</body>
</html>"""


def main():
    if len(sys.argv) != 3:
        print(f"Usage: python3 {sys.argv[0]} <input.jsx> <output.html>", file=sys.stderr)
        sys.exit(1)

    input_path, output_path = sys.argv[1], sys.argv[2]

    with open(input_path, 'r', encoding='utf-8') as f:
        jsx = f.read()

    print(f"Input JSX: {len(jsx):,} chars")

    transformed = transform_jsx(jsx)
    tmp_input = '/tmp/_training_plan_transformed.jsx'
    with open(tmp_input, 'w', encoding='utf-8') as f:
        f.write(transformed)

    tmp_compiled = '/tmp/_training_plan_compiled.js'
    print("Compiling with Babel (classic runtime, modern targets)...")
    compile_with_babel(tmp_input, tmp_compiled)

    with open(tmp_compiled, 'r', encoding='utf-8') as f:
        compiled_js = f.read()
    print(f"Compiled JS: {len(compiled_js.encode())//1024} KB")

    html = assemble_html(compiled_js)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Built {output_path}: {len(html.encode())//1024} KB")


if __name__ == '__main__':
    main()
