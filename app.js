firebase.initializeApp({
  apiKey: "AIzaSyD0Bneb88cs7iqje3obfsr5-TNXv2EIczw",
  authDomain: "an-urgency-of-appetite-61c0c.firebaseapp.com",
  projectId: "an-urgency-of-appetite-61c0c",
  storageBucket: "an-urgency-of-appetite-61c0c.firebasestorage.app",
  messagingSenderId: "282236769213",
  appId: "1:282236769213:web:c6edd7a2059502677d78d4"
});
const db = firebase.firestore();
const stRef = firebase.storage();

// ===== AUTH =====
const USERS={'流奈':'uoaLuna','灯花':'uoaTooka','冬日':'uoaLucas','凤凰':'uoaPhoenix','君商':'uoaAmber'};
let currentUser=null;
function isLoggedIn(){return currentUser!==null}
function getCurrentUser(){return currentUser}
function restoreSession(){try{const s=sessionStorage.getItem('ua-session');if(s&&USERS[s])currentUser=s}catch{}}
function updateAuthUI(){
  const u=document.getElementById('navUser'),b=document.getElementById('navAuthBtn');
  if(isLoggedIn()){u.textContent=currentUser;b.textContent='登出'}else{u.textContent='';b.textContent='登录'}
}
function handleAuth(){
  if(isLoggedIn()){currentUser=null;try{sessionStorage.removeItem('ua-session')}catch{}updateAuthUI();renderAll();showToast('已登出')}
  else openLoginModal()
}
function openLoginModal(){document.getElementById('loginName').value='';document.getElementById('loginPass').value='';document.getElementById('loginError').classList.remove('show');document.getElementById('loginModal').classList.add('active');setTimeout(()=>document.getElementById('loginName').focus(),100)}
function closeLoginModal(){document.getElementById('loginModal').classList.remove('active')}
function doLogin(){
  const n=document.getElementById('loginName').value.trim(),p=document.getElementById('loginPass').value;
  if(USERS[n]&&USERS[n]===p){currentUser=n;try{sessionStorage.setItem('ua-session',n)}catch{}closeLoginModal();updateAuthUI();renderAll();showToast('欢迎回来，'+n)}
  else document.getElementById('loginError').classList.add('show')
}
function requireLogin(){if(!isLoggedIn()){showToast('请先登录');openLoginModal();return false}return true}

// ===== IMAGE =====
function compressImage(file,maxW=1200,q=0.75){return new Promise(r=>{const fr=new FileReader;fr.onload=e=>{const img=new Image;img.onload=()=>{const c=document.createElement('canvas');let w=img.width,h=img.height;if(w>maxW){h=h*maxW/w;w=maxW}c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);r(c.toDataURL('image/jpeg',q))};img.src=e.target.result};fr.readAsDataURL(file)})}
function compressAvatar(f){return compressImage(f,300,0.8)}
function b64toBlob(b){const p=b.split(','),m=p[0].match(/:(.*?);/)[1],d=atob(p[1]),a=new Uint8Array(d.length);for(let i=0;i<d.length;i++)a[i]=d.charCodeAt(i);return new Blob([a],{type:m})}
async function uploadImg(path,b64){const ref=stRef.ref(path);await ref.put(b64toBlob(b64));return await ref.getDownloadURL()}
async function deleteImg(path){try{await stRef.ref(path).delete()}catch(e){console.warn('del img:',e)}}

// ===== DEFAULTS =====
const DEF_MODULES=[
  {id:'orient-express',name:'东方快车上的恐怖',nameEn:'Horror on the Orient Express',desc:'横跨欧洲的列车之旅，古老的雕像碎片散落在沿途的每一座城市。旅途中潜伏的恐怖远比乘客们想象的更加深邃。',kp:'灯花',order:0},
  {id:'king-in-yellow',name:'褴褛之王',nameEn:'The King in Yellow',desc:'黄色的面具之下隐藏着怎样的面容？在历史的夹缝与阴影中，与那位编织了无数悲剧的莎士比亚隔着时空静默对望。',kp:'灯花',order:1},
  {id:'stubborn',name:'有些人油盐不进',nameEn:'and Some Fell On Stony Ground',desc:'理智是脆弱的壁垒，而有些灵魂却如同顽石般拒绝启示。在凡俗的执拗与深渊的凝视之间，调查员们正走向未知的结局。',kp:'流奈',order:2}
];
const DEF_MEMBERS=[
  {id:'m1',name:'灯花',role:'秘史',bio:'历史是时间在世界身上留下的伤疤',initial:'I',order:0},
  {id:'m2',name:'流奈',role:'启',bio:'启不允许封闭和孤立存在，它欢快地将我们推出无知的庇护',initial:'II',order:1},
  {id:'m3',name:'冬日',role:'冬',bio:'冬是静默、终结和不尽然逝去之物的准则',initial:'III',order:2},
  {id:'m4',name:'君商',role:'杯',bio:'食、色、性，有溺而无还者也',initial:'IV',order:3},
  {id:'m5',name:'凤凰',role:'心',bio:'为了保护我们所知世界的表皮，不息之心无尽地搏动着',initial:'V',order:4}
];
const DEF_GUESTS=[{id:'g1',name:'小樱'}];

// ===== STATE =====
let modules=[],members=[],guests=[];
let currentModuleId=null,currentEditMemberId=null,currentEditGuestId=null,currentArticles=[];

// ===== DB OPS =====
async function initData(){
  const m=await db.collection('meta').doc('init').get();
  if(!m.exists){
    const b=db.batch();
    DEF_MODULES.forEach(x=>b.set(db.collection('modules').doc(x.id),x));
    DEF_MEMBERS.forEach(x=>b.set(db.collection('members').doc(x.id),x));
    DEF_GUESTS.forEach(x=>b.set(db.collection('guests').doc(x.id),x));
    b.set(db.collection('meta').doc('init'),{seeded:true});
    await b.commit();
  } else {
    const kpMap={'orient-express':'灯花','king-in-yellow':'灯花','stubborn':'流奈'};
    const snap=await db.collection('modules').get();
    const mb=db.batch();let need=false;
    snap.docs.forEach(d=>{if(!d.data().kp&&kpMap[d.id]){mb.update(d.ref,{kp:kpMap[d.id]});need=true}});
    if(need)await mb.commit();
  }
}
async function loadModules(){const s=await db.collection('modules').orderBy('order').get();modules=s.docs.map(d=>({id:d.id,...d.data()}))}
async function loadMembers(){const s=await db.collection('members').orderBy('order').get();members=s.docs.map(d=>({id:d.id,...d.data()}))}
async function loadGuests(){const s=await db.collection('guests').get();guests=s.docs.map(d=>({id:d.id,...d.data()}))}
async function loadArticles(mid){const s=await db.collection('modules').doc(mid).collection('articles').orderBy('timestamp','desc').get();return s.docs.map(d=>({id:d.id,...d.data()}))}
async function countArticles(mid){return(await db.collection('modules').doc(mid).collection('articles').get()).size}

// ===== TOAST =====
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}

// ===== RENDER =====
function esc(s){const d=document.createElement('div');d.textContent=s||'';return d.innerHTML}
function renderAll(){renderModules();renderTeam();renderGuests()}

async function renderModules(){
  const g=document.getElementById('modulesGrid');let h='';
  for(let i=0;i<modules.length;i++){const m=modules[i],c=await countArticles(m.id);
    h+=`<div class="module-card fade-in" onclick="openModule('${m.id}')"><div class="module-number">CASE FILE NO.${String(i+1).padStart(3,'0')}</div><div class="module-name">${esc(m.name)}</div><div class="module-name-en">${esc(m.nameEn)}</div><div class="module-desc">${esc(m.desc)}</div><div class="module-meta"><span class="module-count">${c} 篇记录</span>${m.kp?`<span class="module-kp">守秘人 · ${esc(m.kp)}</span>`:''}<span class="module-arrow">→</span></div></div>`}
  if(isLoggedIn())h+=`<div class="module-card module-card-add fade-in" onclick="openAddModuleModal()"><div class="add-icon">✦</div><div class="add-text">添加新模组</div></div>`;
  g.innerHTML=h;observeFadeIn()
}

async function renderTeam(){
  let html='';
  for(const m of members){
    const eb=isLoggedIn()?`<button class="edit-member-btn" onclick="event.stopPropagation();openEditModal('${m.id}')">编辑 ✎</button>`:'';
    let countSnap;try{countSnap=await db.collection('members').doc(m.id).collection('characters').get()}catch{countSnap={size:0}}
    const cnt=countSnap.size;
    const cntHtml=cnt>0?`<div style="font-family:var(--font-ui);font-size:0.65rem;color:var(--accent-dim);margin-top:0.8rem;opacity:0.7">${cnt} 次入梦</div>`:'';
    html+=`<div class="member-card fade-in" onclick="openCharSheet('members','${m.id}')" style="cursor:pointer">${eb}<div class="member-avatar">${m.avatarUrl?`<img src="${m.avatarUrl}">`:`<span class="avatar-placeholder">${esc(m.initial||'?')}</span>`}</div><div class="member-name">${esc(m.name)}</div><div class="member-role">${esc(m.role)}</div><div class="member-bio">${esc(m.bio)}</div>${cntHtml}</div>`;
  }
  document.getElementById('teamGrid').innerHTML=html;observeFadeIn()
}

async function renderGuests(){
  let h='';
  for(const g of guests){
    const rb=isLoggedIn()?`<button class="guest-remove" onclick="event.stopPropagation();removeGuest('${g.id}')">×</button>`:'';
    const eb=isLoggedIn()?`<button class="guest-edit-btn" onclick="event.stopPropagation();openEditGuestModal('${g.id}')">✎</button>`:'';
    let countSnap;try{countSnap=await db.collection('guests').doc(g.id).collection('characters').get()}catch{countSnap={size:0}}
    const cnt=countSnap.size;
    const cntHtml=cnt>0?`<div style="font-family:var(--font-ui);font-size:0.6rem;color:var(--accent-dim);margin-top:0.4rem;opacity:0.6">${cnt} 次入梦</div>`:'';
    h+=`<div class="guest-card" onclick="openCharSheet('guests','${g.id}')" style="cursor:pointer">${rb}${eb}<div class="guest-avatar">${g.avatarUrl?`<img src="${g.avatarUrl}">`:`<span class="guest-avatar-placeholder">✦</span>`}</div><div class="guest-name">${esc(g.name)}</div>${cntHtml}</div>`;
  }
  if(isLoggedIn())h+=`<div class="add-guest-card" onclick="openGuestModal()"><div class="add-icon">+</div><div class="add-text">添加客座</div></div>`;
  document.getElementById('guestGrid').innerHTML=h
}

// ===== CHARACTER SHEET =====
let csCollection=null,csOwnerId=null,csChars=[];

async function openCharSheet(col,ownerId){
  csCollection=col;csOwnerId=ownerId;
  const owner=col==='members'?members.find(m=>m.id===ownerId):guests.find(g=>g.id===ownerId);
  if(!owner)return;
  document.getElementById('csTitle').textContent=owner.name+' — 角色卡';
  showToast('加载中...');
  const snap=await db.collection(col).doc(ownerId).collection('characters').get();
  csChars=snap.docs.map(d=>({id:d.id,...d.data()}));
  // Migrate: add order to docs that lack it
  const needOrder=csChars.filter(c=>c.order===undefined||c.order===null);
  if(needOrder.length){
    const batch=db.batch();
    needOrder.forEach((c,i)=>{
      c.order=csChars.length-needOrder.length+i;
      batch.update(db.collection(col).doc(ownerId).collection('characters').doc(c.id),{order:c.order});
    });
    try{await batch.commit()}catch(e){console.warn('order migrate:',e)}
  }
  csChars.sort((a,b)=>(a.order??999)-(b.order??999));
  renderCsList();
  document.getElementById('csOverlay').classList.add('active');document.body.style.overflow='hidden';
}

function renderCsList(){
  const body=document.getElementById('csBody');
  const canEdit=isLoggedIn();
  let h=canEdit?'<button class="cs-add-btn" onclick="openCsEditModal()">✦ 添加角色卡</button>':'<button class="cs-add-btn" disabled>✦ 登录后可添加角色卡</button>';
  if(csChars.length===0)h+='<div class="cs-empty">尚未创建角色卡，点击上方按钮创建。</div>';
  else{
    h+='<div class="cs-list" id="csList">';
    csChars.forEach((c,i)=>{
      const del=canEdit?`<button class="cs-mini-del" onclick="event.stopPropagation();deleteCharSheet('${c.id}','${c.avatarPath||''}')">删除</button>`:'';
      const edit=canEdit?`<button class="cs-mini-edit" onclick="event.stopPropagation();openCsEditModal('${c.id}')">编辑</button>`:'';
      h+=`<div class="cs-mini" data-id="${c.id}" data-idx="${i}" onclick="openCsDetail('${c.id}')" ${canEdit?'draggable="true"':''}>
        <div class="cs-mini-grip">${canEdit?'⠿':''}</div>
        <div class="cs-mini-avatar">${c.avatarUrl?`<img src="${c.avatarUrl}">`:'<span class="cs-mini-ph">⍟</span>'}</div>
        <div class="cs-mini-info">
          <div class="cs-mini-name">${esc(c.charName||'未命名')}</div>
          <div class="cs-mini-meta">${c.moduleName?esc(c.moduleName):'—'}${c.job?' · '+esc(c.job):''}</div>
        </div>
        <div class="cs-mini-actions">${edit}${del}</div>
      </div>`;
    });
    h+='</div>';
  }
  body.innerHTML=h;
  if(canEdit&&csChars.length>1)initCsDrag();
}

let csDragEl=null;
function initCsDrag(){
  const list=document.getElementById('csList');if(!list)return;
  list.addEventListener('dragstart',e=>{
    const item=e.target.closest('.cs-mini');if(!item)return;
    csDragEl=item;item.classList.add('cs-dragging');
    e.dataTransfer.effectAllowed='move';
  });
  list.addEventListener('dragend',e=>{
    if(csDragEl)csDragEl.classList.remove('cs-dragging');csDragEl=null;
    document.querySelectorAll('.cs-mini').forEach(el=>el.classList.remove('cs-drag-over'));
    saveCsOrder();
  });
  list.addEventListener('dragover',e=>{
    e.preventDefault();e.dataTransfer.dropEffect='move';
    const target=e.target.closest('.cs-mini');
    if(!target||target===csDragEl)return;
    const rect=target.getBoundingClientRect();
    const mid=rect.top+rect.height/2;
    document.querySelectorAll('.cs-mini').forEach(el=>el.classList.remove('cs-drag-over'));
    if(e.clientY<mid)target.parentNode.insertBefore(csDragEl,target);
    else target.parentNode.insertBefore(csDragEl,target.nextSibling);
  });
}
async function saveCsOrder(){
  const items=document.querySelectorAll('#csList .cs-mini');
  const batch=db.batch();
  items.forEach((el,i)=>{
    const id=el.dataset.id;
    batch.update(db.collection(csCollection).doc(csOwnerId).collection('characters').doc(id),{order:i});
    const ch=csChars.find(c=>c.id===id);if(ch)ch.order=i;
  });
  csChars.sort((a,b)=>(a.order||0)-(b.order||0));
  try{await batch.commit()}catch(e){console.warn('order save:',e)}
}

function openCsDetail(cid){
  const c=csChars.find(x=>x.id===cid);if(!c)return;
  const body=document.getElementById('csBody');
  const canEdit=isLoggedIn();
  body.innerHTML='<button class="cs-detail-back" onclick="renderCsList()">← 返回列表</button>'+renderOneCard(c,canEdit);
}

function renderOneCard(c,canEdit){
  const stats=[{k:'STR',v:c.str},{k:'DEX',v:c.dex},{k:'POW',v:c.pow},{k:'CON',v:c.con},{k:'APP',v:c.app},{k:'EDU',v:c.edu},{k:'SIZ',v:c.siz},{k:'INT',v:c.int}];
  const actions=canEdit?`<div class="cs-card-actions"><button class="cs-card-edit" onclick="event.stopPropagation();openCsEditModal('${c.id}')">编辑</button><button class="cs-card-del" onclick="event.stopPropagation();deleteCharSheet('${c.id}','${c.avatarPath||''}')">删除</button></div>`:'';
  return `<div class="cs-card-wrapper">${actions}
    <div class="cs-card">
      <div class="cs-top"><div class="cs-portrait">${c.avatarUrl?`<img src="${c.avatarUrl}">`:'<span class="cs-portrait-ph">⍟</span>'}</div>
        <div class="cs-info"><div class="cs-char-name">${esc(c.charName||'未命名')}</div><div class="cs-char-title">${c.moduleName?esc(c.moduleName):'Investigator'}</div>
          <div class="cs-info-grid">
            <div class="cs-info-item"><span class="cs-info-label">职业</span><span class="cs-info-val">${esc(c.job||'—')}</span></div>
            <div class="cs-info-item"><span class="cs-info-label">年龄</span><span class="cs-info-val">${esc(c.age||'—')}</span></div>
            <div class="cs-info-item"><span class="cs-info-label">时代</span><span class="cs-info-val">${esc(c.era||'—')}</span></div>
            <div class="cs-info-item"><span class="cs-info-label">住地</span><span class="cs-info-val">${esc(c.home||'—')}</span></div>
          </div></div></div>
      <div class="cs-divider"></div>
      <div class="cs-stats-grid">${stats.map(s=>`<div class="cs-stat"><div class="cs-stat-label">${s.k}</div><div class="cs-stat-val">${s.v||'—'}</div><div class="cs-stat-bar" style="width:${Math.min(100,(s.v||0))}%"></div></div>`).join('')}</div>
      ${c.backstory?`<div class="cs-divider"></div><div class="cs-backstory"><div class="cs-backstory-title">BACKSTORY</div><div class="cs-backstory-text">${esc(c.backstory)}</div></div>`:''}
    </div></div>`;
}

function closeCharSheet(){document.getElementById('csOverlay').classList.remove('active');document.body.style.overflow='';csCollection=null;csOwnerId=null;csChars=[]}

let csEditId=null,csPendingAvatar=null;
function openCsEditModal(editId){
  if(!requireLogin())return;csEditId=editId||null;csPendingAvatar=null;
  document.getElementById('csEditTitle').textContent=editId?'编辑角色卡':'添加角色卡';
  document.getElementById('csAvatarInfo').textContent='';document.getElementById('csAvatarInput').value='';
  if(editId){
    db.collection(csCollection).doc(csOwnerId).collection('characters').doc(editId).get().then(d=>{
      if(!d.exists)return;const c=d.data();
      document.getElementById('csName').value=c.charName||'';document.getElementById('csModule').value=c.moduleName||'';document.getElementById('csJob').value=c.job||'';
      document.getElementById('csAge').value=c.age||'';document.getElementById('csEra').value=c.era||'';document.getElementById('csHome').value=c.home||'';
      document.getElementById('csST').value=c.str||'';document.getElementById('csDX').value=c.dex||'';
      document.getElementById('csPW').value=c.pow||'';document.getElementById('csCN').value=c.con||'';
      document.getElementById('csAP').value=c.app||'';document.getElementById('csED').value=c.edu||'';
      document.getElementById('csSZ').value=c.siz||'';document.getElementById('csIN').value=c.int||'';
      document.getElementById('csBio').value=c.backstory||'';
    });
  } else {
    ['csName','csModule','csJob','csAge','csHome','csST','csDX','csPW','csCN','csAP','csED','csSZ','csIN','csBio'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('csEra').value='';
  }
  document.getElementById('csEditModal').classList.add('active');
}
function closeCsEditModal(){document.getElementById('csEditModal').classList.remove('active');csEditId=null;csPendingAvatar=null}

document.getElementById('csAvatarInput').addEventListener('change',async function(){
  if(this.files[0]){document.getElementById('csAvatarInfo').textContent='压缩中...';
    try{csPendingAvatar=await compressImage(this.files[0],400,0.8);document.getElementById('csAvatarInfo').textContent='已选择'}catch{document.getElementById('csAvatarInfo').textContent='失败'}}
});

async function saveCharSheet(){
  if(!requireLogin())return;
  const data={charName:document.getElementById('csName').value.trim(),moduleName:document.getElementById('csModule').value.trim(),job:document.getElementById('csJob').value.trim(),
    age:document.getElementById('csAge').value.trim(),era:document.getElementById('csEra').value,home:document.getElementById('csHome').value.trim(),
    str:parseInt(document.getElementById('csST').value)||0,dex:parseInt(document.getElementById('csDX').value)||0,
    pow:parseInt(document.getElementById('csPW').value)||0,con:parseInt(document.getElementById('csCN').value)||0,
    app:parseInt(document.getElementById('csAP').value)||0,edu:parseInt(document.getElementById('csED').value)||0,
    siz:parseInt(document.getElementById('csSZ').value)||0,int:parseInt(document.getElementById('csIN').value)||0,
    backstory:document.getElementById('csBio').value.trim()};
  if(!data.charName){showToast('请输入角色姓名');return}
  const btn=document.getElementById('csSaveBtn');btn.disabled=true;btn.textContent='保存中...';
  try{
    if(csPendingAvatar){const p=`charsheets/${csOwnerId}/${Date.now()}.jpg`;data.avatarUrl=await uploadImg(p,csPendingAvatar);data.avatarPath=p}
    if(csEditId){await db.collection(csCollection).doc(csOwnerId).collection('characters').doc(csEditId).update(data)}
    else{data.order=csChars.length;data.timestamp=firebase.firestore.FieldValue.serverTimestamp();await db.collection(csCollection).doc(csOwnerId).collection('characters').add(data)}
    closeCsEditModal();showToast('已保存');openCharSheet(csCollection,csOwnerId);
  }catch(e){showToast('失败: '+e.message)}finally{btn.disabled=false;btn.textContent='保存'}
}

async function deleteCharSheet(cid,imgPath){
  if(!requireLogin()||!confirm('删除此角色卡？'))return;
  try{await db.collection(csCollection).doc(csOwnerId).collection('characters').doc(cid).delete();if(imgPath)await deleteImg(imgPath);showToast('已删除');openCharSheet(csCollection,csOwnerId)}catch(e){showToast('失败: '+e.message)}
}

// ===== MODULE DETAIL =====
async function openModule(mid){
  currentModuleId=mid;const mod=modules.find(m=>m.id===mid);if(!mod)return;
  document.getElementById('detailTitle').textContent=mod.name;
  showToast('加载中...');currentArticles=await loadArticles(mid);
  // Pre-fetch comment counts
  const commentCounts={};
  for(const a of currentArticles){try{const s=await db.collection('modules').doc(mid).collection('articles').doc(a.id).collection('comments').get();commentCounts[a.id]=s.size}catch{commentCounts[a.id]=0}}
  const cp=isLoggedIn();
  document.getElementById('detailContent').innerHTML=`
    <div class="detail-hero-title">${esc(mod.name)}</div><div class="detail-hero-en">${esc(mod.nameEn)}</div>${mod.kp?`<div class="detail-hero-kp">守秘人 · ${esc(mod.kp)}</div>`:''}
    <button class="new-article-btn" ${cp?'onclick="toggleEditor()"':'disabled'}>${cp?'✦ 创建新条目':'✦ 登录后可创建条目'}</button>
    <div class="article-editor" id="articleEditor">
      <div class="editor-field"><label class="editor-label">标题</label><input type="text" class="editor-input" id="articleTitle" placeholder="输入文章标题..."></div>
      <div class="editor-field"><label class="editor-label">封面图片（自动压缩）</label><div class="editor-image-upload"><button class="upload-btn" onclick="document.getElementById('articleImageInput').click()">选择图片</button><input type="file" id="articleImageInput" accept="image/*" style="display:none" onchange="previewArticleImage(this)"><img class="upload-preview" id="articleImagePreview"><span class="upload-info" id="articleImageInfo"></span></div></div>
      <div class="editor-field"><label class="editor-label">正文</label><textarea class="editor-textarea" id="articleBody" placeholder="在此撰写内容..."></textarea></div>
      <div class="editor-actions"><button class="btn-cancel" onclick="toggleEditor()">取消</button><button class="btn-publish" id="publishBtn" onclick="publishArticle()">发布</button></div>
    </div>
    <div class="articles-list">${currentArticles.length===0?'<div class="empty-state">尚无记录，点击上方按钮创建第一篇条目</div>':currentArticles.map(a=>{
      const del=isLoggedIn()?`<button class="article-delete" onclick="event.stopPropagation();deleteArticle('${a.id}','${a.imagePath||''}')">删除</button>`:'';
      const cc=commentCounts[a.id]||0;
      const ccHtml=cc>0?`<span class="article-comment-count">💬 ${cc}</span>`:'';
      return `<div class="article-item" onclick="openArticleFull('${a.id}')">
        <div class="article-thumb">${a.imageUrl?`<img src="${a.imageUrl}">`:'<span class="article-thumb-ph">✦</span>'}</div>
        <div class="article-item-content">
          <div class="article-item-header"><span class="article-item-date">${esc(a.date)}</span>${a.author?`<span class="article-item-author">by ${esc(a.author)}</span>`:''}</div>
          <div class="article-item-title">${esc(a.title)}</div>
          <div class="article-item-excerpt">${esc(a.body)}</div>
          <div class="article-item-meta">${ccHtml}${del}</div>
        </div></div>`
    }).join('')}</div>`;
  document.getElementById('moduleDetail').classList.add('active');
  document.getElementById('moduleDetail').scrollTop=0;
  document.body.style.overflow='hidden'
}
function closeModuleDetail(){document.getElementById('moduleDetail').classList.remove('active');document.body.style.overflow='';currentModuleId=null;renderModules()}
function toggleEditor(){if(!requireLogin())return;document.getElementById('articleEditor').classList.toggle('active')}

// ===== ARTICLE FULL VIEW =====
let currentArticleId=null;
async function openArticleFull(aid){
  currentArticleId=aid;
  const a=currentArticles.find(x=>x.id===aid);if(!a)return;
  document.getElementById('afHeaderTitle').textContent=a.title;
  // Load comments
  let comments=[];
  try{const s=await db.collection('modules').doc(currentModuleId).collection('articles').doc(aid).collection('comments').orderBy('timestamp','asc').get();comments=s.docs.map(d=>({id:d.id,...d.data()}))}catch{}
  const cp=isLoggedIn();
  document.getElementById('afBody').innerHTML=`
    ${a.imageUrl?`<img class="af-image" src="${a.imageUrl}" onclick="openLightboxUrl('${a.imageUrl}')">`:''}
    <div class="af-meta"><span class="af-date">${esc(a.date)}</span>${a.author?`<span class="af-author">by ${esc(a.author)}</span>`:''}</div>
    <div class="af-title">${esc(a.title)}</div>
    <div class="af-text">${esc(a.body)}</div>
    <div class="af-comments">
      <div class="af-comments-title">COMMENTS · ${comments.length}</div>
      ${cp?`<div class="af-comment-form"><textarea class="af-comment-input" id="afCommentInput" placeholder="写下你的评论..."></textarea><button class="af-comment-send" onclick="postArticleComment()">发送</button></div>`
        :`<div class="af-comment-login">登录后可发表评论</div>`}
      <div class="af-comment-list">${comments.length===0?'<div class="af-comment-empty">暂无评论</div>':comments.map(c=>{
        const del=isLoggedIn()?`<button class="af-comment-del" onclick="deleteArticleComment('${c.id}')">删除</button>`:'';
        return `<div class="af-comment">${del}<div class="af-comment-head"><span class="af-comment-nick">${esc(c.author)}</span><span class="af-comment-time">${esc(c.date||'')} ${esc(c.time||'')}</span></div><div class="af-comment-text">${esc(c.text)}</div></div>`
      }).join('')}</div>
    </div>`;
  document.getElementById('articleFullOverlay').classList.add('active');
  document.getElementById('articleFullOverlay').scrollTop=0;
}
function closeArticleFull(){document.getElementById('articleFullOverlay').classList.remove('active');currentArticleId=null}

async function postArticleComment(){
  if(!requireLogin())return;
  const inp=document.getElementById('afCommentInput');
  const text=inp.value.trim();if(!text){showToast('请输入评论');return}
  try{
    const now=new Date;
    await db.collection('modules').doc(currentModuleId).collection('articles').doc(currentArticleId).collection('comments').add({
      text,author:getCurrentUser(),
      date:`${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`,
      time:`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
      timestamp:firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast('评论成功');openArticleFull(currentArticleId);
  }catch(e){showToast('失败: '+e.message)}
}

async function deleteArticleComment(cid){
  if(!requireLogin()||!confirm('删除此评论？'))return;
  try{await db.collection('modules').doc(currentModuleId).collection('articles').doc(currentArticleId).collection('comments').doc(cid).delete();showToast('已删除');openArticleFull(currentArticleId)}catch(e){showToast('失败: '+e.message)}
}

let pendingImg=null;
async function previewArticleImage(inp){
  if(inp.files&&inp.files[0]){document.getElementById('articleImageInfo').textContent='压缩中...';
    try{const c=await compressImage(inp.files[0]);document.getElementById('articleImagePreview').src=c;document.getElementById('articleImagePreview').style.display='block';document.getElementById('articleImageInfo').textContent=`≈${Math.round(c.length*3/4/1024)}KB`;pendingImg=c}
    catch{document.getElementById('articleImageInfo').textContent='压缩失败'}}
}

async function publishArticle(){
  if(!requireLogin())return;
  const t=document.getElementById('articleTitle').value.trim(),b=document.getElementById('articleBody').value.trim();
  if(!t){showToast('请输入标题');return}
  const btn=document.getElementById('publishBtn');btn.disabled=true;btn.textContent='上传中...';
  try{
    const now=new Date,ds=`${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
    const ad={title:t,body:b,date:ds,author:getCurrentUser(),timestamp:firebase.firestore.FieldValue.serverTimestamp()};
    if(pendingImg){const p=`articles/${currentModuleId}/${Date.now()}.jpg`;ad.imageUrl=await uploadImg(p,pendingImg);ad.imagePath=p}
    await db.collection('modules').doc(currentModuleId).collection('articles').add(ad);
    pendingImg=null;showToast('发布成功');openModule(currentModuleId)
  }catch(e){showToast('失败: '+e.message)}finally{btn.disabled=false;btn.textContent='发布'}
}

async function deleteArticle(aid,imgPath){
  if(!requireLogin()||!confirm('确定删除？'))return;
  try{await db.collection('modules').doc(currentModuleId).collection('articles').doc(aid).delete();if(imgPath)await deleteImg(imgPath);showToast('已删除');openModule(currentModuleId)}catch(e){showToast('失败: '+e.message)}
}

// ===== ADD MODULE =====
function openAddModuleModal(){if(!requireLogin())return;document.getElementById('newModuleName').value='';document.getElementById('newModuleNameEn').value='';document.getElementById('newModuleDesc').value='';document.getElementById('newModuleKp').value='';document.getElementById('addModuleModal').classList.add('active')}
function closeAddModuleModal(){document.getElementById('addModuleModal').classList.remove('active')}
async function saveNewModule(){
  if(!requireLogin())return;const n=document.getElementById('newModuleName').value.trim();if(!n){showToast('请输入名称');return}
  try{await db.collection('modules').doc('mod-'+Date.now()).set({name:n,nameEn:document.getElementById('newModuleNameEn').value.trim(),desc:document.getElementById('newModuleDesc').value.trim(),kp:document.getElementById('newModuleKp').value.trim(),order:modules.length});await loadModules();closeAddModuleModal();renderModules();showToast('已创建')}catch(e){showToast('失败: '+e.message)}
}

// ===== MEMBER EDIT =====
function openEditModal(mid){if(!requireLogin())return;currentEditMemberId=mid;const m=members.find(x=>x.id===mid);document.getElementById('editName').value=m.name;document.getElementById('editRole').value=m.role;document.getElementById('editBio').value=m.bio;document.getElementById('avatarFileName').textContent='';document.getElementById('avatarUpload').value='';document.getElementById('editMemberModal').classList.add('active')}
function closeEditModal(){document.getElementById('editMemberModal').classList.remove('active');currentEditMemberId=null}
document.getElementById('avatarUpload').addEventListener('change',function(){if(this.files[0])document.getElementById('avatarFileName').textContent=this.files[0].name});
async function saveMember(){
  const m=members.find(x=>x.id===currentEditMemberId);if(!m)return;
  const u={name:document.getElementById('editName').value.trim()||m.name,role:document.getElementById('editRole').value.trim()||m.role,bio:document.getElementById('editBio').value.trim()||m.bio};
  const f=document.getElementById('avatarUpload');
  if(f.files&&f.files[0]){showToast('上传头像...');const c=await compressAvatar(f.files[0]);u.avatarUrl=await uploadImg(`avatars/${currentEditMemberId}.jpg`,c)}
  try{await db.collection('members').doc(currentEditMemberId).update(u);await loadMembers();renderTeam();closeEditModal();showToast('已保存')}catch(e){showToast('失败: '+e.message)}
}

// ===== GUESTS =====
function openGuestModal(){if(!requireLogin())return;document.getElementById('guestNameInput').value='';document.getElementById('guestAvatarFileName').textContent='';document.getElementById('guestAvatarUpload').value='';document.getElementById('addGuestModal').classList.add('active')}
function closeGuestModal(){document.getElementById('addGuestModal').classList.remove('active')}
document.getElementById('guestAvatarUpload').addEventListener('change',function(){if(this.files[0])document.getElementById('guestAvatarFileName').textContent=this.files[0].name});
async function saveGuest(){
  if(!requireLogin())return;const n=document.getElementById('guestNameInput').value.trim();if(!n)return;
  try{const id='g'+Date.now(),d={name:n};const f=document.getElementById('guestAvatarUpload');
    if(f.files&&f.files[0]){const c=await compressAvatar(f.files[0]);d.avatarUrl=await uploadImg(`guests/${id}.jpg`,c)}
    await db.collection('guests').doc(id).set(d);await loadGuests();renderGuests();closeGuestModal();showToast('已添加')}catch(e){showToast('失败: '+e.message)}
}
async function removeGuest(gid){if(!requireLogin()||!confirm('移除？'))return;try{await db.collection('guests').doc(gid).delete();await loadGuests();renderGuests()}catch(e){showToast('失败: '+e.message)}}

function openEditGuestModal(gid){if(!requireLogin())return;currentEditGuestId=gid;const g=guests.find(x=>x.id===gid);document.getElementById('editGuestName').value=g.name;document.getElementById('editGuestAvatarFileName').textContent='';document.getElementById('editGuestAvatarUpload').value='';document.getElementById('editGuestModal').classList.add('active')}
function closeEditGuestModal(){document.getElementById('editGuestModal').classList.remove('active');currentEditGuestId=null}
document.getElementById('editGuestAvatarUpload').addEventListener('change',function(){if(this.files[0])document.getElementById('editGuestAvatarFileName').textContent=this.files[0].name});
async function saveEditGuest(){
  const g=guests.find(x=>x.id===currentEditGuestId);if(!g)return;
  const u={name:document.getElementById('editGuestName').value.trim()||g.name};
  const f=document.getElementById('editGuestAvatarUpload');
  if(f.files&&f.files[0]){const c=await compressAvatar(f.files[0]);u.avatarUrl=await uploadImg(`guests/${currentEditGuestId}.jpg`,c)}
  try{await db.collection('guests').doc(currentEditGuestId).update(u);await loadGuests();renderGuests();closeEditGuestModal();showToast('已保存')}catch(e){showToast('失败: '+e.message)}
}

// ===== EXPORT/IMPORT =====
async function exportData(){
  showToast('导出中...');
  try{const exp={modules:[],members:[],guests:[]};
    for(const doc of(await db.collection('modules').get()).docs){const m={id:doc.id,...doc.data(),articles:[]};const as=await db.collection('modules').doc(doc.id).collection('articles').orderBy('timestamp','desc').get();m.articles=as.docs.map(d=>({id:d.id,...d.data()}));exp.modules.push(m)}
    exp.members=(await db.collection('members').get()).docs.map(d=>({id:d.id,...d.data()}));
    exp.guests=(await db.collection('guests').get()).docs.map(d=>({id:d.id,...d.data()}));
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(exp,null,2)],{type:'application/json'}));a.download=`急切的食欲_backup_${new Date().toISOString().slice(0,10)}.json`;a.click();showToast('导出成功')
  }catch(e){showToast('失败: '+e.message)}
}
async function importData(inp){
  if(!inp.files[0])return;if(!confirm('导入将覆盖云端数据，确定？')){inp.value='';return}
  showToast('导入中...');
  try{const d=JSON.parse(await inp.files[0].text());
    if(d.modules)for(const m of d.modules){const{articles,id,...md}=m;await db.collection('modules').doc(id).set(md);if(articles)for(const a of articles){const{id:aid,...ad}=a;await db.collection('modules').doc(id).collection('articles').doc(aid).set(ad)}}
    if(d.members)for(const m of d.members){const{id,...md}=m;await db.collection('members').doc(id).set(md)}
    if(d.guests)for(const g of d.guests){const{id,...gd}=g;await db.collection('guests').doc(id).set(gd)}
    inp.value='';showToast('导入成功');setTimeout(()=>location.reload(),1000)
  }catch(e){showToast('失败: '+e.message)}
}
async function resetAllData(){
  if(!confirm('⚠️ 永久删除云端所有数据？')||!confirm('再次确认，不可撤销。'))return;
  showToast('重置中...');
  try{for(const col of['modules','members','guests','guestbook','meta']){const s=await db.collection(col).get();const b=db.batch();s.docs.forEach(d=>b.delete(d.ref));await b.commit();
    if(col==='modules')for(const d of s.docs){const as=await db.collection('modules').doc(d.id).collection('articles').get();if(as.size){const ab=db.batch();as.docs.forEach(x=>ab.delete(x.ref));await ab.commit()}}}
    showToast('已重置');setTimeout(()=>location.reload(),1000)
  }catch(e){showToast('失败: '+e.message)}
}

// ===== LIGHTBOX =====
function openLightboxUrl(u){document.getElementById('lightboxImg').src=u;document.getElementById('lightbox').classList.add('active')}
function closeLightbox(){document.getElementById('lightbox').classList.remove('active')}

// ===== NAV =====
function goHome(){closeModuleDetail();window.scrollTo({top:0,behavior:'smooth'})}
function scrollToEl(s){setTimeout(()=>{const e=document.querySelector(s);if(e)e.scrollIntoView({behavior:'smooth'})},100)}
function toggleMobileNav(){document.getElementById('navLinks').classList.toggle('open')}
function closeMobileNav(){document.getElementById('navLinks').classList.remove('open')}
window.addEventListener('scroll',()=>document.getElementById('mainNav').classList.toggle('scrolled',window.scrollY>50));
function observeFadeIn(){const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');o.unobserve(e.target)}}),{threshold:0.15});document.querySelectorAll('.fade-in:not(.visible)').forEach(el=>o.observe(el))}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeLightbox();closeEditModal();closeGuestModal();closeEditGuestModal();closeLoginModal();closeAddModuleModal();closeCsEditModal();if(document.getElementById('articleFullOverlay').classList.contains('active'))closeArticleFull();else if(document.getElementById('csOverlay').classList.contains('active'))closeCharSheet();else if(currentModuleId)closeModuleDetail()}});

// ===== GUESTBOOK =====
const DAILY_LIMIT = 10;
let guestbookMessages = [];

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getMyPostCountToday() {
  let key = 'gb-fp';
  let fp;
  try { fp = localStorage.getItem(key); if (!fp) { fp = Math.random().toString(36).slice(2, 12); localStorage.setItem(key, fp); } } catch { fp = 'anon'; }
  const today = getTodayStr();
  return guestbookMessages.filter(m => m.fp === fp && m.dateStr === today).length;
}

function getFingerprint() {
  try { let fp = localStorage.getItem('gb-fp'); if (!fp) { fp = Math.random().toString(36).slice(2, 12); localStorage.setItem('gb-fp', fp); } return fp; } catch { return 'anon'; }
}

async function loadGuestbook() {
  const s = await db.collection('guestbook').orderBy('timestamp', 'desc').limit(100).get();
  guestbookMessages = s.docs.map(d => ({ id: d.id, ...d.data() }));
}

function renderGuestbook() {
  const list = document.getElementById('gbList');
  const remaining = DAILY_LIMIT - getMyPostCountToday();
  document.getElementById('gbLimit').textContent = `今日剩余 ${Math.max(0, remaining)}/${DAILY_LIMIT} 条`;
  document.getElementById('gbSubmit').disabled = remaining <= 0;

  if (guestbookMessages.length === 0) {
    list.innerHTML = '<div class="guestbook-empty">还没有留言，成为第一个留下低语的人吧。</div>';
    return;
  }
  list.innerHTML = guestbookMessages.map(m => {
    const del = isLoggedIn() ? `<button class="guestbook-item-del" onclick="deleteGbMsg('${m.id}')">删除</button>` : '';
    return `<div class="guestbook-item">${del}<div class="guestbook-item-header"><span class="guestbook-item-nick">${esc(m.nick)}</span><span class="guestbook-item-date">${esc(m.dateStr || '')}</span></div><div class="guestbook-item-msg">${esc(m.msg)}</div></div>`;
  }).join('');
}

async function postGuestbook() {
  const nick = document.getElementById('gbNick').value.trim() || '匿名旅人';
  const msg = document.getElementById('gbMsg').value.trim();
  if (!msg) { showToast('请输入留言内容'); return; }
  if (msg.length > 200) { showToast('留言不能超过200字'); return; }

  const remaining = DAILY_LIMIT - getMyPostCountToday();
  if (remaining <= 0) { showToast('今日留言次数已用完'); return; }

  const btn = document.getElementById('gbSubmit');
  btn.disabled = true;
  try {
    const now = new Date();
    const dateStr = getTodayStr();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    await db.collection('guestbook').add({
      nick, msg, dateStr, timeStr,
      fp: getFingerprint(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('gbMsg').value = '';
    await loadGuestbook();
    renderGuestbook();
    showToast('留言成功');
  } catch (e) { showToast('留言失败: ' + e.message); }
  finally { btn.disabled = false; }
}

async function deleteGbMsg(id) {
  if (!requireLogin() || !confirm('删除此留言？')) return;
  try { await db.collection('guestbook').doc(id).delete(); await loadGuestbook(); renderGuestbook(); showToast('已删除'); }
  catch (e) { showToast('失败: ' + e.message); }
}

// ===== THEME =====
const THEMES={
  lantern:{name:'灯',en:'Lantern',color:'#c9a84c'},
  grail:{name:'杯',en:'Grail',color:'#8c2018'},
  knock:{name:'启',en:'Knock',color:'#8338d0'},
  winter:{name:'冬',en:'Winter',color:'#2888d0'}
};
function setTheme(t){
  if(!THEMES[t])t='lantern';
  document.body.className=document.body.className.replace(/theme-\w+/g,'');
  document.body.classList.add('theme-'+t);
  try{localStorage.setItem('ua-theme',t)}catch{}
  const dot=document.querySelector('.theme-toggle .dot');
  if(dot)dot.style.background=THEMES[t].color;
  document.querySelectorAll('.theme-opt').forEach(o=>{
    o.classList.toggle('active',o.dataset.theme===t);
  });
}
function initTheme(){
  let t='lantern';
  try{t=localStorage.getItem('ua-theme')||'lantern'}catch{}
  setTheme(t);
}
function toggleThemePanel(){
  document.querySelector('.theme-panel').classList.toggle('open');
}
document.addEventListener('click',e=>{
  const panel=document.querySelector('.theme-panel');
  const switcher=document.querySelector('.theme-switcher');
  if(panel&&switcher&&!switcher.contains(e.target))panel.classList.remove('open');
});
initTheme();

// ===== INIT =====
(async function(){
  restoreSession();
  try{await initData();await Promise.all([loadModules(),loadMembers(),loadGuests(),loadGuestbook()]);renderAll();renderGuestbook();observeFadeIn();updateAuthUI()}
  catch(e){console.error('Init:',e);showToast('加载失败，请刷新')}
  setTimeout(()=>{document.getElementById('loadingScreen').classList.add('hidden');setTimeout(()=>document.getElementById('loadingScreen').remove(),600)},800)
})();
