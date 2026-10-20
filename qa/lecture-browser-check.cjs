// NODE_PATH=/tmp/csdl-study-qa/node_modules node qa/lecture-browser-check.cjs
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const out='/tmp/csdl-study-qa';
fs.mkdirSync(out,{recursive:true});
const KEY='csdl-studio-v1';
const seed={version:1,stats:{'null-1':{attempts:2,correct:1,lastCorrect:true}},bookmarks:['basic-1'],history:[],session:null,lastResult:null};
async function go(page,hash){
  await page.evaluate(h=>{location.hash=h;},hash);
  await page.waitForURL('**/#'+hash);
  await page.waitForTimeout(60);
}
(async()=>{
  const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({key,seed})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(seed));},{key:KEY,seed});
  try{
    await page.goto('http://localhost:8088/#notes');
    await page.locator('#note-intro').waitFor();
    assert.equal(await page.locator('.reader-index>a').count(),12);
    assert.equal(await page.locator('.lecture-section').count(),6);
    assert.equal(await page.locator('.lesson-exercise').count(),3);
    await page.screenshot({path:path.join(out,'lectures-desktop.png')});
    await page.locator('.reader-index>a[href="#notes?topic=joins"]').click();
    await page.locator('#note-joins').waitFor();
    await page.locator('[data-target="lesson-joins-2"]').click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'lesson-joins-2');
    await page.locator('.lesson-dataset>summary').click();
    assert.equal(await page.locator('.dataset-body .lecture-table:visible').count(),3);
    await page.locator('.fixture-code>summary').click();
    assert.ok((await page.locator('.fixture-code code').innerText()).includes('INSERT INTO Apply'));
    await page.evaluate(()=>{window.__copied=[];navigator.clipboard.writeText=async text=>window.__copied.push(text);});
    await page.locator('.fixture-code [data-action="copy-code"]').click();
    assert.ok((await page.evaluate(()=>window.__copied[0])).includes('CREATE TABLE Student'));
    await page.locator('.lesson-exercise').first().locator('summary').click();
    await page.locator('.lesson-exercise').first().locator('.exercise-answer').waitFor({state:'visible'});
    await page.locator('.reader-modes a').nth(1).click();
    await page.locator('.quick-notes').waitFor();
    assert.equal(await page.locator('.lecture-section').count(),0);
    await page.locator('.quick-notes>a').click();
    await page.locator('.lecture-section').first().waitFor();
    assert.equal(await page.locator('.lecture-section').count(),6);
    await page.locator('.chapter-pagination .next-chapter').click();
    await page.locator('#note-aggregation').waitFor();
    await page.locator('.chapter-pagination>a').first().click();
    await page.locator('#note-joins').waitFor();
    const ids=await page.evaluate(()=>window.CSDL_DATA.topics.map(t=>t.id));
    for(const id of ids){
      await go(page,'notes?topic='+id);
      await page.locator('#note-'+id).waitFor();
      assert.equal(await page.locator('.lecture-section').count(),6,id);
      assert.equal(await page.locator('.lesson-exercise').count(),3,id);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,id);
    }
    // Reading and navigating must not erase or rewrite quiz progress.
    assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY),seed);
    await page.setViewportSize({width:390,height:844});
    for(const id of ids){
      await page.locator('#lesson-select').selectOption(id);
      await page.locator('#note-'+id).waitFor();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'mobile '+id);
    }
    await page.locator('#lesson-select').selectOption('aggregation');
    await page.locator('#note-aggregation').waitFor();
    await page.screenshot({path:path.join(out,'lectures-mobile.png')});
    await page.locator('.worked-example').first().scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(out,'lecture-example-mobile.png')});
    await page.reload();
    await page.locator('#note-aggregation').waitFor();
    await page.locator('[data-action="topic-start"][data-topic="aggregation"]').click();
    await page.waitForURL('**/#quiz');
    const session=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).session,KEY);
    assert.equal(session.items.length,12);
    assert.equal(session.topic,'aggregation');
    assert.deepEqual(errors,[]);
    console.log('PASS: all 12 detailed chapters, quick view, chapter/section navigation, example tables, dataset SQL, copying, exercise answers, mobile layouts, deep-link reload and quiz integration; progress preserved.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
