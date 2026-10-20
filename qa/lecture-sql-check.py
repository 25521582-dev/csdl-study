"""Execute each lecture's worked SQL example against its documented fixture."""
import json
import math
from pathlib import Path
import sqlite3
import subprocess

root = Path(__file__).resolve().parents[1]
script = """
const fs=require('node:fs'),vm=require('node:vm');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8'),sandbox);
console.log(JSON.stringify(sandbox.window.CSDL_LECTURES));
"""
data = json.loads(subprocess.check_output(['node', '-e', script, str(root/'dist/lectures.js')], text=True))
checked = 0
for topic, lesson in data['lessons'].items():
    for section in lesson['sections']:
        for block in section['blocks']:
            if block['type'] != 'example':
                continue
            with sqlite3.connect(':memory:') as db:
                db.executescript(data['fixture'])
                if block['before']:
                    db.executescript(block['before'])
                cursor = db.execute(block['query'])
                actual = cursor.fetchall()
                expected = block['rows']
                label = topic + ': ' + block['title']
                assert len(cursor.description) == len(block['headers']), label
                assert len(actual) == len(expected), (label, actual, expected)
                for row, wanted in zip(actual, expected):
                    for value, target in zip(row, wanted):
                        if isinstance(target, (int, float)):
                            assert isinstance(value, (int, float)) and math.isclose(value, target, abs_tol=1e-9), (label, row, wanted)
                        else:
                            assert value == target, (label, row, wanted)
                checked += 1
assert checked >= 20
print(f'PASS: all {checked} worked SQL examples match the displayed tables, including independent UPDATE/DELETE scenarios.')
