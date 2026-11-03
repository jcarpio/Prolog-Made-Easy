import { loadAuthConfig } from './auth-config.js';
import { chapters, experiences, prefix, canAccess, complete, mergeProgress } from './course-model.js';
let AUTH_URL;
const key='pme-learning-guest-v1';
const path=location.pathname;
const request=(url,options={})=>fetch(url,{...options,signal:AbortSignal.timeout(15000)});
const index=path.endsWith('01-think-differently-slides.html') ? 0 : chapters.findIndex(c=>c.path===path);
let state={experience:null,completed:[]}, account=false, syncMessage='', busy=false;
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
const link=(text,href)=>{const n=el('a',text);n.href=href;return n;};
function guest(){try{const s=JSON.parse(localStorage.getItem(key));return {experience:experiences.includes(s?.experience)?s.experience:null,completed:prefix(s?.completed)};}catch{return {experience:null,completed:[]};}}
async function api(method='GET',body){
  const tokenResponse=await request(`${AUTH_URL}/token`,{credentials:'include',cache:'no-store'});
  if(!tokenResponse.ok)throw new Error('Please sign in again to sync your progress.');
  const {token}=await tokenResponse.json();
  if(typeof token!=='string'||token.split('.').length!==3)throw new Error('Please sign in again to sync your progress.');
  const r=await request('/api/learning',{method,cache:'no-store',headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const data=await r.json();if(!r.ok)throw new Error(data.error||'Unable to sync progress.');return data.learning;
}
function notice(parent,text){const n=el('p',text);n.className='learning-status';n.setAttribute('role','status');parent.append(n);return n;}
function profileForm(parent){
  const form=el('form'),label=el('label','Have you programmed before?'),select=el('select');select.required=true;select.name='experience';
  [['','Choose your experience'],['beginner','I have never programmed'],['imperative','I know C, C++, Java, Python or another imperative language; Prolog is new to me'],['prolog','I have programmed in Prolog (including if I still find it difficult)']].forEach(([v,t])=>{const o=el('option',t);o.value=v;select.append(o);});select.value=state.experience||'';label.append(select);
  const b=el('button',state.experience?'Save learning preferences':'Start my learning path');b.type='submit';
  form.append(label,el('p','Everyone starts with the foundations. Your experience changes the explanations, not which chapters are unlocked.'),b);
  form.addEventListener('submit',async e=>{e.preventDefault();if(busy)return;b.disabled=true;try{await save('profile',{experience:select.value});render();}catch(error){notice(form,error.message);b.disabled=false;}});parent.append(form);
}
async function save(action,extra={}){
  busy=true;
  try{
    if(account){state=await api('POST',{action,experience:state.experience,...extra});syncMessage='Saved to your account. Available on your other devices.';}
    else{
      const latest=guest();state.completed=mergeProgress(state.completed,latest.completed);
      if(action==='complete')state.completed=complete(state.completed,extra.chapter);
      if(extra.experience)state.experience=extra.experience;
      try{localStorage.setItem(key,JSON.stringify(state));syncMessage='Saved in this browser. Sign in to keep learning on other devices.';}
      catch{throw new Error('Your browser could not save progress. Allow site storage or sign in, then try again.');}
    }
  }finally{busy=false;}
}
function nextLink(parent){const next=chapters[state.completed.length];parent.append(link(next?'Continue → '+next.title:'Revisit the first chapter',next?.path||chapters[0].path));}
function dashboard(){
  const root=document.getElementById('learning-dashboard');if(!root)return;root.replaceChildren(el('h1','Your learning path'));
  notice(root,syncMessage);if(!account)root.append(link('Sign in to sync between devices','/login.html'));
  if(!state.experience){profileForm(root);return;}
  root.append(el('p',`${state.completed.length} of ${chapters.length} chapters finished. Understanding grows with practice; finished does not mean mastered.`));
  const meter=el('progress');meter.max=chapters.length;meter.value=state.completed.length;meter.setAttribute('aria-label','Chapters finished');root.append(meter);nextLink(root);
  const list=el('ol');for(const c of chapters){const item=el('li');const done=state.completed.includes(c.id);if(canAccess(state.completed,c.id))item.append(link(c.title,c.path),el('small',done?'Finished · revisit any time':'Your next chapter'));else item.append(el('span',c.title),el('small','Locked · finish the previous chapter'));list.append(item);}root.append(list);
  const settings=el('details');settings.append(el('summary','Change my learning preferences'));profileForm(settings);root.append(settings,el('p','Advanced exploration will require a practical assessment of Prolog foundations. It is not unlocked by changing your experience.'));
}
function gate(){
  document.getElementById('learning-gate')?.remove();
  for(const n of document.querySelectorAll('[data-learning-inert]')){n.inert=false;delete n.dataset.learningInert;}
  if(index<0)return true;
  if(state.experience&&canAccess(state.completed,chapters[index].id))return true;
  const overlay=el('div');overlay.id='learning-gate';overlay.className='pme-locked';const card=el('section');card.className='pme-learning';
  card.append(el('h1',state.experience?'One chapter at a time.':'Welcome to your learning path.'));
  if(!state.experience)profileForm(card);else{card.append(el('p','Finish your current chapter before opening this one. You can revisit every chapter you have already finished.'));nextLink(card);}
  card.append(link('My progress','/progress.html'));notice(card,syncMessage);overlay.append(card);for(const n of document.body.children){if(n.tagName!=='SCRIPT'&&!n.inert){n.inert=true;n.dataset.learningInert='';}}document.body.append(overlay);card.setAttribute('tabindex','-1');card.focus();return false;
}
function chapter(){
  if(index<0||document.querySelector('[data-learning-recap][data-populated]'))return;
  const c=chapters[index], slides=document.querySelector('.reveal .slides');
  const wrap=document.querySelector('[data-learning-recap]')||el('section');wrap.dataset.learningRecap='';wrap.dataset.populated='';const panel=el('div');panel.className='pme-learning';panel.append(el('p','BEFORE WE BEGIN'),el('h2',index?'A small reminder':'You can learn this'),el('p',c.recap));
  const help=el('p');help.dataset.learningHelp='';panel.append(help,el('p','You do not need to understand everything yet. Try the examples. We will return to these ideas.'));wrap.append(panel);
  if(slides){if(!wrap.parentNode)slides.insertBefore(wrap,slides.children[1]||null);}else{const article=document.querySelector('article')||document.querySelector('main');article?.prepend(wrap);}
  const end=document.querySelector('[data-learning-end]')||el('section');const box=el('div');box.className='pme-learning';box.append(el('h2','One more step on your path'),el('p','Follow the examples and try the activities. When you are ready, mark this chapter as finished. You can always return.'));
  const button=el('button',"I've finished!");button.type='button';button.dataset.learningFinish='';
  button.addEventListener('click',async()=>{if(busy)return;button.disabled=true;try{await save('complete',{chapter:c.id});render();}catch(error){notice(box,error.message);button.disabled=false;}});
  box.append(button);const status=el('p');status.dataset.learningSaved='';status.setAttribute('role','status');box.append(status,link('My progress','/progress.html'));const forward=el('div');forward.dataset.learningForward='';box.append(forward);
  if(index===1){box.append(el('p','Optional practice: get to know Exercism with its introductory Hello World exercise. It introduces the platform; it does not test mastery of facts and rules.'));const ex=link('Open Hello World on Exercism ↗','https://exercism.org/tracks/prolog/exercises/hello-world');ex.target='_blank';ex.rel='noopener noreferrer';box.append(ex);}
  end.append(box);if(slides){if(!end.parentNode)slides.append(end);window.Reveal?.layout();}else{const article=document.querySelector('article')||document.querySelector('main');article?.append(end);}
}
function navigation(){
  for(const a of document.querySelectorAll('a[href]')){
    const url=new URL(a.href,location.href);const i=chapters.findIndex(c=>c.path===url.pathname);if(i<0||url.origin!==location.origin)continue;
    const locked=!state.experience||!canAccess(state.completed,chapters[i].id);
    if(locked){a.dataset.learningTarget=a.getAttribute('href');a.href='/progress.html';a.title='Open your learning path to continue';}
  }
}
function render(){
  document.getElementById('learning-loading')?.remove();
  for(const a of document.querySelectorAll('a[data-learning-target]')){a.setAttribute('href',a.dataset.learningTarget);delete a.dataset.learningTarget;}
  const allowed=gate();if(allowed){chapter();document.querySelector('[data-learning-help]')?.replaceChildren(document.createTextNode(chapters[index]?.[state.experience]||''));}
  const button=document.querySelector('[data-learning-finish]');if(button){button.disabled=state.completed.includes(chapters[index].id);button.textContent=button.disabled?'Chapter finished ✓':"I've finished!";document.querySelector('[data-learning-saved]').textContent=syncMessage;const forward=document.querySelector('[data-learning-forward]');forward.replaceChildren();if(button.disabled&&chapters[index+1])forward.append(link('Next chapter → '+chapters[index+1].title,chapters[index+1].path));}
  dashboard();navigation();document.documentElement.classList.remove('pme-path-pending');
}
async function init(){
  state=guest();
  try{
    ({ authUrl: AUTH_URL } = await loadAuthConfig());
    const session=await request(`${AUTH_URL}/get-session`,{credentials:'include',cache:'no-store'});
    if(!session.ok)throw new Error('Unable to check your account.');
    const data=await session.json();account=!!data?.user;
    if(account){const remote=await api();const local=state;state=remote||{experience:null,completed:[]};
      if(local.experience){state=await api('POST',{action:'import',experience:remote?.experience||local.experience,completed:local.completed});try{localStorage.removeItem(key);}catch{/* Server has saved the import. */}}
      syncMessage='Progress is synced with your account.';
    }else syncMessage='Progress stays in this browser. Sign in to sync between devices.';
    render();
  }catch(error){
    document.getElementById('learning-loading')?.remove();
    // Never fall back to another user's guest data if account state is uncertain.
    const overlay=el('div');overlay.className='pme-locked';const card=el('section');card.className='pme-learning';card.append(el('h1','Your learning path could not load'),el('p',error.message),el('p','Your saved progress has not been changed.'),link('Sign in / manage account','/login.html'));const retry=el('button','Try again');retry.onclick=()=>location.reload();card.append(retry);overlay.append(card);document.body.append(overlay);document.documentElement.classList.remove('pme-path-pending');
  }
}
init();
