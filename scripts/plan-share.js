/* Asking for advice reuses a plan snapshot; it never posts to a real account. */
function planAdviceSnapshot(t,messageIndex){
  if(!t)return null;
  const explicit=messageIndex!==undefined&&messageIndex!=='';
  const m=explicit?t.messages[Number(messageIndex)]:null;
  if(explicit&&!m?.plan?.length)return null;
  const rows=m?m.plan:t.plan;
  if(!rows?.length)return null;
  const version=m?(m.version||1):t.planVersion;
  const original=m||t.messages.findLast(x=>x.plan?.length&&x.version===version);
  return {version,destination:m?.destination||tripDestination(t),rows:JSON.parse(JSON.stringify(rows)),prefs:JSON.parse(JSON.stringify(original?.prefsSnapshot||(explicit?{}:t.prefs)))};
}
function planAdviceCreate(snapshot){
  const {version,destination,rows,prefs}=snapshot;
  // Use only general, explicitly stated conditions. No dates, identities or notes.
  const conditions=[prefs.transport,prefs.pace,...(prefs.interests||[])].filter(Boolean);
  const route=rows.map(r=>`Day ${r.day} · ${r.place}\n${r.title}`);
  const pending=rows.filter(r=>r.pending&&String(r.pending).trim()&&!/^(无|暂无|已确认|已核实)$/.test(String(r.pending).trim()))
    .sort((a,b)=>Number(/接驳|预约/.test(b.pending))-Number(/接驳|预约/.test(a.pending))).slice(0,2);
  const questions=pending.length?pending.map(r=>`第${r.day}天的${r.pending}还没确认，有了解的朋友可以提点建议吗？`):['这样的路线安排合理吗？有实际走过的朋友可以帮忙看看吗？'];
  return {...snapshot,title:`${destination}${rows.length}天${prefs.transport||''}，这样安排合理吗？`,body:`正在准备${destination}${rows.length}天旅行${conditions.length?'，希望'+conditions.join('、'):''}。\n这是出发前的计划，还没最终确定，想请有经验的朋友帮忙看看。\n\n计划路线：\n${route.join('\n\n')}\n\n想请教：\n${questions.map((q,i)=>`${i+1}. ${q}`).join('\n')}\n\n以上是计划，不是实际出游体验。`,cardText:route.join('\n\n'),status:'draft',version};
}
function planAdviceOwner(){
  if(!modal?.type?.startsWith('plan-advice'))return null;
  const t=state.tasks.find(x=>x.id===modal.taskId);
  const draft=t?.adviceDrafts?.[modal.key];
  return t&&draft?{t,draft,key:modal.key}:null;
}
function planAdviceOpen(messageIndex){
  const t=task(),snapshot=planAdviceSnapshot(t,messageIndex);
  if(!snapshot){toast('先整理一份行程，再发帖问建议');return;}
  // Keep edited drafts per trip and version, including historical plans.
  const key='v'+snapshot.version;
  t.adviceDrafts=t.adviceDrafts||{};
  if(!t.adviceDrafts[key])t.adviceDrafts[key]=planAdviceCreate(snapshot);
  save();
  modal={type:'plan-advice-editor',taskId:t.id,key};
  planAdviceEditor();
}
function planAdviceVersion(t,draft){
  return `v${draft.version}${draft.version===t.planVersion?' · 出发前计划':' · 历史行程 · 出发前计划'}`;
}
function planAdviceCard(draft){
  return `<article class="plan-advice-card" aria-label="求建议行程卡"><div class="plan-advice-card-top"><span>出发前计划 · 待确认</span><small>v${esc(draft.version)}</small></div><h3>${esc(draft.destination)} · ${draft.rows.length}天路线</h3><p>${esc(draft.cardText)}</p><footer>请有经验的朋友帮忙看看</footer></article>`;
}
function planAdviceEditor(){
  const owner=planAdviceOwner();if(!owner)return;
  const {t,draft}=owner;modal.type='plan-advice-editor';
  sheet('发帖问建议',`<div class="plan-advice-context"><span>${esc(planAdviceVersion(t,draft))}</span><p>需求和路线已经整理好，改改就能请大家帮忙看看。</p></div><form data-form="plan-advice"><div class="field"><label for="advice-title">标题</label><input id="advice-title" data-advice-field="title" value="${esc(draft.title)}" maxlength="100" required></div><div class="field"><label for="advice-body">正文</label><textarea id="advice-body" data-advice-field="body" required>${esc(draft.body)}</textarea></div><details class="plan-advice-card-edit"><summary>行程卡内容 · 可删改</summary><label class="visually-hidden" for="advice-card">行程卡内容</label><textarea id="advice-card" data-advice-field="cardText" required>${esc(draft.cardText)}</textarea></details>${planAdviceCard(draft)}<p class="plan-advice-local">仅在当前浏览器保存，下一步为本地发布预览。</p><div class="plan-advice-buttons">${btn('保存草稿','plan-advice-save','outline-btn','type="button"')}${btn('预览笔记','plan-advice-preview','red-btn','type="button"')}</div></form>`,true);
}
function planAdviceUpdate(field,value){
  const owner=planAdviceOwner();
  if(!owner||!['title','body','cardText'].includes(field))return;
  owner.draft[field]=String(value);owner.draft.status='draft';save();
}
function planAdviceValid(draft){
  return ['title','body','cardText'].every(field=>String(draft[field]||'').trim());
}
function planAdvicePreview(){
  const owner=planAdviceOwner();if(!owner)return;
  const {t,draft}=owner;
  if(!planAdviceValid(draft)){toast('请补上标题、正文和行程卡内容，再预览');return;}
  modal.type='plan-advice-preview';
  sheet('笔记预览',`<div class="plan-advice-preview"><div class="plan-advice-context"><span>${esc(planAdviceVersion(t,draft))}</span></div>${planAdviceCard(draft)}<h3>${esc(draft.title)}</h3><p class="plan-advice-body">${esc(draft.body)}</p><p class="plan-advice-local">本地预览，未真实发布；不会发送到小红书。</p><div class="plan-advice-buttons">${btn('返回编辑','plan-advice-edit','outline-btn')}${btn('完成预览','plan-advice-done','red-btn')}</div></div>`,true);
}
function planAdviceAction(name,el){
  if(!name.startsWith('plan-advice-'))return false;
  if(name==='plan-advice-open'){planAdviceOpen(el?.dataset?.message);return true;}
  const owner=planAdviceOwner();if(!owner)return true;
  if(name==='plan-advice-edit')planAdviceEditor();
  if(name==='plan-advice-preview')planAdvicePreview();
  if(name==='plan-advice-save'||name==='plan-advice-done'){
    owner.draft.status=name==='plan-advice-done'?'previewed':'draft';
    save();closeSheet();
    toast(name==='plan-advice-done'?'预览完成，草稿已保存，未真实发布':'草稿已保存，可从这版行程继续编辑');
  }
  return true;
}
document.addEventListener('input',e=>{
  const field=e.target.dataset?.adviceField;
  if(field)planAdviceUpdate(field,e.target.value);
});
document.addEventListener('submit',e=>{
  if(e.target.dataset?.form!=='plan-advice')return;
  e.preventDefault();planAdvicePreview();
});
