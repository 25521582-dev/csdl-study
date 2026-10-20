// NODE_PATH=/tmp/csdl-study-qa/node_modules node qa/assessment-browser-check.cjs
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const KEY='csdl-studio-v1';
const out='/tmp/csdl-study-qa';
fs.mkdirSync(out,{recursive:true});
const getState=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
async function route(p,hash){await p.evaluate(h=>{location.hash=h;},hash);await p.waitForURL('**/#'+hash);await p.waitForTimeout(60);}
async function pick(p,correct){
  const choice=await p.evaluate(({key,correct})=>{
    const s=JSON.parse(localStorage.getItem(key)).session;
    const all=[...window.CSDL_DATA.questions,...window.CSDL_ASSESSMENTS.flatMap(a=>a.questions)];
    const q=all.find(q=>q.id===s.items[s.index].id);
    return correct?q.answer:(q.answer+1)%4;
  },{key:KEY,correct});
  await p.locator(`[data-action="answer"][data-choice="${choice}"]`).click();
}
(async()=>{
  const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto('http://localhost:8088/#assessments');
    await page.locator('.assessment-cover').waitFor();
    assert.equal(await page.locator('.assessment-preview .review-item').count(),40);
    await page.screenshot({path:out+'/assessment-library.png'});
    await page.locator('.assessment-actions a[href="#practice?set=kiem-tra-2"]').click();
    await page.locator('#bank-select').waitFor();
    assert.equal(await page.locator('#bank-select').inputValue(),'kiem-tra-2');
    assert.equal(await page.locator('#count-select').inputValue(),'40');
    assert.equal(await page.locator('#order-select').inputValue(),'original');
    assert.equal(await page.locator('#option-order-select').inputValue(),'original');
    await page.locator('#setup-form [type="submit"]').click();
    await page.waitForURL('**/#quiz');
    let s=await getState(page);
    assert.deepEqual(s.session.items.map(x=>x.id),Array.from({length:40},(_,i)=>`kt2-${String(i+1).padStart(2,'0')}`));
    assert.ok(s.session.items.every(x=>x.order.join(',')==='0,1,2,3'));
    assert.equal(await page.locator('.question-source').innerText(),'Kiểm tra lần 2 · Câu gốc 1/40 · Trang 1 PDF');
    await pick(page,true);
    await page.locator('[data-action="bookmark"]').click();
    await page.reload();
    await page.locator('.explanation').waitFor();
    assert.equal((await getState(page)).bookmarks[0],'kt2-01');
    await page.locator('[data-action="jump"][data-index="3"]').click();
    await pick(page,true);
    assert.ok((await page.locator('.context-note').innerText()).includes('ONLY_FULL_GROUP_BY'));
    await page.screenshot({path:out+'/assessment-context.png'});
    await route(page,'home');
    await page.locator('[data-action="resume"]').click();
    assert.equal((await getState(page)).session.index,3);
    await page.locator('[data-action="finish"]').first().click();
    await page.locator('#dialog-ok').click();
    await page.waitForURL('**/#results');
    s=await getState(page);
    assert.equal(s.lastResult.score,2);
    assert.equal(s.lastResult.items.length,40);
    assert.equal(Object.values(s.stats).filter(x=>!x.lastCorrect).length,38);
    await page.locator('[data-action="retry-result"]').click();
    await page.waitForURL('**/#quiz');
    assert.equal((await getState(page)).session.items.length,38);
    await pick(page,true);
    await route(page,'exam?set=kiem-tra-2');
    await page.locator('#setup-form [type="submit"]').click();
    await page.locator('#dialog-ok').click();
    await page.waitForURL('**/#quiz');
    for(let i=0;i<40;i++){
      await pick(page,true);
      assert.equal(await page.locator('.explanation').count(),0);
      assert.equal(await page.locator('.context-note').count(),0);
      if(i<39)await page.locator('[data-action="next"]').click();
    }
    await page.locator('[data-action="finish"]').first().click();
    await page.locator('#dialog-ok').click();
    await page.waitForURL('**/#results');
    s=await getState(page);
    assert.equal(s.lastResult.score,40);
    assert.equal(Object.values(s.stats).filter(x=>!x.lastCorrect).length,0);
    await page.locator('#review-wrong-only').uncheck();
    assert.equal(await page.locator('#result-review .review-item').count(),40);
    await page.locator('#result-review .review-item').nth(34).locator('summary').click();
    assert.ok((await page.locator('#result-review .review-item').nth(34).innerText()).includes('phiên bản 16'));
    await route(page,'practice');
    await page.locator('#bank-select').selectOption('all');
    assert.ok((await page.locator('#pool-note').innerText()).includes('184'));
    await page.locator('#bank-select').selectOption('curated');
    assert.ok((await page.locator('#pool-note').innerText()).includes('144'));
    await page.locator('#bank-select').selectOption('kiem-tra-2');
    await page.locator('#topic-select').selectOption('indexes');
    assert.equal(await page.locator('#setup-form [type="submit"]').isDisabled(),true);
    await page.locator('#topic-select').selectOption('all');
    await page.locator('#order-select').selectOption('shuffle');
    await page.locator('#option-order-select').selectOption('shuffle');
    await page.locator('#setup-form [type="submit"]').click();
    await page.waitForURL('**/#quiz');
    s=await getState(page);
    assert.equal(new Set(s.session.items.map(x=>x.id)).size,40);
    assert.ok(s.session.items.every(x=>x.id.startsWith('kt2-')));
    await page.setViewportSize({width:390,height:844});
    // Long SQL choices in Q26 must wrap without document overflow.
    const index=s.session.items.findIndex(x=>x.id==='kt2-26');
    for(let i=0;i<index;i++)await page.locator('[data-action="next"]').click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:out+'/assessment-mobile.png',fullPage:true});
    await route(page,'assessments');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(errors,[]);
    console.log('PASS: original 40-question sequence and A–D choices, provenance, context notes, reload/resume, bookmarking, 40/40 exam grading, no answer leaks, retry, all 184 questions, filtering, shuffling and mobile SQL choices.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
