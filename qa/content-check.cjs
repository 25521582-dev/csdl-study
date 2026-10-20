const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const sandbox = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/data.js'),'utf8'),sandbox);
const {topics,questions} = sandbox.window.CSDL_DATA;
assert.equal(topics.length,12);
assert.equal(questions.length,144);
assert.equal(new Set(questions.map(q=>q.id)).size,144);
assert.equal(new Set(questions.map(q=>q.prompt)).size,144);
for(const t of topics){
  assert.equal(questions.filter(q=>q.topic===t.id).length,12,t.id);
  assert.ok(t.notes.length>=4);
  assert.ok(t.source.startsWith('https://courses.uit.edu.vn/'));
}
const distribution=[0,0,0,0];
for(const q of questions){
  assert.ok(topics.some(t=>t.id===q.topic));
  assert.equal(q.options.length,4);
  assert.equal(new Set(q.options).size,4,q.id);
  assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);
  assert.ok(q.options.every(s=>typeof s==='string'&&s.trim()));
  assert.ok(q.explanation.length>=25,q.id);
  distribution[q.answer]++;
}
assert.deepEqual(distribution,[36,36,36,36]);
console.log('PASS: 144 unique questions, 12 topics, explanations, source links, balanced correct-answer positions.');
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/lectures.js'),'utf8'),sandbox);
const {lessons,dataset,fixture}=sandbox.window.CSDL_LECTURES;
assert.equal(Object.keys(lessons).length,12);
assert.equal(dataset.length,3);
assert.ok(fixture.includes('INSERT INTO Student'));
let sections=0,exercises=0;
for(const topic of topics){
  const lesson=lessons[topic.id];
  assert.ok(lesson,topic.id);
  assert.equal(lesson.sections.length,6,topic.id);
  assert.equal(lesson.exercises.length,3,topic.id);
  assert.ok(lesson.objectives.length>=3);
  for(const section of lesson.sections){
    assert.ok(section.title.trim());
    assert.ok(section.blocks.length>=2,topic.id+': '+section.title);
    for(const block of section.blocks){
      assert.ok(['paragraph','list','code','table','example','callout'].includes(block.type));
      if(block.type==='table'||block.type==='example')for(const row of block.rows)assert.equal(row.length,block.headers.length);
    }
  }
  for(const exercise of lesson.exercises){assert.ok(exercise.question.length>15);assert.ok(exercise.answer.length>30);}
  sections+=lesson.sections.length;exercises+=lesson.exercises.length;
}
console.log(`PASS: 12 detailed chapters, ${sections} sections and ${exercises} self-check exercises with solutions.`);
