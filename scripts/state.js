const M=TravelMock, INITIAL_STORAGE_KEY='red-personal-assistant-v2';
const fresh=()=>({tasks:[],saved:['route','onsen','camera'],history:['北海道旅游攻略','札幌住哪里','冬季不自驾'],invited:false});
let state;try{state=JSON.parse(localStorage.getItem(INITIAL_STORAGE_KEY));}catch{}if(!state||!Array.isArray(state.tasks))state=fresh();
let route={page:'search',searchDraft:''},historyStack=[],currentId=state.tasks[0]?.id,modal=null,selection=null,pick=new Set(),prefsDraft={},shareTarget=null,toastTimer,inviteTimer;
const running=new Map(),timers=new Set();
let draftTask=null;
function storedTask(){return state.tasks.find(t=>t.id===currentId);}
function task(){return storedTask()||(draftTask?.id===currentId?draftTask:null);}
function save(){try{localStorage.setItem(INITIAL_STORAGE_KEY,JSON.stringify(state));}catch{}}
function uid(){return 't-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);}
function tripDestination(t=task()){return t?.destination||'北海道';}
function createTask({draft=false,destination='北海道',name=''}={}){const t={id:uid(),destination,name:name||'点点导游 · '+destination,prefs:{interests:[]},sources:[],messages:[],plan:[],planVersion:0,proposal:null,permission:false,unread:false};if(draft)draftTask=t;else{draftTask=null;state.tasks.unshift(t);}currentId=t.id;if(!draft)save();return t;}
// Only a sent message or shared source turns a first visit into a saved trip.
function commitTask(t){if(!state.tasks.includes(t))state.tasks.unshift(t);if(draftTask===t)draftTask=null;}
function go(page,props={}){
  if(page==='chat')props={taskId:currentId,...props};
  // Reopening the current conversation (for example after creating it from a
  // search shortcut) must not add another chat screen to the back stack.
  if(page==='chat'&&route.page==='chat')route={...route,...props};
  else{
    const previous={...route};
    if(route.page==='results')previous.resultsScrollTop=$('#results-scroll')?.scrollTop||0;
    if(route.page==='chat')previous.chatScrollTop=$('#chat-scroll')?.scrollTop||0;
    historyStack.push(previous);route={page,...props};
  }
  closeSheet();clearSelection();render();
}
function back(){
  closeSheet();clearSelection();route=historyStack.pop()||{page:'search',searchDraft:''};if(route.taskId)currentId=route.taskId;else if(route.linked&&route.tripId)currentId=route.tripId;if(route.page==='chat'&&Number.isFinite(route.chatScrollTop))route.restoreChatScroll=route.chatScrollTop;render();
  if(route.page==='results'){const results=$('#results-scroll');if(results)results.scrollTop=route.resultsScrollTop||0;}
}
function chatBackLabel(){
  const page=historyStack[historyStack.length-1]?.page;
  return ({results:'返回搜索结果页',search:'返回搜索页',messages:'返回消息列表',note:'返回笔记详情',favorites:'返回收藏页',home:'返回首页'})[page]||'返回上一页';
}
function openChat(id=currentId,{resumed=route.page==='messages'}={}){if(!id)return invite();currentId=id;const t=task();t.unread=false;save();go('chat',{tab:'chat',resumed:resumed&&!!t.messages.length,materialQuery:'',materialCategory:'全部',searchContext:null});}
