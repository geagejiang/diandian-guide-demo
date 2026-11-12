// Shared local identities keep inbox and share recipients visually consistent.
const DemoContacts={
  xia:{name:'小夏',photos:['snowportrait']},
  yuan:{name:'阿远',photos:['profile-avatar']},
  weekend:{name:'周末出发小分队',photos:['profile-inspiration','sapporo','profile-avatar','camera']}
};
function titleBar(title,action='menu'){return `<header class="header">${btn(icon('back'),'back','icon-btn','aria-label="返回"')}<div class="page-title">${esc(title)}</div>${btn(icon(action==='search'?'search':'more'),action,'icon-btn',`aria-label="${action==='search'?'搜索':'更多'}"`)}</header>`;}
function nav(active){return `<nav class="bottom-nav" aria-label="底部导航">${btn('首页','home',active==='home'?'selected':'')}${btn('市集','out-of-scope')}${btn('+','publish','publish','aria-label="发布"')}${btn(`消息${state.tasks.some(t=>t.unread)?'<i class="nav-dot"></i>':''}`,'messages',active==='messages'?'selected':'')}<button type="button" disabled aria-label="我（暂不开放）">我</button></nav>`;}
const posterText={route:['HOKKAIDO · TRAVEL NOTES','北海道\n6天5晚\n不自驾攻略','少搬行李 · 慢慢看雪'],onsen:['MY SLOW TRIP','温泉怎么选\n留一晚\n慢慢放松','日归 or 住一晚？'],hotel:['SAPPORO · STAY','不自驾\n札幌住哪？','先看交通，再选房间'],rail:['HOKKAIDO · TRANSPORT','先定路线\n再选票券','别为了用票，增加行程']};
function cover(p,extra=''){let a=posterText[p.theme]||posterText.route;return `<span class="cover ${extra}">${p.cover?`<img src="${ASSETS[p.cover]}" alt="${esc(p.title)}" loading="lazy">`:`<span class="poster ${p.theme}"><small>${a[0]}</small><strong>${a[1]}</strong><em>${a[2]}</em></span>`}</span>`;}
function postCard(p,i=0,matched=false){return btn(`${cover(p)}<h3 class="post-title">${esc(p.title)}</h3>${matched?`<div class="match-reason">${esc(p.reason)}</div>`:''}<div class="post-meta"><span class="author"><i class="avatar ${i%2?'coral':''}">${p.avatar}</i>${p.author}</span><span>${icon('heart')} ${p.likes}</span></div>`,'note',`post ${i%3===1?'short':''}`,`data-id="${p.id}" aria-label="打开笔记：${esc(p.title)}"`);}
function grid(posts,matched=false){return `<div class="post-grid">${[0,1].map(col=>`<div class="post-column">${posts.filter((p,i)=>i%2===col).map((p,i)=>postCard(p,i+col,matched)).join('')}</div>`).join('')}</div>`;}
function recommendations(ids,reasons={}){return `<div class="chat-recommendations">${ids.slice(0,2).map(id=>{let p=M.byId(id);return btn(`${cover(p)}<h4>${esc(p.title)}</h4><p class="rec-author">${p.author} · ${p.type}</p><p class="rec-reason">${esc(reasons[id]||'补充一个具体的真人体验')}</p>`,'note','recommendation',`data-id="${p.id}" aria-label="打开推荐：${esc(p.title)}"`);}).join('')}</div>`;}
