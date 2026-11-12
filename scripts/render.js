let lastRenderKey='',lastRenderedTaskId;
function render(){const restoreChatScroll=route.restoreChatScroll;delete route.restoreChatScroll;const renderKey=JSON.stringify(route),keepScroll=renderKey===lastRenderKey,positions=keepScroll?[...document.querySelectorAll('#app .scroll[id]')].map(x=>[x.id,x.scrollTop]):[];lastRenderKey=renderKey;const field=$('#app input[name="message"]'),draft=lastRenderedTaskId===currentId?field?.value||'':'',wasFocused=field===document.activeElement;const screens={results,search:searchPage,home,messages,chat,note,favorites};$('#app').innerHTML=(screens[route.page]||results)();renderRail();lastRenderedTaskId=currentId;for(const [id,pos] of positions){const area=document.getElementById(id);if(area&&id!=='chat-scroll')area.scrollTop=pos;}if(route.page==='chat'){const next=$('#app input[name="message"]');if(next){next.value=draft;if(wasFocused)next.focus({preventScroll:true});}}if(route.page==='chat')requestAnimationFrame(()=>{let el=$('#chat-scroll');if(el)el.scrollTop=Number.isFinite(restoreChatScroll)?restoreChatScroll:el.scrollHeight;});}
function renderRail(){const t=task();const step=route.page==='results'?0:route.page==='note'?2:route.page==='messages'?3:route.tab==='materials'?4:1;const items=[['从搜索，遇见点点','熟悉的入口，直接聊需求'],['说一句，记住旅行条件','自动记忆 · 推荐理由 · 轻量追问'],['自己看，随手分享回来','整帖分享 · 评论发送 · 划线'],['再搜酒店，带着背景','关联条件 · 住宿推荐 · 已存资料'],['问一句，找回已存资料','关键词搜索 · 分类 · 原文上下文'],['需要时，整理成行程','聊天提出需求 · 资料中找回结果']];$('#walkthrough').innerHTML=items.map(([title,sub],i)=>btn(`<span class="n">0${i+1}</span><span><strong>${title}</strong><small>${sub}</small></span><span class="arrow">${i===step?'↗':'›'}</span>`,'journey-walk',`walk-step ${i===step?'active':''}`,`data-step="${i}"`)).join('');$('#memory-preview').innerHTML=t?`<div class="memory-tags">${M.tags(t.prefs).map(s=>`<span>${esc(s)}</span>`).join('')||'<span>只记住你已说出的条件</span>'}</div><p>${t.sources.length}条已存资料${t.plan.length?' · '+t.plan.length+'天草稿':''}<br>保存的经验，之后可以按关键词找回。</p>`:'<p>说出旅行条件后开始推荐，<br>分享的资料会留在这趟旅行里。</p>';}
function toast(text,extra=''){clearTimeout(toastTimer);$('#toast').innerHTML=esc(text)+extra;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>{$('#toast').classList.remove('visible');$('#toast').replaceChildren();},5000);}
function sheet(title,body,full=false){$('#overlay').innerHTML=`<div class="overlay" data-action="dismiss-overlay"><section class="sheet ${full?'full':''}" role="dialog" aria-modal="true" aria-label="${esc(title||'和点点做计划')}"><div class="sheet-handle"></div><div class="sheet-head">${title?`<h2>${esc(title)}</h2>`:'<span></span>'}${btn(icon('close'),'close-sheet','', 'aria-label="关闭弹层"')}</div><div class="sheet-body">${body}</div></section></div>`;renderRail();}
function closeSheet(){modal=null;$('#overlay').innerHTML='';}
function invite(){if(!task())createTask({draft:true});if(route.page==='results')task().entryQuery=route.query;openChat();}
function searchFor(query,{fromTrip=false}={}){
  query=String(query).trim();if(!query)return;
  const dismissed=!fromTrip&&route.page==='results'&&!!route.aiDismissed;
  let t=fromTrip?storedTask():(route.page==='results'?searchLinkedTrip():null);
  const backgroundSelected=fromTrip||!!(route.page==='results'&&route.backgroundSelected);
  let linked=!dismissed&&!!(t&&(searchTripMatches(t,query)||(backgroundSelected&&!searchQueryDestination(query))));
  // Only an explicit destination with one saved trip is safe to associate automatically.
  // An explicit background or this visit's opt-out always takes precedence.
  if(!linked&&!dismissed&&!fromTrip){
    const destination=searchQueryDestination(query);
    const candidates=destination?state.tasks.filter(trip=>tripDestination(trip)===destination):[];
    if(candidates.length===1){t=candidates[0];linked=true;}
  }
  if(linked)currentId=t.id;
  state.history=[query,...state.history.filter(q=>q!==query)].slice(0,8);save();
  go('results',{query,linked,tripId:linked?t.id:null,backgroundSelected:linked&&backgroundSelected,detached:dismissed,aiDismissed:dismissed});
}
