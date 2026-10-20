(() => {
  'use strict';
  const {topics, questions:curatedQuestions, schema} = window.CSDL_DATA;
  const assessments = window.CSDL_ASSESSMENTS;
  const questions = [...curatedQuestions, ...assessments.flatMap(a=>a.questions)];
  const {lessons, dataset, fixture} = window.CSDL_LECTURES;
  const byId = new Map(questions.map(q => [q.id, q]));
  const topicMap = new Map(topics.map(t => [t.id, t]));
  const KEY = 'csdl-studio-v1';
  const main = document.querySelector('main');
  const symbols = ['◈','▦','⌘','∪','⊂','⋈','Σ','∅','↗','π','⌕','⇄'];
  let storageOK = true;
  let state;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    state = saved?.version === 1 ? saved : null;
  } catch { storageOK = false; }
  state = {...{version:1, stats:{}, bookmarks:[], history:[], session:null, lastResult:null}, ...state};
  state.bookmarks = Array.isArray(state.bookmarks) ? state.bookmarks.filter(id => byId.has(id)) : [];
  state.history = Array.isArray(state.history) ? state.history : [];
  if (!state.stats || typeof state.stats !== 'object') state.stats = {};
  if (state.session && (!Array.isArray(state.session.items) || !state.session.items.length || state.session.items.some(x => !byId.has(x.id)))) state.session = null;
  let topicFilter = 'all';
  let topicSearch = '';
  let toastTimer;
  let submitting = false;
  let resultWrongOnly = true;

  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = (name, size=18) => {
    const paths = {
      grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
      book:'<path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4zM13 7a3 3 0 0 1 3-3h5v15h-5a3 3 0 0 0-3 2"/>',
      pen:'<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-4-4L5 15z"/>',
      clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      retry:'<path d="M3 10a9 9 0 1 1 2 9M3 4v6h6"/>',
      bookmark:'<path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4z"/>',
      arrow:'<path d="M4 12h15m-5-5 5 5-5 5"/>',
      back:'<path d="M20 12H5m5-5-5 5 5 5"/>',
      search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
      check:'<path d="m5 12 4 4L19 6"/>',
      close:'<path d="m6 6 12 12M18 6 6 18"/>',
      spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
    };
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.book}</svg>`;
  };
  const shuffle = arr => {
    const a = [...arr];
    for (let i=a.length-1;i>0;i--) {const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  };
  const wrongIds = () => questions.filter(q => state.stats[q.id]?.lastCorrect === false).map(q => q.id);
  const seenIds = () => questions.filter(q => state.stats[q.id]?.attempts > 0).map(q => q.id);
  const pct = (n,d) => d ? Math.round(n/d*100) : 0;
  const duration = ms => {const s=Math.max(0,Math.floor(ms/1000));return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;};
  const button = (label, action, kind='primary', attrs='') => `<button class="button ${kind}" data-action="${action}" ${attrs}>${label}</button>`;
  function persist() {
    try {localStorage.setItem(KEY, JSON.stringify(state));}
    catch {storageOK=false;}
  }
  function toast(message) {
    const n=document.querySelector('#toast');n.textContent=message;n.classList.add('visible');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove('visible'),2800);
  }
  function ask(title, message, ok='Xác nhận') {
    return new Promise(resolve => {
      const d=document.querySelector('#confirm-dialog');
      document.querySelector('#dialog-title').textContent=title;
      document.querySelector('#dialog-message').textContent=message;
      document.querySelector('#dialog-ok').textContent=ok;
      d.returnValue='';d.addEventListener('close',()=>resolve(d.returnValue==='ok'),{once:true});d.showModal();
    });
  }
  function go(route) {
    if(location.hash.slice(1) === route) render();else location.hash=route;
  }
  const route = () => location.hash.slice(1).split('?')[0] || 'home';
  const params = () => new URLSearchParams(location.hash.split('?')[1] || '');
  function nav() {
    const current=route();
    const links=[['home','grid','Tổng quan'],['practice','pen','Luyện tập'],['exam','clock','Làm đề thi'],['assessments','book','Bộ đề đã nhập'],['notes','book','Sổ tay kiến thức'],['wrong','retry','Câu cần ôn'],['saved','bookmark','Đã đánh dấu']];
    document.querySelector('#nav').innerHTML=links.map(([id,i,label])=>`<a href="#${id}" class="nav-link ${(current===id || (id==='practice' && current==='quiz'))?'active':''}" ${current===id?'aria-current="page"':''}>${icon(i)}<span>${label}</span>${id==='wrong' && wrongIds().length?`<span class="nav-count">${wrongIds().length}</span>`:''}${id==='saved' && state.bookmarks.length?`<span class="nav-count">${state.bookmarks.length}</span>`:''}</a>`).join('');
    document.querySelector('#breadcrumb').textContent=links.find(x=>x[0]===current)?.[2] || (current==='results'?'Kết quả':'Phiên luyện tập');
  }
  const heading=(eyebrow,title,description,right='')=>`<div class="page-heading"><div><div class="eyebrow">${icon('spark',12)} ${eyebrow}</div><h1>${title}</h1><p>${description}</p></div>${right?`<span class="date-label">${right}</span>`:''}</div>`;
  function resumeBanner() {
    if(!state.session)return '';
    const answered=Object.keys(state.session.answers).length;
    return `<div class="resume-banner"><div><strong>Bạn còn một phiên ${state.session.mode==='exam'?'làm đề':'luyện tập'} đang dở</strong><p>Đã trả lời ${answered}/${state.session.items.length} câu · Tiếp tục ngay tại chỗ bạn dừng.</p></div>${button(`Tiếp tục ${icon('arrow',14)}`,'resume','secondary small')}</div>`;
  }
  function topicCards() {
    const query=topicSearch.toLocaleLowerCase('vi');
    const filtered=topics.filter(t => {
      const seen=curatedQuestions.filter(q=>q.topic===t.id && state.stats[q.id]?.attempts).length;
      const matches=(`${t.title} ${t.subtitle}`).toLocaleLowerCase('vi').includes(query);
      return matches && (topicFilter==='all' || (topicFilter==='unseen' && !seen) || (topicFilter==='started' && seen));
    });
    return filtered.length?filtered.map(t=>{
      const qs=curatedQuestions.filter(q=>q.topic===t.id);
      const seen=qs.filter(q=>state.stats[q.id]?.attempts).length;
      return `<article class="topic-card"><div class="topic-top"><span class="topic-num">CHƯƠNG ${t.num}</span><span class="topic-symbol" aria-hidden="true">${symbols[topics.indexOf(t)]}</span></div><h3>${t.title}</h3><p>${t.subtitle}</p><div class="topic-meta"><span>${qs.length} câu hỏi · ${t.week}</span><span>${seen}/${qs.length} đã luyện</span></div><div class="topic-progress"><span style="width:${pct(seen,qs.length)}%"></span></div><div class="topic-bottom"><a href="#notes?topic=${t.id}">Đọc kiến thức</a><button data-action="topic-start" data-topic="${t.id}">Luyện ngay ${icon('arrow',12)}</button></div></article>`;
    }).join(''):`<div class="empty"><div class="empty-icon">⌕</div><h2>Chưa tìm thấy chủ đề</h2><p>Thử tên khác hoặc chọn lại bộ lọc “Tất cả”.</p></div>`;
  }
  function home() {
    const seen=seenIds().length;
    const stats=Object.values(state.stats);
    const attempts=stats.reduce((s,x)=>s+(x.attempts||0),0);
    const correct=stats.reduce((s,x)=>s+(x.correct||0),0);
    const progress=pct(seen,questions.length);
    const circumference=2*Math.PI*48;
    return `${heading('HỌC CHẮC, NHỚ LÂU','Một chút mỗi ngày.<br>Vững cả môn học.','Ôn Cơ sở dữ liệu theo cách của bạn, từ bài đầu đến bài mới nhất.','07/09 — 25/10 · 7 tuần đã đăng')}${resumeBanner()}
      <section class="hero" aria-label="Tổng quan tiến độ"><div class="hero-card"><div><div class="hero-kicker"><span>✦</span> KIẾN THỨC CÓ HỆ THỐNG</div><h2>Hiểu từ gốc.<br><em>Làm chắc từng câu.</em></h2><p>${questions.length} câu hỏi có giải thích, phủ trọn ${topics.length} chủ đề.<br>Bắt đầu từ một câu hỏi nhỏ hôm nay.</p></div>${button(`Bắt đầu luyện tập ${icon('arrow',15)}`,'practice','lime')}</div><div class="progress-card"><div class="card-kicker"><span>Hành trình của bạn</span><span class="tiny-pill">CỨ TIẾP TỤC NHÉ</span></div><div class="progress-content"><div class="ring"><svg viewBox="0 0 110 110" aria-hidden="true"><circle class="ring-bg" cx="55" cy="55" r="48"/><circle class="ring-fill" cx="55" cy="55" r="48" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference*(1-progress/100)}"/></svg><div class="ring-label"><strong>${progress}%</strong><small>ĐÃ KHÁM PHÁ</small></div></div><div class="progress-copy"><h3>${seen?'Đang tiến bộ từng ngày':'Chặng mới bắt đầu'}</h3><p>Đã luyện ${seen}/${questions.length} câu hỏi.<br>${seen?'Cứ luyện tiếp, bạn sẽ nhớ lâu hơn.':'Một phiên ngắn cũng tạo khác biệt.'}</p></div></div><div class="progress-stats"><div class="progress-stat"><strong>${state.history.length}</strong><span>Phiên hoàn thành</span></div><div class="progress-stat"><strong>${pct(correct,attempts)}%</strong><span>Tỷ lệ trả lời đúng</span></div><div class="progress-stat"><strong>${wrongIds().length}</strong><span><i class="dot"></i>Câu cần ôn</span></div></div></div></section>
      <div class="quick-actions"><a class="quick-action" href="#exam"><span class="quick-icon">${icon('clock',19)}</span><div><strong>Thử sức với một đề thi</strong><small>40 câu · 45 phút · Chấm cuối bài</small></div><span class="arrow">↗</span></a><a class="quick-action" href="#wrong"><span class="quick-icon peach">${icon('retry',19)}</span><div><strong>Ôn lại để nhớ lâu hơn</strong><small>${wrongIds().length} câu cần luyện lại</small></div><span class="arrow">↗</span></a><a class="quick-action" href="#notes"><span class="quick-icon blue">${icon('book',19)}</span><div><strong>Mở sổ tay kiến thức</strong><small>Những ý chính, gọn trong một chỗ</small></div><span class="arrow">↗</span></a></div>
      ${assessmentBanner()}<div class="section-heading"><h2>Chọn một chủ đề <span>${topics.length} chương · ${curatedQuestions.length} câu tự biên soạn</span></h2><a href="#practice">Tự chọn phiên luyện →</a></div><div class="tools-row"><label class="search-wrap">${icon('search',15)}<input id="topic-search" type="search" placeholder="Tìm chủ đề bạn muốn ôn…" aria-label="Tìm chủ đề" value="${esc(topicSearch)}"></label>${[['all','Tất cả'],['unseen','Chưa bắt đầu'],['started','Đang học']].map(([id,name])=>`<button class="filter-chip ${topicFilter===id?'active':''}" data-action="topic-filter" data-filter="${id}" aria-pressed="${topicFilter===id}">${name}</button>`).join('')}</div><div class="topics-grid" id="topics-grid">${topicCards()}</div>
      ${state.history.length?`<section class="history-list"><div class="section-heading"><h2>Những lần bạn đã cố gắng</h2><span class="subtle">5 phiên gần nhất</span></div>${state.history.slice(0,5).map(h=>`<div class="history-row"><div>${esc(h.label)}<small>${new Date(h.at).toLocaleString('vi-VN')} · ${duration(h.duration)}</small></div><strong>${h.score}/${h.total} câu đúng · ${pct(h.score,h.total)}%</strong></div>`).join('')}</section>`:''}`;
  }
  function setup(mode) {
    const exam=mode==='exam';
    const selected=params().get('topic')||'all';
    const bank=assessments.some(a=>a.id===params().get('set'))?params().get('set'):'curated';
    return `${heading(exam?'THỬ SỨC CÓ THỜI GIAN':'LUYỆN ĐÚNG PHẦN BẠN CẦN',exam?'Một đề thi. Một bước tiến.':'Hôm nay mình học gì?',exam?'Làm bài liền mạch, xem đáp án và phân tích sau khi nộp.':'Chọn chủ đề, trả lời từng câu và hiểu ngay vì sao đúng hoặc sai.')}${resumeBanner()}<div class="setup-layout"><form class="panel setup-panel" id="setup-form" data-mode="${mode}"><h2>${exam?'Thiết lập đề luyện':'Thiết lập phiên học'}</h2><p>${exam?'Chọn ngân hàng, thứ tự và thời gian luyện. Thời gian ở đây do bạn tự chọn.':'Không áp lực thời gian. Bạn có thể dừng và tiếp tục bất cứ lúc nào.'}</p><div class="form-grid"><div class="field full"><label for="bank-select">Ngân hàng câu hỏi</label><select id="bank-select" name="bank"><option value="curated">144 câu tự biên soạn</option>${assessments.map(a=>`<option value="${a.id}" ${bank===a.id?'selected':''}>${a.title} · ${a.questions.length} câu từ PDF</option>`).join('')}<option value="all">Tất cả ${questions.length} câu (trộn các nguồn)</option></select></div><div class="field full"><label for="topic-select">Chủ đề kiến thức</label><select id="topic-select" name="topic"><option value="all">Toàn bộ 12 chủ đề</option>${topics.map(t=>`<option value="${t.id}" ${selected===t.id?'selected':''}>${t.num}. ${t.title}</option>`).join('')}</select></div><div class="field"><label for="count-select">Số câu hỏi</label><select id="count-select" name="count">${[10,20,30,40,60,'all'].map(n=>`<option value="${n}" ${n===(bank!=='curated'||exam?40:20)?'selected':''}>${n==='all'?'Tất cả câu phù hợp':`${n} câu`}</option>`).join('')}</select></div><div class="field"><label for="pool-select">Nguồn câu hỏi</label><select id="pool-select" name="pool"><option value="all">Tất cả câu hỏi</option><option value="unseen">Chưa từng luyện</option><option value="wrong">Câu trả lời sai gần nhất</option><option value="saved">Đã đánh dấu</option></select></div><div class="field"><label for="order-select">Thứ tự câu</label><select id="order-select" name="order"><option value="shuffle">Xáo trộn câu hỏi</option><option value="original" ${bank!=='curated'?'selected':''}>Giữ thứ tự trong bộ đề</option></select></div><div class="field"><label for="option-order-select">Thứ tự đáp án</label><select id="option-order-select" name="optionOrder"><option value="shuffle">Xáo trộn lựa chọn</option><option value="original" ${bank!=='curated'?'selected':''}>Giữ A–D theo nguồn</option></select></div>${exam?`<div class="field full"><label for="minutes-select">Thời gian làm bài</label><select id="minutes-select" name="minutes"><option value="15">15 phút</option><option value="30">30 phút</option><option value="45" selected>45 phút</option><option value="60">60 phút</option><option value="90">90 phút</option></select></div>`:''}</div><p class="form-note" id="pool-note"></p><button type="submit" class="button primary">${exam?'Bắt đầu làm đề':'Bắt đầu luyện tập'} ${icon('arrow',15)}</button></form><aside class="panel hint-panel"><div class="hint-symbol">${exam?'◷':'π'}</div><h3>${exam?'Đủ bình tĩnh.<br>Đủ tự tin.':'Hiểu cách nghĩ,<br>nhớ cách làm.'}</h3><ul>${exam?'<li>Có thể đổi đáp án trước khi nộp.</li><li>Chưa hiển thị lời giải trong khi làm đề.</li><li>Hết giờ, bài được tự động chấm.</li><li>Câu bỏ trống được tính là chưa đúng.</li>':'<li>Lời giải xuất hiện ngay khi chọn đáp án.</li><li>Câu sai được lưu để luyện lại.</li><li>Đánh dấu câu bạn muốn xem kỹ hơn.</li><li>Tiến độ tự lưu trên trình duyệt này.</li>'}</ul><div class="schema">${esc(schema)}</div></aside></div>`;
  }
  function poolFor(topic='all',pool='all',bank='curated') {
    return questions.filter(q=>(bank==='all'||(bank==='curated'?!q.assessment:q.assessment===bank)) && (topic==='all'||q.topic===topic) && (pool==='all'||(pool==='unseen'&&!state.stats[q.id]?.attempts)||(pool==='wrong'&&state.stats[q.id]?.lastCorrect===false)||(pool==='saved'&&state.bookmarks.includes(q.id))));
  }
  function updatePoolNote() {
    const f=document.querySelector('#setup-form');if(!f)return;
    const values=new FormData(f),available=poolFor(values.get('topic'),values.get('pool'),values.get('bank')).length;
    const requested=values.get('count')==='all'?available:Number(values.get('count'));
    document.querySelector('#pool-note').textContent=available?`Có ${available} câu phù hợp. Phiên này gồm ${Math.min(available,requested)} câu; ${values.get('order')==='original'?'giữ thứ tự câu':'xáo trộn câu'}, ${values.get('optionOrder')==='original'?'giữ thứ tự lựa chọn':'xáo trộn lựa chọn'}.`:'Chưa có câu nào phù hợp. Hãy đổi chủ đề hoặc nguồn câu hỏi.';
    f.querySelector('[type="submit"]').disabled=!available;
  }
  function balancedSelection(pool,count) {
    const buckets=shuffle(topics.map(t=>shuffle(pool.filter(q=>q.topic===t.id))).filter(a=>a.length));
    const selected=[];
    while(selected.length<count && buckets.some(a=>a.length)) for(const bucket of buckets) if(bucket.length && selected.length<count)selected.push(bucket.pop());
    return shuffle(selected);
  }
  async function start({mode='practice',topic='all',pool='all',count=20,minutes=45,ids=null,bank='curated',order='shuffle',optionOrder='shuffle'}={}) {
    const available=ids?ids.map(id=>byId.get(id)).filter(Boolean):poolFor(topic,pool,bank);
    if(!available.length){toast('Chưa có câu phù hợp. Thử một nguồn câu hỏi khác nhé.');return;}
    if(state.session && !await ask('Bắt đầu một phiên mới?','Phiên đang dở sẽ được thay thế. Những câu bạn đã luyện và tiến độ đã ghi nhận vẫn được giữ.','Bắt đầu phiên mới'))return;
    const limit=count==='all'?available.length:Math.min(Number(count),available.length);
    const qs=order==='original'?available.slice(0,limit):balancedSelection(available,limit);
    state.session={mode,topic,pool,bank,order,optionOrder,label:ids?'Ôn lại câu cần luyện':assessments.find(a=>a.id===bank)?.title||topicMap.get(topic)?.title||'Tổng hợp 12 chủ đề',items:qs.map(q=>({id:q.id,order:optionOrder==='original'?[0,1,2,3]:shuffle([0,1,2,3])})),answers:{},index:0,startedAt:Date.now(),endsAt:mode==='exam'?Date.now()+Number(minutes)*60000:null};
    persist();go('quiz');
  }
  function record(id,correct,choice) {
    const old=state.stats[id]||{attempts:0,correct:0};
    state.stats[id]={attempts:old.attempts+1,correct:old.correct+(correct?1:0),lastCorrect:correct,lastChoice:choice??null,at:Date.now()};
  }
  function assessmentBanner() {
    return `<section class="assessment-banner"><div><span class="eyebrow">BỘ ĐỀ TỪ TÀI LIỆU BẠN GỬI</span><h2>Kiểm tra lần 2 <span>40 câu</span></h2><p>Câu hỏi và đáp án theo PDF, có giải thích và ghi chú ngữ cảnh.</p></div><a class="button primary" href="#assessments">Mở bộ đề ${icon('arrow',14)}</a></section>`;
  }
  function questionSource(q) {
    return q.assessment?`<div class="question-source">${esc(assessments.find(a=>a.id===q.assessment).title)} · Câu gốc ${q.sourceNumber}/40 · Trang ${q.sourcePage} PDF</div>`:'';
  }
  function contextNote(q) {
    return q.note?`<aside class="context-note"><strong>Lưu ý ngữ cảnh</strong><p>${esc(q.note)}</p>${q.reference?`<a href="${esc(q.reference)}" target="_blank" rel="noopener">Đối chiếu tài liệu hệ quản trị ↗</a>`:''}</aside>`:'';
  }
  function assessmentLibrary() {
    return `${heading('CÂU HỎI TỪ PDF ĐÃ NHẬP','Luyện lại bộ đề của bạn.','Tách riêng đề gốc khỏi các câu tự biên soạn, giữ rõ nguồn và số câu.')} ${resumeBanner()}${assessments.map(a=>`<section class="panel assessment-cover"><span class="topic-tag">COURSES · 40 CÂU · ĐÁP ÁN THEO PDF</span><h2>${esc(a.title)}</h2><p>${esc(a.description)}</p><div class="assessment-source-file">Nguồn: ${esc(a.sourceFile)}</div><div class="assessment-actions"><a class="button primary" href="#practice?set=${a.id}">Luyện theo thứ tự đề ${icon('arrow',14)}</a><a class="button secondary" href="#exam?set=${a.id}">${icon('clock',14)} Làm đề có đồng hồ</a></div><p class="assessment-footnote">Thời gian làm đề do bạn tự chọn. Đáp án giữ theo bản xem lại; phần giải thích và lưu ý bổ sung chỉ hiện khi xem lời giải.</p></section><section class="panel assessment-preview"><div class="section-heading"><h2>40 câu trong tài liệu</h2><span class="subtle">Mở từng câu để xem đáp án</span></div>${a.questions.map(q=>review(q,undefined)).join('')}</section>`).join('')}`;
  }
  function quiz() {
    const s=state.session;
    if(!s)return `<div class="panel empty"><div class="empty-icon">π</div><h2>Sẵn sàng cho một phiên học?</h2><p>Chọn một chủ đề để bắt đầu nhé.</p><a href="#practice" class="button primary">Chọn phiên luyện</a></div>`;
    const item=s.items[s.index],q=byId.get(item.id),answer=s.answers[q.id],answered=answer!==undefined,exam=s.mode==='exam';
    const answeredCount=Object.keys(s.answers).length;
    return `<div class="quiz-top"><div><div class="eyebrow">${exam?'ĐỀ LUYỆN CÓ THỜI GIAN':'MỘT CÂU HỎI, MỘT CHÚT TIẾN BỘ'}</div><h1>${esc(s.label)}</h1><p>${answeredCount}/${s.items.length} câu đã trả lời ${exam?'· Chấm khi nộp bài':'· Giải thích ngay sau mỗi câu'}</p></div><div class="timer" id="session-timer">${icon('clock',16)}<span>${duration(exam?s.endsAt-Date.now():Date.now()-s.startedAt)}</span></div></div><div class="session-progress"><span style="width:${pct(answeredCount,s.items.length)}%"></span></div><div class="quiz-layout"><section class="panel question-card" aria-label="Câu hỏi hiện tại"><div class="question-meta"><span class="topic-tag">${topicMap.get(q.topic).title}</span><div style="display:flex;align-items:center;gap:12px"><span class="question-number">${s.index+1} / ${s.items.length}</span><button class="bookmark ${state.bookmarks.includes(q.id)?'saved':''}" data-action="bookmark" data-id="${q.id}" aria-label="${state.bookmarks.includes(q.id)?'Bỏ đánh dấu':'Đánh dấu câu hỏi'}" aria-pressed="${state.bookmarks.includes(q.id)}">${icon('bookmark',16)}</button></div></div>${questionSource(q)}<h2>${esc(q.prompt)}</h2>${q.code?`<pre class="sql-code"><code>${esc(q.code)}</code></pre>`:''}<div class="answers" role="group" aria-label="Chọn đáp án">${item.order.map((oi,i)=>{
      const cls=exam?(answer===oi?'selected':''):answered?(oi===q.answer?'correct':oi===answer?'wrong':''):'';
      return `<button class="answer ${cls}" data-action="answer" data-choice="${oi}" aria-pressed="${answer===oi}" ${answered&&!exam?'disabled':''}><span class="answer-letter">${String.fromCharCode(65+i)}</span><span>${esc(q.options[oi])}</span>${!exam&&answered&&(oi===q.answer||oi===answer)?`<span class="answer-check">${icon(oi===q.answer?'check':'close',16)}</span>`:''}</button>`;
    }).join('')}</div>${answered&&!exam?`<div class="explanation ${answer!==q.answer?'is-wrong':''}" aria-live="polite"><strong>${answer===q.answer?'Đúng rồi! Bạn đã nắm được ý này.':'Chưa đúng, mình xem lại một chút nhé.'}</strong><p>${esc(q.explanation)}</p>${q.assessment?`<p class="source-answer">Đáp án trong PDF: ${String.fromCharCode(65+q.answer)}</p>`:''}${contextNote(q)}<a href="${q.source||topicMap.get(q.topic).source}" target="_blank" rel="noopener">${q.assessment?'Mở mục kiểm tra trên UIT':'Mở bài học trên UIT'} ↗</a></div>`:''}<div class="quiz-controls">${button(`${icon('back',13)} Câu trước`,'prev','secondary',s.index===0?'disabled':'')}${s.index<s.items.length-1?button(`${answered||exam?'Câu tiếp theo':'Bỏ qua câu này'} ${icon('arrow',13)}`,'next'):button(`Xem kết quả ${icon('check',13)}`,'finish')}</div><div class="keyboard-note">Phím 1–4 để chọn · ← → để chuyển câu · Tự động lưu tiến độ</div></section><aside class="panel quiz-sidebar"><h3>Bản đồ câu hỏi</h3><p>Chọn số để chuyển đến câu bất kỳ.</p><div class="question-grid">${s.items.map((it,i)=>{const a=s.answers[it.id];return `<button data-action="jump" data-index="${i}" class="${i===s.index?'current ':''}${a===undefined?'':exam?'answered':a===byId.get(it.id).answer?'right':'wrong'}" aria-label="Đến câu ${i+1}${a!==undefined?', đã trả lời':''}" ${i===s.index?'aria-current="step"':''}>${i+1}</button>`;}).join('')}</div><div class="question-legend">${exam?'<span><i></i>Đã chọn</span>':'<span><i></i>Đúng</span><span><i class="red"></i>Cần ôn</span>'}</div>${button('Nộp bài & xem kết quả','finish','primary')}<div class="schema quiz-schema">${esc(schema)}</div></aside></div>`;
  }
  async function finish(auto=false) {
    if(!state.session || submitting)return;
    submitting=true;
    try {
      const session=state.session;
      if(!auto){
        const blank=session.items.length-Object.keys(session.answers).length;
        if(!await ask('Hoàn thành phiên học?',blank?`Bạn còn ${blank} câu chưa trả lời. Các câu này sẽ được tính là chưa đúng và lưu để ôn lại.`:'Bài sẽ được chấm và lưu vào tiến độ của bạn.','Nộp bài'))return;
        if(state.session!==session)return;
      }
      let score=0;
      for(const item of session.items){
        const q=byId.get(item.id),chosen=session.answers[q.id],correct=chosen===q.answer;
        if(correct)score++;
        if(session.mode==='exam'||chosen===undefined)record(q.id,correct,chosen);
      }
      const result={...session,score,finishedAt:Date.now(),duration:Math.max(0,Math.min(Date.now(),session.endsAt||Date.now())-session.startedAt),auto};
      state.lastResult=result;
      state.history.unshift({at:result.finishedAt,label:`${session.mode==='exam'?'Đề luyện':'Luyện tập'} · ${session.label}`,score,total:session.items.length,duration:result.duration});
      state.history=state.history.slice(0,50);state.session=null;resultWrongOnly=true;persist();go('results');
      if(auto)toast('Đã hết giờ. Bài của bạn đã được tự động nộp.');
    } finally{submitting=false;}
  }
  function review(q,chosen,{bookmark=false,open=false}={}) {
    const correct=chosen===q.answer;
    return `<details class="review-item" ${open?'open':''}><summary><span class="review-indicator ${correct?'right':''}">${correct?'✓':'↺'}</span><span>${q.sourceNumber?`Câu ${q.sourceNumber}. `:''}${esc(q.prompt)}</span>${bookmark?`<button class="inline-bookmark" data-action="bookmark" data-id="${q.id}" aria-label="Bỏ đánh dấu câu hỏi">${icon('bookmark',15)}</button>`:''}</summary><div class="review-detail">${questionSource(q)}<div class="saved-label">${topicMap.get(q.topic).title}</div>${q.code?`<pre class="sql-code"><code>${esc(q.code)}</code></pre>`:''}${chosen!==undefined?`<p class="${correct?'correct-text':'wrong-text'}">Bạn chọn: ${esc(q.options[chosen])}</p>`:'<p class="wrong-text">Chưa trả lời</p>'}<p class="correct-text"><strong>${q.assessment?`Đáp án theo PDF (${String.fromCharCode(65+q.answer)}):`:'Đáp án đúng:'}</strong> ${esc(q.options[q.answer])}</p><p>${esc(q.explanation)}</p>${contextNote(q)}<a href="${q.source||topicMap.get(q.topic).source}" target="_blank" rel="noopener">${q.assessment?'Xem mục kiểm tra':'Xem bài học gốc'} ↗</a></div></details>`;
  }
  function results() {
    const r=state.lastResult;
    if(!r)return `<div class="panel empty"><div class="empty-icon">✦</div><h2>Chưa có kết quả nào</h2><p>Hoàn thành một phiên luyện để xem điều bạn đã nắm vững.</p><a class="button primary" href="#practice">Bắt đầu luyện</a></div>`;
    const total=r.items.length,blank=total-Object.keys(r.answers).length,wrong=total-r.score;
    const percent=pct(r.score,total);
    const group=topics.map(t=>{const items=r.items.filter(it=>byId.get(it.id).topic===t.id);return {t,total:items.length,correct:items.filter(it=>r.answers[it.id]===byId.get(it.id).answer).length};}).filter(x=>x.total).sort((a,b)=>a.correct/a.total-b.correct/b.total);
    const reviewItems=r.items.filter(it=>!resultWrongOnly||r.answers[it.id]!==byId.get(it.id).answer);
    return `<section class="result-hero"><div class="eyebrow">${icon('spark',12)} ${r.auto?'HẾT GIỜ · BÀI ĐÃ ĐƯỢC NỘP':'THÊM MỘT BƯỚC TIẾN'}</div><h1>${percent>=80?'Bạn đang nắm bài rất tốt.':percent>=50?'Nền tảng đang vững hơn rồi.':'Mình đã biết cần học thêm ở đâu.'}</h1><div class="result-score">${r.score}<small> / ${total}</small></div><p>${esc(r.label)} · ${percent}% chính xác · ${duration(r.duration)}</p><div class="result-actions">${wrong?button(`Luyện lại ${wrong} câu chưa đúng ${icon('retry',14)}`,'retry-result'):button('Thử một đề mới','exam')}${button('Về tổng quan','home','secondary')}</div></section><div class="result-metrics"><div class="metric-box"><strong>${r.score}</strong><small>Câu trả lời đúng</small></div><div class="metric-box"><strong>${wrong-blank}</strong><small>Câu trả lời sai</small></div><div class="metric-box"><strong>${blank}</strong><small>Câu chưa trả lời</small></div></div><div class="result-layout"><section class="panel"><div class="section-heading"><h2>Nhìn lại từng chủ đề</h2></div><p class="subtle">Ưu tiên những phần có tỷ lệ đúng thấp hơn.</p>${group.map(({t,total,correct})=>`<div class="topic-score-row"><div><span>${t.title}</span><span>${correct}/${total}</span></div><div class="topic-progress"><span style="width:${pct(correct,total)}%"></span></div></div>`).join('')}</section><section class="panel"><div class="review-top"><h2>Hiểu lại từng câu</h2><label><input type="checkbox" id="review-wrong-only" ${resultWrongOnly?'checked':''}> Chỉ câu chưa đúng</label></div><div id="result-review">${reviewItems.length?reviewItems.map(it=>review(byId.get(it.id),r.answers[it.id])).join(''):'<div class="empty"><div class="empty-icon">✓</div><p>Không có câu sai. Bạn làm rất tốt!</p></div>'}</div></section></div>`;
  }
  const noteExamples={
    intro:'Lược đồ: Student(sID, sName, GPA)\nThể hiện: (123, Amy, 3.9), (234, Bob, 3.6)',
    model:'Student(sID PRIMARY KEY, sName, deptID)\nDepartment(deptID PRIMARY KEY, deptName)\nStudent.deptID → Department.deptID',
    basic:"SELECT DISTINCT sID, sName\nFROM Student\nWHERE GPA > 3.7 AND sizeHS < 1000\nORDER BY GPA DESC, sID ASC;",
    sets:'SELECT sID FROM Student\nEXCEPT\nSELECT sID FROM Apply;\n-- Mã sinh viên chưa nộp đơn',
    subquery:'SELECT S.sID, S.sName\nFROM Student S\nWHERE NOT EXISTS (\n  SELECT 1 FROM Apply A WHERE A.sID = S.sID\n);',
    joins:'SELECT S.sID, A.cName\nFROM Student S\nLEFT JOIN Apply A ON S.sID = A.sID;\n-- Giữ cả sinh viên chưa có đơn',
    aggregation:'SELECT major, COUNT(*) AS total\nFROM Apply\nGROUP BY major\nHAVING COUNT(*) >= 5;',
    null:'SELECT sID, COALESCE(GPA, 0) AS displayedGPA\nFROM Student\nWHERE GPA IS NULL OR GPA < 3.0;\n-- COALESCE ở SELECT không sửa dữ liệu gốc',
    updates:"INSERT INTO Archive\nSELECT * FROM Apply WHERE decision = 'N';\n-- Chỉ sao chép dữ liệu, chưa xóa ở Apply",
    algebra:'π[sID,sName](σ[GPA > 3.7](Student))\n\nChuaNop ← π[sID](Student) − π[sID](Apply)\nKetQua ← π[sID,sName](Student ⋈ ChuaNop)',
    indexes:'CREATE INDEX idx_gpa ON Student(GPA);\nCREATE INDEX idx_name_gpa ON Student(sName, GPA);\n-- Cú pháp xóa chỉ mục tùy hệ quản trị',
    transactions:'Một đơn vị công việc:\n  1. Chép đơn bị từ chối sang Archive\n  2. Xóa các đơn đó khỏi Apply\n  3. COMMIT nếu toàn bộ thành công\nNếu thất bại: hủy cả nhóm thay đổi chưa commit',
  };
  function lectureCode(title,text) {
    return `<figure class="lecture-code"><figcaption><span>${esc(title)}</span><button data-action="copy-code" aria-label="Sao chép ${esc(title)}">Sao chép</button></figcaption><pre class="sql-code"><code>${esc(text)}</code></pre></figure>`;
  }
  function lectureTable(title,headers,rows) {
    return `<figure class="lecture-table"><figcaption>${esc(title)}</figcaption><div class="table-scroll" tabindex="0" role="region" aria-label="${esc(title)}"><table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${cell===null?'<span class="null-value">NULL</span>':cell===''?'—':esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></figure>`;
  }
  function lectureBlock(block) {
    if(block.type==='paragraph')return `<p>${esc(block.text)}</p>`;
    if(block.type==='list')return `<ul>${block.items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`;
    if(block.type==='table')return lectureTable(block.title,block.headers,block.rows);
    if(block.type==='code')return lectureCode(block.title,block.text);
    if(block.type==='example')return `<div class="worked-example">${lectureCode(block.title,block.query)}${lectureTable('Kết quả',block.headers,block.rows)}</div>`;
    if(block.type==='callout')return `<aside class="lesson-callout ${block.tone==='pitfall'?'pitfall':''}"><strong>${block.tone==='pitfall'?'↳':'✦'} ${esc(block.title)}</strong><p>${esc(block.text)}</p></aside>`;
    return '';
  }
  function notes() {
    const topic=topicMap.get(params().get('topic'))||topics[0];
    const chapter=lessons[topic.id],quick=params().get('view')==='quick',index=topics.indexOf(topic);
    const routeFor=t=>`#notes?topic=${t.id}${quick?'&view=quick':''}`;
    const minutes=Math.max(5,Math.ceil(JSON.stringify(chapter).split(/\s+/).length/180));
    return `${heading('SỔ TAY KIẾN THỨC','Học từng bước. Hiểu đến gốc.','12 bài giảng chi tiết, ví dụ có kết quả và bài tập tự kiểm tra.')}<div class="reader-toolbar"><label class="mobile-chapter-picker" for="lesson-select">Chọn chương<select id="lesson-select">${topics.map(t=>`<option value="${t.id}" ${t.id===topic.id?'selected':''}>${t.num}. ${t.title}</option>`).join('')}</select></label><div class="reader-modes" aria-label="Cách đọc"><a href="#notes?topic=${topic.id}" class="${!quick?'active':''}" ${!quick?'aria-current="page"':''}>${icon('book',14)} Bài giảng chi tiết</a><a href="#notes?topic=${topic.id}&view=quick" class="${quick?'active':''}" ${quick?'aria-current="page"':''}>Ôn nhanh</a></div><span class="reader-meta">${quick?'5 ý chính cần nhớ':`${chapter.sections.length} mục · ${chapter.exercises.length} bài tự kiểm tra`}</span></div><div class="notes-layout reader-layout"><aside class="panel notes-index reader-index"><div class="reader-index-label">12 CHƯƠNG KIẾN THỨC</div>${topics.map(t=>`<a href="${routeFor(t)}" class="${t.id===topic.id?'active':''}" ${t.id===topic.id?'aria-current="page"':''}><span>${t.num}</span>${t.title}</a>`).join('')}${!quick?`<div class="reader-toc"><div class="reader-index-label">TRONG CHƯƠNG NÀY</div>${chapter.sections.map((s,i)=>`<button data-action="lesson-section" data-target="lesson-${topic.id}-${i}">${String(i+1).padStart(2,'0')} <span>${esc(s.title)}</span></button>`).join('')}<button data-action="lesson-section" data-target="lesson-exercises"><span>✦ Tự kiểm tra</span></button></div>`:''}</aside><div class="reader-content"><article class="panel note-card lecture-card" id="note-${topic.id}"><header class="lesson-header"><span class="topic-tag">CHƯƠNG ${topic.num} · ${topic.week}</span><h2>${topic.title}</h2><p>${esc(chapter.summary)}</p><div class="lesson-meta"><span>${icon('clock',13)} ${quick?'Ôn trong vài phút':`Khoảng ${minutes} phút đọc`}</span><span>${quick?'Tóm tắt':'Từ khái niệm đến vận dụng'}</span></div></header>${quick?`<div class="quick-notes"><h3>Những ý cần nhớ</h3><ul>${topic.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>${lectureCode('Ví dụ gợi nhớ',noteExamples[topic.id])}<a class="button secondary" href="#notes?topic=${topic.id}">Đọc bài giảng đầy đủ ${icon('arrow',13)}</a></div>`:`<section class="lesson-objectives"><h3>Sau bài này, bạn sẽ làm được</h3><ul>${chapter.objectives.map(o=>`<li>${esc(o)}</li>`).join('')}</ul></section><details class="lesson-dataset"><summary>${icon('grid',15)} Bộ dữ liệu dùng xuyên suốt các ví dụ <span>+</span></summary><div class="dataset-body"><p>Đây là bộ dữ liệu rút gọn tự biên soạn cho bài giảng. Mỗi ví dụ bắt đầu từ trạng thái này, trừ khi có ghi chú khác. Y = chấp nhận, N = từ chối; NULL là thông tin chưa biết.</p>${dataset.map(lectureBlock).join('')}<details class="fixture-code"><summary>Xem SQL tạo và nạp dữ liệu mẫu</summary>${lectureCode('Khởi tạo dữ liệu trên một CSDL học tập mới',fixture)}</details></div></details><div class="lesson-sections">${chapter.sections.map((s,i)=>`<section class="lecture-section" aria-labelledby="lesson-${topic.id}-${i}"><div class="lecture-section-title"><span>${String(i+1).padStart(2,'0')}</span><h3 id="lesson-${topic.id}-${i}" tabindex="-1">${esc(s.title)}</h3></div>${s.blocks.map(lectureBlock).join('')}</section>`).join('')}</div><section class="lesson-exercises" aria-labelledby="lesson-exercises"><div class="eyebrow">ĐỌC XONG, THỬ TỰ GIẢI THÍCH</div><h3 id="lesson-exercises" tabindex="-1">Tự kiểm tra trước khi xem lời giải</h3><p>Thử trả lời bằng lời của bạn, rồi mở từng câu để đối chiếu.</p>${chapter.exercises.map((e,i)=>`<details class="lesson-exercise"><summary><span>${String(i+1).padStart(2,'0')}</span>${esc(e.question)}<b aria-hidden="true">+</b></summary><div class="exercise-answer"><strong>Gợi ý lời giải</strong><p>${esc(e.answer)}</p>${e.solution?lectureCode('Cách diễn đạt bằng SQL',e.solution):''}</div></details>`).join('')}</section>`}<div class="lesson-references"><strong>Nguồn học & đọc thêm</strong><a href="${topic.source}" target="_blank" rel="noopener">Bài học ${topic.title} trên UIT ↗</a>${(chapter.references||[]).map(([label,url])=>`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`).join('')}<small>Bài giảng được biên soạn để tự học; các ví dụ rút gọn minh họa cách suy luận.</small></div><div class="note-actions"><a href="#notes?topic=${topic.id}${quick?'':'&view=quick'}">${quick?'Đọc bài giảng đầy đủ':'Xem bản ôn nhanh'}</a>${button(`Luyện 12 câu ${icon('arrow',12)}`,'topic-start','primary small',`data-topic="${topic.id}"`)}</div></article><nav class="chapter-pagination" aria-label="Chuyển chương">${index>0?`<a href="${routeFor(topics[index-1])}"><span>← CHƯƠNG TRƯỚC</span><strong>${topics[index-1].title}</strong></a>`:'<div></div>'}${index<topics.length-1?`<a href="${routeFor(topics[index+1])}" class="next-chapter"><span>CHƯƠNG TIẾP THEO →</span><strong>${topics[index+1].title}</strong></a>`:`<a href="#practice" class="next-chapter"><span>HOÀN THÀNH 12 CHƯƠNG →</span><strong>Luyện tập tổng hợp</strong></a>`}</nav></div></div>`;
  }
  function library(type) {
    const wrong=type==='wrong';
    const ids=wrong?wrongIds():state.bookmarks;
    return `${heading(wrong?'ÔN LẠI ĐỂ NHỚ LÂU':'ĐỂ DÀNH MỘT CHÚT TẬP TRUNG',wrong?'Mỗi câu sai là một gợi ý.':'Những câu bạn muốn nhớ kỹ.',wrong?'Câu trả lời sai gần nhất được giữ ở đây. Trả lời đúng khi luyện lại để đưa câu ra khỏi danh sách.':'Lưu lại những câu thú vị hoặc chưa thật chắc, rồi luyện riêng khi cần.')}${ids.length?`<div class="panel library-intro"><p><strong>${ids.length} câu hỏi</strong> · ${wrong?'Không cần vội, hiểu rõ lời giải quan trọng hơn.':'Sẵn sàng cho một phiên ôn tập riêng.'}</p>${button(`Luyện tất cả ${icon('arrow',14)}`,'library-start','primary',`data-type="${type}"`)}</div><div class="panel library-list">${ids.map(id=>review(byId.get(id),state.stats[id]?.lastChoice??undefined,{bookmark:!wrong})).join('')}</div>`:`<div class="panel empty"><div class="empty-icon">${wrong?'✓':'♧'}</div><h2>${wrong?'Chưa có câu nào cần ôn lại':'Chưa có câu được đánh dấu'}</h2><p>${wrong?'Sau khi luyện tập, các câu trả lời sai sẽ xuất hiện ở đây để bạn học lại.':'Bấm biểu tượng đánh dấu ở góc câu hỏi để thêm vào bộ sưu tập của bạn.'}</p><a href="#practice" class="button primary">Bắt đầu luyện tập ${icon('arrow',14)}</a></div>`}`;
  }
  function render() {
    nav();
    const current=route();
    const content=current==='home'?home():current==='practice'||current==='exam'?setup(current):current==='quiz'?quiz():current==='results'?results():current==='assessments'?assessmentLibrary():current==='notes'?notes():current==='wrong'||current==='saved'?library(current):home();
    main.innerHTML=(!storageOK?'<div class="storage-warning">Trình duyệt chưa lưu được tiến độ. Bạn vẫn có thể làm bài trong phiên hiện tại.</div>':'')+content;
    if(current==='practice'||current==='exam')updatePoolNote();
    if(current==='notes'&&params().get('topic'))requestAnimationFrame(()=>document.querySelector(`#note-${CSS.escape(params().get('topic'))}`)?.scrollIntoView({block:'start'}));
    tick();
  }
  function tick() {
    const s=state.session;if(!s)return;
    const remaining=s.endsAt?s.endsAt-Date.now():null;
    const timer=document.querySelector('#session-timer');
    if(timer){timer.querySelector('span').textContent=duration(remaining??Date.now()-s.startedAt);timer.classList.toggle('urgent',remaining!==null&&remaining<=60000);}
    if(remaining!==null&&remaining<=0){
      const dialog=document.querySelector('#confirm-dialog');
      if(submitting&&dialog.open){dialog.close('cancel');setTimeout(()=>finish(true),0);}
      else finish(true);
    }
  }
  main.addEventListener('click', async event=>{
    const el=event.target.closest('[data-action]');if(!el||el.disabled)return;
    const action=el.dataset.action;
    if(['home','practice','exam','notes'].includes(action))return go(action);
    if(action==='resume')return go('quiz');
    if(action==='topic-start')return start({topic:el.dataset.topic,count:12});
    if(action==='lesson-section'){
      const target=document.getElementById(el.dataset.target);
      if(target){target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});target.focus({preventScroll:true});}
      return;
    }
    if(action==='copy-code'){
      try{await navigator.clipboard.writeText(el.closest('.lecture-code').querySelector('code').textContent);toast('Đã sao chép ví dụ.');}
      catch{toast('Chưa sao chép được. Bạn có thể chọn và chép trực tiếp đoạn mã.');}
      return;
    }
    if(action==='topic-filter'){
      topicFilter=el.dataset.filter;document.querySelectorAll('[data-action="topic-filter"]').forEach(b=>{b.classList.toggle('active',b===el);b.setAttribute('aria-pressed',String(b===el));});document.querySelector('#topics-grid').innerHTML=topicCards();return;
    }
    if(action==='bookmark'){
      event.preventDefault();
      const id=el.dataset.id;
      if(!byId.has(id))return;
      const wasSaved=state.bookmarks.includes(id);state.bookmarks=wasSaved?state.bookmarks.filter(x=>x!==id):[...state.bookmarks,id];persist();nav();
      if(route()==='saved')render();else{el.classList.toggle('saved',!wasSaved);el.setAttribute('aria-pressed',String(!wasSaved));el.setAttribute('aria-label',wasSaved?'Đánh dấu câu hỏi':'Bỏ đánh dấu');}
      toast(wasSaved?'Đã bỏ đánh dấu.':'Đã lưu vào các câu được đánh dấu.');return;
    }
    if(action==='library-start')return start({ids:el.dataset.type==='wrong'?wrongIds():state.bookmarks,count:'all'});
    if(action==='retry-result')return start({ids:state.lastResult.items.filter(it=>state.lastResult.answers[it.id]!==byId.get(it.id).answer).map(it=>it.id),count:'all'});
    const s=state.session;if(!s)return;
    if(action==='answer'){
      const q=byId.get(s.items[s.index].id),choice=Number(el.dataset.choice);
      if(s.mode!=='exam'&&s.answers[q.id]!==undefined)return;
      s.answers[q.id]=choice;
      if(s.mode!=='exam')record(q.id,choice===q.answer,choice);
      persist();render();return;
    }
    if(action==='prev'||action==='next'||action==='jump'){
      s.index=action==='jump'?Number(el.dataset.index):Math.max(0,Math.min(s.items.length-1,s.index+(action==='next'?1:-1)));
      persist();render();return;
    }
    if(action==='finish')return finish();
  });
  main.addEventListener('input',event=>{
    if(event.target.id==='topic-search'){topicSearch=event.target.value;document.querySelector('#topics-grid').innerHTML=topicCards();}
  });
  main.addEventListener('change',event=>{
    if(event.target.id==='bank-select'){
      const imported=assessments.some(a=>a.id===event.target.value);
      document.querySelector('#order-select').value=imported?'original':'shuffle';
      document.querySelector('#option-order-select').value=imported?'original':'shuffle';
      document.querySelector('#count-select').value=imported?'40':(document.querySelector('#setup-form').dataset.mode==='exam'?'40':'20');
    }
    if(event.target.id==='lesson-select')go(`notes?topic=${event.target.value}${params().get('view')==='quick'?'&view=quick':''}`);
    if(event.target.closest('#setup-form'))updatePoolNote();
    if(event.target.id==='review-wrong-only'){
      resultWrongOnly=event.target.checked;
      const r=state.lastResult,items=r.items.filter(it=>!resultWrongOnly||r.answers[it.id]!==byId.get(it.id).answer);
      document.querySelector('#result-review').innerHTML=items.length?items.map(it=>review(byId.get(it.id),r.answers[it.id])).join(''):'<div class="empty"><div class="empty-icon">✓</div><p>Không có câu sai. Bạn làm rất tốt!</p></div>';
    }
  });
  main.addEventListener('submit',event=>{
    if(event.target.id!=='setup-form')return;
    event.preventDefault();const data=Object.fromEntries(new FormData(event.target));start({...data,mode:event.target.dataset.mode});
  });
  document.querySelector('#reset-progress').addEventListener('click',async()=>{
    if(!await ask('Đặt lại tiến độ?','Toàn bộ lịch sử, câu sai, đánh dấu và phiên đang dở trên trình duyệt này sẽ được xóa.','Đặt lại'))return;
    state={version:1,stats:{},bookmarks:[],history:[],session:null,lastResult:null};persist();go('home');toast('Đã đặt lại tiến độ. Chúc bạn một khởi đầu mới.');
  });
  document.addEventListener('keydown',event=>{
    if(route()!=='quiz'||!state.session||document.querySelector('dialog[open]')||event.altKey||event.ctrlKey||event.metaKey||/INPUT|SELECT|TEXTAREA/.test(event.target.tagName))return;
    if(['1','2','3','4'].includes(event.key)){const b=document.querySelectorAll('.answer')[Number(event.key)-1];if(b&&!b.disabled){event.preventDefault();b.click();}}
    if(event.key==='ArrowRight'){document.querySelector('[data-action="next"]')?.click();event.preventDefault();}
    if(event.key==='ArrowLeft'){document.querySelector('[data-action="prev"]')?.click();event.preventDefault();}
  });
  window.addEventListener('hashchange',()=>{render();if(route()!=='notes'||!params().get('topic'))window.scrollTo(0,0);});
  window.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
  window.addEventListener('pagehide',persist);
  setInterval(tick,1000);
  render();
})();
