/* Note interactions: normal reading, native text selection, direct forwarding. */
Object.assign(paths,{copy:'M8 8h12v13H8V8M16 5V2H3v15h2',bubble:'M20 11a8 8 0 0 1-8 8H4v-8a8 8 0 1 1 16 0'});
const selectionAction=action;
let lastTextRange=null,longPressTimer,selectionTimer;
function captureTextRange(){
  const native=window.getSelection();
  if(!native?.rangeCount||native.isCollapsed)return null;
  const range=native.getRangeAt(0),parent=range.commonAncestorContainer.nodeType===1?range.commonAncestorContainer:range.commonAncestorContainer.parentElement;
  if(!parent?.closest('#note-article'))return null;
  return range.cloneRange();
}
clearSelection=()=>{selection=null;lastTextRange=null;$('#selection-tools').replaceChildren();document.querySelectorAll('.marked').forEach(n=>n.classList.remove('marked'));window.getSelection()?.removeAllRanges();};
showSelection=text=>{
  const range=captureTextRange();if(!range||!text.trim()||route.page!=='note'||modal)return;
  lastTextRange=range;
  const parent=range.startContainer.parentElement,comment=parent?.closest('[data-comment-index]');
  selection={postId:route.id,kind:comment?'comment':'quote',text:text.trim()};
  if(comment)selection.author=M.byId(route.id).comments[Number(comment.dataset.commentIndex)].author;
  const tools=$('#selection-tools'),bounds=tools.getBoundingClientRect(),scale=bounds.width/tools.clientWidth;
  const rects=[...range.getClientRects()].filter(r=>r.width>0),first=rects[0],last=rects.at(-1);if(!first||!last)return;
  const x=(first.left-bounds.left)/scale,y=(first.top-bounds.top)/scale;
  const right=(last.right-bounds.left)/scale,bottom=(last.bottom-bounds.top)/scale;
  const width=222,left=Math.max(9,Math.min(tools.clientWidth-width-9,(x+right-width)/2)),top=Math.max(54,y-91);
  tools.innerHTML=`<div class="native-text-menu" role="toolbar" aria-label="文字操作" style="left:${left}px;top:${top}px">${btn(`${icon('copy')}<span>复制</span>`,'selection-copy')}${btn(`${icon('search')}<span>搜索</span>`,'selection-search')}${btn(`${icon('bubble')}<span>发给点点</span>`,'selection-forward')}</div><i class="selection-caret start" style="left:${x}px;top:${y}px;height:${first.height/scale}px"></i><i class="selection-caret end" style="left:${right}px;top:${bottom-last.height/scale}px;height:${last.height/scale}px"></i>`;
};
function selectParagraph(element){
  const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);const text=walker.nextNode();if(!text?.textContent.trim())return;
  const range=document.createRange();range.setStart(text,0);range.setEnd(text,Math.min(text.length,16));
  const native=window.getSelection();native.removeAllRanges();native.addRange(range);showSelection(native.toString());
}
// Whole-post sharing uses the two-step panel in interactions.js.
action=(name,el)=>{
  if(name==='selection-forward'||name==='share-selection'){
    if(!selection)return;const source={...selection,remark:''};clearSelection();
    if(!task()){share(source);return;}
    const t=task();const added=receiveSources(t,[source]);toast(added?'已发给'+t.name:'这段内容已经保存',btn('查看保存','journey-view-save','',`data-id="${t.id}"`));return;
  }
  if(name==='selection-copy'){
    if(!selection)return;const text=selection.text;
    if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>{clearSelection();toast('已复制');}).catch(()=>toast('浏览器未允许复制，可使用系统复制'));else toast('可使用系统复制选中文字');return;
  }
  if(name==='selection-search'){if(!selection)return;const text=selection.text;clearSelection();searchFor(text);return;}
  if(name==='note-comments'){$('.comment-title')?.scrollIntoView({block:'start',behavior:'smooth'});return;}
  if(name==='save-for-later'){const p=modal?.source?.postId;if(p&&!state.saved.includes(p))state.saved.push(p);save();closeSheet();toast('已加入稍后再看');return;}
  if(name==='mock-copy-link'){toast('演示内容保留原帖来源，不生成外部链接');return;}
  selectionAction(name,el);
};
document.addEventListener('pointerdown',event=>{
  if(event.target.closest('.native-text-menu')){event.preventDefault();return;}
  const p=event.target.closest('.note-paragraph,.comment-item p');if(!p)return;
  if(event.pointerType==='touch')longPressTimer=setTimeout(()=>selectParagraph(p),450);
});
document.addEventListener('pointerup',()=>clearTimeout(longPressTimer));
document.addEventListener('pointermove',()=>clearTimeout(longPressTimer));
document.addEventListener('dblclick',event=>{const p=event.target.closest('.note-paragraph,.comment-item p');if(p)selectParagraph(p);});
document.addEventListener('contextmenu',event=>{const p=event.target.closest('.note-paragraph,.comment-item p');if(p){event.preventDefault();selectParagraph(p);}});
document.addEventListener('selectionchange',()=>{clearTimeout(selectionTimer);selectionTimer=setTimeout(()=>{const range=captureTextRange();if(range)showSelection(range.toString());else if(selection&&!modal)clearSelection();},70);});
document.addEventListener('scroll',()=>{if(selection&&lastTextRange)showSelection(selection.text);},true);
