// Run with: NODE_PATH=/tmp/csdl-study-qa/node_modules node qa/browser-check.cjs
// Requires the local server on port 8088 and Playwright with system Chrome.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = '/tmp/csdl-study-qa';
fs.mkdirSync(out,{recursive:true});
const KEY='csdl-studio-v1';
const getState=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
async function pick(page,correct=true){
  const choice=await page.evaluate(({key,correct})=>{
    const s=JSON.parse(localStorage.getItem(key)).session;
    const q=window.CSDL_DATA.questions.find(q=>q.id===s.items[s.index].id);
    return correct?q.answer:(q.answer+1)%4;
  },{key:KEY,correct});
  await page.locator(`[data-action="answer"][data-choice="${choice}"]`).click();
}
async function submit(page){
  await page.locator('[data-action="finish"]').first().click();
  await page.locator('#dialog-ok').click();
  await page.waitForURL('**/#results');
}
async function openRoute(page,route){
  await page.evaluate(r=>location.hash=r,route);
  await page.waitForFunction(r=>location.hash==='#'+r,route);
  await page.waitForTimeout(60);
}
(async()=>{
  const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:1050}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto('http://localhost:8088');
    await page.locator('.topic-card').first().waitFor();
    assert.equal(await page.locator('.topic-card').count(),12);
    await page.screenshot({path:out+'/desktop.png',fullPage:true});
    await page.locator('#topic-search').fill('NULL');
    assert.equal(await page.locator('.topic-card').count(),1);
    await page.locator('#topic-search').fill('');
    await page.locator('[data-action="topic-start"][data-topic="null"]').click();
    await page.waitForURL('**/#quiz');
    await pick(page,false);
    assert.equal(await page.locator('.answer.wrong').count(),1);
    assert.equal(await page.locator('.answer.correct').count(),1);
    await page.locator('[data-action="bookmark"]').click();
    await page.reload();
    await page.locator('.explanation').waitFor();
    assert.equal(await page.locator('.answer:disabled').count(),4);
    assert.equal((await getState(page)).bookmarks.length,1);
    await page.locator('[data-action="next"]').click();
    await pick(page,true);
    await openRoute(page,'home');
    assert.equal(await page.locator('[data-action="resume"]').count(),1);
    await page.locator('[data-action="resume"]').click();
    await submit(page);
    let s=await getState(page);
    assert.equal(s.lastResult.score,1);
    assert.equal(s.lastResult.items.length,12);
    assert.equal(s.history.length,1);
    assert.equal(Object.values(s.stats).filter(x=>x.lastCorrect===false).length,11);
    await page.screenshot({path:out+'/results.png',fullPage:true});
    await page.locator('[data-action="retry-result"]').click();
    await page.waitForURL('**/#quiz');
    for(let i=0;i<11;i++){
      await pick(page,true);
      if(i<10)await page.locator('[data-action="next"]').click();
    }
    await submit(page);
    s=await getState(page);
    assert.equal(s.lastResult.score,11);
    assert.equal(Object.values(s.stats).filter(x=>x.lastCorrect===false).length,0);
    await openRoute(page,'exam');
    await page.locator('#setup-form [type="submit"]').click();
    await page.waitForURL('**/#quiz');
    s=await getState(page);
    assert.equal(s.session.items.length,40);
    const distribution={};
    for(const item of s.session.items)distribution[item.id.split('-')[0]]=(distribution[item.id.split('-')[0]]||0)+1;
    assert.equal(Object.keys(distribution).length,12);
    assert.ok(Math.max(...Object.values(distribution))-Math.min(...Object.values(distribution))<=1);
    await pick(page,true);
    assert.equal(await page.locator('.explanation').count(),0);
    await pick(page,false);
    await page.reload();
    await page.locator('.answer.selected').waitFor();
    assert.equal(await page.locator('.explanation').count(),0);
    await pick(page,true);
    await page.locator('[data-action="jump"][data-index="4"]').click();
    assert.equal((await getState(page)).session.index,4);
    await submit(page);
    s=await getState(page);
    assert.equal(s.lastResult.score,1);
    assert.equal(s.lastResult.items.length,40);
    // Timer must also finish while a manual-submit dialog is open.
    await openRoute(page,'exam');
    await page.locator('#setup-form [type="submit"]').click();
    await page.waitForURL('**/#quiz');
    // Apply after pagehide has persisted the previous document's session.
    await page.addInitScript(k=>{
      if(sessionStorage.getItem('qa-timer-shortened'))return;
      const s=JSON.parse(localStorage.getItem(k));
      if(s?.session){s.session.endsAt=Date.now()+2500;localStorage.setItem(k,JSON.stringify(s));sessionStorage.setItem('qa-timer-shortened','1');}
    },KEY);
    await page.reload();
    await page.locator('[data-action="finish"]').first().click();
    await page.waitForURL('**/#results',{timeout:8000});
    assert.equal((await getState(page)).lastResult.auto,true);
    await openRoute(page,'notes?topic=algebra');
    await page.locator('#note-algebra').waitFor();
    assert.equal(await page.locator('.note-card').count(),1);
    assert.equal(await page.locator('.lecture-section').count(),6);
    await openRoute(page,'saved');
    assert.equal(await page.locator('.library-list .review-item').count(),1);
    await page.locator('.inline-bookmark').click();
    assert.equal((await getState(page)).bookmarks.length,0);
    await openRoute(page,'home');
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:out+'/mobile.png',fullPage:true});
    await openRoute(page,'practice');
    await page.locator('#topic-select').selectOption('indexes');
    await page.locator('#setup-form [type="submit"]').click();
    await page.waitForURL('**/#quiz');
    await pick(page,true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:out+'/mobile-quiz.png',fullPage:true});
    assert.deepEqual(errors,[]);
    console.log('PASS: topic search, practice feedback, bookmarks, resume/reload, grading, retry, exam answer changes, balanced selection, auto-submit, notes, mobile and no browser errors.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
