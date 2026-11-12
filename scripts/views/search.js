const searchContinuationRequests=new Set();
// Search context stays within this visit. Reading never saves a post or changes trip memory.
function searchIsStay(query=''){return /酒店|住宿|住哪/.test(query);}
function searchMatchesTravel(query=''){return /北海道|札幌|小樽|温泉|美瑛|旭川/.test(query);}
function searchRelevantNotes(prefs={},query='',strict=false){
  const ranked=M.rank(prefs,query);
  if(strict&&searchTopic(query)==='onsen')return ranked.filter(p=>p.tags.includes('温泉'));
  return searchIsStay(query)?ranked.filter(p=>p.tags.includes('住宿')&&(!strict||!/札幌/.test(query)||p.tags.includes('札幌'))):ranked;
}
function searchTopic(query=''){
  if(/温泉|泡汤|接驳/.test(query))return 'onsen';
  if(searchIsStay(query))return 'stay';
  if(/交通|票券|换乘/.test(query))return 'transport';
  return 'travel';
}
function searchPrefs(t,linked,query=route.query||''){
  return M.extract(query,linked?t.prefs:{interests:[]}).prefs;
}
function searchRelevantSources(t,query=route.query||''){
  const ids=new Set(searchRelevantNotes({},query,true).map(p=>p.id));
  return matchingSources(t,query).filter(s=>ids.has(s.postId));
}
function searchBrief(p,query,list){
  const topic=searchTopic(query),has=id=>list.some(p=>p.id===id);
  if(!list.length)return {title:'暂时没有合适的示例',text:'可以换个筛选继续看，或告诉点点这次最在意什么。',questions:['帮我换个找法']};
  if(topic==='stay')return {title:/札幌/.test(query)?'札幌住哪里，先看每天怎么出行':'住宿怎么选，先看这次的路线',text:has('sapporo-station')&&has('sapporo-odori')?(p.transport==='不自驾'?'你们不自驾，先比较札幌站与大通：跨城多看车站往返，市内吃逛多看周边便利。':p.transport==='自驾'?'这次自驾，先按每天去哪里比较住宿区域；这组资料未提供停车信息，还需要另行核实。':'先比较札幌站与大通：跨城多看车站往返，市内吃逛多看周边便利。酒店按实际日期再核实。'):'先看住宿体验与每天的移动路线是否合适，房价、房型和可订日期还需要核实。',questions:['帮我比较住宿区域','怎么选能少走路？']};
  if(topic==='onsen')return {title:'这次找温泉，先想好怎么慢下来',text:p.onsenStay==='住一晚'?'你们想住一晚，可以先看住宿与泡汤体验，把前后安排留松一些；接驳和预约还要核实。':p.onsenStay==='当天往返'?'这次想当天往返，先看交通和能留给泡汤的时间；这组体验帖还不能确认日归是否可行。':p.transport==='不自驾'?'你们不自驾，温泉体验可以先看，交通也要一起比较；接驳核实后，再决定住一晚还是日归。':'先看更喜欢哪种泡汤体验，再比较住一晚还是日归，交通与预约需要另外核实。',questions:['温泉住一晚还是日归？','温泉接驳要确认什么？']};
  if(topic==='transport')return {title:'先看怎么移动，再比较交通方式',text:'按想去的地方列出往返路段，再比较换乘和行李负担。班次、票价与运行情况仍需核实。',questions:['交通要确认什么？','怎么安排能少换乘？']};
  return {title:'这次的北海道，先挑值得留下的体验',text:(p.interests||[]).includes('温泉')?'你们想泡温泉，可以先把温泉与休息放在一起考虑，再从路线里挑顺路的地方。':'先看看路线与体验，再挑真正想去的地方；不用照搬别人的全部打卡点。',questions:['帮我挑轻松的玩法','想先看看温泉体验']};
}
function searchQueryDestination(query=''){
  const names=[...new Set(['北海道','云南','上海','北京','东京','京都',...state.tasks.map(t=>tripDestination(t))])].sort((a,b)=>b.length-a.length);
  const explicit=names.find(name=>query.includes(name));
  return explicit||(/札幌|小樽|美瑛|旭川/.test(query)?'北海道':null);
}
function searchTripMatches(t,query=route.query||''){
  const destination=searchQueryDestination(query);
  return destination?tripDestination(t)===destination:/温泉|酒店|住宿|住哪|交通|旅行|旅游/.test(query);
}
function searchLinkedTrip(){
  if(!route.linked||route.aiDismissed)return null;
  const t=route.tripId?state.tasks.find(t=>t.id===route.tripId):storedTask();
  return t&&(searchTripMatches(t)||(route.backgroundSelected&&!searchQueryDestination(route.query)))?t:null;
}
function searchCandidates(){return state.tasks.filter(t=>searchTripMatches(t));}
function searchContinueLabel(){return ({stay:'继续聊住宿',onsen:'继续聊温泉',transport:'继续聊交通',travel:'接着聊旅行'})[searchTopic(route.query||'')];}
function searchSubject(){return ({stay:'住宿',onsen:'温泉',transport:'交通',travel:'旅行内容'})[searchTopic(route.query||'')];}
function searchHasExamples(query=route.query||'',t=null){return (searchQueryDestination(query)||tripDestination(t))==='北海道';}
function assistantSearchCard(t,linked,list,p) {
  if(route.aiDismissed)return '';
  const candidates=searchCandidates(),displayed=linked?t:null;
  if(displayed||candidates.length||route.detached){
    const name=displayed?.name||'点点导游',brief=searchBrief(p,route.query,list);
    const action=linked?'search-continue':candidates.length&&!route.detached?'search-trips':'search-chat';
    const label=action==='search-trips'?'选择旅行':searchContinueLabel();
    const text=linked&&!searchHasExamples(route.query,t)?`当前还没有${tripDestination(t)}的内容示例，可以接着这趟旅行记录想法和资料。`:linked?brief.text:action==='search-trips'?(candidates.length>1?'有多趟相关旅行，选一趟接着找。':'这次想为哪趟旅行找内容？选好后带着背景搜。'):brief.text;
    return `<section class="search-assistant-card search-continuation" aria-label="旅行助手"><div class="search-assistant-top"><div class="search-assistant-heading">${logo()}${btn(`<strong>${esc(name)}</strong><span class="trip-chevron">⌄</span>`,'search-trips','search-trip-name',`aria-label="${esc(name)}：切换旅行或查看背景" aria-haspopup="dialog" title="${esc(name)}"`)}</div>${btn(label,action,'search-chat-link',displayed?`data-id="${displayed.id}"`:'')}</div><p class="search-brief">${esc(text)}</p>${linked?searchSavedContext(t):''}</section>`;
  }
  const destination=searchQueryDestination(route.query||'');
  if(!destination)return '';
  const subject=({stay:/札幌/.test(route.query)?'札幌住宿':`${destination}住宿`,onsen:`${destination}温泉`,transport:`${destination}交通`,travel:`${destination}攻略`})[searchTopic(route.query||'')];
  return `<section class="search-assistant-card search-guide-invite" aria-label="创建${esc(destination)}专属导游"><div class="search-assistant-top"><div class="search-assistant-heading">${logo()}<span class="search-guide-identity">点点导游</span></div>${btn('创建专属导游','search-create-guide','red-btn')}</div><h2 class="search-guide-title">${esc(subject)}，按你的需求找</h2><p class="search-guide-benefit">说说你想怎么玩，帮你找更符合条件的攻略。</p><p class="search-guide-continuity">这趟需求和资料留在一起，下次接着用。</p><div class="search-assistant-shortcuts" aria-label="开始准备这趟旅行">${[['need','我有具体需求'],['interests','先找点灵感'],['saved','用收藏整理']].map(([intent,label])=>btn(label,'search-assistant-start','',`data-intent="${intent}"`)).join('')}</div></section>`;
}
function searchTripsSheet(){
  const selected=route.page==='chat'?storedTask():searchLinkedTrip(),candidates=searchCandidates();
  const ordered=[...state.tasks].sort((a,b)=>Number(candidates.includes(b))-Number(candidates.includes(a)));
  modal={type:'search-trips'};
  sheet('我的旅行',`${selected?btn(`${icon('book')}查看这趟旅行的背景`,'search-trip-memory','attachment-row',`data-id="${selected.id}"`):''}<div class="trip-choices">${ordered.map(t=>btn(`${logo()}<span><strong>${esc(t.name)}</strong><small>${esc([t.prefs.days?`${t.prefs.days}天`:null,t.prefs.transport,t.sources.length?`${t.sources.length}条资料`:null].filter(Boolean).join(' · ')||'接着这趟旅行聊')}</small></span>${selected?.id===t.id?'<span class="trip-selected">当前</span>':''}`,'search-select-trip','trip-choice',`data-id="${t.id}"`)).join('')||'<p class="sheet-note">还没有保存的旅行，开始聊一句就能留下来。</p>'}</div>${route.page==='results'?btn(`${icon('search')}不用于本次搜索`,'unlink-search','attachment-row'):''}`);
}
function linkSearchTrip(id){
  const t=state.tasks.find(t=>t.id===id);
  if(!t||!searchTripMatches(t)){toast('这趟旅行与当前搜索不一致，可以换个关键词再找');return;}
  currentId=t.id;route.linked=true;route.tripId=t.id;route.backgroundSelected=true;route.detached=false;route.aiDismissed=false;closeSheet();render();
}
function newTripSheet(){
  modal={type:'new-trip'};
  sheet('开始新旅行',`<form data-form="new-trip"><div class="field"><label for="trip-destination">这趟想去哪？</label><input id="trip-destination" name="destination" maxlength="24" value="${esc(searchQueryDestination(route.query||'')||'')}" placeholder="例如：北海道、云南" required autocomplete="off"></div><p class="sheet-note">每趟旅行单独保留想法和资料。当前内容示例仅覆盖北海道。</p><button class="wide-btn">开始聊这趟旅行</button></form>`);
}
function startTrip(destination){
  destination=String(destination||'').trim().slice(0,24);if(!destination)return;
  const count=state.tasks.filter(t=>tripDestination(t)===destination).length;
  const t=createTask({draft:true,destination,name:`点点导游 · ${destination}${count?`（${count+1}）`:''}`});
  t.entryQuery=destination+'旅行';openChat();
}
function searchSavedContext(t){
  const s=searchRelevantSources(t)[0];if(!s)return '';
  const quote=s.kind==='post'?M.byId(s.postId).title:s.text;
  return btn(`<span>之前存过的相关${sourceKind(s)}</span><strong>${esc(quote)}</strong>${icon('right')}`,'reference','search-saved-inline',`data-id="${s.postId}" data-source="${s.id}" aria-label="查看之前保存的相关${sourceKind(s)}"`);
}
function results(){
  const t=searchLinkedTrip(),linked=!!t;
  const p=searchPrefs(t,linked);
  let list=searchHasExamples(route.query,t)?searchRelevantNotes(p,route.query||'',true):[];
  if(route.filter==='视频')list=list.filter(p=>p.type==='视频');
  else if(route.filter&&route.filter!=='综合'&&route.filter!=='最新')list=list.filter(p=>p.tags.includes(route.filter));
  else if(route.filter==='最新')list=[...list].sort((a,b)=>b.date.localeCompare(a.date));
  return `<header class="header">${btn(icon('back'),'home','icon-btn','aria-label="返回首页"')}<form class="search-form" data-form="search"><input name="query" aria-label="搜索关键词" value="${esc(route.query||'')}" autocomplete="off">${btn(icon('image'),'image-search','icon-btn','aria-label="图片搜索"')}<button>搜索</button></form></header><div class="category">${btn('全部','filter','selected','data-filter="综合"')}${btn('用户','out-of-scope')}${btn('商品','out-of-scope')}${btn('图片','filter','','data-filter="综合"')}${btn('视频','video-unavailable')}${btn('<span class="ask-diandian-mark" aria-hidden="true"></span>问点点','search-chat','dot-label','aria-label="问点点"')}</div><div class="scroll results-bg" id="results-scroll">${assistantSearchCard(t,linked,list,p)}<div class="filters">${['综合','最新','不自驾','温泉','情侣出游'].map(f=>btn(f,'filter',`filter ${(route.filter||'综合')===f?'active':''}`,`data-filter="${f}"`)).join('')}</div>${list.length?grid(list):'<div class="empty">没有匹配的示例内容，可以更换筛选。</div>'}</div>`;
}
function searchPage(){
  return `<header class="header">${btn(icon('back'),'back','icon-btn','aria-label="返回"')}<form class="search-form" data-form="search"><input name="query" aria-label="搜索关键词" value="${esc(route.searchDraft||'')}" placeholder="搜索你想了解的内容" autocomplete="off">${icon('image')}<button>搜索</button></form></header>
  <div class="scroll search-empty">
    <section class="search-section" aria-labelledby="search-history-title"><div class="label-row"><h2 id="search-history-title">历史记录</h2>${btn(icon('trash'),'clear-history','icon-btn','aria-label="清空搜索记录"')}</div><div class="history">${state.history.map(q=>btn(esc(q),'search-query','',`data-query="${esc(q)}"`)).join('')}</div></section>
    <section class="search-section" aria-labelledby="search-suggest-title"><div class="label-row"><h2 id="search-suggest-title">猜你想搜</h2></div><div class="search-suggest">${['北海道6天5晚攻略','札幌住哪里方便','冬天不自驾旅行','带父母去日本','北海道温泉住宿','北海道交通攻略'].map(q=>btn(q,'search-query','',`data-query="${q}"`)).join('')}</div></section>
    <div class="voice-area"><span>按住提问 有问必答 ✨</span>${btn(icon('mic'),'voice','','aria-label="语音提问"')}</div>
  </div>`;
}
function home(){return `<header class="header home-header">${btn(icon('message'),'messages','icon-btn','aria-label="打开消息"')}<div class="home-tabs">${btn('关注','out-of-scope')}${btn('发现','home','selected')}${btn('上海','out-of-scope')}</div>${btn(icon('search'),'search','icon-btn','aria-label="打开搜索"')}</header><div class="home-categories">${['推荐','RED','直播','热点','短剧','足球'].map((s,i)=>btn(s,i?'out-of-scope':'home',i?'':'selected')).join('')}</div><div class="scroll">${grid([M.byId('sweets'),M.byId('biei'),M.byId('route'),M.byId('camera'),M.byId('river'),M.byId('onsen')])}</div>${nav('home')}`;}

// Pair every reply with its own recorded question, including older topic-only replies.
function restoreSearchQuestions(t){
  let changed=false;const paired=new Set();
  for(let i=0;i<(t.messages||[]).length;i++){
    const reply=t.messages[i];if(reply.role!=='assistant')continue;
    let query=reply.searchQuery,original=typeof query==='string'&&!!query.trim();
    if(reply.searchContinuationKey){try{const saved=JSON.parse(reply.searchContinuationKey).query;if(typeof saved==='string'&&saved.trim()){query=saved;original=true;}}catch{}}
    if(!original){if(reply.kind!=='journey-answer'||typeof reply.contentQuery!=='string'||!reply.contentQuery.trim())continue;query=reply.contentQuery;}
    // Ordinary typed questions are already represented by their original user bubble.
    if(!original&&t.messages[i-1]?.role==='user'&&t.messages[i-1].kind!=='search-question')continue;
    let question;
    for(let j=i-1;j>=0;j--){
      const candidate=t.messages[j];
      if(candidate.kind!=='search-question'||paired.has(candidate))continue;
      if(reply.searchQuestionId?candidate.id===reply.searchQuestionId:candidate.text===query&&(!reply.searchContinuationKey||candidate.searchContinuationKey===reply.searchContinuationKey)){question=candidate;break;}
    }
    if(!question){
      question={id:uid(),role:'user',kind:'search-question',text:query,searchQuestionOrigin:original?'query':'topic'};
      if(reply.searchContinuationKey)question.searchContinuationKey=reply.searchContinuationKey;
      t.messages.splice(i,0,question);i++;changed=true;
    }
    if(!question.id){question.id=uid();changed=true;}
    if(reply.searchQuestionId!==question.id){reply.searchQuestionId=question.id;changed=true;}
    paired.add(question);
  }
  return changed;
}
function openSearchChat(question='',{recommend=false}={}){
  const query=route.query||'',t=searchLinkedTrip();
  if(!t){
    if(!route.detached&&searchCandidates().length){searchTripsSheet();return;}
    const destination=searchQueryDestination(query);
    if(!destination){newTripSheet();return;}
    const draft=task();if(!draft||storedTask()||tripDestination(draft)!==destination)createTask({draft:true,destination});
    task().entryQuery=query;openChat();return;
  }
  currentId=t.id;
  if(restoreSearchQuestions(t))save();
  const prefs=searchPrefs(t,true,query),sources=searchRelevantSources(t,query).slice(0,1);
  const continuationKey=JSON.stringify({query,prefs,sources:sources.map(s=>[s.id,s.text,s.remark])});
  openChat(t.id);route.searchContext={query,prefs,linked:true,tripId:t.id};route.resumed=false;render();
  if(question)send(`关于「${query}」：${question}`,{searchPrefs:prefs,searchQuery:query});
  else if(recommend){
    const requestKey=t.id+'|'+continuationKey;
    if((t.messages.at(-1)?.role==='assistant'&&t.messages.at(-1)?.searchContinuationKey===continuationKey)||searchContinuationRequests.has(requestKey))return;
    searchContinuationRequests.add(requestKey);
    const last=t.messages.at(-1);
    const question=last?.kind==='search-question'&&last.searchContinuationKey===continuationKey?last:{id:uid(),role:'user',kind:'search-question',text:query,searchQuestionOrigin:'query',searchContinuationKey:continuationKey};
    if(question!==last)t.messages.push(question);
    save();render();
    queueAssistant(t,{kind:'search-continuation',searchQuery:query,searchPrefs:JSON.parse(JSON.stringify(prefs)),searchSourceIds:sources.map(s=>s.id),searchContinuationKey:continuationKey,searchQuestionId:question.id}).finally(()=>searchContinuationRequests.delete(requestKey));
  }
}
