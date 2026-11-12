/* Native-style inbox; ordinary conversations are local display fixtures. */
function inboxShortcutIcon(kind){
  const body={
    likes:'<path fill="#ff626a" d="M16 28 4.5 16.8C-3 9.5 6 0 13 6.5L16 9l3-2.5C26 0 35 9.5 27.5 16.8Z"/>',
    follows:'<circle cx="16" cy="9" r="7" fill="#348bfa"/><path d="M4 30v-4a12 12 0 0 1 24 0v4Z" fill="#348bfa"/>',
    comments:'<path d="M16 2C7 2 1 8 1 16c0 4 2 7 4 9l-1 6 7-3c2 1 3 1 5 1 9 0 15-6 15-14S25 2 16 2Z" fill="#28ce99"/><ellipse cx="11" cy="15" rx="1.7" ry="2.4" fill="white"/><ellipse cx="21" cy="15" rx="1.7" ry="2.4" fill="white"/>'
  }[kind];
  return `<svg viewBox="0 0 32 32" aria-hidden="true">${body}</svg>`;
}
function inboxPhoto(file){return `<img src="assets/${file}.jpg" alt="" loading="lazy">`;}
function inboxAvatar(files){return `<span class="inbox-avatar ${files.length>1?'inbox-group-avatar':''}" aria-hidden="true">${files.map(inboxPhoto).join('')}</span>`;}
function inboxExample({name,preview,time='昨天',photos,unread=''}){
  return btn(`${inboxAvatar(photos)}<span class="row-copy"><span class="row-title">${esc(name)}</span><span class="inbox-preview">${esc(preview)}</span></span><span class="inbox-meta"><time>${esc(time)}</time>${unread?`<span class="inbox-count">${esc(unread)}</span>`:''}</span>`,'mock-conversation','message-row');
}
function inboxTrip(t){
  return btn(`<span class="inbox-avatar inbox-guide-avatar">${logo('lg')}</span><span class="row-copy"><span class="row-title"><span class="inbox-name">${esc(t.name)}</span><i class="ai-tag">AI</i></span><span class="inbox-preview">${esc(running.has(t.id)?'正在整理这次旅行的内容…':t.preview||'旅行的想法和资料，都留在这里')}</span></span><span class="inbox-meta"><time>刚刚</time>${t.unread?'<span class="inbox-unread-dot" aria-label="有未读消息"></span>':''}</span>`,'chat',`message-row ${t.pinned?'inbox-pinned':''}`,`data-id="${t.id}"`);
}
function messages(){
  const groupRows=[
    {...DemoContacts.weekend,preview:'阿远：照片整理好啦，发群里了',time:'01:25',unread:'3'}
  ];
  const ordinaryRows=[
    {...DemoContacts.xia,preview:'好呀，等你确定时间～'},
    {...DemoContacts.yuan,preview:'我也存了几篇攻略，晚点一起看看',unread:'1'}
  ];
  const emptyGuide=!state.tasks.length?btn(`<span class="inbox-avatar inbox-guide-avatar">${logo('lg')}</span><span class="row-copy"><span class="row-title">点点导游 <i class="ai-tag">AI</i></span><span class="inbox-preview">旅行的想法，随时来聊聊</span></span><span class="inbox-meta"><time>昨天</time></span>`,'invite','message-row'):'';
  return `<section class="inbox-screen"><header class="inbox-header"><h1>消息</h1><div>${btn(icon('search'),'search','inbox-header-button','aria-label="搜索"')}${btn('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 6.5v11M6.5 12h11"/></svg>','search-trips','inbox-header-button','aria-label="我的旅行"')}</div></header><div class="scroll inbox-scroll" id="inbox-scroll"><div class="message-icons">${[['likes','赞和收藏'],['follows','新增关注'],['comments','评论和@']].map(([kind,label])=>btn(`<span class="message-icon ${kind}">${inboxShortcutIcon(kind)}</span><span>${label}</span>`,'out-of-scope')).join('')}</div><div class="message-list">${state.tasks.filter(t=>t.pinned).map(inboxTrip).join('')}${groupRows.map(inboxExample).join('')}${state.tasks.filter(t=>!t.pinned).map(inboxTrip).join('')}${emptyGuide}${ordinaryRows.map(inboxExample).join('')}</div></div>${nav('messages')}</section>`;
}
