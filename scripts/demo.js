/* Fixed, clickable product story. All assistant actions are local mocks. */
const DEMO_STORAGE_KEY='red-personal-assistant-v3';
try{state=JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY))||fresh();}catch{state=fresh();}
if(!Array.isArray(state.tasks))state=fresh();
currentId=state.tasks[0]?.id;route={page:'search',searchDraft:''};historyStack=[];
save=()=>{try{localStorage.setItem(DEMO_STORAGE_KEY,JSON.stringify(state));}catch{}};
let migratedTripData=false;
for(const t of state.tasks){if(['北海道旅行助手','北海道旅行助理','北海道助手'].includes(t.name)){t.name='点点导游 · 北海道';migratedTripData=true;}if(restoreSearchQuestions(t))migratedTripData=true;}
if(migratedTripData)save();
document.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(el&&(el.dataset.action!=='dismiss-overlay'||e.target===el))e.preventDefault();},true);
const baseUI={chat,greeting,note,renderMessage,sharedPreview,messages,invite,action,receiveSources,recordSheet};
let experiencePhotos=[];
function sourceTime(s){return s.savedAt||'本次保存';}
function categoryFor(s){return journeyCategory(s);}
function tabsHTML(){return `<nav class="v3-tabs" aria-label="旅行区域">${[['chat','对话'],['materials','资料']].map(([id,label])=>btn(label,'v3-tab',((route.tab||'chat')===id?'active':''),`data-tab="${id}"`)).join('')}</nav>`;}
greeting=journeyGreeting;
chat=journeyChat;
function materialContent(t){return journeyMaterials(t);}
// Keep the itinerary readable on a phone; supporting information opens per day.
function planTimeline(rows,t,expandedDay=null){return `<div class="itinerary" aria-label="每日行程">${rows.map(r=>{
  const source=journeyPlanSource(r,t);
  const reason=(r.reason||r.detail||'先保留弹性，具体安排继续讨论。').replace('先留一个弹性位置，尚缺保存资料支持。','为当天留出弹性，方便按兴趣调整。');
  return `<details class="itinerary-day"${Number(expandedDay)===Number(r.day)?' open':''}><summary><span class="itinerary-number"><small>第</small><b>${esc(r.day)}</b><small>天</small></span><span class="itinerary-overview"><strong>${esc(r.place)}</strong><span>${esc(journeyPlanDayLabel(r,t))}</span>${r.citation&&!t.sources.some(s=>s.id===r.citation)?'<em>依据已移除</em>':''}</span><span class="itinerary-chevron">${icon('right')}</span></summary><div class="itinerary-detail"><div><h4>为什么这样安排</h4><p>${esc(reason)}</p>${r.detail&&r.reason&&r.detail!==r.reason?`<p>${esc(r.detail)}</p>`:''}</div><div class="itinerary-pending"><h4>待确认</h4><p>${esc(r.pending||'日期与交通信息')}</p></div>${source?`<div><h4>参考资料</h4>${source}</div>`:''}${r.status==='草稿建议'?'':`<p class="itinerary-status">${esc(r.status||'待确认')}</p>`}</div></details>`;
}).join('')}</div>`;}
function planContent(t,expandedDay=null){if(!t.plan.length)return `<div class="empty">${icon('list')}<h3>还没有整理过行程</h3><p>需要时，在对话里告诉点点想怎么安排。</p>${btn('回到对话','adjust-plan','red-btn')}</div>`;
return `<section class="itinerary-plan"><div class="itinerary-heading"><div><h3>${esc(tripDestination(t))} ${t.plan.length}天行程</h3><p>${t.confirmed?'已采用方向 · 信息仍待核实':'计划草稿 · 安排可随时讨论'}</p></div><span>v${t.planVersion}</span></div>${t.proposal?`<div class="plan-warning">有一份调整待确认。${btn('查看对比','proposal')}</div>`:''}<p class="itinerary-hint">先看每天去哪，点开查看安排依据</p>${planTimeline(t.plan,t,expandedDay)}<p class="itinerary-disclaimer">${journeyPlanSharingHint()}<br>本地演示草稿，日期、班次、价格与预约仍需核实。</p><div class="itinerary-actions">${t.confirmed?'<span class="itinerary-adopted">'+icon('check')+' 已采用这个方向</span>':btn('采用这个方向','confirm-plan','red-btn')}${btn('聊聊怎么调整','adjust-plan','outline-btn')}${btn('发帖问建议','plan-advice-open','outline-btn')}</div><details class="itinerary-tools"><summary>更多操作 ${icon('right')}</summary><div>${btn(`${icon('download')} 下载计划表`,'export-plan')}${btn('查看旅行记忆','prefs')}${btn(t.draft?'查看分享草稿':'记录实际体验',t.draft?'view-draft':'record')}</div></details></section>`;}
materialsSheet=()=>{if(!task())return invite();modal={type:'materials'};sheet('参考资料 · '+task().sources.length,materialContent(task()),true);};
messages=()=>{state.tasks.sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned));return baseUI.messages();};
sharedPreview=src=>{
  const p=M.byId(src.postId);if(!p)return '';
  const fragment=src.kind!=='post',attrs=`data-id="${p.id}" data-source="${src.id}"`;
  return `${fragment?`<div class="shared-kind">保存的${sourceKind(src)}</div>${src.kind==='image'?`<img class="shared-image" src="${ASSETS[src.imageAsset||p.cover]}" alt="保存的图片">`:`<div class="shared-quote">${esc(src.text)}</div>`}`:''}${btn(`${cover(p)}<span><strong>${esc(p.title)}</strong>${journeySourceTags(src)}</span>`,'journey-original','shared-note',attrs)}${src.remark?`<div class="shared-remark"><span>你的备注</span>${esc(src.remark)}</div>`:''}`;
};
renderMessage=journeyMessage;
receiveSources=(t,sources)=>baseUI.receiveSources(t,sources.map(s=>({...s,category:categoryFor(s),status:/接驳|预约|班次|票价/.test((s.text||'')+(M.byId(s.postId)?.tags||[]).join(' '))?'待核实':'参考',savedAt:new Date().toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})})));

function continueSearchShortcut(intent){
  openChat();
  if(intent==='saved'){pickerSheet();return;}
  if(intent==='need'){action('journey-fill',{dataset:{text:tripDestination()==='北海道'?'我们情侣两个人，去6天，不自驾，想看雪景和泡温泉，轻松一点。':'想去'+tripDestination()+'，先聊聊旅行需求。'}});return;}
  if(intent==='stay')send(tripDestination()==='北海道'?'想找札幌酒店，先比较住宿区域。':'想找'+tripDestination()+'住宿，先聊聊选择方向。');
  if(intent==='route')send('帮我排'+tripDestination()+'路线，先聊聊我的旅行条件。');
  if(intent==='interests')send('还没想好，先看看'+tripDestination()+'有哪些玩法。');
}
share=source=>{modal={type:'share',source,remark:source.remark||''};shareTarget=null;sharePanel();};
runAssistant=runJourneyAssistant;
function watchSheet(){if(!task())return invite();const w=task().watch||{active:false,mode:'仅进入对话时查看',topics:['不自驾交通','温泉酒店接驳'],until:'2026-12-31'};modal={type:'watch'};sheet('关注更新 · 模拟功能',`<p>由你决定补充什么信息。这里仅演示一次预设的新内容，不实际订阅或发送通知。</p><div class="toggle-row"><span><strong>关注这次旅行的新资料</strong><small>不自驾交通 · 温泉酒店接驳</small></span>${btn('','v3-watch-toggle',`toggle ${w.active?'on':''}`,'role="switch" aria-label="开启模拟关注" aria-checked="'+w.active+'"')}</div><div class="field"><label>呈现方式</label><div class="pref-choices">${['仅进入对话时查看','消息提醒（模拟）'].map(x=>btn(x,'v3-watch-mode',w.mode===x?'selected':'',`data-value="${x}"`)).join('')}</div></div><div class="field"><label for="watch-until">关注截止时间</label><input id="watch-until" type="date" value="${w.until}"></div>${btn('保存关注设置','v3-watch-save','wide-btn')}${btn('模拟发现一条相关新内容','v3-simulate-update','wide-btn secondary')}<p class="sheet-note">可随时暂停、修改或关闭；不运行真实后台任务。</p>`);}
function simulateUpdate(){const t=task();closeSheet();go('chat');t.messages.push({role:'assistant',kind:'answer',title:'模拟更新：你关注的接驳有一条补充',text:'这是一条预设的更新示例：新的入住体验提醒接驳预约需要核实，可能帮助你们确认温泉当天的交通。',posts:['hotel'],reasons:{hotel:'对应你主动关注的「温泉酒店接驳」'},refs:['hotel'],prompt:'打开这条接驳资料看看'});t.preview='模拟更新：你关注的温泉接驳有补充';save();render();}
taskMenu=()=>{if(!task())return invite();sheet('我的',`${btn(`${icon('user')}旅行记忆`,'prefs','attachment-row')}${btn(`${icon('bell')}关注更新<small>模拟</small>`,'v3-watch','attachment-row')}${btn(`${icon('pin')}${task().pinned?'取消置顶':'置顶这趟旅行'}`,'v3-pin','attachment-row')}${btn(`${icon('edit')}修改对话名称`,'rename','attachment-row')}${btn(`${icon('star')}资料授权<small>后续能力预览</small>`,'permission','attachment-row')}${btn(`${icon('trash')}删除这趟旅行`,'delete-dialog','attachment-row')}`);};
recordSheet=()=>{baseUI.recordSheet();const f=$('form[data-form="record"]');if(f)f.querySelector('.wide-btn').insertAdjacentHTML('beforebegin',`<div class="field"><label>添加照片 <small>演示素材，供草稿排版预览</small></label><div class="experience-pictures">${['suichokan','sapporo'].map(id=>btn(`<img src="${ASSETS[id]}" alt="示例旅行照片"><span>${experiencePhotos.includes(id)?'✓ 已选':'＋ 选择'}</span>`,'v3-experience-photo',experiencePhotos.includes(id)?'selected':'',`data-id="${id}" type="button"`)).join('')}</div></div>`);};
action=(name,el)=>{
  if(planAdviceAction(name,el))return;
  if(journeyAction(name,el))return;
  if(name==='search-create-guide'){openSearchChat();return;}
  if(name==='search-assistant-start'){
    const intent=el.dataset.intent;
    if(!['need','stay','route','interests','saved'].includes(intent))return;
    if(!task()||storedTask()||!searchTripMatches(task(),route.query||''))createTask({draft:true,destination:searchQueryDestination(route.query||'')||'北海道'});
    task().entryQuery=route.query||'北海道旅游攻略';
    continueSearchShortcut(intent);
    return;
  }
  if(name==='share-create-assistant'){if(!task())createTask({draft:true});shareTarget=currentId;sharePanel();return;}
  if(name==='share-option'){toast('本地演示：请选择上方点点导游体验分享');return;}
  if(name==='walk'&&el.dataset.step==='2'){go('note',{id:'hotel'});return;}
  if(name==='v3-tab'){if(!task())return invite();const tab=el.dataset.tab==='chat'?'chat':'materials';if(route.page!=='chat')go('chat',{tab});else{route.tab=tab;closeSheet();render();}return;}
  if(name==='create-assistant'){invite();return;}
  if(name==='v3-hotel'){go('note',{id:'hotel'});return;}
  if(name==='v3-share-image'){const p=M.byId(el.dataset.id);share({postId:p.id,kind:'image',text:'雪景与拍照参考',imageAsset:p.cover,remark:'先保存图片，拍照安排时参考'});return;}
  if(name==='v3-watch'){watchSheet();return;}
  if(name==='v3-watch-toggle'){const t=task();t.watch=t.watch||{active:false,mode:'仅进入对话时查看',until:'2026-12-31'};t.watch.active=!t.watch.active;save();watchSheet();return;}
  if(name==='v3-watch-mode'){task().watch={...(task().watch||{}),mode:el.dataset.value};save();watchSheet();return;}
  if(name==='v3-watch-save'){task().watch={...(task().watch||{}),until:$('#watch-until').value};save();closeSheet();toast('已保存模拟关注设置');return;}
  if(name==='v3-simulate-update'){simulateUpdate();return;}
  if(name==='v3-pin'){task().pinned=!task().pinned;save();closeSheet();toast(task().pinned?'已置顶这趟旅行':'已取消置顶');return;}
  if(name==='v3-experience-photo'){const title=$('#actual-places')?.value||'',text=$('#actual-experience')?.value||'';experiencePhotos=experiencePhotos.includes(el.dataset.id)?experiencePhotos.filter(x=>x!==el.dataset.id):[...experiencePhotos,el.dataset.id];task().experience={places:title,text,photos:experiencePhotos};save();recordSheet();return;}
  if(name==='confirm-plan'){task().confirmed=true;task().plan.forEach(r=>r.status='已采用·待核实');save();render();planSheet();toast('已采用这个方向，未核实信息继续保留');return;}
  if(name==='remove-source'){baseUI.action(name,el);if(route.tab==='materials'){closeSheet();render();}return;}
  if(name==='messages'){baseUI.action(name,el);return;}
  if(name==='reset'){baseUI.action(name,el);experiencePhotos=[];return;}
  baseUI.action(name,el);
};
const renderWithRetrieval=renderMessage;
renderMessage=m=>m.kind==='mock-update'?assistantBody(`<span class="mock-update-label">模拟更新 · 非实时推送</span><h3>关注的温泉接驳，有一条新体验</h3><p>这条演示内容补充入住前再次确认接驳的提醒，可能帮助你们确认温泉当天交通。</p>${recommendations(['hotel'],{hotel:'与你关注的「温泉酒店接驳」相关'})}<div class="quick-replies">${btn('看帖子','v3-hotel','primary')}${btn('加入资料','v3-update-save')}${btn('不感兴趣','v3-update-dismiss','',`data-update="${m.id}"`)}</div>`):renderWithRetrieval(m);
simulateUpdate=()=>{const t=task();closeSheet();go('chat');t.messages.push({id:uid(),role:'assistant',kind:'mock-update'});t.preview='模拟更新：温泉接驳有一条相关新内容';save();render();};
const actionWithV3=action;
action=(name,el)=>{if(name==='v3-update-save'){receiveSources(task(),[{postId:'hotel',kind:'comment',text:'Mock 新体验：入住前再次向酒店确认接驳预约、上车地点和时间，旧帖子仅作为参考。',remark:'来自模拟关注更新，订酒店时核实'}]);save();toast('已加入资料，继续标记为待核实');return;}if(name==='v3-update-dismiss'){task().messages=task().messages.filter(m=>m.id!==el.dataset.update);save();render();return;}actionWithV3(name,el);};
// Preserve selected demo photos alongside the user's own experience text.
document.addEventListener('submit',e=>{if(e.target.dataset.form==='record'&&task()){task().experience={...(task().experience||{}),photos:[...experiencePhotos]};if(task().draft)task().draft.photos=[...experiencePhotos];save();const body=$('.sheet-body');if(body&&experiencePhotos.length)body.insertAdjacentHTML('beforeend',`<div class="experience-pictures draft-pictures">${experiencePhotos.map(id=>`<img src="${ASSETS[id]}" alt="草稿中的示例照片">`).join('')}</div>`);}});

document.documentElement.style.colorScheme='light';
document.querySelector('.rail-title').innerHTML='每次搜索，<br>都接着你的旅行。';
document.querySelector('.rail-sub').innerHTML='记住需求 · 保存经验 · 带着背景接着搜';
document.querySelector('.rail-foot').innerHTML='非官方概念设计 · V4 · 白天模式<br>按固定故事演示，AI 与评论为 Mock 数据<br>截图素材仅在本地使用';
render();
