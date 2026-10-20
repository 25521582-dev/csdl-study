"""Compare all imported choices and correct answers with the supplied review PDF.

Usage: python3 qa/pdf-import-check.py /path/to/review.pdf
The original PDF stays outside the repository.
"""
import json
from pathlib import Path
import re
import subprocess
import sys
import unicodedata

root = Path(__file__).resolve().parents[1]
script = """
const fs=require('node:fs'),vm=require('node:vm');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8'),sandbox);
console.log(JSON.stringify(sandbox.window.CSDL_ASSESSMENTS[0].questions));
"""
questions = json.loads(subprocess.check_output(['node', '-e', script, str(root/'dist/assessments.js')], text=True))
text = subprocess.check_output(['pdftotext', '-layout', sys.argv[1], '-'], text=True)
blocks = list(re.finditer(r'Câu hỏi\s+(\d+)\b', text))
assert len(blocks) == len(questions) == 40

def normalize(value):
    value = unicodedata.normalize('NFC', value)
    return re.sub(r'[\s\uf058\uf057]', '', value)

for i, match in enumerate(blocks):
    number = int(match.group(1))
    end = blocks[i+1].start() if i+1 < len(blocks) else len(text)
    block = text[match.end():end]
    stem, answer = block.split('The correct answer is:', 1)
    choices = re.findall(r'^\s*[a-d]\.\s+(.+?)(?=^\s*[a-d]\.\s+|\Z)', stem, flags=re.M|re.S)
    assert len(choices) == 4, number
    q = questions[number-1]
    assert q['sourceNumber'] == number
    assert q['sourcePage'] == text[:match.start()].count('\f') + 1, number
    for index, choice in enumerate(choices):
        assert normalize(choice) == normalize(q['options'][index]), (number, index, choice, q['options'][index])
    correct = answer.strip().split('\n\n', 1)[0]
    assert normalize(correct) == normalize(q['options'][q['answer']]), (number, correct, q['options'][q['answer']])
print('PASS: all 40 question numbers, 160 choices and 40 correct answers match the original PDF (ignoring extraction spacing/check marks).')
