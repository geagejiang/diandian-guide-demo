const ASSETS={
  "river": "assets/river.jpg",
  "sweets": "assets/sweets.jpg",
  "suichokan": "assets/suichokan.jpg",
  "biei": "assets/biei.jpg",
  "snowportrait": "assets/snowportrait.jpg",
  "asahikawa": "assets/asahikawa.jpg",
  "forest-onsen": "assets/forest-onsen.jpg",
  "sapporo": "assets/sapporo.jpg",
  "camera": "assets/camera.jpg"
};
/* Local, deterministic mock of an assistant. No remote calls or real travel claims. */
(() => {
  const notes = [
    {id:'route',title:'北海道6天5晚｜不自驾也能玩得很舒服',author:'小林的旅行手帐',avatar:'林',likes:'2.1万',cover:null,theme:'route',type:'图文',tags:['路线','不自驾','慢旅行'],date:'11-08',intro:'第一次去北海道，我选了札幌作为主要落脚点。少搬一次行李，就多一点看雪的时间。',paragraphs:['我们这次是6天5晚，没有租车。先在札幌安顿，再分别安排小樽和温泉方向，最后留一天自由活动。','行程别排太满。尤其冬天，天黑得早，想看的地方集中在白天，晚上就在住处附近吃饭、散步。','这份路线最适合第一次去、希望少换酒店的人。出行日期不同，交通、营业时间和天气都要重新确认。'],comments:[{author:'团子和爸妈',text:'带父母的话建议减少跨城，温泉可以安排住一晚，别当天赶回来。',kind:'同行提醒'},{author:'周末逃跑',text:'我们更喜欢多去几个地方，所以只参考了交通部分，节奏还是按自己来。',kind:'不同体验'}],quote:'行程别排太满。尤其冬天，天黑得早，想看的地方集中在白天，晚上就在住处附近吃饭、散步。'},
    {id:'biei',title:'美瑛一日游攻略｜冬天不自驾，先看这一篇',author:'山间来信',avatar:'山',likes:'3257',cover:'biei',type:'图文',tags:['不自驾','交通','自然风景'],date:'11-09',intro:'雪地里的美瑛很美，但“想去”和“适合这次去”之间，还需要看交通与同行人的体力。',paragraphs:['我们这次没有自驾，出发前先确认了往返交通，再挑选当天能顺路到达的景点。','雪天路况和步行体验因人而异，拖着行李或带长辈，体验可能完全不同。','如果不想赶路，可以把美瑛留作备选，先把札幌、小樽和温泉安排舒服。'],comments:[{author:'和妈妈去看雪',text:'我们带父母去，雪地走了很久，比想象中累。后来取消了第二个景点，提前回去休息。',kind:'带父母实测'},{author:'小雪团',text:'我是一个人去，轻装慢慢走觉得很值得。最好结合自己的体力决定。',kind:'不同体验'}],quote:'我们带父母去，雪地走了很久，比想象中累。后来取消了第二个景点，提前回去休息。'},
    {id:'onsen',title:'北海道温泉怎么选？想放松的话，留一晚给自己',author:'热汤与落雪',avatar:'汤',likes:'1862',cover:null,theme:'onsen',type:'图文',tags:['温泉','慢旅行','带父母'],date:'11-07',intro:'比起赶着打卡，我更喜欢把温泉当作一段真正停下来的时间。',paragraphs:['如果很期待泡温泉，可以先考虑一晚温泉住宿，把前后两天的安排留松一点。','带家人同行时，先问清大家对餐食、床型和交通的要求，比只看房间照片更有用。','具体酒店还要看预算、可订日期和接驳条件。这篇只是我的选择思路，不能直接替你决定。'],comments:[{author:'慢半拍',text:'住一晚比当天来回舒服，但接驳和行李安排要先查清楚。',kind:'交通补充'},{author:'预算有限也想玩',text:'我们只做了日归体验，把住宿预算留给了市区，适合自己的就好。',kind:'预算取舍'}],quote:'如果很期待泡温泉，可以先考虑一晚温泉住宿，把前后两天的安排留松一点。'},
    {id:'sweets',title:'札幌白色恋人工厂｜和家人一起的甜蜜半天',author:'小岛日记',avatar:'岛',likes:'1200',cover:'sweets',type:'图文',tags:['带父母','带孩子','札幌'],date:'11-06',intro:'这次没有把札幌排成特种兵，留半天给一个大家都喜欢的体验。',paragraphs:['先问同行的人对体验项目感不感兴趣，再决定要不要放进行程。收藏好看的照片，不等于一定要去。','我们围绕住宿区域安排出行，把这类体验放在比较轻松的一天。','营业时间与预约规则可能变化，出发前请再确认。'],comments:[{author:'带爸妈出门',text:'比起一天跑好几个景点，大家更喜欢一个地方慢慢逛。',kind:'同行体验'}],quote:'先问同行的人对体验项目感不感兴趣，再决定要不要放进行程。收藏好看的照片，不等于一定要去。'},
    {id:'river',title:'旭川Citywalk｜一天除了吃饭，其他花费0元',author:'走走停停',avatar:'走',likes:'688',cover:'river',type:'图文',tags:['慢旅行','城市散步','预算'],date:'11-04',intro:'跟着自己的节奏走一段路，不把所有风景都变成必去清单。',paragraphs:['这次最喜欢的部分，是沿着河边慢慢走。没有提前排满一天，遇到喜欢的店就进去坐一会。','有人喜欢城市散步，有人想看更多自然风景。行程里的留白，可以留给自己真正喜欢的东西。'],comments:[{author:'柚子',text:'冬天带长辈还是要考虑路面情况，散步距离别直接照搬。',kind:'季节提醒'}],quote:'没有提前排满一天，遇到喜欢的店就进去坐一会。'},
    {id:'hotel',title:'不自驾住札幌哪里？按交通便利度来选',author:'住得明白',avatar:'住',likes:'4630',cover:null,theme:'hotel',type:'图文',tags:['住宿','不自驾','带父母'],date:'11-10',intro:'选住宿区域的时候，我先画出要去的地方，再看换乘和搬行李的次数。',paragraphs:['不自驾的话，优先比较车站周边、换乘方式和实际步行距离。离车站近，也要看看是不是需要绕路或上下楼。','带父母时，我更愿意少换一次酒店。房价、房型和可订情况要按自己的日期查。'],comments:[{author:'带爸妈慢慢玩',text:'少搬行李比多住一家漂亮酒店更适合我们，最好把交通也一起算进去。',kind:'同行体验'}],quote:'不自驾的话，优先比较车站周边、换乘方式和实际步行距离。'},
    {id:'camera',title:'在札幌逛中古相机店，把兴趣也放进旅程',author:'北方放映室',avatar:'北',likes:'2503',cover:'camera',type:'图文',tags:['兴趣','摄影','城市探索'],date:'11-03',intro:'旅行里想留一点时间，给那些只有自己才会心动的小事。',paragraphs:['把感兴趣的店先存为备选，确定住宿和主要路线后，再选顺路的一两家。','逛店不一定要买东西。时间有限的时候，我愿意为自己的兴趣留一个下午。'],comments:[{author:'快门声',text:'收藏先留着，最后只去了离住处近的一家，也很满足。',kind:'取舍经验'}],quote:'把感兴趣的店先存为备选，确定住宿和主要路线后，再选顺路的一两家。'},
    {id:'rail',title:'北海道交通笔记｜先定路线，再考虑交通票券',author:'不赶路的人',avatar:'路',likes:'8901',cover:null,theme:'rail',type:'图文',tags:['交通','不自驾','路线'],date:'11-11',intro:'整理交通时，我先确认每天从哪里出发、回到哪里，再逐段核实。',paragraphs:['先按行程列出需要移动的路段，再比较单程票和交通票券，避免为了用票券而增加行程。','时刻、票价、接驳和冬季运行情况，都需要在出发前查官方信息。'],comments:[{author:'小小旅行家',text:'别只看总价，换乘和行李成本也要算上。',kind:'交通补充'}],quote:'先按行程列出需要移动的路段，再比较单程票和交通票券，避免为了用票券而增加行程。'}
  ];
  const byId = id => notes.find(p=>p.id===id);
  const chinese={一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9,十:10};
  function extract(text,old={}) {
    const prefs={...old,interests:[...(old.interests||[])]};
    const changes=[];
    function put(key,value){if(JSON.stringify(prefs[key])!==JSON.stringify(value)){prefs[key]=value;changes.push(key);}}
    const days=text.match(/([1-9]|1[0-4]|[一二两三四五六七八九十])\s*天/);
    if(days)put('days',Number(days[1])||chinese[days[1]]);
    if(/不自驾|不租车|公共交通/.test(text))put('transport','不自驾');
    else if(/自驾|租车/.test(text))put('transport','自驾');
    if(/不带父母|父母不去|爸妈不去|一个人/.test(text))put('company','一个人');
    else if(/父母|爸妈|长辈/.test(text))put('company','带父母');
    else if(/孩子|亲子/.test(text))put('company','带孩子');
    else if(/两个人|情侣|朋友/.test(text))put('company','两人同行');
    if(/轻松|慢一点|不赶|少走|少步行|减少步行/.test(text))put('pace','轻松慢游');
    if(/冬天|冬季/.test(text))put('season','冬季');
    if(/夏天|夏季/.test(text))put('season','夏季');
    if(/住一晚|住一夜/.test(text))put('onsenStay','住一晚');
    if(/当天往返|当天来回|日归/.test(text))put('onsenStay','当天往返');
    const budget=text.match(/预算(?:是|大概|大约|在|为|人均|\s)*(\d+(?:\.\d+)?)\s*(万|千|元)?/);
    if(budget)put('budget',Math.round(Number(budget[1])*(budget[2]==='万'?10000:budget[2]==='千'?1000:1)));
    else if(/预算.*一万/.test(text))put('budget',10000);
    const interests=[...prefs.interests];
    for(const [word,name] of [['温泉','温泉'],['摄影|拍照','摄影'],['美食|吃的','美食'],['自然','自然风景'],['雪景|看雪','雪景']]){
      if(new RegExp('不(?:喜欢|想|要|去|看|泡)'+'.{0,2}(?:'+word+')').test(text)){const i=interests.indexOf(name);if(i>=0)interests.splice(i,1);}
      else if(new RegExp(word).test(text)&&!interests.includes(name))interests.push(name);
    }
    if(JSON.stringify(interests)!==JSON.stringify(prefs.interests))put('interests',interests);
    return {prefs,changes};
  }
  function tags(p){return [p.days?`${p.days}天`:null,p.transport,p.company,p.season,p.pace,p.onsenStay?'温泉'+p.onsenStay:null,...(p.interests||[]),p.budget?`预算¥${p.budget.toLocaleString()}`:null].filter(Boolean);}
  function rank(prefs={},query='',exclude=[]) {
    return notes.filter(n=>!exclude.includes(n.id)).map(n=>{
      let score=0,reasons=[];
      for(const tag of [prefs.transport,prefs.company,prefs.pace==='轻松慢游'?'慢旅行':null,...(prefs.interests||[])].filter(Boolean))if(n.tags.includes(tag)){score+=4;reasons.push(tag);}
      for(const word of ['温泉','住宿','交通','路线','摄影','不自驾'])if(query.includes(word)&&n.tags.includes(word)){score+=7;reasons.push(word);}
      if(/酒店|住宿|住哪/.test(query)&&n.tags.includes('住宿'))score+=30;
      if(/札幌/.test(query)&&n.tags.includes('札幌'))score+=10;
      if(n.id==='route')score+=1;
      return {...n,score,reason:reasons.length?`对应你的「${[...new Set(reasons)].slice(0,2).join(' · ')}」`:'帮你补充一个不同的体验视角'};
    }).sort((a,b)=>b.score-a.score);
  }
  function buildPlan(prefs={},sources=[]) {
    const days=Math.min(14,Math.max(1,prefs.days||6));
    const family=prefs.company==='带父母'||prefs.company==='带孩子';
    const hasWarning=sources.some(s=>s.postId==='biei'&&(s.kind==='comment'||s.kind==='quote')&&/累|长辈|父母|步行/.test(s.text||''));
    const slow=family||prefs.pace==='轻松慢游'||hasWarning;
    let middle=[
      {place:'札幌',title:family?'札幌轻松体验，留出午间休息':slow?'市区轻松体验，午后留白':'札幌城市探索',detail:family?'以同行人体力为先，减少雪地步行，预留坐下休息的时间。':slow?'缩短步行，按自己的节奏选一个体验点。':'按区域慢慢逛，兴趣地点保留为备选。',source:'sweets'},
      {place:'小樽',title:'小樽一日，顺路慢逛',detail:family?'少换乘、少搬行李，先确认出站步行距离，允许提前返回。':slow?'选择少换乘的路线，预留休息时间。':'交通与停留点待进一步核实。',source:'rail'},
      {place:'温泉方向',title:'温泉体验，放慢节奏',detail:'比较日归与住一晚；具体地点、接驳和价格待确认。',source:'onsen'},
      {place:slow?'札幌':'美瑛（备选）',title:slow?'回到札幌，自由安排':'美瑛自然风景，先作备选',detail:slow?'保留休息与购物时间，避免连续跨城。':'冬季步行与交通需要核实，确认适合后再采用。',source:slow?'hotel':'biei'}
    ];
    if(!(prefs.interests||[]).includes('温泉'))middle[2]={place:'札幌',title:'留给个人兴趣的半天',detail:'从收藏中挑选顺路的兴趣地点，余下时间自由安排。',source:'camera'};
    let rows=[{place:'札幌',title:'抵达，入住后轻松逛',detail:'住宿待定；以减少行李搬运为优先。',source:'hotel'}];
    for(let i=1;i<days-1;i++)rows.push({...middle[(i-1)%middle.length]});
    if(days>1)rows.push({place:'返程',title:'预留交通时间，从容返程',detail:'按实际航班核实交通，暂不填写班次。',source:'rail'});
    return rows.map((r,i)=>({...r,day:i+1,status:'待确认'}));
  }
  globalThis.TravelMock={notes,byId,extract,tags,rank,buildPlan};
})();


/* Fixed demo material: image and excerpt references supplied by the user. */

(() => {
  const notes=TravelMock.notes;
  const update=(id,changes)=>Object.assign(notes.find(n=>n.id===id),changes);
  const common={date:'截图未显示发布时间',sourcePublished:'截图未显示',capturedAt:'2026-11-12',sourceLabel:'用户提供的截图节选 · 评论为演示示例'};
  update('route',{...common,title:'⛄ 北海道6天5夜旅行攻略',author:'不吃了谢谢',avatar:'不',likes:'372',cover:'sapporo',tags:['路线','雪景','摄影','情侣出游'],audience:'半自由行／一日团',sourceFile:'微信图片_20261112182622_325_65.jpg、326_65.jpg',intro:'❄️ 冬天就是要去北海道！！！之前在北海道玩了6天（含往返），分享一下这次的行程。',paragraphs:['之前元旦在北海道玩了6天（含往返），报了个半自由团，包含接送机、住宿以及根据个人路线帮忙报一日团，确实比较方便，但是一日团行程比较赶，后面再去的话，个人偏向自由行。','Day1：抵达札幌。下午到达新千岁机场，晚上在中岛公园附近闲逛吃饭。','Day2：北海道神宫 and 北海道大学。雪后的神宫很静谧；校园很大很美，雪后很美，拍照很出片！','Day3：小樽一日游。钱函海岸、朝里站、堺町通商业街和小樽运河商业街；这一天跟了一日团，去了好几个地方。'],quote:'一日团行程比较赶，后面再去的话，个人偏向自由行。',comments:[{author:'小夏与阿远（Mock）',text:'我们也是两个人去，想保留札幌和小樽，其他地方少去一点，把时间留给温泉。',kind:'情侣出游 · Mock 评论'},{author:'冬日慢游（Mock）',text:'拍照点比较分散，不一定要全部照搬。自由行可以按交通和兴趣取舍。',kind:'不同意见 · Mock 评论'}]});
  update('onsen',{...common,title:'🛖🌨️♨️ 在落雪时 泡温泉',author:'小鸟的树果',avatar:'鸟',likes:'199',cover:'forest-onsen',tags:['温泉','雪景','摄影','慢旅行','情侣出游'],audience:'温泉与雪景体验',sourceFile:'微信图片_20261112182622_327_65.jpg',intro:'走进秘境森林深处，穿过长长的林间步道，寒气浸透四肢。在浑身发冷的时候，一下子沉进温热私汤。',paragraphs:['走进秘境森林深处，穿过长长的林间步道，寒气浸透四肢。','在浑身发冷的时候，一下子沉进温热私汤。'],quote:'在浑身发冷的时候，一下子沉进温热私汤。',comments:[{author:'慢慢泡汤（Mock）',text:'如果想好好休息，可以多留半天，具体预约、开放规则和交通还是要问酒店确认。',kind:'温泉安排 · Mock 评论'}]});
  update('hotel',{...common,title:'北海道雪景汤泉（翠蝶馆',author:'老芋芳',avatar:'芋',likes:'1973',cover:'suichokan',tags:['住宿','接驳','预约','温泉','不自驾','情侣出游'],audience:'温泉酒店入住体验',sourceFile:'微信图片_20261112182622_328_65.jpg',intro:'Bucket list 在北海道的雪里泡汤♨️',paragraphs:['Bucket list 在北海道的雪里泡汤♨️','这次想做的事情很简单：看雪、泡汤，慢慢待一会儿。♨️'],quote:'Bucket list 在北海道的雪里泡汤♨️',comments:[{author:'泡汤笔记（Mock）',text:'接驳地点和班次要按酒店的预约确认信息核实，提前联系酒店预约。我当时是从札幌出发的，别只按旧帖子找上车点。',kind:'接驳与预约 · Mock 评论',topic:'温泉酒店接驳',publishedAt:'Mock 示例日期：2026-11-10'},{author:'两个人的冬天（Mock）',text:'我们住了一晚，第二天上午没有另外排景点。雪景照片很好看，但还是要给休息留时间。',kind:'入住体验 · Mock 评论',publishedAt:'Mock 示例日期：2026-11-09'}]});
  update('biei',{...common,title:'北海道真的应该去旭川',author:'67',avatar:'67',likes:'972',cover:'asahikawa',tags:['交通','自然风景','雪景','旭川'],audience:'旭川停留3天',sourceFile:'微信图片_20261112182622_323_65.jpg、324_65.jpg',intro:'在旭川待了3天，今天到札幌了，已经开始怀念旭川。',paragraphs:['在旭川待了3天，今天到札幌了，已经开始怀念旭川。','这几天慢慢逛了旭川，也去了白须瀑布、美瑛和旭岳。最舍不得的是路上随处可见的雪景。','1.30走路去了见本林，从旭川站出发走20分钟左右就能到，时间充裕建议走路，真的没什么人，路上还有个小公园。'],quote:'在旭川待了3天，今天到札幌了，已经开始怀念旭川。',comments:[{author:'小雪团（Mock）',text:'旭川可以单独多留几天。如果总共只有六天，又想泡温泉，不一定要再塞进美瑛和旭岳。',kind:'路线取舍 · Mock 评论'},{author:'路上有雪（Mock）',text:'作者当次的班次和价格要重新查，冬季运行与步行情况也要确认。',kind:'时效提醒 · Mock 评论'}]});
  notes.push({id:'solo',...common,title:'❄️ 北海道自由行攻略（一个人solotrip版）',author:'小九酱',avatar:'九',likes:'6760',cover:'snowportrait',type:'图文',tags:['不自驾','路线','摄影','雪景'],audience:'一个人独自旅行',sourceFile:'微信图片_20261112182622_322_65.jpg、331_65.jpg',intro:'❤️ 一些经验分享：住宿、行程、穿搭、现金和交通。',paragraphs:['住宿地：不去函馆，全程住札幌就行啦。','行程规划：钱函＋小樽可以当天来回。札幌市区可以留一天；冬天北海道黑得早，早上尽量早点出门玩。','穿暖一点，现金也备一些。一个人出门不用赶路，喜欢的地方就多待一会儿～'],quote:'冬天北海道黑得早，早上尽量早点出门玩。',comments:[{author:'两人慢游（Mock）',text:'一个人的节奏和两个人不太一样，我们只参考交通，拍照和温泉会多留时间。',kind:'适用条件差异 · Mock 评论'}]});
  const baseExtract=TravelMock.extract;
  TravelMock.extract=(text,old={})=>{const r=baseExtract(text,old);if(/情侣|男朋友|女朋友/.test(text)&&r.prefs.company!=='情侣出游'){r.prefs.company='情侣出游';r.changes.push('company');}return r;};
  TravelMock.demoPrefs={days:6,transport:'不自驾',company:'情侣出游',season:'冬季',pace:'轻松慢游',interests:['温泉','雪景','摄影']};
  TravelMock.demoRows=(extraOnsen=false)=>[
    {day:1,place:'札幌',title:'抵达与入住，附近轻松逛',detail:'减少搬行李，第一天不安排跨城。',reason:'两人不自驾，抵达后留出休息时间',pending:'航班、住宿位置、抵达时间',status:'待确认',source:'hotel'},
    {day:2,place:'札幌',title:'雪景与拍照，集中在一个区域',detail:'从神宫、大学等候选地点中取舍，不把所有拍照点排满。',reason:'满足两人雪景与拍照兴趣，减少折返',pending:'天气、步行情况、开放信息',status:'备选',source:'route'},
    {day:3,place:'小樽',title:'小樽慢游，不照搬一日团路线',detail:'按交通便利度选择少量地点，晚上回到札幌。',reason:'参考路线帖，同时保留自由行的轻松节奏',pending:'往返交通、实际停留点',status:'备选',source:'route'},
    {day:4,place:'温泉方向',title:extraOnsen?'提前半天到温泉，午后就放松':'温泉与休息，先比较住一晚',detail:extraOnsen?'把原定札幌半天自由活动让给温泉，减少当天游逛。':'酒店接驳与预约先核实，具体入住安排待确定。',reason:'泡温泉与雪景都是两人共同偏好',pending:'接驳地点、预约、费用与可订日期',status:'备选',source:'hotel'},
    {day:5,place:'札幌／温泉',title:extraOnsen?'温泉慢慢退房，再回札幌':'自由半天，保留个人兴趣',detail:extraOnsen?'上午留给泡汤与休息，返程接驳待核实。':'可以加入购物或相机店，体力不足时直接休息。',reason:'给旅行留白，按实际体验继续调整',pending:'接驳时间、两人各自想去的地方',status:'待确认',source:extraOnsen?'onsen':'camera'},
    {day:6,place:'返程',title:'预留交通时间，从容返程',detail:'按实际航班与官方交通信息补充，不预填班次。',reason:'避免最后一天赶路',pending:'航班与机场交通',status:'待确认',source:'rail'}
  ];
})();

/* Extra local examples for the search-continuation story; never live hotel inventory. */
TravelMock.notes.push(
  {id:'sapporo-station',title:'札幌酒店怎么选｜不自驾先看车站周边',author:'住得明白（Mock）',avatar:'住',likes:'463',cover:'sapporo',type:'图文',tags:['札幌','住宿','不自驾','情侣出游'],date:'演示资料',sourceLabel:'本地补充示例 · 正文与评论为 Mock',intro:'这是一份住宿区域选择示例，先比较交通，再按实际日期查酒店。',paragraphs:['不自驾选札幌住宿，可以先比较札幌站周边：去机场、跨城和带行李的路线是否顺手。不能只看地图距离，还要确认车站出口、电梯和实际步行路线。','情侣两个人希望轻松一点，可以把少换酒店作为比较条件。六天旅行不等于每晚都住札幌，温泉住宿可以另外留作候选。','这篇不提供实时酒店名单、房价或可订状态。确定日期、每晚预算与床型后，再核实具体酒店。'],quote:'不能只看地图距离，还要确认车站出口、电梯和实际步行路线。',comments:[{author:'两人慢游（Mock）',text:'我们订之前会把带行李从车站走到酒店的路线单独看一遍，雪天步行也要留余量。',kind:'住宿经验 · Mock 评论'}]},
  {id:'sapporo-odori',title:'札幌站还是大通？住宿区域先这样比较',author:'慢住日记（Mock）',avatar:'慢',likes:'286',cover:null,theme:'hotel',type:'图文',tags:['札幌','住宿','城市散步','慢旅行'],date:'演示资料',sourceLabel:'本地补充示例 · 正文与评论为 Mock',intro:'两种住宿方向都可以先保留，用自己的移动路线来比较。',paragraphs:['如果行程常从札幌出发跨城，可以先对照车站周边；如果以市区吃逛为主，也可以比较大通一带。这里是选择思路，不是具体酒店推荐。','轻松旅行可以把附近用餐、换乘次数和带行李步行距离一起比较，不只看房间照片。','具体位置、价格、房型和可订日期需要重新核实。没有实际入住日期时，先保存区域方向就好。'],quote:'轻松旅行可以把附近用餐、换乘次数和带行李步行距离一起比较，不只看房间照片。',comments:[{author:'下次再来（Mock）',text:'先看每天去哪里，再选住哪一片，比只按热度订房更适合我们。',kind:'选择思路 · Mock 评论'}]}
);

// Natural-language corrections update the existing memory rather than a preference form.
const extractMemoryBase=TravelMock.extract;
TravelMock.extract=(text,old={})=>{
  const result=extractMemoryBase(text,old);
  const put=(key,value)=>{if(result.prefs[key]!==value){result.prefs[key]=value;result.changes.push(key);}};
  const forget=key=>{if(key in result.prefs){delete result.prefs[key];result.changes.push(key);}};
  if(/不想早起|不早起|晚起|睡到自然醒/.test(text))put('sleepPreference','晚起');
  else if(/愿意早起|喜欢早起|可以早起/.test(text))put('sleepPreference','早起');
  if(/天数(?:还)?没定|忘掉天数|取消天数/.test(text))forget('days');
  if(/季节(?:还)?没定|忘掉季节|取消季节/.test(text))forget('season');
  if(/忘掉预算|取消预算|预算(?:还)?没定/.test(text))forget('budget');
  if(/忘掉温泉住宿|温泉住不住(?:还)?没定/.test(text))forget('onsenStay');
  return result;
};
