/* Local product journey: preferences -> recommendations -> collection -> retrieval. */
const journeyPlanRequests=new Set();
function isPlanQuery(text){return /生成.*(?:计划|行程)|计划表|整理.*(?:计划|行程|[一二三四五六七八九十两0-9]+天安排)|做.*计划|排.*(?:路线|行程)|根据.*(?:收藏|资料).*(?:计划|行程)/.test(text)&&!/先聊|先看灵感/.test(text);}
function isSavedQuery(text){return !isPlanQuery(text)&& /之前|上次|找回|存的|存过|保存的|收藏的|资料里|资料中|找资料|已存|收过|我存|我的资料|那[篇条].*(?:哪|找)|接驳.*在哪/.test(text);}
function sourceKind(s){return ({comment:'评论',quote:'划线',image:'图片',post:'笔记'})[s.kind]||'笔记';}
function journeyCategory(s){
  const p=M.byId(s.postId),text=[s.text,s.remark,p?.title].join(' ');
  if(/接驳|预约|住宿|酒店|交通|车站|换乘|票券/.test(text))return '住宿与交通';
  if(s.kind==='image'||/相机|摄影|拍照/.test(text))return '拍照与兴趣';
  if(/温泉|汤泉|泡汤/.test(text))return '温泉体验';
  if(/美食|甜|吃饭/.test(text))return '美食与闲逛';
  return '路线与体验';
}
function sourcePurpose(s){return s.remark||'';}
function matchingSources(t,query='',category='全部'){
  const queryText=String(query).trim();
  const keywords=['接驳','预约','酒店','住宿','交通','车站','温泉','泡汤','雪景','拍照','摄影','相机','小樽','札幌','旭川','路线','美食','评论','划线','图片','预算'];
  const terms=keywords.filter(k=>queryText.includes(k));
  const rest=queryText.replace(/我们|你们|之前|上次|那个|那条|那篇|帮我|给我|找回|找找|找一下|找一找|保存的|收藏的|存过的|存过|存的|收过|已存|保存|收藏|资料里面|资料里|资料中|我的资料|找资料|资料|信息|帖子|笔记|关于|在哪里|在哪儿|在哪|哪里|有没有|看一下|看看|请问|一下|找到|的|？|\?|。|，|\s/g,'');
  if(rest.length>=2){terms.push(rest);if(queryText!==rest)terms.push(queryText);}
  const unique=[...new Set(terms)];
  return [...t.sources].reverse().filter(s=>M.byId(s.postId)).map(s=>{
    const p=M.byId(s.postId),hay=[p.title,p.author,p.tags.join(' '),s.text,s.remark,s.purpose,sourceKind(s),s.category||journeyCategory(s)].join(' ').toLowerCase();
    return {source:s,score:unique.reduce((sum,term)=>sum+(hay.includes(term.toLowerCase())?1:0),0)};
  }).filter(({source,score})=>(category==='全部'||(source.category||journeyCategory(source))===category)&&(!unique.length||score>0)).sort((a,b)=>b.score-a.score).map(x=>x.source);
}
function nextJourneyQuestion(p){
  if(!p.days)return {text:'这次大概玩几天？没定也可以先看。',choices:[['大约6天','大概去6天。'],['还没定，先看看','天数还没定，先看看推荐。']]};
  if(!p.company)return {text:'这次和谁一起去？',choices:[['情侣出游','我们情侣两个人一起去。'],['带父母','这次带父母一起去。'],['一个人','这次一个人去。']]};
  if(!p.transport)return {text:'打算自驾，还是主要坐公共交通？',choices:[['不自驾','我们不自驾，主要坐公共交通。'],['自驾','这次准备自驾。']]};
  return null;
}
function journeyMemoryText(p={},destination=tripDestination()){
  const opening=[];
  if(p.company)opening.push(({情侣出游:'你们是情侣',两人同行:'这次两人同行',带父母:'这次和父母一起出发',带孩子:'这次带孩子一起出发',一个人:'这次一个人出发'})[p.company]||`这次${p.company}`);
  if(p.days)opening.push(`计划在${destination}玩${p.days}天`);
  else if(opening.length)opening.push(`想去${destination}旅行`);
  if(p.season)opening.push(`打算${p.season}去`);
  const lines=opening.length?[opening.join('，')+'。']:[];
  if(p.transport)lines.push(p.transport==='不自驾'?'这趟不自驾，选择安排时需要留意交通方式。':'这趟准备自驾。');
  const interests=(p.interests||[]).map(x=>({温泉:'泡温泉',雪景:'看雪景',摄影:'拍照',美食:'尝尝美食',自然风景:'看看自然风景'})[x]||x);
  if(interests.length)lines.push('想'+interests.join('、')+'。');
  if(p.pace)lines.push(p.pace==='轻松慢游'?'希望节奏轻松一些，不把行程排满。':'希望多看几个地方。');
  if(p.onsenStay)lines.push(p.onsenStay==='住一晚'?'温泉想住一晚，留出休息时间。':'温泉更倾向当天往返。');
  if(p.budget)lines.push(`提到的预算是¥${p.budget.toLocaleString()}，总额或人均口径还需确认。`);
  if(p.sleepPreference)lines.push(p.sleepPreference==='晚起'?'希望早上睡到自然醒，避免太早出门。':'愿意早起，早点出门。');
  return lines.join('');
}
function journeyMemory(p,{updatedAt='',expanded=false}={}){
  const text=journeyMemoryText(p);if(!text)return '';
  return `<article class="journey-memory narrative-memory ${expanded?'expanded':''}"><div class="journey-card-heading">${icon('book')} 这趟旅行，我记住了 ${expanded?'':btn('补充','prefs','journey-text-link')}</div><p class="memory-prose">${esc(text)}</p><small>${updatedAt?'更新于 '+esc(updatedAt)+' · ':''}只用于这趟旅行，继续聊就能补充或纠正。</small></article>`;
}
function journeyMemoryReceipt(m){
  const latest=task()?.messages.findLast(x=>x.memory?.length);
  return m===latest?journeyMemory(m.prefsSnapshot||task().prefs,{updatedAt:m.memoryUpdatedAt||''}):'<p class="memory-history-receipt">旅行记忆已更新</p>';
}
function journeyMemorySheet(){
  const t=task();if(!t)return invite();modal={type:'memory'};
  sheet('这趟旅行的记忆',`${journeyMemory(t.prefs,{updatedAt:t.memoryUpdatedAt||'',expanded:true})||'<p>还没有记住具体想法。说说这趟旅行你在意什么，我会慢慢记下来。</p>'}<form data-form="memory-update" class="memory-update-form"><label for="memory-update">继续告诉点点</label><textarea id="memory-update" name="message" maxlength="500" placeholder="例如：改成7天，温泉想住一晚。" required></textarea><button class="wide-btn">告诉点点</button></form><p class="sheet-note">也可以回到对话直接说，不用逐项填写。</p>`);
}
function journeyGreeting(){
  const destination=tripDestination(),supported=destination==='北海道',stay=supported&&searchIsStay(task()?.entryQuery||'');
  const sample=stay?'想找札幌住宿，我们不自驾，希望交通方便。':supported?'我们情侣两个人，去6天，不自驾，想看雪景和泡温泉，轻松一点。':`想去${destination}，先聊聊这趟旅行的想法。`;
  return assistantBody(`<div class="welcome-visual">${logo('welcome')}<span><strong>${esc(`你的${destination}专属导游`)}</strong><small>记住这趟旅行的条件，收好你发来的攻略。</small></span></div><p>${supported?(stay?'我们先从住宿开始：你想住哪个区域、最在意什么？以后找交通和玩法，也在这趟旅行里接着聊。':'先说说这趟北海道想怎么玩；还没想好也可以先找灵感。实际发送后，这趟旅行会留在「消息」里，下次不用从头说起。'):'可以先记录条件和主动加入资料；当前内容示例仅覆盖北海道，暂不能提供这个目的地的推荐或计划。'}</p><div class="journey-entry-options">${btn('<strong>我有具体需求</strong><span>说说想找的内容和你的条件</span>','journey-fill','',`data-text="${esc(sample)}"`)}${supported?btn('<strong>还没想好，先看看</strong><span>先找灵感，喜欢的再存下来</span>','quick','','data-text="还没想好，先看看北海道有哪些玩法。"'):''}</div>`);
}
function journeyHeader(t){return `<header class="header chat-header">${btn(icon('back'),'back','icon-btn',`aria-label="${chatBackLabel()}"`)}${logo('header-avatar')}<div class="chat-title"><strong>${esc(t.name)} <i class="ai-tag">AI</i></strong><small>${running.has(t.id)?'正在整理这次旅行的想法':'帮你找经验，也记住每次发现'}</small></div>${btn(icon('user'),'task-menu','icon-btn chat-mine','aria-label="我的" title="我的"')}</header>${tabsHTML()}`;}
function journeyCanGeneratePlan(t){return tripDestination(t)==='北海道'&&!!t?.sources.some(s=>['post','comment','quote','image'].includes(s.kind)&&M.byId(s.postId));}
function journeyChat(){
  const t=task();if(!t)return messages();if(restoreSearchQuestions(t))save();if(route.tab==='plan')route.tab='materials';const tab=route.tab==='materials'?'materials':'chat',run=running.get(t.id);
  if(tab!=='chat')return journeyHeader(t)+`<div class="scroll v3-content" id="journey-content">${journeyMaterials(t)}</div>`;
  const count=t.sources.length,searchContext=route.searchContext;
  const resumeText=count?`你存下的${count}条旅行经验都在，随时可以翻出来接着用。`:journeyMemoryText(t.prefs)?'之前聊过的旅行想法都记着，我们接着找适合你的旅行经验。':'还没想好也没关系，我们接着找点灵感。';
  const resumePlan=t.plan.length?(t.confirmed?`已采用的${t.plan.length}天行程也留着。`:`${t.plan.length}天的行程草稿也留着。`):'';
  const resumed=route.resumed&&t.messages.length?`<div class="journey-resume"><strong>${esc(tripDestination())}，我们接着聊</strong><p>${esc(resumeText+resumePlan)}</p><div>${btn('我存的内容','journey-materials')}${btn('继续找灵感','browse')}</div></div>`:'';
  const generating=journeyPlanRequests.has(t.id),generateButton=journeyCanGeneratePlan(t)?btn(`${icon('list')}${generating?'正在整理…':'生成行程'}`,'journey-generate-plan','composer-generate',`type="button" ${run||generating?'disabled':''} aria-label="生成行程"`):'';
  const suggestions=generateButton?`<div class="composer-suggestions">${generateButton}</div>`:'';
  return journeyHeader(t)+`<div class="scroll chat-feed journey-feed" id="chat-scroll"><p class="chat-date">${t.messages.length?'这趟旅行的对话与资料':'今天 · 对话仅自己可见'}</p>${!t.messages.length?(searchContext?'':journeyGreeting()):t.messages.map(renderMessage).join('')}${resumed}${searchContext&&!t.messages.some(m=>m.kind==='search-question'&&m.text===searchContext.query)?`<p class="search-chat-context">接着找「${esc(searchContext.query)}」${searchContext.linked?' · 已带入旅行背景':''}</p>`:''}${run?assistantBody(`<div class="assistant-state"><i class="spinner"></i>${esc(run.current)}</div>`,'is-thinking'):''}</div><div class="composer-wrap">${suggestions}<form class="composer" data-form="chat">${btn(icon('plus'),'attach','','aria-label="添加帖子或收藏"')}<input name="message" placeholder="${searchContext?'继续聊'+esc(searchContext.query)+'…':count?'说说想法，或问之前存的内容…':'说说天数、同行人，或分享好帖子…'}" aria-label="和点点聊聊旅行" autocomplete="off"><button class="send" aria-label="发送" ${run?'disabled':''}>${icon('send')}</button></form></div>`;
}
function journeyRecommendationHint(p){
  return ({hotel:'温泉住宿 · 接驳待核实',onsen:'雪景与温泉',camera:'市区逛店灵感','sapporo-station':'不自驾 · 车站周边','sapporo-odori':'市区住宿 · 区域对比',route:'路线参考 · 按节奏取舍',solo:'独自旅行经验',rail:'交通选择 · 班次待核实',biei:'旭川雪景 · 先作备选'})[p.id]||'旅行经验';
}
function journeyRecommendations(m){return `<div class="journey-recommendations" aria-label="点击图片查看帖子">${(m.posts||[]).map(id=>{const p=M.byId(id);if(!p)return '';return btn(`${cover(p)}<span class="journey-rec-copy"><strong>${esc(p.title)}</strong><small>${esc(journeyRecommendationHint(p))}</small></span>`,'note','journey-rec-open',`data-id="${p.id}" aria-label="打开帖子：${esc(p.title)}"`);}).join('')}</div>`;}
// Summarize what these exact sources offer for the expressed trip conditions.
// These are bounded local examples, not model-generated or live travel advice.
function journeyRecommendationSummary(p,ids,{exploring=false,query=''}={}){
  const posts=ids.map(M.byId).filter(Boolean),has=id=>posts.some(n=>n.id===id);
  const interests=p.interests||[],who=p.company==='情侣出游'?'你们':p.company==='一个人'?'你':p.company?'这次同行的人':'你';
  const constraints=[p.company==='情侣出游'?'情侣出游':null,p.days?`这趟玩${p.days}天`:null,p.transport,p.pace==='轻松慢游'?'希望轻松一些':null].filter(Boolean);
  const context=constraints.length?`考虑到${who}${constraints.join('、')}，`:'';
  const stay=searchTopic(query)==='stay'||!query&&posts.length>0&&posts.every(n=>n.tags.includes('住宿'));
  let intro,suggestion;
  if(exploring){intro='可以先从两种旅行感受里找方向：雪景里泡汤，或留在市区慢慢逛。现在不用急着排完整行程。';suggestion='先留意哪一种体验更吸引你，再围绕它补路线和交通。';}
  else if(stay){intro=context+(has('sapporo-station')&&p.transport==='不自驾'?'我先推荐札幌站周边的住宿经验，重点看车站出口、电梯和拖行李的步行路线。'+(p.pace==='轻松慢游'?'选住处时也把少搬行李作为比较条件。':''):p.transport==='自驾'?'先推荐这组住宿区域经验，按每天去哪里比较位置；帖子未提供停车信息，选具体酒店时仍需补查。':p.transport==='不自驾'?'住宿先比较车站往返、行李步行和换乘，再看房间本身。':'先推荐这组住宿经验，对照每天去哪里比较区域和房型。');suggestion=p.days?`${p.days}天不必都住札幌，先选适合主要路线的落脚区域；价格与可订房型按实际入住日期核实。`:'先确定更适合的住宿区域；具体酒店、房价与可订情况等入住日期明确后再核实。';}
  else if(has('hotel')||has('onsen')){
    intro=context+(interests.includes('温泉')?(interests.includes('雪景')?'我建议先围绕雪景和温泉找体验，把泡汤与休息放在一起考虑。':'我建议先比较温泉体验和住宿，把休息时间一起考虑。'):'这组经验可以帮助比较温泉住宿和雪中泡汤的感受，先作为候选。');
    suggestion=p.onsenStay==='住一晚'?'你们想住一晚，下一步先核实接驳与入住日期，再放进路线。':p.onsenStay==='当天往返'?'你更倾向当天往返，先确认接驳和可停留时间，再决定是否适合日归。':p.transport==='不自驾'?'先把温泉住宿留作候选，接驳核实后再决定住一晚还是日归。':'可以先比较住一晚与日归，确定更喜欢的节奏后再排到具体哪天。';
  }else if(has('rail')){intro=context+'我建议先把需要移动的路段列出来，再比较交通方式，避免为了票券增加行程。';suggestion='先定要保留的路线，再查对应班次与票价。';}
  else if(has('route')||has('solo')){intro=context+(p.pace==='轻松慢游'?'路线先挑少量顺路的地点，不照搬作者的全部打卡点。':'先参考路线结构，再按自己的同行方式和兴趣取舍。');suggestion='先选想保留的地点，具体停留天数和交通再逐步补齐。';}
  else{intro=context+(interests.includes('摄影')?'我会把拍照与市区兴趣放在一起看，挑顺路的体验。':'可以从市区体验和个人兴趣里挑顺路的安排。');suggestion='把喜欢的地点先留作候选，确定落脚区域后再选顺路的一两处。';}
  const facts={
    hotel:{label:'温泉住宿',text:'翠蝶馆这篇可参考雪景泡汤与住宿体验；评论提醒接驳需提前联系酒店核实。'},
    onsen:{label:'雪中泡汤',text:'这篇主要描述森林、落雪与泡汤的感受，适合判断是否喜欢这种慢下来的体验。'},
    'sapporo-station':{label:'车站周边',text:p.transport==='不自驾'?'不自驾可以先参考这篇的车站出口、电梯与行李步行路线，再核实具体酒店。':'这篇提供车站周边住宿的选择思路，重点比较跨城出发与带行李的便利度。'},
    'sapporo-odori':{label:'市区住宿',text:'这篇比较札幌站与大通两种方向；若以市区吃逛为主，可结合附近用餐和换乘次数取舍。'},
    route:{label:'路线取舍',text:p.pace==='轻松慢游'?'作者的一日团行程偏赶，你们可参考札幌、小樽的组合，减少要照搬的拍照点。':'这篇可参考札幌与小樽的路线结构；作者含一日团经历，交通与节奏需要另作取舍。'},
    solo:{label:'交通参考',text:p.company&&p.company!=='一个人'?'这是一人旅行经验，适合借鉴交通思路，停留节奏仍按你们的情况调整。':'这篇是一人不自驾经验，可参考札幌落脚与小樽往返的组织方式。'},
    rail:{label:'交通选择',text:'这篇建议先列每天的移动路段，再比较单程票和票券；没有提供当前可执行班次。'},
    biei:{label:'旭川取舍',text:p.days&&p.days<=6?'作者在旭川待了3天；你们总共时间有限，先作备选，不直接塞进路线。':'作者在旭川停留3天，可参考雪景体验；是否跨城需结合交通与可用天数。'},
    camera:{label:'市区兴趣',text:'这篇建议先保存感兴趣的相机店，等住宿与主要路线明确后，只挑顺路的一两家。'},
    sweets:{label:'半天体验',text:'这篇强调先看同行人是否感兴趣，再决定要不要安排半天，收藏不代表一定要去。'},
    river:{label:'城市散步',text:'这篇强调按自己的节奏留白；散步距离要结合路面和体力重新判断。'}
  };
  return {intro,highlights:posts.map(n=>({postId:n.id,...(facts[n.id]||{label:'经验参考',text:n.intro||'内容是否适用仍需结合本次条件判断。'})})),suggestion};
}
function journeyRecommendationSummaryHTML(m){
  const summary=m.summary||journeyRecommendationSummary(m.prefsSnapshot||{},m.posts||[],{exploring:m.exploring,query:m.contentQuery||''});
  return `<div class="journey-summary"><p>${esc(summary.intro)}</p><ul>${summary.highlights.map(item=>`<li><strong>${esc(item.label)}</strong>：${esc(item.text)}</li>`).join('')}</ul><p class="journey-summary-suggestion">${esc(summary.suggestion)}</p></div>`;
}
function journeySearchSavedReference(m){
  const source=(m.searchSourceIds||[]).map(id=>task()?.sources.find(s=>s.id===id)).find(Boolean);
  if(!source)return '';
  const post=M.byId(source.postId);if(!post)return '';
  return `<p class="journey-search-saved">你之前存过的相关${sourceKind(source)}：${btn(esc(source.kind==='post'?post.title:source.text),'reference','journey-text-link',`data-id="${source.postId}" data-source="${source.id}"`)}</p>`;
}
function journeyReplyToolbar(m){
  const index=task()?.messages.indexOf(m);if(index<0||index==null)return '';
  const attrs=`data-reply="${index}"`;
  const control=(glyph,action,label,pressed)=>btn(icon(glyph),action,pressed?'is-active':'',`${attrs} aria-label="${label}" title="${label}"${pressed===undefined?'':` aria-pressed="${!!pressed}"`}`);
  return `<div class="journey-reply-toolbar" role="group" aria-label="回复操作"><div>${control('replyCopy','reply-copy','复制回复')}${control('star','reply-bookmark',m.bookmarked?'取消收藏回复':'收藏回复',!!m.bookmarked)}${control('replyForward','reply-forward','转发回复')}</div><div>${control('replyDown','reply-dislike',m.disliked?'取消点踩':'点踩',!!m.disliked)}${control('replyRefresh','reply-refresh','刷新回复')}</div></div>`;
}
function journeyReplyText(m){
  const summary=m.summary||journeyRecommendationSummary(m.prefsSnapshot||{},m.posts||[],{exploring:m.exploring,query:m.contentQuery||''});
  return [summary.intro,...summary.highlights.map(item=>item.label+'：'+item.text),summary.suggestion,'参考帖子：',...(m.posts||[]).map(id=>M.byId(id)?.title).filter(Boolean)].join('\n\n');
}
function journeyCopyReply(m){
  const text=journeyReplyText(m);
  const manual=()=>sheet('复制回复',`<p>可选中下方文字复制。</p><textarea class="reply-copy-text" readonly aria-label="回复全文">${esc(text)}</textarea>`);
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>toast('已复制回复')).catch(manual);
  else manual();
}
function journeyBookmarkedReplies(t){
  const items=t.messages.map((m,index)=>({m,index})).filter(({m})=>m.kind==='journey-answer'&&m.bookmarked);
  if(!items.length)return '';
  return `<section class="bookmarked-replies"><h3>收藏的回复 · ${items.length}</h3>${items.map(({m,index})=>`<article><p>${esc(journeyReplyText(m).split('\n')[0])}</p><div>${btn('查看回复','reply-open','',`data-reply="${index}"`)}${btn('取消收藏','reply-bookmark','',`data-reply="${index}"`)}</div></article>`).join('')}</section>`;
}
function journeySourceTags(s){
  const p=M.byId(s.postId);
  return `<span class="journey-source-tags">${[...new Set(p?.tags?.length?p.tags:[s.category||journeyCategory(s)])].slice(0,3).map(tag=>`<span>${esc(tag)}</span>`).join('')}</span>`;
}
function journeySourceCard(s,{manage=false}={}){
  const p=M.byId(s.postId);if(!p)return '';
  const fragment=s.kind!=='post',attrs=`data-id="${p.id}" data-source="${s.id}"`;
  return `<article class="journey-source ${fragment?'is-fragment':''} ${manage?'has-management':''}">${btn(`<span class="journey-source-top">${cover(p)}<span class="journey-source-copy"><span class="journey-source-title">${esc(p.title)}</span>${journeySourceTags(s)}</span></span>`,'journey-original','journey-source-open',attrs+` aria-label="打开原帖：${esc(p.title)}"`)}${fragment?btn(`<span class="journey-fragment-kind">${sourceKind(s)}</span><blockquote>${esc(s.text||p.title)}</blockquote>`,'journey-source-detail','journey-fragment-open',attrs+` aria-label="查看保存的${sourceKind(s)}"`):''}${sourcePurpose(s)?`<p class="journey-source-reason"><span>你的备注</span>${esc(sourcePurpose(s))}</p>`:''}${manage?btn(icon('more'),'journey-source-menu','journey-source-more',`data-source="${s.id}" aria-label="管理资料：${esc(p.title)}"`):''}</article>`;
}
function journeySourceDetail(s){
  const p=M.byId(s.postId);if(!p)return;
  modal={type:'source-detail',sourceId:s.id};
  sheet('保存的'+sourceKind(s),`<article class="journey-source-detail"><h3>${esc(p.title)}</h3>${s.kind==='image'?`<img class="shared-image" src="${ASSETS[s.imageAsset||p.cover]}" alt="保存的图片">`:''}<blockquote>${esc(s.text||p.intro||p.paragraphs[0])}</blockquote>${sourcePurpose(s)?`<p class="source-detail-reason"><span>你的备注</span>${esc(sourcePurpose(s))}</p>`:''}<p class="source-detail-meta">保存于 ${esc(sourceTime(s))}</p>${s.status==='待核实'?'<p class="source-detail-meta">涉及交通、预约等信息，使用前仍需核实。</p>':''}${btn('打开原帖，查看上下文 ↗','journey-original','wide-btn secondary',`data-id="${p.id}" data-source="${s.id}"`)}</article>`);
}
// Saving acknowledges the source and one explicit trip condition; it never decides an arrangement.
function journeySavedReceipt(sources,prefs={},destination=''){
  const descriptors=sources.map(s=>{
    const post=M.byId(s.postId),fragment=s.kind==='comment'||s.kind==='quote';
    const text=fragment?s.text||'':[post?.title,...(post?.tags||[])].join(' ');
    const fullText=fragment?text:s.kind==='image'?'':[text,post?.intro,...(post?.paragraphs||[])].join(' ');
    const topic=s.kind==='image'?'':fragment&&/接驳/.test(text)?'接驳':/相机/.test(text)?'相机':/拍照|摄影/.test(text)?'拍照':/温泉|泡汤/.test(text)?(/住宿|酒店/.test(text)?'温泉住宿':'温泉'):/住宿|酒店/.test(text)?'住宿':/交通|车站|换乘|票券|步行/.test(text)?'交通':/路线|行程/.test(text)?'路线':'';
    const label=s.kind==='post'?`这篇${topic}笔记`:s.kind==='image'?'这张图片':s.kind==='comment'?`这条${topic}评论`:`这段${topic}划线`;
    let relation='';
    if(s.kind!=='image'&&prefs.transport==='不自驾'&&/接驳/.test(fullText))relation='这趟不自驾，可以留作住宿交通的参考，接驳安排仍待核实。';
    else if(s.kind!=='image'&&prefs.transport==='不自驾'&&/交通|换乘|车站|票券|步行/.test(fullText))relation='这趟不自驾，其中的交通经验可以留作出行参考。';
    else if(s.kind!=='image'&&(prefs.interests||[]).includes('摄影')&&/拍照|摄影/.test(fullText))relation='和你之前提到的拍照兴趣有关，先留在这趟旅行里作参考。';
    else if(s.kind!=='image'&&((prefs.interests||[]).includes('温泉')||prefs.onsenStay)&&/温泉|汤泉|泡汤/.test(fullText))relation='和你之前提到的泡温泉想法有关，之后比较温泉体验时可以参考。';
    return {label,relation};
  });
  const where=destination?`这趟${destination}旅行`:'这趟旅行';
  const first=sources[0];
  let text=sources.length>1?`这${sources.length}条都记下了，${descriptors.slice(0,2).map(x=>x.label).join('和')}${sources.length>2?'等内容':''}已收进${where}的资料。`:first.kind==='post'?`记下了，${descriptors[0].label}已收进${where}的资料。`:`${descriptors[0].label}${first.kind==='image'?'和出处':'的原话和出处'}都保存了，已收进${where}的资料。`;
  if(sources.some(s=>s.remark))text+='你的备注也一起留好了。';
  // A batch may contain unrelated sources, so attach the relationship to one named item.
  const related=descriptors.find(x=>x.relation);
  return {text,relation:related?(sources.length>1?`${related.label}：`:'')+related.relation:''};
}
function journeyMessage(m){
  if(m.kind==='journey-answer'){
    const question=m.question;
    return assistantBody(`${m.memory?.length?journeyMemoryReceipt(m):''}${journeyRecommendationSummaryHTML(m)}${journeySearchSavedReference(m)}${journeyRecommendations(m)}${m.exploring?`<div class="quick-replies">${btn('想看雪景泡温泉','quick','','data-text="我想看雪景、泡温泉，行程轻松一点。"')}${btn('更想市区吃逛','quick','','data-text="我更想在市区吃吃逛逛，喜欢美食，行程轻松一点。"')}</div>`:''}${question?`<div class="journey-question"><strong>${esc(question.text)}</strong><div class="quick-replies">${question.choices.map(([label,text])=>btn(esc(label),'quick','',`data-text="${esc(text)}"`)).join('')}</div></div>`:''}${journeyReplyToolbar(m)}`);
  }
  if(m.role==='user'&&m.kind==='search-question')return userBody(`<small class="search-question-origin">${m.searchQuestionOrigin==='topic'?'搜索主题':'来自搜索'}</small><span>${esc(m.text)}</span>`);
  if(m.role==='user'&&m.kind==='source'){
    const active=task()?.sources.find(s=>s.id===m.source.id);
    return userBody(sharedPreview(active||m.source)+(active?'':'<small class="source-removed">这条资料已移除</small>'));
  }
  if(m.kind==='journey-saved'){
    const ids=m.sourceIds||[m.sourceId],sources=ids.map(id=>task()?.sources.find(s=>s.id===id)).filter(Boolean);
    if(!sources.length)return assistantBody('<p>这条资料已移除，对话记录保留。</p>');
    const receipt=journeySavedReceipt(sources,m.prefsSnapshot||{},tripDestination());
    return assistantBody(`<p class="journey-save-confirmation">${esc(receipt.text)}</p>${receipt.relation?`<p class="journey-save-relation">${esc(receipt.relation)}</p>`:''}${btn('查看资料','journey-materials','journey-saved-link')}`);
  }
  if(m.kind==='journey-plan'||m.role==='assistant'&&Array.isArray(m.plan)&&m.plan.length)return journeyPlanMessage(m);
  if(m.kind==='retrieval'){
    const source=task()?.sources.find(s=>s.id===m.source?.id);
    return journeyMessage({kind:'journey-retrieval',sourceIds:source?[source.id]:[],query:'接驳'});
  }
  if(m.kind==='journey-retrieval'){
    const sources=(m.sourceIds||[]).map(id=>task()?.sources.find(s=>s.id===id)).filter(Boolean);
    return assistantBody(`<h3>${sources.length?`找到${sources.length}条已存资料`:'这趟旅行里还没找到对应资料'}</h3><p>${sources.length?'下面都是你之前分享或主动保存的内容。':'可以换个关键词，或继续搜索帖子，把有用的内容分享回来。'}</p>${sources.map(s=>journeySourceCard(s)).join('')}<div class="quick-replies">${btn('查看全部已存资料','journey-materials')}${btn('继续搜索帖子','journey-public-search','',`data-query="${esc(m.query||'北海道旅游攻略')}"`)}</div>`);
  }
  return baseUI.renderMessage(m);
}
function journeyPlanDayLabel(row,t){
  const src=t.sources.find(s=>s.id===row.citation),post=src&&M.byId(src.postId);
  const evidence=src?.kind==='post'?(post?.paragraphs||[]).join(' '):src?.text||'';
  if(/市区轻松体验|札幌城市探索|札幌轻松体验/.test(row.title)&&/北海道神宫/.test(evidence)&&/北海道大学/.test(evidence))return '神宫、大学按兴趣取舍，留出休息';
  return row.title;
}
function journeyPlanCitationIds(row){
  return [...new Set([row.citation,...(row.citationIds||[])].filter(Boolean))];
}
function journeyPlanSourceHint(row,t,shownPosts=new Set()){
  const ids=journeyPlanCitationIds(row),groups=new Map();let missing=false;
  for(const id of ids){
    const src=t.sources.find(s=>s.id===id),post=src&&M.byId(src.postId);
    if(!post){missing=true;continue;}
    if(!groups.has(post.id))groups.set(post.id,{post,sources:[]});
    groups.get(post.id).sources.push(src);
  }
  // One source preview per day, and each post appears only once in the itinerary.
  const group=[...groups.values()].find(({post,sources})=>{
    const image=sources.find(s=>s.kind==='image'&&ASSETS[s.imageAsset]);
    const asset=ASSETS[image?.imageAsset||post.cover];
    return !shownPosts.has(post.id)&&(!asset||!shownPosts.has('image:'+asset));
  });
  let preview='';
  if(group){
    const {post,sources}=group;
    shownPosts.add(post.id);
    const image=sources.find(s=>s.kind==='image'&&ASSETS[s.imageAsset]),primary=image||sources[0];
    const attrs=`data-id="${post.id}" data-source="${primary.id}"`;
    if(image||ASSETS[post.cover]){
      shownPosts.add('image:'+ASSETS[image?.imageAsset||post.cover]);
      const picture=image?`<span class="cover"><img src="${ASSETS[image.imageAsset]}" alt="保存自${esc(post.title)}的图片" loading="lazy"></span>`:cover(post);
      preview=`<div class="chat-plan-media columns-1"><div class="chat-plan-material">${btn(picture,'journey-original','chat-plan-image',attrs+` aria-label="打开原帖：${esc(post.title)}"`)}${btn(esc(post.title),'journey-original','chat-plan-post-title',attrs)}</div></div>`;
    }else{
      preview=`<div class="chat-plan-source-bubbles">${btn(`<span>已存${sourceKind(primary)} ↗</span><span class="chat-plan-source-excerpt">${esc(primary.text||post.title)}</span>`,'journey-original','chat-plan-source-bubble',attrs+` aria-label="打开原帖：${esc(post.title)}"`)}</div>`;
    }
  }
  return preview+(missing?'<small class="chat-plan-source-missing">部分依据已移除，相关安排仍待核实。</small>':'');
}
function journeyPlanDayText(row,t){
  const label=journeyPlanDayLabel(row,t);
  const intro=/神宫、大学/.test(label)?'把北海道神宫、北海道大学作为市区候选，按兴趣取舍，不必一天排满。':/抵达/.test(row.title)?'抵达后先安顿住宿，把附近散步留作弹性安排。':/小樽/.test(row.place)?'这天以小樽为主，不叠加其他跨城安排。':'';
  return intro+(row.detail||'具体安排继续根据出游条件与保存资料补充。');
}
function journeyPlanMessage(m){
  const t=task(),rows=m.plan||[],prefs=m.prefsSnapshot||{},index=t.messages.indexOf(m),current=m.version===t.planVersion,shownPosts=new Set();
  const conditions=[prefs.transport,prefs.pace==='轻松慢游'?'希望轻松一些':null,(prefs.interests||[]).includes('温泉')?'想泡温泉':null].filter(Boolean);
  const places=rows.map(r=>r.place),sapporo=places.filter(p=>p==='札幌').length>1,onsen=rows.some(r=>/温泉/.test(r.place+r.title));
  const who=prefs.company&&prefs.company!=='一个人'?'你们':'你';
  const rationale=(conditions.length?'按'+who+conditions.join('、')+'的想法，':'先按每天的落脚点和移动顺序，')+(sapporo?'以札幌为主要落脚点'+(onsen?'，留出温泉体验的时间。':'，把每天的安排留出弹性。'):'把每天的体验和休息时间排开。');
  const state=current?(t.confirmed?'已采用':'草稿'):'历史版本';
  const attrs=`data-message="${index}"`;
  return assistantBody(`${m.memory?.length?journeyMemoryReceipt(m):''}<section class="chat-plan" aria-label="${esc(tripDestination(t))}${rows.length}天图文行程"><div class="chat-plan-heading"><h3>${esc(m.destination||tripDestination(t))} · ${rows.length}天行程</h3><small>${state} · v${esc(m.version||1)}</small></div><p class="chat-plan-rationale">${esc(rationale)}</p><ol class="chat-plan-days">${rows.map(row=>`<li data-plan-day="${row.day}"><h4>${btn(`<span class="chat-plan-day">Day ${esc(row.day)}</span><span>${esc(row.place)} · ${esc(journeyPlanDayLabel(row,t))}</span>`,'journey-plan-day','chat-plan-day-title',`${attrs} data-day="${row.day}" aria-label="查看第${row.day}天的安排、依据与待确认事项"`)}</h4><p class="chat-plan-day-text">${esc(journeyPlanDayText(row,t))}</p>${journeyPlanSourceHint(row,t,shownPosts)}${/温泉/.test(row.place+row.title)&&!prefs.onsenStay?'<small class="chat-plan-pending">是否住一晚待定；接驳、费用与日期仍需核实。</small>':''}</li>`).join('')}</ol><div class="plan-advice-entry">${btn("发帖问建议","plan-advice-open","",attrs)}</div><p class="chat-plan-disclaimer">${journeyPlanSharingHint()}</p></section>`);
}
function journeyPlanDetails(m,day=null){
  const t=task();if(!m?.plan?.length||!t)return;
  if(m.version===t.planVersion){planSheet({day});return;}
  modal={type:'plan-history',version:m.version};
  sheet('之前生成的行程',`<p class="itinerary-disclaimer">这是 v${esc(m.version||1)} 的历史安排，当前行程另行保留。</p>${planTimeline(m.plan,t,day)}${btn('发帖问建议','plan-advice-open','wide-btn secondary',`data-message="${t.messages.indexOf(m)}"`)}${btn('查看当前行程','plan','wide-btn secondary')}`,true);
}
function journeyOrganizedResults(t){
  if(!t.plan.length)return '';
  return `<section class="journey-results" aria-label="整理结果"><h2>整理结果</h2>${btn(`<span class="journey-result-icon">${icon('list')}</span><span class="journey-result-copy"><strong>${esc(tripDestination(t))} · ${t.plan.length}天行程</strong><small>v${t.planVersion} · ${t.confirmed?'已采用方向':'草稿'}${t.proposal?' · 有待确认调整':''}</small></span>${icon('right')}`,'plan','journey-result-open')}</section>`;
}
function journeyMaterials(t){
  const q=route.materialQuery||'',category=route.materialCategory||'全部',items=matchingSources(t,q,category),categories=['全部',...new Set(t.sources.map(s=>s.category||journeyCategory(s)))];
  return `${journeyOrganizedResults(t)}${journeyBookmarkedReplies(t)}<div class="v3-section-head"><h2>这趟旅行的资料 <small>${t.sources.length}</small></h2>${btn(`${icon('plus')} 加资料`,'picker')}</div><p class="journey-material-intro">存下的内容和收藏原因，都在这里。</p><form class="journey-material-search" data-form="material-search">${icon('search')}<input name="query" value="${esc(q)}" placeholder="搜标题、原话或收藏原因…" aria-label="搜索这趟旅行已存资料"><button type="submit">搜索</button></form><div class="journey-categories">${categories.map(c=>btn(esc(c),'journey-category',category===c?'active':'',`data-value="${esc(c)}"`)).join('')}</div>${q?`<div class="journey-search-summary"><span>“${esc(q)}” · ${items.length}条结果</span>${btn('清空搜索','journey-clear-search')}</div>`:''}${items.map(s=>journeySourceCard(s,{manage:true})).join('')||`<div class="empty">${icon('folder')}<h3>${t.sources.length?'没有匹配的资料':'看到有用的，就交给点点'}</h3><p>${t.sources.length?'试试帖子标题、关键词或当时的备注。':'整篇帖子可以分享给点点，<br>评论和正文也可以选中后直接发送。'}</p>${btn(t.sources.length?'查看全部资料':'去搜喜欢的帖子',t.sources.length?'journey-clear-search':'browse','red-btn')}</div>`}`;
}
function journeyRecommendationData(t,q){
  const batch=t.recommendationBatch||0,ranked=searchRelevantNotes(t.prefs,q),offset=batch%Math.max(1,Math.ceil(ranked.length/2))*2;
  const picked=ranked.slice(offset,offset+2);if(picked.length<2)picked.push(...ranked.slice(0,2-picked.length));
  return {posts:picked.map(p=>p.id),reasons:Object.fromEntries(picked.map(p=>[p.id,journeyReason(p,t.prefs,q)]))};
}
function journeyReason(p,prefs,q=''){
  const interests=prefs.interests||[];
  if(p.id==='sapporo-station')return prefs.transport==='不自驾'?'沿用你不自驾的条件：重点看车站出口、带行李步行和跨城出发是否方便。':'札幌站周边的住宿选择思路；实际日期、预算与酒店仍待确定。';
  if(p.id==='sapporo-odori')return prefs.pace==='轻松慢游'?'按你希望轻松的节奏，比较市区吃逛、附近用餐与换乘次数。':'对比札幌站与大通两种住宿方向，先根据每天去哪里做取舍。';
  if(p.id==='hotel')return prefs.transport==='不自驾'?'适合你：温泉住宿体验，评论补充了不自驾要核实的接驳。':'温泉酒店的入住体验，接驳与预约可在评论里继续看。';
  if(p.id==='route')return `${prefs.days?`可参考${prefs.days}天旅行中的札幌、小樽安排。`:'札幌和小樽路线灵感。'}原帖含一日团，按自己的节奏取舍。`;
  if(p.id==='onsen')return interests.includes('温泉')?'对应你的温泉兴趣，先看看放松与雪景的体验。':'温泉与雪景的灵感，喜欢可以先存为候选。';
  if(p.id==='solo')return prefs.company&&prefs.company!=='一个人'?'这是一人旅行经验，你们可以参考交通，停留节奏另作取舍。':'不自驾的自由行经验，可以先参考交通和住宿思路。';
  if(p.id==='camera')return interests.includes('摄影')?'对应你的摄影兴趣，店铺可以先存下，之后再选顺路的。':'给自己的兴趣留一点时间，先收藏顺路的店。';
  if(p.id==='rail')return '补充公共交通与票券的选择思路，具体班次仍需核实。';
  if(p.id==='biei')return prefs.days&&prefs.days<=6?'作者在旭川停留3天；短途旅行先作为灵感，不直接塞进行程。':'看看旭川雪景与城市体验，往返交通需要另行核实。';
  return p.reason;
}
async function runJourneyAssistant(t,context){
  if(!state.tasks.includes(t))return;
  running.set(t.id,{current:context.source?'保存原文，整理到这趟旅行':'记住已说的条件，找适合的经验',done:[]});if(route.page==='chat'&&currentId===t.id)render();
  await delay(450);if(!state.tasks.includes(t))return;
  const continuing=context.kind==='search-continuation';
  const q=continuing?'':context.text||'',src=context.source,p=context.searchPrefs||t.prefs;let msg;
  const explore=/没定|没想好|没确定|先看看|先看灵感/.test(q)&&!isPlanQuery(q);
  const stay=context.searchQuery?searchTopic(context.searchQuery)==='stay':searchIsStay(q)||(!isPlanQuery(q)&&searchIsStay(t.lastContentQuery||'')&&!/路线|灵感|玩法|看雪|泡温泉|市区吃逛/.test(q));
  if(!src&&!isSavedQuery(q)&&!isPlanQuery(q)&&!/换一批/.test(q))t.lastContentQuery=context.searchQuery||(stay?'札幌酒店':q);
  if(src){
    const active=t.sources.find(s=>s.id===src.id);
    if(!active){running.delete(t.id);render();return;}
    const hint=/接驳/.test(src.text||'')?'接驳':src.postId==='camera'?'相机':active.category||journeyCategory(active);
    msg={role:'assistant',kind:'journey-saved',sourceId:src.id,hint,prefsSnapshot:JSON.parse(JSON.stringify(t.prefs))};
  }else if(isSavedQuery(q)){
    msg={role:'assistant',kind:'journey-retrieval',query:q,sourceIds:matchingSources(t,q).map(s=>s.id)};
  }else if(tripDestination(t)!=='北海道'){
    msg={role:'assistant',kind:'answer',title:tripDestination(t)+'旅行，单独记在这里',text:`已把这次表达留在「${t.name}」。当前示例仅覆盖北海道，暂不能提供${tripDestination(t)}的内容推荐或计划；可以继续补充旅行想法，或查看主动保存的资料。`};
  }else if(isPlanQuery(q)){
    if(!t.prefs.days){msg={role:'assistant',kind:'answer',text:'可以先整理草稿。这次大概玩几天？先确定天数，我再按你已经说过的条件安排。',prompt:'大概玩6天，帮我整理计划草稿。'};}
    else{const rows=journeyBuildPlan(t);const used=new Set(rows.flatMap(journeyPlanCitationIds));const planMsg={role:'assistant',kind:'journey-plan',title:`${t.prefs.days}天旅行，先有一份草稿`,text:'按已知条件和已保存资料整理；没有依据的部分保留为草稿建议，具体日期与交通继续待确认。',basis:`本次参考 ${used.size} 条已存资料 · 每天可查看依据与待确认事项`,memory:context.changed?.length?[journeyMemoryText(t.prefs)]:[],prefsSnapshot:JSON.parse(JSON.stringify(t.prefs)),memoryUpdatedAt:t.memoryUpdatedAt,plan:JSON.parse(JSON.stringify(rows)),version:(t.planVersion||0)+1};if(t.confirmed&&t.plan.length){t.proposal={id:uid(),baseVersion:t.planVersion,rows,before:'已采用的 '+t.plan.length+' 天计划',after:'根据当前条件重新整理的 '+rows.length+' 天草稿',reason:'先比较新草稿，采用后再替换已采用的安排。',source:rows.find(r=>r.source)?.source};msg={role:'assistant',kind:'answer',text:'新草稿已准备好，原计划保留到你采用调整为止。',proposal:t.proposal};}else{t.plan=rows;t.planVersion=planMsg.version;t.proposal=null;t.confirmed=false;msg=planMsg;}}
  }else if(/多留|半天/.test(q)&&t.plan.length){
    const rows=t.plan.map(r=>({...r})),index=rows.findIndex(r=>/温泉/.test(r.title+r.place));
    if(index>=0){const before=rows[index].title;rows[index]={...rows[index],title:'减少当天游逛，给温泉多留半天',detail:'减少当天活动，具体入住、交通和接驳仍待核实。'};t.proposal={id:uid(),baseVersion:t.planVersion,rows,before,after:rows[index].title,reason:'根据你想多留时间泡温泉的要求，先调整对应一天。',source:'onsen'};msg={role:'assistant',kind:'answer',text:'先把这一处变化列出来，采用后再更新计划。',proposal:t.proposal};}
    else msg={role:'assistant',kind:'answer',text:'当前草稿还没有温泉安排。可以先告诉我想在哪一天加入温泉，再一起调整。'};
  }else{
    const skip=explore,next=stay||continuing?null:nextJourneyQuestion(p);
    const updated=context.changed?.length;
    const contentQuery=context.searchQuery||(stay?'札幌酒店':/换一批/.test(q)?t.lastContentQuery||q:q);
    msg={role:'assistant',kind:'journey-answer',title:stay?'按本次旅行条件比较住宿':skip?'先找适合自己的玩法':'结合你的条件整理经验',...journeyRecommendationData({...t,prefs:p},context.searchQuery||contentQuery),question:skip?null:next,exploring:skip&&!stay,contentQuery:context.searchQuery||contentQuery,prefsSnapshot:JSON.parse(JSON.stringify(p))};
    if(skip&&!stay){msg.posts=['onsen','camera'];msg.reasons={onsen:'雪景与温泉的体验灵感，喜欢再决定是否安排。',camera:'看看市区逛店的玩法，不赶路也能给兴趣留时间。'};}

    msg.summary=journeyRecommendationSummary(msg.prefsSnapshot,msg.posts,{exploring:msg.exploring,query:contentQuery});
    msg.text=msg.summary.intro;
    if(updated){msg.memory=[journeyMemoryText(t.prefs)];msg.memoryUpdatedAt=t.memoryUpdatedAt;msg.prefsSnapshot=JSON.parse(JSON.stringify(t.prefs));}
  }
  if(continuing){msg.searchContinuationKey=context.searchContinuationKey;msg.searchQuestionId=context.searchQuestionId;msg.searchSourceIds=context.searchSourceIds||[];}
  running.delete(t.id);
  const previous=t.messages.at(-1);
  if(src&&previous?.kind==='journey-saved'&&t.messages.some(m=>m.role==='user'&&m.kind==='source'&&m.source.id===src.id)&&t.messages.findIndex(m=>m.kind==='source'&&m.source.id===src.id)<t.messages.length-1)previous.sourceIds=[...(previous.sourceIds||[previous.sourceId]),src.id];
  else t.messages.push(msg);
  t.preview=src?'已保存'+sourceKind(src)+' · '+(src.category||journeyCategory(src)):msg.kind==='journey-retrieval'?'已找回相关资料':msg.title||'旅行条件已记住，推荐了新的帖子';t.unread=!(route.page==='chat'&&currentId===t.id);save();render();
}
function journeyAction(name,el){
  const t=task();
  if(name==='journey-plan-day'||name==='journey-plan-details'){const m=t?.messages[Number(el.dataset.message)];journeyPlanDetails(m,name==='journey-plan-day'?Number(el.dataset.day):null);return true;}
  if(name==='journey-generate-plan'){
    if(!t||!journeyCanGeneratePlan(t)||running.has(t.id)||journeyPlanRequests.has(t.id))return true;
    const draft=$('#app input[name="message"]')?.value||'';
    journeyPlanRequests.add(t.id);
    send('根据这趟旅行已明确的条件和已保存资料，生成行程草稿。');
    const input=$('#app input[name="message"]');if(input)input.value=draft;
    queues.get(t.id).finally(()=>{journeyPlanRequests.delete(t.id);if(currentId===t.id&&route.page==='chat')render();});
    return true;
  }

  if(name.startsWith('reply-')){
    const index=Number(el.dataset.reply),m=t?.messages[index];if(!m||m.kind!=='journey-answer')return true;
    if(name==='reply-copy'){journeyCopyReply(m);return true;}
    if(name==='reply-bookmark'){m.bookmarked=!m.bookmarked;save();if(modal?.type==='materials')materialsSheet();else render();toast(m.bookmarked?'已收藏回复，可在资料中查看':'已取消收藏回复');return true;}
    if(name==='reply-dislike'){m.disliked=!m.disliked;save();render();toast(m.disliked?'已记录反馈（本地）':'已取消点踩');return true;}
    if(name==='reply-forward'){modal={type:'reply-forward',replyIndex:index};sheet('转发回复',`<p class="sheet-note">本地转发演示，不发送真实消息。</p><div class="reply-forward-preview">${esc(journeyReplyText(m))}</div><div class="reply-forward-targets">${['小夏','阿远','周末旅行群'].map(label=>btn(`${icon('user')}${label}`,'reply-forward-demo','',`data-reply="${index}" data-name="${label}"`)).join('')}</div>`);return true;}
    if(name==='reply-forward-demo'){closeSheet();toast('已完成本地转发演示，不会发送真实消息');return true;}
    if(name==='reply-refresh'){
      const p=m.prefsSnapshot||t.prefs,q=m.contentQuery||'北海道旅游攻略';
      m.refreshBatch=(m.refreshBatch||0)+1;
      Object.assign(m,journeyRecommendationData({prefs:p,recommendationBatch:m.refreshBatch},q));
      m.prefsSnapshot=JSON.parse(JSON.stringify(p));
      m.summary=journeyRecommendationSummary(p,m.posts,{exploring:m.exploring,query:q});m.text=m.summary.intro;
      save();render();toast('已刷新这条推荐');return true;
    }
    if(name==='reply-open'){openChat();requestAnimationFrame(()=>document.querySelector(`[data-reply="${index}"]`)?.scrollIntoView({block:'center',behavior:'smooth'}));return true;}
    return true;
  }
  if(name==='search-chat-question'){if(route.searchContext){const c=route.searchContext;send(`关于「${c.query}」：${el.dataset.text}`,{searchPrefs:c.prefs,searchQuery:c.query});}return true;}
  if(name==='journey-view-save'){openChat(el.dataset.id||currentId,{resumed:false});return true;}
  if(name==='journey-source-detail'){const s=t?.sources.find(s=>s.id===el.dataset.source);if(s)journeySourceDetail(s);return true;}
  if(name==='journey-source-menu'){
    const s=t?.sources.find(s=>s.id===el.dataset.source);if(!s)return true;
    modal={type:'source-menu',sourceId:s.id};
    sheet('管理这条资料',`${btn('编辑收藏原因','journey-source-edit','attachment-row',`data-source="${s.id}"`)}${btn('调整分类','journey-source-category','attachment-row',`data-source="${s.id}"`)}${btn('查看保存详情','journey-source-detail','attachment-row',`data-source="${s.id}"`)}${btn('移除资料','journey-source-remove','attachment-row source-remove',`data-source="${s.id}"`)}`);return true;
  }
  if(name==='journey-source-category'){
    const s=t?.sources.find(s=>s.id===el.dataset.source);if(!s)return true;
    modal={type:'source-category',sourceId:s.id};
    sheet('调整分类',`${['住宿与交通','拍照与兴趣','温泉体验','美食与闲逛','路线与体验'].map(c=>btn(esc(c)+(c===(s.category||journeyCategory(s))?' ✓':''),'journey-source-category-save','attachment-row',`data-source="${s.id}" data-value="${c}"`)).join('')}`);return true;
  }
  if(name==='journey-source-category-save'){const s=t?.sources.find(s=>s.id===el.dataset.source);if(s){s.category=el.dataset.value;save();closeSheet();route.materialCategory='全部';render();toast('分类已更新');}return true;}
  if(name==='journey-source-remove'){t.sources=t.sources.filter(s=>s.id!==el.dataset.source);route.materialCategory='全部';save();closeSheet();render();toast('已移除资料，历史对话保留');return true;}
  if(name==='prefs'){journeyMemorySheet();return true;}
  if(name==='journey-search-stay'){searchFor(tripDestination()==='北海道'?'札幌酒店':tripDestination()+'住宿',{fromTrip:true});return true;}
  if(name==='journey-fill'){const input=$('#app input[name="message"]');if(input){input.value=el.dataset.text;input.focus();}return true;}
  if(name==='journey-materials'){route.materialQuery='';route.materialCategory='全部';if(route.page!=='chat')go('chat',{tab:'materials'});else{route.tab='materials';closeSheet();render();}return true;}
  if(name==='journey-category'){route.materialCategory=el.dataset.value;if(modal?.type==='materials')materialsSheet();else render();return true;}
  if(name==='journey-clear-search'){route.materialQuery='';route.materialCategory='全部';if(modal?.type==='materials')materialsSheet();else render();return true;}
  if(name==='journey-refresh'){t.recommendationBatch=(t.recommendationBatch||0)+1;send('换一批适合这次旅行的帖子。');return true;}
  if(name==='journey-save-post'){const added=receiveSources(t,[{postId:el.dataset.id,kind:'post',text:'',remark:''}]);toast(added?'已保存为参考资料':'这篇已经存好了',btn('查看资料','journey-materials'));return true;}
  if(name==='journey-source-edit'){const s=t?.sources.find(s=>s.id===el.dataset.source);if(!s)return true;modal={type:'source-edit',sourceId:s.id};sheet('编辑收藏原因',`<form data-form="source-edit"><p>记下为什么想留着它，之后更容易找回。</p><div class="field"><label for="journey-source-remark">你的备注（选填）</label><textarea id="journey-source-remark" name="remark" maxlength="500" placeholder="想参考什么？">${esc(s.remark||'')}</textarea></div><button class="wide-btn">保存备注</button></form>`);return true;}
  if(name==='journey-original'){
    const id=el.dataset.id,sourceId=el.dataset.source;go('note',{id,sourceId});
    requestAnimationFrame(()=>{
      const s=t?.sources.find(s=>s.id===sourceId),p=M.byId(id),text=s?.text?.trim();
      if(!p||!text)return;
      const comment=s.kind==='comment'?p.comments.findIndex(c=>c.text.includes(text)):-1;
      const paragraph=s.kind==='quote'?p.paragraphs.findIndex(value=>value.includes(text)):-1;
      const target=comment>=0?`[data-comment-index="${comment}"]`:paragraph>=0?`[data-paragraph="${paragraph}"]`:null;
      if(target)$(target)?.scrollIntoView({block:'center'});
    });return true;
  }
  if(name==='journey-public-search'){searchFor('北海道 '+(el.dataset.query||''));return true;}
  if(name==='journey-walk'){const step=el.dataset.step;if(step==='0')go('results',{query:'北海道旅游攻略'});else if(step==='1')invite();else if(step==='2'){if(!t)invite();else action('browse',el);}else if(step==='3')searchFor('札幌酒店');else if(step==='4'){if(!t)invite();else action('journey-materials',el);}else if(step==='5'){if(!t)invite();else action('journey-materials',el);}return true;}
  return false;
}
document.addEventListener('submit',e=>{
  const form=e.target;if(form.dataset.form==='memory-update'){e.preventDefault();const text=String(new FormData(form).get('message')||'').trim();if(text)send(text);return;}
  if(form.dataset.form==='material-search'){e.preventDefault();route.materialQuery=String(new FormData(form).get('query')||'').trim();if(modal?.type==='materials')materialsSheet();else render();}
  if(form.dataset.form==='source-edit'){e.preventDefault();const s=task()?.sources.find(s=>s.id===modal?.sourceId);if(!s)return;s.remark=String(new FormData(form).get('remark')||'').trim();save();closeSheet();render();toast('收藏原因已更新');}
});

// Plans cite only active saved sources; uncited rows keep their suggestion state internally.
function journeyBuildPlan(t){
  const rows=M.buildPlan(t.prefs,t.sources);
  const content=s=>s.kind==='post'?[M.byId(s.postId)?.title,...(M.byId(s.postId)?.paragraphs||[])].join(' '):s.text||(s.kind==='image'?[M.byId(s.postId)?.title,...(M.byId(s.postId)?.tags||[])].join(' '):'');
  const find=pattern=>t.sources.filter(s=>M.byId(s.postId)&&pattern.test(content(s)));
  return rows.map((r,i)=>{
    let related;
    if(i===0)related=find(/札幌(?:站)?(?:周边|附近)?(?:住宿|住|落脚)|全程住札幌|(?:住宿地|住宿区域)[：:][^。；]*札幌|札幌站周边|抵达札幌/);
    else if(i===rows.length-1)related=find(/机场|航班|返程|交通票券/);
    else if(/温泉/.test(r.title+r.place))related=find(/温泉|泡汤|接驳/);
    else if(/小樽/.test(r.place))related=find(/小樽/);
    else if(/个人兴趣/.test(r.title))related=find(/相机|逛店|摄影/);
    else if(/市区|城市/.test(r.title))related=find(/神宫|大学|市区|城市|拍照/);
    else related=find(/留白|休息|不赶路|自由活动/);
    const src=related[0];
    const evidence=src?(src.text||M.byId(src.postId).paragraphs.find(p=>/札幌|小樽|温泉|行程|交通|相机|休息/.test(p))||M.byId(src.postId).paragraphs[0]):'';
    return {...r,source:src?.postId||null,citation:src?.id||null,citationIds:related.map(s=>s.id),evidence,
      reason:(t.prefs.pace==='轻松慢游'?'按你希望轻松的节奏，':'按已知条件，')+(src?'结合保存资料提出候选安排。':'为当天留出弹性，方便按兴趣调整。'),
      pending:/温泉/.test(r.title+r.place)?'是否住一晚、接驳预约、费用与日期':i===0?'抵达时间、住宿区域、实际酒店':i===rows.length-1?'航班与机场交通':'具体地点、营业与交通信息',
      detail:/温泉/.test(r.title+r.place)&&src&&/接驳/.test(content(src))?'你保存的资料提醒了接驳预约；先核实上车地点、班次与预约，再确定入住安排。':r.detail,
      status:src?'备选·待确认':'草稿建议'};
  });
}
function journeyPlanSharingHint(){
  return '这份行程先按你的旅行需求整理，你也可以分享更多喜欢的帖子，让安排更贴合你的想法。';
}
function journeyPlanSource(r,t){
  const ids=journeyPlanCitationIds(r),sources=ids.map(id=>t.sources.find(s=>s.id===id)).filter(s=>s&&M.byId(s.postId));
  return sources.map(src=>`${btn('已存'+sourceKind(src)+' ↗','reference','table-source',`data-id="${src.postId}" data-source="${src.id}"`)}<small class="plan-source-excerpt">${esc(src.text||M.byId(src.postId).title)}</small>`).join('')+(sources.length<ids.length?'<span class="plan-source-missing">部分资料已移除，需补充依据</span>':'');
}
