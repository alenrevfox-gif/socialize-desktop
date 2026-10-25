const apps=[
 {id:'instagram',name:'Instagram',url:'https://www.instagram.com/',icon:'◎',color:'#f0a1b8',bg:'#38232e',description:'Photos, reels, and messages.'},
 {id:'x',name:'X',url:'https://x.com/',icon:'𝕏',color:'#f4f4f5',bg:'#292a30',description:'What’s happening right now.'},
 {id:'telegram',name:'Telegram',url:'https://web.telegram.org/',icon:'➤',color:'#65c9ec',bg:'#1e3039',description:'Fast, secure messaging.'},
 {id:'youtube',name:'YouTube',url:'https://www.youtube.com/',icon:'▶',color:'#ff7979',bg:'#3a2528',description:'Videos, music, and creators.'},
 {id:'facebook',name:'Facebook',url:'https://www.facebook.com/',icon:'f',color:'#82aaff',bg:'#222c42',description:'Friends, groups, and updates.'},
 {id:'reddit',name:'Reddit',url:'https://www.reddit.com/',icon:'◉',color:'#ff9d6c',bg:'#3b2b26',description:'Communities for everything.'},
 {id:'linkedin',name:'LinkedIn',url:'https://www.linkedin.com/',icon:'in',color:'#79c8ee',bg:'#20323a',description:'Professional news and connections.'},
 {id:'threads',name:'Threads',url:'https://www.threads.net/',icon:'＠',color:'#eeeaf7',bg:'#302d36',description:'Join the conversation.'}
];
const nav=document.getElementById('social-nav');
const readSaved=()=>{try{return JSON.parse(localStorage.getItem('socialize-apps')||'null')}catch{return null}};
let saved=readSaved();let myApps=Array.isArray(saved)?saved:apps.map(a=>a.id);let activeId=localStorage.getItem('socialize-active')||'instagram';
function getApp(id){return apps.find(a=>a.id===id)||customApps.find(a=>a.id===id)}
let customApps=[];try{customApps=JSON.parse(localStorage.getItem('socialize-custom-apps')||'[]')}catch{}
function allApps(){return [...apps,...customApps]}
function render(){const list=allApps().filter(a=>myApps.includes(a.id));if(!list.length){myApps=['instagram'];list.push(apps[0])}if(!list.some(a=>a.id===activeId))activeId=list[0].id;
 nav.innerHTML=list.map(a=>`<button class="nav-item ${a.id===activeId?'active':''}" data-app="${a.id}" type="button"><span class="nav-icon" style="color:${a.color}">${escapeHtml(a.icon)}</span><span class="nav-name">${escapeHtml(a.name)}</span><span class="nav-external">↗</span></button>`).join('');

 document.querySelectorAll('[data-app]').forEach(el=>el.addEventListener('click',()=>selectApp(el.dataset.app)));
}
function selectApp(id){
 const a=getApp(id);if(!a)return;
 activeId=id;localStorage.setItem('socialize-active',id);render();
 document.getElementById('welcome').hidden=true;document.getElementById('browser-card').hidden=false;
 document.getElementById('current-name').textContent=a.name;
 document.getElementById('address-label').textContent=new URL(a.url).hostname;
 const frame=document.getElementById('social-frame'),overlay=document.getElementById('frame-overlay');
 document.getElementById('overlay-icon').textContent=a.icon;
 document.getElementById('overlay-icon').style.color=a.color;
 document.getElementById('overlay-icon').style.background=a.bg;
 document.getElementById('overlay-title').textContent=`${a.name} is ready`;
 document.getElementById('overlay-copy').textContent=`${a.name} is opening in your Socialize workspace. Your sign-in session is kept in this app on this PC.`;
 const launch=document.getElementById('overlay-launch');launch.href=a.url;launch.innerHTML=`Open ${escapeHtml(a.name)} in browser <span>↗</span>`;
 document.getElementById('open-external').onclick=()=>openExternal(a.url);
 document.getElementById('launch-frame').onclick=()=>openExternal(a.url);
 document.getElementById('reload-frame').onclick=()=>reloadSocial(a.url);
 document.getElementById('back-frame').onclick=()=>window.socializeDesktop?.back();
 document.getElementById('forward-frame').onclick=()=>window.socializeDesktop?.forward();
 if(window.socializeDesktop){
   frame.style.display='none';overlay.classList.add('dismissed');document.getElementById('continue-embedded').hidden=true;
   window.socializeDesktop.rememberHost(new URL(a.url).hostname);
   window.socializeDesktop.openService(a.url).catch(error=>{overlay.classList.remove('dismissed');document.getElementById('overlay-title').textContent='Could not open this website';document.getElementById('overlay-copy').textContent=error.message||'Use a secure HTTPS address.'});
 }else{
   frame.style.display='block';frame.src=a.url;overlay.classList.remove('dismissed');document.getElementById('continue-embedded').hidden=false;
   document.getElementById('overlay-copy').textContent=`Some sites block embedded views. Open ${a.name} in a new tab to sign in directly. Your browser may remember your session.`;
 }
}
function openExternal(url){if(window.socializeDesktop)window.socializeDesktop.openExternal(url);else window.open(url,'_blank','noopener,noreferrer')}
function reloadSocial(url){if(window.socializeDesktop)window.socializeDesktop.reload();else{document.getElementById('social-frame').src=url;document.getElementById('frame-overlay').classList.remove('dismissed')}}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function addApp(id){if(!myApps.includes(id))myApps.push(id);localStorage.setItem('socialize-apps',JSON.stringify(myApps));render();document.getElementById('app-modal').classList.remove('open');document.getElementById('app-modal').setAttribute('aria-hidden','true');const toast=document.getElementById('toast');toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2500)}
function openModal(){const select=document.getElementById('app-choice');const available=allApps().filter(a=>!myApps.includes(a.id));select.innerHTML=available.length?available.map(a=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join(''):'<option value="">All popular apps are in your sidebar</option>';document.getElementById('app-modal').classList.add('open');document.getElementById('app-modal').setAttribute('aria-hidden','false')}
document.getElementById('add-app').onclick=openModal;document.getElementById('manage-apps').onclick=()=>{if(confirm('Remove an app from your sidebar? Choose OK to remove the selected app.')){if(myApps.length>1){myApps=myApps.filter(id=>id!==activeId);localStorage.setItem('socialize-apps',JSON.stringify(myApps));activeId=myApps[0];render();document.getElementById('welcome').hidden=false;document.getElementById('browser-card').hidden=true}else alert('Keep at least one app in your sidebar.')}};
document.getElementById('close-modal').onclick=()=>document.getElementById('app-modal').classList.remove('open');document.getElementById('cancel-modal').onclick=()=>document.getElementById('app-modal').classList.remove('open');document.getElementById('app-modal').addEventListener('click',e=>{if(e.target.id==='app-modal')e.currentTarget.classList.remove('open')});document.addEventListener('keydown',e=>{if(e.key==='Escape')document.getElementById('app-modal').classList.remove('open')});
document.getElementById('app-form').addEventListener('submit',e=>{e.preventDefault();const customName=document.getElementById('custom-name').value.trim(),customUrl=document.getElementById('custom-url').value.trim();if(customName||customUrl){try{const url=new URL(customUrl);if(url.protocol!=='https:')throw Error();const id=`custom-${Date.now()}`;customApps.push({id,name:customName||url.hostname,url:url.href,icon:'↗',color:'#c6b2ff',bg:'#302942',description:'Your custom website.'});localStorage.setItem('socialize-custom-apps',JSON.stringify(customApps));addApp(id)}catch{alert('Enter a valid website address beginning with https://');}return}const id=document.getElementById('app-choice').value;if(id)addApp(id)});
document.getElementById('continue-embedded').onclick=()=>document.getElementById('frame-overlay').classList.add('dismissed');document.getElementById('get-started').onclick=()=>selectApp(activeId);document.getElementById('help-button').onclick=()=>alert('Select a social app from the sidebar. If its page cannot load here, use the arrow button to open it in a new tab. Each service handles its own sign-in.');render();


// First-visit profile setup is local to this browser.
const profileKey='socialize-profile';
function loadProfile(){try{return JSON.parse(localStorage.getItem(profileKey)||'null')}catch{return null}}
function paintProfile(profile){if(!profile)return;document.getElementById('profile-name').textContent=profile.name;document.getElementById('profile-email').textContent=profile.email;document.getElementById('profile-avatar').textContent=(profile.name.trim()[0]||'Y').toUpperCase()}
const profile=loadProfile();
if(profile){paintProfile(profile)}else{const setup=document.getElementById('onboarding-modal');setup.classList.add('open');setup.setAttribute('aria-hidden','false');document.getElementById('profile-fullname').focus()}
document.getElementById('onboarding-form').addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;const data={name:document.getElementById('profile-fullname').value.trim(),age:Number(document.getElementById('profile-age').value),gender:document.getElementById('profile-gender').value,phone:document.getElementById('profile-phone').value.trim(),email:document.getElementById('profile-email-input').value.trim()};if(data.age<1||data.age>120){document.getElementById('profile-age').focus();return}localStorage.setItem(profileKey,JSON.stringify(data));paintProfile(data);const setup=document.getElementById('onboarding-modal');setup.classList.remove('open');setup.setAttribute('aria-hidden','true')});
const shell=document.querySelector('.app-shell'),sidebarToggle=document.getElementById('sidebar-toggle'),sidebarShow=document.getElementById('sidebar-show');
function setSidebarCollapsed(collapsed){shell.classList.toggle('sidebar-collapsed',collapsed);sidebarToggle.setAttribute('aria-expanded',String(!collapsed));sidebarToggle.setAttribute('aria-label',collapsed?'Show sidebar':'Hide sidebar');sidebarShow.setAttribute('aria-expanded',String(!collapsed))}
sidebarToggle.addEventListener('click',()=>setSidebarCollapsed(!shell.classList.contains('sidebar-collapsed')));sidebarShow.addEventListener('click',()=>setSidebarCollapsed(false));



if(window.socializeDesktop){
 const pane=document.querySelector('.frame-wrap');
 const syncBounds=()=>{const r=pane.getBoundingClientRect();window.socializeDesktop.setContentBounds({x:r.left,y:r.top,width:document.getElementById('browser-card').hidden?0:r.width,height:document.getElementById('browser-card').hidden?0:r.height})};
 new ResizeObserver(syncBounds).observe(pane);window.addEventListener('resize',syncBounds);requestAnimationFrame(syncBounds);
 window.socializeDesktop.onNavigate(url=>{try{document.getElementById('address-label').textContent=new URL(url).hostname}catch{}});
 window.socializeDesktop.onLoadError(error=>{if(error.code===-3)return;const overlay=document.getElementById('frame-overlay');overlay.classList.remove('dismissed');document.getElementById('overlay-title').textContent='This page could not load';document.getElementById('overlay-copy').textContent='Check your internet connection, then try again. Some services may restrict desktop app access.'});
}
document.getElementById('clear-signins').onclick=async()=>{if(window.socializeDesktop){const cleared=await window.socializeDesktop.clearSignins();if(cleared)alert('Saved social website sign-ins have been cleared from this PC.')}else alert('Sign-ins are saved by the desktop app.');};



