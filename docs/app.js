const CREDS = {username:'admin',password:'fleet123'};

// ── STATE ──────────────────────────────────────────────────────────
let tgGroups = [
  {id:1, name:'D-Twin Grp 1 (Customer One)', botToken:'', chatId:'-5119382124', isDefault:true},
  {id:2, name:'D-Twin Group 2 (Customer Two)', botToken:'', chatId:'-5274392721', isDefault:false},
];
let nextGroupId = 3;
let members = [
  {id:1, name:'Alex Johnson', handle:'@alexj'},
  {id:2, name:'Priya Mehta',  handle:'@priyam'},
];
let nextMemberId = 3;

const CATEGORIES = [
  {key:'all',       label:'All'},
  {key:'software',  label:'Fleet Software'},
  {key:'gps',       label:'GPS & Tracking'},
  {key:'safety',    label:'Driver Safety'},
  {key:'maintenance',label:'Maintenance'},
  {key:'fuel',      label:'Fuel Management'},
  {key:'compliance',label:'Compliance'},
  {key:'critical',  label:'Critical'},
];
const GRADIENTS = {
  software:   ['#1565c0','#42a5f5'],
  gps:        ['#1b5e20','#66bb6a'],
  safety:     ['#e65100','#ffa726'],
  maintenance:['#880e4f','#f06292'],
  fuel:       ['#4a148c','#ab47bc'],
  compliance: ['#004d40','#4db6ac'],
  critical:   ['#b71c1c','#ef5350'],
};
const ICONS = {software:'🖥️',gps:'📡',safety:'🛡️',maintenance:'🔧',fuel:'⛽',compliance:'📋',critical:'🚨'};
const GITHUB_SOURCE_LINK = 'https://github.com/intel-iot-devkit/sample-videos';
const LOCAL_VIDEO_FILES = [
  'bolt-detection.mp4',
  'bolt-multi-size-detection.mp4',
  'bottle-detection.mp4',
  'car-detection.mp4',
  'classroom.mp4',
  'driver-action-recognition.mp4',
  'face-demographics-walking-and-pause.mp4',
  'face-demographics-walking.mp4',
  'fruit-and-vegetable-detection.mp4',
  'head-pose-face-detection-female-and-male.mp4',
  'head-pose-face-detection-female.mp4',
  'head-pose-face-detection-male.mp4',
  'one-by-one-person-detection.mp4',
  'people-detection.mp4',
  'person-bicycle-car-detection.mp4',
  'store-aisle-detection.mp4',
  'worker-zone-detection.mp4'
];
function titleFromFileName(fileName){
  return fileName
    .replace('.mp4','')
    .split('-')
    .map(part=>part.charAt(0).toUpperCase()+part.slice(1))
    .join(' ');
}
function categoryForIndex(index){
  const cycle = ['software','gps','safety','maintenance','fuel','compliance','critical'];
  return cycle[index % cycle.length];
}

let videos = [
  ...LOCAL_VIDEO_FILES.map((fileName, index)=>({
    id:index+1,
    ytId:null,
    title:titleFromFileName(fileName),
    channel:'Intel IoT DevKit',
    cat:categoryForIndex(index),
    duration:'Local MP4',
    views:'Ready for /sendVideo',
    desc:'Local video from docs/videos; cards preview using thumbnail playback and source link is restricted to github.com.',
    mp4Url:'videos/' + fileName,
    telegramVideoUrl:null,
    githubUrl:'https://github.com/intel-iot-devkit/sample-videos/blob/master/' + fileName,
    userAdded:false
  }))
];
let nextId = videos.length + 1;
let currentView = 'card';
let activeTag   = 'all';
let selected    = new Set();
let postedIds   = new Set();
let postTarget  = [];

// ── AUTH ──────────────────────────────────────────────────────────
function doLogin(){
  const u=document.getElementById('usr').value.trim();
  const p=document.getElementById('pwd').value;
  if(u===CREDS.username&&p===CREDS.password){
    document.getElementById('login-screen').style.display='none';
    document.getElementById('app').style.display='block';
    buildTags(); renderVideos(); renderMemberList();
  } else {
    document.getElementById('login-err').style.display='block';
  }
}
function fillDemoCreds(){
  document.getElementById('usr').value = CREDS.username;
  document.getElementById('pwd').value = CREDS.password;
  document.getElementById('login-err').style.display='none';
}
function doLogout(){
  document.getElementById('app').style.display='none';
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('usr').value='';
  document.getElementById('pwd').value='';
  document.getElementById('login-err').style.display='none';
  selected.clear(); updateSelBar();
}

// ── SETTINGS ──────────────────────────────────────────────────────
function saveSettings(){
  // Save edits to each group's fields
  tgGroups.forEach(g=>{
    const t = document.getElementById('g-token-'+g.id);
    const c = document.getElementById('g-chatid-'+g.id);
    if(t) g.botToken = t.value.trim();
    if(c) g.chatId   = c.value.trim();
  });
  renderTgGroupList();
  closeModal('settings-modal');
}
function renderTgGroupList(){
  const wrap = document.getElementById('tg-group-list');
  if(!wrap) return;
  if(!tgGroups.length){
    wrap.innerHTML='<div style="font-size:12px;color:#bbb;padding:6px 0">No groups yet. Add one below.</div>';
    return;
  }
  wrap.innerHTML = tgGroups.map(g=>{
    const configured = g.botToken && g.chatId;
    return `<div class="tg-group-item">
      <div class="tg-group-item-head">
        <div class="tg-group-name">
          📡 ${g.name}
          ${g.isDefault?'<span class="tg-group-badge default">✓ Default</span>':'<span class="tg-group-badge">Group</span>'}
        </div>
        <div class="tg-group-actions">
          ${!g.isDefault?`<button class="tg-group-btn set-default" onclick="setDefaultGroup(${g.id})">Set Default</button>`:''}
          ${tgGroups.length>1?`<button class="tg-group-btn remove" onclick="removeTgGroup(${g.id})">✕ Remove</button>`:''}
        </div>
      </div>
      <div class="tg-group-fields">
        <div class="f-group">
          <label class="f-label">Bot Token</label>
          <input type="text" id="g-token-${g.id}" value="${g.botToken}" placeholder="Bot Token"/>
        </div>
        <div class="f-group">
          <label class="f-label">Chat ID</label>
          <input type="text" id="g-chatid-${g.id}" value="${g.chatId}" placeholder="-1001234567890"/>
        </div>
      </div>
      <div class="tg-group-status ${configured?'ok':'warn'}">
        ${configured?'✅ Configured':'⚠️ Token & Chat ID required'}
      </div>
    </div>`;
  }).join('');
}
function addTgGroup(){
  const name  = document.getElementById('ng-name').value.trim();
  const token = document.getElementById('ng-token').value.trim();
  const chat  = document.getElementById('ng-chatid').value.trim();
  if(!name){alert('Group name is required.');return;}
  tgGroups.push({id:nextGroupId++, name, botToken:token, chatId:chat, isDefault:false});
  document.getElementById('ng-name').value='';
  document.getElementById('ng-token').value='';
  document.getElementById('ng-chatid').value='';
  renderTgGroupList();
}
function removeTgGroup(id){
  const wasDefault = tgGroups.find(g=>g.id===id)?.isDefault;
  tgGroups = tgGroups.filter(g=>g.id!==id);
  if(wasDefault && tgGroups.length) tgGroups[0].isDefault = true;
  renderTgGroupList();
}
function setDefaultGroup(id){
  tgGroups.forEach(g=>g.isDefault = g.id===id);
  renderTgGroupList();
}

// ── MEMBERS ────────────────────────────────────────────────────────
function renderMemberList(){
  const wrap = document.getElementById('member-list');
  if(members.length===0){
    wrap.innerHTML='<div style="font-size:12px;color:#bbb;padding:8px 0;">No members added yet.</div>';
    return;
  }
  wrap.innerHTML = members.map(m=>`
    <div class="member-item">
      <div class="member-item-left">
        <div class="member-avatar">${m.name.charAt(0).toUpperCase()}</div>
        <div>
          <div class="member-name">${m.name}</div>
          <div class="member-handle">${m.handle}</div>
        </div>
      </div>
      <button class="member-remove" onclick="removeMember(${m.id})" title="Remove">✕</button>
    </div>`).join('');
}
function addMember(){
  const name   = document.getElementById('new-member-name').value.trim();
  const handle = document.getElementById('new-member-handle').value.trim();
  if(!name) return;
  const h = handle.startsWith('@')?handle:'@'+handle;
  members.push({id:nextMemberId++, name, handle:h});
  document.getElementById('new-member-name').value='';
  document.getElementById('new-member-handle').value='';
  renderMemberList();
}
function removeMember(id){
  members = members.filter(m=>m.id!==id);
  renderMemberList();
}

// ── TAGS ──────────────────────────────────────────────────────────
function buildTags(){
  document.getElementById('tag-list').innerHTML = CATEGORIES.map(c=>`
    <button class="tag ${c.key==='all'?'active':''}" data-cat="${c.key}" onclick="setTag('${c.key}')">${c.label}</button>`).join('');
}
function setTag(key){
  activeTag=key;
  document.querySelectorAll('.tag').forEach(t=>t.classList.toggle('active',t.dataset.cat===key));
  renderVideos();
}

// ── VIEW ──────────────────────────────────────────────────────────
function setView(v){
  currentView=v;
  document.getElementById('btn-card').classList.toggle('active',v==='card');
  document.getElementById('btn-list').classList.toggle('active',v==='list');
  renderVideos();
}

// ── SELECTION ─────────────────────────────────────────────────────
function toggleSel(id,e){
  e&&e.stopPropagation();
  selected.has(id)?selected.delete(id):selected.add(id);
  const el=document.querySelector(`[data-id="${id}"]`);
  if(el) el.classList.toggle('selected',selected.has(id));
  updateSelBar();
}
function clearAll(){
  selected.clear();
  document.querySelectorAll('.selected').forEach(el=>el.classList.remove('selected'));
  document.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.checked=false);
  updateSelBar();
}
function updateSelBar(){
  document.getElementById('sel-bar').classList.toggle('hidden',selected.size===0);
  document.getElementById('sel-count').textContent=selected.size;
}

// ── FILTER ────────────────────────────────────────────────────────
function getFiltered(){
  const q=(document.getElementById('search-input')?.value||'').toLowerCase();
  return videos.filter(v=>{
    const catOk=activeTag==='all'||v.cat===activeTag;
    const qOk=!q||v.title.toLowerCase().includes(q)||v.channel.toLowerCase().includes(q)||v.desc.toLowerCase().includes(q);
    return catOk&&qOk;
  });
}

// ── THUMBNAIL ─────────────────────────────────────────────────────
function thumbHtml(v){
  return `<video class="thumb-video" data-video-id="${v.id}" src="${v.mp4Url}" preload="metadata" muted playsinline onended="handleVideoEnded(${v.id})"></video>`;
}
function ytLink(v){
  return v.githubUrl || GITHUB_SOURCE_LINK;
}
function telegramVideoLink(v){
  if(v.telegramVideoUrl) return v.telegramVideoUrl;
  if(v.mp4Url && /^https:\/\//i.test(v.mp4Url)) return v.mp4Url;
  if(v.mp4Url){
    // Resolve local docs/videos paths to a fully-qualified public URL (e.g. GitHub Pages).
    return new URL(v.mp4Url, window.location.href).toString();
  }
  return ytLink(v);
}
function catBadge(cat){
  const c=CATEGORIES.find(x=>x.key===cat)||{label:cat};
  return `<span class="cat-badge cat-${cat}">${c.label}</span>`;
}

// ── RENDER ────────────────────────────────────────────────────────
function renderVideos(){
  const filtered=getFiltered();
  const c=document.getElementById('video-container');
  const label=activeTag==='all'?'All Videos':(CATEGORIES.find(x=>x.key===activeTag)?.label||activeTag);
  document.getElementById('section-title').textContent=label;
  document.getElementById('result-count').textContent=`${filtered.length} video${filtered.length!==1?'s':''}`;

  if(!filtered.length){
    c.className='';
    c.innerHTML=`<div class="empty-state"><div class="e-icon">🔍</div><p>No videos match your search.<br>Try a different keyword or category.</p></div>`;
    return;
  }

  if(currentView==='card'){
    c.className='grid';
    c.innerHTML=filtered.map(v=>`
      <div class="card ${selected.has(v.id)?'selected':''}" data-id="${v.id}">
        ${v.userAdded?'<span class="user-badge">MY VIDEO</span>':''}
        ${v.mp4Url?'<span class="mp4-badge" style="background:rgba(36,106,56,.9)" title="Local MP4 preview + GitHub source">🐙 GitHub MP4</span>':''}
        <div class="thumb-wrap">
          ${thumbHtml(v)}
          <div class="play-overlay"><div class="play-icon" id="play-icon-${v.id}">▶</div></div>
          <button class="play-toggle" onclick="toggleThumbVideo(${v.id},event)" aria-label="Play preview"></button>
          <span class="thumb-duration">${v.duration}</span>
        </div>
        <div class="card-body">
          ${catBadge(v.cat)}
          <div class="card-title">${v.title}</div>
          <div class="card-channel">${v.channel}</div>
          <div style="margin-bottom:8px"><a class="modal-video-link" href="${ytLink(v)}" target="_blank" rel="noopener">github.com source</a></div>
          <div class="card-footer">
            <span class="card-views">${v.views}</span>
            <div class="card-actions">
              <input type="checkbox" class="card-cb" ${selected.has(v.id)?'checked':''} onchange="toggleSel(${v.id},event)" title="Select"/>
              <button class="post-btn ${postedIds.has(v.id)?'sent':''}" onclick="openPostModal([${v.id}])">
                ${postedIds.has(v.id)?'✓ Sent':'✈ Post'}
              </button>
            </div>
          </div>
        </div>
      </div>`).join('');
  } else {
    c.className='list';
    c.innerHTML=filtered.map(v=>`
      <div class="list-item ${selected.has(v.id)?'selected':''}" data-id="${v.id}">
        <div class="list-thumb">
          <div class="thumb-wrap" style="height:100%">
            ${thumbHtml(v)}
            <div class="play-overlay"><div class="play-icon" id="play-icon-${v.id}">▶</div></div>
            <button class="play-toggle" onclick="toggleThumbVideo(${v.id},event)" aria-label="Play preview"></button>
            <span class="thumb-duration">${v.duration}</span>
          </div>
        </div>
        <div class="list-body">
          ${catBadge(v.cat)}
          <div class="list-title">${v.title}${v.userAdded?' <em style="color:#e94560;font-style:normal;font-size:10px;font-weight:700">MY VIDEO</em>':''}${v.mp4Url?' <em style="color:#246a38;font-style:normal;font-size:10px;font-weight:700">🐙 GitHub MP4</em>':''}</div>
          <div class="list-channel">${v.channel}</div>
          <div><a class="modal-video-link" href="${ytLink(v)}" target="_blank" rel="noopener">github.com source</a></div>
          <div class="list-desc">${v.desc}</div>
        </div>
        <div class="list-actions">
          <span class="list-views">${v.views}</span>
          <div class="list-action-row">
            <input type="checkbox" class="list-cb" ${selected.has(v.id)?'checked':''} onchange="toggleSel(${v.id},event)" title="Select"/>
            <button class="post-btn ${postedIds.has(v.id)?'sent':''}" onclick="openPostModal([${v.id}])">
              ${postedIds.has(v.id)?'✓ Sent':'✈ Post'}
            </button>
          </div>
        </div>
      </div>`).join('');
  }
}

// ── POST MODAL ────────────────────────────────────────────────────
function populateGroupDropdown(){
  const sel = document.getElementById('post-group-select');
  const msg = document.getElementById('post-no-groups-msg');
  const btn = document.getElementById('post-confirm-btn');
  sel.innerHTML = '';
  if(!tgGroups.length){
    sel.style.display='none'; msg.style.display='block'; btn.disabled=true; return;
  }
  sel.style.display='block'; msg.style.display='none'; btn.disabled=false;
  sel.innerHTML = tgGroups.map(g=>{
    const warn = (!g.botToken||!g.chatId) ? '<span class="warn">Not configured</span>' : '';
    return `<label class="post-group-check">
      <input type="checkbox" class="post-group-cb" value="${g.id}" ${g.isDefault?'checked':''}/>
      <span>${g.name}${g.isDefault?' (Default)':''}</span>
      ${warn}
    </label>`;
  }).join('');
}
function getSelectedPostGroups(){
  const checked = Array.from(document.querySelectorAll('.post-group-cb:checked'));
  return checked
    .map(cb=>tgGroups.find(g=>g.id===parseInt(cb.value,10)))
    .filter(Boolean);
}
function toggleThumbVideo(id,e){
  if(e){ e.preventDefault(); e.stopPropagation(); }
  const video = document.querySelector('video[data-video-id="'+id+'"]');
  if(!video) return;
  if(video.paused){
    video.play().catch(()=>{});
  } else {
    video.pause();
    video.currentTime = 0;
  }
  updatePlayIcon(id, video.paused);
}
function handleVideoEnded(id){
  updatePlayIcon(id, true);
}
function updatePlayIcon(id, isPaused){
  const icon = document.getElementById('play-icon-'+id);
  if(icon) icon.textContent = isPaused ? '▶' : '❚❚';
}
function openPostModal(ids){
  postTarget=ids||Array.from(selected);
  if(!postTarget.length) return;
  const items=postTarget.map(id=>videos.find(v=>v.id===id)).filter(Boolean);
  const multi=items.length>1;
  document.getElementById('post-modal-title').textContent=multi?`📤 Post ${items.length} Videos to Telegram`:'📤 Post to Telegram';
  document.getElementById('post-modal-intro').textContent=multi
    ?`The following ${items.length} video links will be posted to the selected Telegram groups:`
    :'The following video link will be posted to the selected Telegram groups:';
  document.getElementById('post-modal-items').innerHTML=items.map(v=>`
    <div class="modal-video-item">
      <div class="modal-mini-thumb">
        <div class="thumb-wrap" style="height:100%">${thumbHtml(v)}</div>
      </div>
      <div class="modal-video-info">
        <div class="modal-video-title">${v.title}</div>
        <div class="modal-video-ch">${v.channel} · ${v.views}</div>
        ${v.mp4Url?'<div style="font-size:10px;font-weight:700;color:#1b5e20;background:#e8f5e9;display:inline-block;padding:2px 8px;border-radius:8px;margin-bottom:4px">📹 Will send as Video</div><br>':''}
        <a class="modal-video-link" href="${ytLink(v)}" target="_blank">${ytLink(v)}</a>
      </div>
    </div>`).join('');
  populateGroupDropdown();
  const btn=document.getElementById('post-confirm-btn');
  btn.className='modal-confirm'; btn.textContent='✈ Confirm & Post'; btn.disabled=false;
  const errEl=document.getElementById('post-error-msg'); if(errEl){errEl.style.display='none';errEl.textContent='';}
  openModal('post-modal');
}
async function confirmPost(){
  const groups = getSelectedPostGroups();
  const btn = document.getElementById('post-confirm-btn');
  if(!groups.length){
    const errEl = document.getElementById('post-error-msg');
    if(errEl){ errEl.textContent='❌ Select at least one Telegram group.'; errEl.style.display='block'; }
    return;
  }

  btn.disabled=true;
  btn.textContent='Posting…';
  const items = postTarget.map(id=>videos.find(v=>v.id===id)).filter(Boolean);

  let allOk = true;
  let failReason = '';
  for(const group of groups){
    if(!group.botToken || !group.chatId){
      allOk = false;
      failReason = 'Group "' + group.name + '" is missing Bot Token or Chat ID.';
      break;
    }
    for(const v of items){
      const link = ytLink(v);
      const caption = '📹 ' + v.title + '\n🏢 ' + v.channel + ' · ' + v.views + '\n\n' + link;
      try {
        let apiMethod, payload;
        if(v.mp4Url){
          apiMethod = 'sendVideo';
          payload = {
            chat_id: group.chatId,
            video: telegramVideoLink(v),
            caption: caption,
            supports_streaming: true
          };
        } else {
          apiMethod = 'sendMessage';
          payload = {
            chat_id: group.chatId,
            text: caption,
            disable_web_page_preview: false
          };
        }
        const res = await fetch('https://api.telegram.org/bot' + group.botToken + '/' + apiMethod, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if(!data.ok){
          allOk = false;
          failReason = group.name + ': ' + (data.description || 'Unknown error');
          break;
        }
      } catch(err){
        allOk = false;
        failReason = group.name + ': Network error — check your connection.';
        break;
      }
    }
    if(!allOk) break;
  }

  if(allOk){
    postTarget.forEach(id=>postedIds.add(id));
    selected.clear();
    updateSelBar();
    renderVideos();
    btn.className='modal-confirm done';
    btn.textContent = `✓ Posted to ${groups.length} group(s)!`;
    setTimeout(()=>closeModal('post-modal'),1500);
  } else {
    btn.disabled=false;
    btn.textContent='✈ Retry';
    btn.className='modal-confirm';
    const errEl = document.getElementById('post-error-msg');
    if(errEl){ errEl.textContent='❌ Failed: '+failReason; errEl.style.display='block'; }
  }
}

// ── ADD VIDEO ─────────────────────────────────────────────────────
function openAddModal(){
  ['add-url','add-title','add-channel','add-dur','add-views','add-desc','add-mp4'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('add-cat').value='software';
  document.getElementById('yt-preview').style.display='none';
  const ms=document.getElementById('mp4-status'); if(ms){ms.style.display='none';ms.textContent='';}
  openModal('add-modal');
}
function previewYT(){
  const id=document.getElementById('add-url').value.trim().includes('github.com');
  const p=document.getElementById('yt-preview');
  if(id){ p.style.display='block'; }
  else p.style.display='none';
}
function extractYtId(url){
  if(url.includes('github.com')) return null;
  return null;
}
function previewMp4(){
  const url = document.getElementById('add-mp4').value.trim();
  const el  = document.getElementById('mp4-status');
  if(!url){ el.style.display='none'; return; }
  const isLikelyMp4 = /\.(mp4|mov|avi|mkv|webm)(\?|$)/i.test(url) || url.includes('.mp4');
  el.style.display='block';
  if(isLikelyMp4){
    el.style.background='#e8f5e9'; el.style.color='#1b5e20';
    el.textContent='✅ Looks like a valid video URL — will use sendVideo when posting to Telegram.';
  } else {
    el.style.background='#fff8e1'; el.style.color='#f57f17';
    el.textContent='⚠️ URL does not end in .mp4 — Telegram may still accept it, but results may vary.';
  }
}
function addVideo(){
  const url=document.getElementById('add-url').value.trim();
  const title=document.getElementById('add-title').value.trim();
  if(!title){alert('Title is required.');return;}
  const mp4Url=document.getElementById('add-mp4').value.trim();
  videos.unshift({
    id:nextId++, ytId:null, title,
    channel:document.getElementById('add-channel').value.trim()||'Unknown Channel',
    cat:document.getElementById('add-cat').value,
    duration:document.getElementById('add-dur').value.trim()||'–',
    views:document.getElementById('add-views').value.trim()||'–',
    desc:document.getElementById('add-desc').value.trim()||'',
    mp4Url: mp4Url||null,
    telegramVideoUrl: mp4Url&&/^https:\/\//i.test(mp4Url) ? mp4Url : null,
    githubUrl: url.includes('github.com') ? url : GITHUB_SOURCE_LINK,
    userAdded:true,
  });
  closeModal('add-modal');
  activeTag='all';
  document.querySelectorAll('.tag').forEach(t=>t.classList.toggle('active',t.dataset.cat==='all'));
  document.getElementById('search-input').value='';
  renderVideos();
}

// ── MODAL HELPERS ─────────────────────────────────────────────────
function openModal(id){
  if(id==='settings-modal'){
    renderTgGroupList();
    renderMemberList();
  }
  document.getElementById(id).classList.add('open');
}
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
