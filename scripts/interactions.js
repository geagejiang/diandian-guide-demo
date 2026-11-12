const queues=new Map();
function delay(ms){return new Promise(resolve=>{const id=setTimeout(()=>{timers.delete(id);resolve();},ms);timers.add(id);});}
function queueAssistant(t,context){const previous=queues.get(t.id)||Promise.resolve();const next=previous.then(()=>runAssistant(t,context)).catch(()=>{running.delete(t.id);toast('整理暂时中断，可以继续提问');render();});queues.set(t.id,next);return next;}
async function runAssistant(t,context){
  if(!state.tasks.includes(t))return;
  const done=[];const labels=context.kind==='source'?['读取原文与分享上下文','对照你的偏好和已有计划','关联资料，找补充经验']:['理解这次问题，更新需求记忆','按偏好检索示例笔记与评论','比较不同体验，整理下一步'];
  for(let i=0;i<labels.length;i++){if(!state.tasks.includes(t))return;running.set(t.id,{current:labels[i],done:[...done]});if(route.page==='chat'&&currentId===t.id)render();else renderRail();await delay(420);done.push(labels[i]);}
  if(!state.tasks.includes(t))return;
  const p=t.prefs;let incoming=context.source;let q=context.text||'';
  const sharedPost=incoming?M.byId(incoming.postId):null;
  const ranked=M.rank(p,incoming?sharedPost.tags.join(' '):q,incoming?[incoming.postId]:[]).slice(0,2);
  const response={role:'assistant',kind:'answer',posts:ranked.map(n=>n.id),reasons:Object.fromEntries(ranked.map(n=>[n.id,n.reason])),refs:incoming?[incoming.postId]:ranked.map(n=>n.id)};
  if(context.changed?.length)response.memory=M.tags(p);
  if(incoming){
    if(incoming.kind==='comment'){
      response.title='这条评论，我帮你和行程对上了';
      response.text='已记下这位用户的具体体验，保留评论原文与所属帖子。它提醒我们：雪地步行的感受，会受到同行人和体力影响。';
      response.insight=p.company==='带父母'?'你这次带父母出行，我会优先找少换乘、少步行的安排，再补充其他同行者的经验。':'这是一种同行条件下的体验，我先作为提醒保留，是否适用还要结合你的情况。';
    }else if(incoming.kind==='quote'){
      response.title='这段重点，已经归到对应资料';response.text='我保留了你划线的原话，也保留它所属的帖子。之后做取舍时，可以回来看这段依据。';
      response.insight=`这段内容与「${sharedPost.tags[0]}」相关。${incoming.remark?'你的备注也一起记住了。':'先放在参考资料中，行程采用前再确认。'}`;
    }else{
      response.title='收到，这篇不只是存起来';response.text=`我把它归到「${sharedPost.tags.slice(0,2).join(' / ')}」，接着你的旅行条件继续比较。${incoming.remark?'也记下了你想参考的部分。':''}`;
      response.insight='下面两篇补充不同角度的体验。看完可以直接分享回来，我们接着整理。';
    }
  }else if(/还没确定|先看看/.test(q)){
    response.title='先找旅行的感觉，也可以';response.text='我先给你两种思路：少换酒店的路线，以及留一晚慢慢泡温泉。喜欢哪一种，点开看看，或者直接告诉我。';response.prompt='想玩6天，不自驾，喜欢温泉';
  }else if(/酒店|住宿|住哪/.test(q)){
    response.title='先按你的路线，比较住哪里';response.text='我会先比较换乘、搬行李和步行距离，再看住宿本身。你还没确定具体日期，所以房价和可订情况先留空。';response.insight=p.company==='带父母'?'带父母出行，少换酒店和行李负担，是这次要重点比较的条件。':'把喜欢的住宿帖子发给我，可以继续比较交通和入住体验。';
  }else if(/温泉/.test(q)&&!context.changed?.length){
    response.title='给温泉留时间，也给交通留余地';response.text='可以先比较「住一晚」和「当天往返」。我找了两篇体验，分别看休息感受与交通安排；具体酒店、接驳和价格仍待确认。';
  }else if(/比较|哪.*选|取舍/.test(q)){
    response.title='把条件摆在一起，比单看结论更有用';response.text=`按${M.tags(p).join('、')||'你当前的旅行方向'}，先比较交通便利、步行强度和行程节奏。你分享的原文也会作为依据保留。`;
    response.insight=t.sources.length?`已结合你加入的${t.sources.length}条资料；不同用户的体验会分别保留。`:'可以先分享两篇候选帖子，我会帮你对照具体差异。';
  }else{
    response.title=context.changed?.length?'按你的想法，开始有方向了':'接着这次旅行，我们继续';
    response.text=context.changed?.length?`我记住了：${M.tags(p).join('、')}。先找与你条件接近的体验，再把路线留出可调整的空间。`:'告诉我旅行天数、同行人、怎么出行和喜欢什么，或把帖子和评论发给我，我们一起慢慢安排。';
    response.insight=p.days?(t.plan.length?'接着已有计划检查需要变化的安排。具体日期、住宿和交通时刻继续待确认。':'我先整理一个按天的计划草稿。具体日期、住宿和交通时刻继续待确认。'):'先告诉我大概玩几天，我就能把零散攻略整理成一张计划表。';
  }
  const needsPlan=!!p.days||/计划|路线|行程/.test(q);
  const actionableSource=incoming&&(/累|步行|父母|长辈/.test(incoming.text||''))&&incoming.kind==='comment';
  if(t.plan.length&&(context.changed?.length||actionableSource)){
    let rows=M.buildPlan(p,t.sources);
    if(actionableSource&&rows.length>2){rows[2]={...rows[2],place:'札幌（弹性）',title:'减少连续跨城，留半天休息',detail:'结合新加入的步行提醒，将小樽暂放备选，保留就近体验。',source:incoming.postId,citation:incoming.id};}
    const delta=rows.map((row,i)=>({row,before:t.plan[i],i})).filter(x=>JSON.stringify(x.row)!==JSON.stringify(x.before));
    if(delta.length){const first=delta[0];const proposal={id:uid(),baseVersion:t.planVersion,rows,reason:actionableSource?'来自你新分享的评论，需要结合体力与路况判断。':'根据新确认的旅行条件调整，原计划保持到你采用为止。',before:first.before?`D${first.i+1} ${first.before.title}`:'原计划 '+t.plan.length+'天',after:`D${first.i+1} ${first.row.title}`,source:incoming?.postId||'route'};t.proposal=proposal;response.proposal=proposal;}
  }else if(!t.plan.length&&needsPlan){t.plan=M.buildPlan(p,t.sources);t.planVersion=1;response.plan=JSON.parse(JSON.stringify(t.plan));response.version=1;}
  running.delete(t.id);t.messages.push(response);t.preview=response.proposal?'新信息可能影响行程，已有调整建议':response.title+' · '+(t.plan.length?`${t.plan.length}天计划已整理`:'继续聊聊你的想法');t.unread=!(route.page==='chat'&&currentId===t.id);save();if(route.page==='chat'&&currentId===t.id)render();else{render();toast(t.name+' 已回复',btn('查看对话','chat','',`data-id="${t.id}"`));}
}
function send(text,options={}){text=String(text).trim();if(!text)return;if(route.searchContext){if(options.searchPrefs)route.searchContext.prefs=options.searchPrefs;else delete route.searchContext;}let t=task();if(!t){t=createTask();go('chat');}commitTask(t);const out=options.searchPrefs||isSavedQuery(text)?{prefs:t.prefs,changes:[]}:M.extract(text,t.prefs);t.prefs=out.prefs;if(out.changes.length)t.memoryUpdatedAt=new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});t.messages.push({role:'user',text});const input=$('#app input[name="message"]');if(input)input.value='';t.preview=text;t.unread=false;save();closeSheet();if(route.page!=='chat')go('chat',{tab:'chat',resumed:false});else{route.tab='chat';route.resumed=false;render();}queueAssistant(t,{kind:'chat',text,changed:out.changes,...options});}
function share(source){if(!task()){invite();toast('先和点点开始计划，再把内容发给我');return;}modal={type:'share',source};shareTarget=currentId;sharePanel();}
function sharePanel(){
  const source=modal.source,p=M.byId(source.postId),composing=!!shareTarget;
  const targets=draftTask?[...state.tasks,draftTask]:state.tasks;
  const assistants=targets.map(t=>btn(`<span class="recipient-avatar assistant-avatar">${logo('lg')}<i class="recipient-ai">AI</i>${composing?`<i class="recipient-check ${shareTarget===t.id?'checked':''}">${icon('check')}</i>`:''}</span><span class="recipient-name">${esc(t.name)}</span>`,'share-target',`native-recipient ${shareTarget===t.id?'chosen':''}`,`data-id="${t.id}" aria-label="分享到${esc(t.name)}"`)).join('');
  const create=!targets.length?btn(`<span class="recipient-avatar create-avatar">${logo('lg')}<i class="recipient-create">${icon('plus')}</i></span><span class="recipient-name">和点点做计划</span>`,'share-create-assistant','native-recipient'):'';
  const friends=[DemoContacts.xia,DemoContacts.yuan,DemoContacts.weekend].map(contact=>btn(`<span class="recipient-avatar"><span class="recipient-photo ${contact.photos.length>1?'recipient-group-photo':''}">${contact.photos.map(file=>`<img src="assets/${file}.jpg" alt="" loading="lazy">`).join('')}</span>${composing?`<i class="recipient-check">${icon('check')}</i>`:''}</span><span class="recipient-name">${esc(contact.name)}</span>`,'mock-person','native-recipient',`aria-label="分享给${esc(contact.name)}"`)).join('');
  const row=(items)=>`<div class="native-share-row">${items.map(([label,color,glyph])=>btn(`<span class="native-share-icon ${color}">${glyph}</span><span>${label}</span>`,'share-option','native-share-option',`data-label="${label}"`)).join('')}</div>`;
  const chatIcon='<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><ellipse cx="13" cy="13" rx="9" ry="7" fill="currentColor"/><path d="m7 17-2 5 6-3" fill="currentColor"/><ellipse cx="23" cy="21" rx="7" ry="6" fill="currentColor" stroke="#0ec967" stroke-width="1.5"/><path d="m26 25 3 4-6-2" fill="currentColor"/><circle cx="10" cy="12" r="1" fill="#0ec967"/><circle cx="16" cy="12" r="1" fill="#0ec967"/></svg>';
  const channels=row([['私信好友','channel-red',icon('send')],['微信好友','channel-green',chatIcon],['朋友圈','channel-lime',icon('image')],['QQ好友','channel-blue',icon('user')],['QQ空间','channel-yellow',icon('star')],['微博','channel-orange',icon('message')]]);
  const tools=row([['问点点','tool-white',logo()],['复制链接','tool-white',icon('link')],['生成分享图','tool-white',icon('image')],['稍后再看','tool-white',icon('book')],['引用发笔记','tool-white',icon('message')],['建群分享','tool-white',icon('user')]]);
  const fragment=source.kind!=='post'?`<div class="share-fragment"><span>${source.kind==='comment'?'评论':source.kind==='image'?'图片':'划线内容'} · 来自原帖</span><p>${esc(source.text||p.title)}</p></div>`:'';
  const compose=`<div class="share-compose-area">${fragment}<div class="share-compose-box"><label for="share-remark" class="visually-hidden">给点点的备注</label><textarea id="share-remark" maxlength="500" placeholder="想参考什么？可不填，直接发送" aria-label="给点点的备注">${esc(modal.remark||'')}</textarea><div class="share-compose-thumb">${cover(p)}</div></div>${btn('发送','send-share','native-share-send')}</div>`;
  sheet('分享至',`<div class="native-recipients">${assistants}${create}${friends}</div>${composing?compose:channels+tools}`);
  const panel=$('#overlay .sheet');panel.classList.add('note-share-sheet');panel.classList.toggle('is-composing',composing);
}
function receiveSources(t,sources){if(route.page==='chat'&&currentId===t.id){route.resumed=false;route.searchContext=null;}let added=0;for(let src of sources){const exists=t.sources.find(s=>s.postId===src.postId&&s.kind===src.kind&&s.text===src.text);if(exists){if(src.remark)exists.remark=src.remark;continue;}commitTask(t);src={...src,id:uid()};t.sources.push(src);t.messages.push({role:'user',kind:'source',source:src});queueAssistant(t,{kind:'source',source:src});added++;}save();return added;}
function confirmShare(){if(!shareTarget)return;const target=state.tasks.find(t=>t.id===shareTarget)||(draftTask?.id===shareTarget?draftTask:null);if(!target)return;const source={...modal.source,remark:$('#share-remark').value.trim()};currentId=shareTarget;const added=receiveSources(target,[source]);closeSheet();render();toast(added?'已发送给'+target.name:'已保存备注，这条资料已在对话中',btn('查看保存','journey-view-save','',`data-id="${target.id}"`));}
function clearSelection(){selection=null;$('#selection-tools').innerHTML='';document.querySelectorAll('.marked').forEach(el=>el.classList.remove('marked'));}
function showSelection(text){if(!text.trim())return;selection={postId:route.id,kind:'quote',text:text.trim()};$('#selection-tools').innerHTML=`<div class="selection-bar">${btn(`${icon('highlight')} 分享给点点`,'share-selection')}<span class="divider"></span>${btn('取消','clear-selection')}</div>`;}
function formatTime(sec){return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}
function reference(postId,sourceId){const savedSource=task()?.sources.find(s=>s.id===sourceId);if(savedSource){journeySourceDetail(savedSource);return;}const p=M.byId(postId);if(!p)return;modal={type:'reference'};const entries=task()?.sources.filter(s=>sourceId?s.id===sourceId:s.postId===postId)||[];sheet('原文依据',`<article class="reference"><h3>${esc(p.title)}</h3><small>${p.author} · ${p.date} · ${p.type}</small>${entries.length?entries.map(s=>`<div class="reference-note">${s.kind==='comment'?'你分享的评论':s.kind==='video'?'你分享的视频片段 '+s.time:s.kind==='quote'?'你划线的原文':'笔记原文'}</div><blockquote>${esc(s.text||p.paragraphs[0])}</blockquote>`).join(''):`<blockquote>${esc(p.paragraphs[0])}</blockquote>`}<p class="reference-note">不同条件下的体验</p><blockquote>${esc(p.comments[0].text)}</blockquote>${btn('打开原帖，查看完整上下文 ↗','note','',`data-id="${postId}"`)}</article><p>这份依据来自本地 Mock 资料，用于演示引用与追溯。交通时刻、价格和可订状态尚未核实。</p>`);}
function generalSources(){modal={type:'sources'};sheet('这份整理参考了什么',`<p>保留真人经验的出处，也保留不同意见。</p>${['route','onsen','rail'].map(id=>{let p=M.byId(id);return `<article class="reference"><h3>${esc(p.title)}</h3><small>${p.author} · ${p.date}</small><blockquote>${esc(p.paragraphs[0])}</blockquote>${btn('打开原文 ↗','note','',`data-id="${id}"`)}</article>`;}).join('')}<div class="footer-mock">所有资料均为 Mock 示例</div>`);}
function planSheet({day=null}={}){if(!task())return invite();modal={type:'plan'};sheet('我们的旅行计划',planContent(task(),day),true);}
function proposalSheet(){let t=task(),p=t?.proposal;if(!p){toast('当前没有待处理的调整');return;}modal={type:'proposal'};sheet('新信息，怎样影响你的计划',`<p>${esc(p.reason)}</p><div class="diff-card"><div class="diff-head">v${p.baseVersion} → v${p.baseVersion+1}</div><div class="diff-body"><span class="diff-old">${esc(p.before)}</span><span class="diff-new">${esc(p.after)}</span></div></div>${planTimeline(p.rows,t)}${btn('采用调整，更新计划','apply-proposal','wide-btn')}${btn('先保留原计划','keep-plan','wide-btn secondary')}`,true);}
function prefsSheet(){journeyMemorySheet();}
function renderPrefs(){journeyMemorySheet();}
function materialsSheet(){let t=task();if(!t)return invite();modal={type:'materials'};sheet(`参考资料 · ${t.sources.length}`,`<p>整篇笔记、划线和评论，都带着来源留在这里。</p>${t.sources.map(s=>{let p=M.byId(s.postId);return `<article class="materials-card">${cover(p)}<div class="copy"><h3>${esc(p.title)}</h3><p>${s.kind==='comment'?'评论':s.kind==='quote'?'划线':s.kind==='video'?'视频 '+s.time:'笔记'} · ${esc(s.remark||s.text||p.tags.join(' / ')).slice(0,65)}</p><div class="actions">${btn('看原文','reference','',`data-id="${p.id}" data-source="${s.id}"`)}${btn('继续问','discuss-source','',`data-source="${s.id}"`)}${btn('移除','remove-source','remove',`data-source="${s.id}"`)}</div></div></article>`;}).join('')||'<div class="empty">还没有加入资料<br>在帖子分享面板，选择点点导游。</div>'}${btn('从收藏中选择帖子','picker','wide-btn secondary')}`,true);}
function pickerSheet(){if(!task())return invite();pick=new Set();renderPicker();}
function renderPicker(){modal={type:'picker'};sheet('从收藏中选择',`<p>选中的帖子会发到这趟旅行的对话里，我帮你一起整理。</p>${state.saved.map(M.byId).filter(Boolean).map(p=>btn(`${cover(p)}<span class="copy">${esc(p.title)}<small>${p.author} · ${p.type}</small></span><i class="check ${pick.has(p.id)?'selected':''}">${icon('check')}</i>`,'pick','pick-row',`data-id="${p.id}"`)).join('')||'<div class="empty">先在浏览时收藏喜欢的帖子吧</div>'}${btn(`发给点点${pick.size?'（'+pick.size+'）':''}`,'send-picked','wide-btn')}`);}
function permissionSheet(){if(!task())return invite();modal={type:'permission'};sheet('让收藏，也接上这次旅行',`<p>选择「北海道旅行」示例收藏夹，只把这次旅行相关的资料带进来。</p><div class="toggle-row"><span><strong>北海道旅行 · ${state.saved.length}篇</strong><small>仅整理这个收藏夹，不读取其他收藏。<br>开启后，本地新增收藏也会继续关联。</small></span>${btn('','toggle-permission',`toggle ${task().permission?'on':''}`,'role="switch" aria-label="授权整理北海道收藏夹" aria-checked="'+task().permission+'"')}</div><p class="insight-notice">这是本地授权交互演示，不连接真实账号。关闭后停止后续关联，已加入的资料可单独移除。</p>${btn(task().permission?'查看已关联资料':'选择几篇手动加入',task().permission?'materials':'picker','wide-btn secondary')}`);}
function recordSheet(){let t=task();if(!t)return;modal={type:'record'};sheet('把你的体验，留给后来的人',`<p>按实际经历补充，参考过的攻略会继续作为参考资料保留。</p><form data-form="record"><div class="field"><label for="actual-places">实际去了哪里？</label><input id="actual-places" name="places" value="${esc(t.experience?.places||'')}" placeholder="例如：札幌、小樽" required></div><div class="field"><label for="actual-experience">哪些安排值得推荐？有什么变化？</label><textarea id="actual-experience" name="experience" placeholder="只写你亲身经历的部分" required>${esc(t.experience?.text||'')}</textarea></div><button class="wide-btn">整理成我的分享草稿</button></form>`);}
function draftSheet(){let d=task()?.draft;if(!d)return recordSheet();modal={type:'draft'};sheet('我的旅行分享草稿',`<p>只根据你填写的实际经历整理，你可以继续编辑。</p><form data-form="draft"><div class="field"><label for="draft-title">标题</label><input id="draft-title" name="title" value="${esc(d.title)}" required></div><div class="field"><label for="draft-body">正文</label><textarea id="draft-body" name="body" style="min-height:210px" required>${esc(d.body)}</textarea></div><button class="wide-btn">保存草稿</button></form><p class="sheet-note">仅保存到当前任务，不执行发布。</p>`);}
function downloadPlan(){let t=task();if(!t?.plan.length)return;const cell=s=>'"'+String(s).replace(/"/g,'""')+'"';const rows=[['时间','地点','安排','说明','状态','原文标题','原文摘录'],...t.plan.map(r=>{let source=t.sources.find(s=>s.id===r.citation);return ['第'+r.day+'天',r.place,r.title,r.detail,r.status,source?M.byId(source.postId)?.title||'来源待补充':r.citation?'资料已移除':'草稿建议，待补资料',source?(source.text||M.byId(source.postId)?.paragraphs[0]||''):''];})];const blob=new Blob(['\ufeff'+rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='北海道旅行计划-示例-v'+t.planVersion+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已下载带原文摘录的计划表');}
function taskMenu(){if(!task())return invite();sheet('旅行设置',`${btn(`${icon('user')}我这次的旅行需求`,'prefs','attachment-row')}${btn(`${icon('folder')}参考资料`,'materials','attachment-row')}${btn(`${icon('star')}收藏夹授权`,'permission','attachment-row')}${btn(`${icon('edit')}修改对话名称`,'rename','attachment-row')}${btn(`${icon('message')}回到消息列表`,'messages','attachment-row')}${btn(`${icon('trash')}删除这趟旅行`,'delete-dialog','attachment-row')}`);}
function action(name,el){let id=el?.dataset.id;switch(name){
  case 'home':go('home');break;
  case 'back':back();break;
  case 'search':go('search');break;
  case 'search-query':searchFor(el.dataset.query);break;
  case 'filter':route.filter=el.dataset.filter;render();break;
  case 'invite':invite();break;
  case 'create-assistant':invite();break;
  case 'chat':openChat(id||currentId);break;
  case 'messages':go('messages');break;
  case 'profile':break;
  case 'favorites':go('favorites');break;
  case 'favorites-tab':route.all=false;render();break;
  case 'library-tab':route.all=true;render();break;
  case 'quick':send(el.dataset.text);break;
  case 'search-chat':openSearchChat();break;
  case 'search-continue':openSearchChat('',{recommend:true});break;
  case 'search-question':openSearchChat(el.dataset.text);break;
  case 'search-trips':searchTripsSheet();break;
  case 'new-trip':newTripSheet();break;
  case 'search-trip-memory':{const t=state.tasks.find(t=>t.id===id);if(t){sheet('这趟旅行的背景',`<h3>${esc(t.name)}</h3><p class="trip-memory-text">${esc(journeyMemoryText(t.prefs,tripDestination(t))||'还没有明确的旅行条件。')}</p>`);}break;}
  case 'search-select-trip':if(route.page==='results')linkSearchTrip(id);else openChat(id);break;
  case 'link-search':{const candidates=searchCandidates();const target=id||candidates.length===1&&candidates[0].id;if(target)linkSearchTrip(target);else searchTripsSheet();break;}
  case 'unlink-search':route.linked=false;route.tripId=null;route.backgroundSelected=false;route.detached=true;route.aiDismissed=true;closeSheet();render();break;
  case 'note':go('note',{id});break;
  case 'share-post':share({postId:id||route.id,kind:'post',text:''});break;
  case 'share-comment':{const p=M.byId(id),c=p.comments[Number(el.dataset.index)];share({postId:id,kind:'comment',text:c.text,author:c.author});break;}
  case 'share-target':modal.remark=$('#share-remark')?.value||'';shareTarget=id;sharePanel();break;
  case 'send-share':confirmShare();break;
  case 'mark-quote':{const p=M.byId(route.id),text=p.paragraphs[1]||p.paragraphs[0];clearSelection();const paragraph=document.querySelector(`[data-paragraph="${p.paragraphs.length>1?1:0}"]`);paragraph.classList.add('marked');paragraph.scrollIntoView({block:'center',behavior:'smooth'});showSelection(text);break;}
  case 'share-selection':{const s=selection?{...selection}:null;clearSelection();if(s)share(s);break;}
  case 'clear-selection':clearSelection();break;
  case 'save-post':{let saved=state.saved.includes(id);state.saved=saved?state.saved.filter(x=>x!==id):[...state.saved,id];save();let pos=$('#note-scroll')?.scrollTop||0;render();if($('#note-scroll'))$('#note-scroll').scrollTop=pos;if(!saved&&task()?.permission){receiveSources(task(),[{postId:id,kind:'post',text:'',remark:'来自已授权的北海道旅行收藏夹'}]);toast('已收藏，并同步给点点导游',btn('查看对话','chat'));}else toast(saved?'已取消收藏':'已收藏');break;}
  case 'like':el.classList.toggle('is-saved');toast('已喜欢这篇示例笔记');break;
  case 'follow':el.textContent=el.textContent==='关注'?'已关注':'关注';break;
  case 'plan':planSheet();break;
  case 'reference':reference(id,el.dataset.source);break;
  case 'general-sources':generalSources();break;
  case 'proposal':proposalSheet();break;
  case 'apply-proposal':{let t=task(),p=t.proposal;if(!p)break;if(p.baseVersion!==t.planVersion){toast('计划已变化，请重新提出调整');break;}t.plan=p.rows;t.planVersion++;t.confirmed=false;t.proposal=null;t.messages.push({role:'assistant',kind:'answer',title:'计划已更新，来源也保留了',text:`已采用刚才的调整，更新到 v${t.planVersion}。未确认的住宿和交通继续留空，之后可以接着补充。`,plan:JSON.parse(JSON.stringify(t.plan)),version:t.planVersion,refs:[p.source]});t.preview=`计划已更新到 v${t.planVersion}，随时接着聊`;save();closeSheet();render();planSheet();break;}
  case 'keep-plan':if(task())task().proposal=null;save();closeSheet();render();toast('保留原计划，新资料仍在');break;
  case 'confirm-plan':task().confirmed=true;save();planSheet();toast('已采用，后续调整会先向你说明');break;
  case 'adjust-plan':closeSheet();if(route.page!=='chat')go('chat',{tab:'chat'});else{route.tab='chat';render();}$('#app input[name="message"]')?.focus();break;
  case 'export-plan':downloadPlan();break;
  case 'prefs':prefsSheet();break;
  case 'materials':materialsSheet();break;
  case 'remove-source':task().sources=task().sources.filter(s=>s.id!==el.dataset.source);save();materialsSheet();toast('已移除资料，历史对话保留');break;
  case 'discuss-source':{const s=task().sources.find(s=>s.id===el.dataset.source);send('帮我比较这条资料和我的情况：'+(s.text||M.byId(s.postId).title));break;}
  case 'picker':pickerSheet();break;
  case 'pick':pick.has(id)?pick.delete(id):pick.add(id);renderPicker();break;
  case 'send-picked':if(!pick.size){toast('先选一篇帖子吧');break;}receiveSources(task(),[...pick].map(postId=>({postId,kind:'post',text:'',remark:'从我的收藏加入'})));closeSheet();openChat();break;
  case 'attach':sheet('把内容带进这段对话',`${btn(`${icon('star')}从收藏中选择<small>支持多选</small>`,'picker','attachment-row')}${btn(`${icon('search')}继续搜索帖子`,'browse','attachment-row')}${btn(`${icon('link')}粘贴笔记链接`,'paste-link','attachment-row')}${btn(`${icon('folder')}查看已加入的资料`,'materials','attachment-row')}`);break;
  case 'browse':searchFor(tripDestination()+'旅游攻略',{fromTrip:true});break;
  case 'paste-link':sheet('添加笔记链接','<p>此版本不访问真实小红书链接。可以从示例收藏中选择，体验完整的理解、推荐与更新流程。</p>'+btn('选择示例收藏','picker','wide-btn'));break;
  case 'permission':permissionSheet();break;
  case 'toggle-permission':{let t=task();t.permission=!t.permission;save();if(t.permission){receiveSources(t,state.saved.map(postId=>({postId,kind:'post',text:'',remark:'从已授权的北海道旅行收藏夹加入'})));}permissionSheet();toast(t.permission?'已开启这个示例收藏夹的关联':'已停止后续收藏关联');break;}
  case 'record':recordSheet();break;
  case 'view-draft':draftSheet();break;
  case 'publish':if(task()?.plan.length)recordSheet();else toast('旅行计划完成后，可以整理自己的实际体验');break;
  case 'task-menu':taskMenu();break;
  case 'rename':sheet('修改对话名称',`<form data-form="rename"><div class="field"><input name="name" aria-label="对话名称" maxlength="30" value="${esc(task().name)}" required></div><button class="wide-btn">保存</button></form>`);break;
  case 'delete-dialog':sheet('删除这趟旅行？','<p>本浏览器中这次旅行的对话、偏好、资料和计划将被删除。收藏列表会保留。</p>'+btn('删除这趟旅行','delete-task','wide-btn')+btn('保留','close-sheet','text-btn'));break;
  case 'delete-task':if(draftTask?.id===currentId)draftTask=null;state.tasks=state.tasks.filter(t=>t.id!==currentId);currentId=state.tasks[0]?.id;save();go('messages');break;
  case 'clear-history':state.history=[];save();render();break;
  case 'walk':{let i=Number(el.dataset.step);if(i===0){go('results',{query:'北海道旅游攻略'});break;}if(i===4){go('messages');break;}if(!task()){invite();break;}if(i===1)openChat();if(i===2)go('note',{id:'biei'});if(i===3)planSheet();break;}
  case 'about':sheet('关于这个交互原型','<p>基于你提供的小红书截图重新设计，属于非官方产品概念。</p><p>演示重点：独立点点对话、自然语言偏好记忆、内容分享、划线引用、即时推荐，以及带原文依据的计划表。</p><p>AI回复、笔记、作者、评论和计划均为本地 Mock 数据；图片来自提供的截图，不连接真实账号、实时检索或真实视频。</p><p>任务、收藏和草稿仅保存在当前浏览器。上一版数据与此版本分开保留。</p>');break;
  case 'reset-dialog':sheet('重新体验这条产品链路？','<p>将清除当前 Demo 保存的旅行对话、资料与计划，回到空白搜索输入页，已有示例推荐词仍可选择。</p>'+btn('重新开始','reset','wide-btn')+btn('保留当前进度','close-sheet','text-btn'));break;
  case 'reset':clearTimeout(inviteTimer);for(const timer of timers)clearTimeout(timer);timers.clear();running.clear();queues.clear();state=fresh();draftTask=null;currentId=undefined;save();historyStack=[];route={page:'search',searchDraft:''};closeSheet();clearSelection();render();break;
  case 'dismiss-overlay':case 'close-sheet':closeSheet();renderRail();break;
  case 'mock-person':toast('演示只向点点导游发送，不发送真实消息');break;
  case 'mock-conversation':toast('此为示例会话，点击点点导游体验');break;
  case 'write-comment':toast('可把已有评论发给点点，本原型不发布评论');break;
  case 'image-search':case 'voice':toast('当前使用文字与示例内容体验');break;
  case 'menu':sheet('更多',btn(`${icon('message')}消息里的点点导游`,'messages','attachment-row')+btn(`${icon('star')}我的收藏`,'favorites','attachment-row')+btn(`${icon('shield')}演示说明`,'about','attachment-row'));break;
  case 'video-unavailable':toast('视频暂不纳入这版 MVP，先体验图文、评论和划线分享');break;
  case 'out-of-scope':toast('本次原型聚焦搜索、点点对话与旅行计划');break;
}}
document.addEventListener('click',e=>{let el=e.target.closest('[data-action]');if(!el||el.disabled)return;if(el.dataset.action==='dismiss-overlay'&&e.target!==el)return;action(el.dataset.action,el);});
document.addEventListener('input',e=>{if(route.page==='search'&&e.target.matches('form[data-form="search"] input[name="query"]'))route.searchDraft=e.target.value;});
document.addEventListener('submit',e=>{const f=e.target;if(!f.dataset.form)return;e.preventDefault();let d=new FormData(f);switch(f.dataset.form){
  case 'search':searchFor(d.get('query'));break;
  case 'chat':send(d.get('message'),route.searchContext?{searchPrefs:M.extract(String(d.get('message')||''),route.searchContext.prefs).prefs,searchQuery:route.searchContext.query}:{});break;
  case 'new-trip':startTrip(d.get('destination'));break;
  case 'rename':{let name=String(d.get('name')).trim();if(!name)return;task().name=name;save();closeSheet();render();break;}
  case 'record':{let places=String(d.get('places')).trim(),text=String(d.get('experience')).trim();if(!places||!text)return;let t=task();t.experience={places,text};t.draft={title:'我的北海道旅行｜'+places,body:'这次实际去了：'+places+'。\n\n我的亲身体验：\n'+text+'\n\n每个人的条件不同，希望这些经历能给你一点参考。'};save();draftSheet();break;}
  case 'draft':task().draft={title:String(d.get('title')).trim(),body:String(d.get('body')).trim()};save();closeSheet();render();toast('分享草稿已保存在这次旅行中');break;
}});
document.addEventListener('mouseup',()=>{if(route.page!=='note'||modal)return;const s=window.getSelection();if(s?.toString().trim().length>3&&s.anchorNode?.parentElement?.closest('#note-article'))showSelection(s.toString());});
document.addEventListener('keyup',e=>{if(e.key==='Escape'){closeSheet();clearSelection();}else if(route.page==='note'){const s=window.getSelection();if(s?.toString().trim().length>3&&s.anchorNode?.parentElement?.closest('#note-article'))showSelection(s.toString());}});
window.addEventListener('beforeunload',save);
render();
