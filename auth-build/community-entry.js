import { createAuthClient } from '@neondatabase/auth';

const AUTH_URL = 'https://ep-calm-mouse-bapjwd5s.neonauth.c-8.eu-central-1.aws.neon.tech/neondb/auth';

const auth = createAuthClient(AUTH_URL);

const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const mounts=[...document.querySelectorAll('[data-pme-community]')];


async function token() {
  const response = await fetch(`${AUTH_URL}/token`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(
      `Unable to obtain JWT from Neon Auth (HTTP ${response.status})`
    );
  }

  const data = await response.json();
  const jwt = data?.token;

  if (typeof jwt !== 'string' || jwt.split('.').length !== 3) {
    throw new Error('Neon Auth did not return a valid JWT.');
  }

  return jwt;
}

async function load(id,stats,comments){
 const r=await fetch(`/api/community?exercise=${encodeURIComponent(id)}`,{cache:'no-store'});
 const data=await r.json();if(!r.ok)throw Error(data.error||`HTTP ${r.status}`);
 stats.textContent=`Helpful votes: ${data.votes.up} · Needs improvement: ${data.votes.down}`;
 comments.replaceChildren();
 if(!data.comments.length)comments.append(el('p','pme-community-muted','No published comments yet. Start the conversation!'));
 data.comments.forEach(item=>{
  const article=el('article','pme-community-comment');
  const title=el('strong','',item.nickname+' · ');
  const date=el('time','pme-community-muted',new Date(item.created_at).toLocaleDateString());date.dateTime=item.created_at;
  const text=el('p','',item.content);article.append(title,date,text);comments.append(article);
 });
 if(data.hasMore)comments.append(el('p','pme-community-muted','Showing 30 latest comments.'));
}
async function send(body){
 const response=await fetch('/api/community',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${await token()}`},body:JSON.stringify(body)});
 const data=await response.json().catch(()=>({}));
 if(!response.ok){if(data.needsProfile)location.href='/profile.html';throw Error(data.error||`HTTP ${response.status}`);}
 return data;
}
async function init(mount){
 const id=mount.dataset.exerciseId;if(!/^[a-z0-9][a-z0-9-]{1,79}$/.test(id||''))return;
 mount.replaceChildren();mount.append(el('h2','','Community discussion'),el('p','pme-community-muted','Questions, discoveries and feedback from fellow learners.'));
 const stats=el('div','pme-community-stats','Loading…'), heading=el('h3','','Comments'), comments=el('div','pme-community-comments');
 mount.append(stats,heading,comments);
 try{await load(id,stats,comments);}catch(e){stats.textContent=e.message;}
 const {data}=await auth.getSession().catch(()=>({data:null}));
 if(!data?.user){const info=el('p','pme-community-notice','Sign in to vote or comment. Reading is open to everyone.');const a=el('a','',' Sign in with Google');a.href='/login.html';info.append(a);mount.append(info);return;}
 const controls=el('div','pme-community-actions');
 const up=el('button','pme-action','Helpful ▲'),down=el('button','pme-action','Needs improvement ▼');
 const feedback=el('p','pme-community-muted','');feedback.setAttribute('role','status');
 const sendVote=async value=>{try{await send({action:'vote',exerciseId:id,value});await load(id,stats,comments);feedback.textContent='Vote recorded.';}catch(e){feedback.textContent=e.message;}};
 up.onclick=()=>sendVote(1);down.onclick=()=>sendVote(-1);controls.append(up,down);mount.append(controls);
 const form=el('form','pme-community-form');const label=el('label','','Share a question or discovery');const area=el('textarea','');area.maxLength=2000;area.minLength=3;area.rows=3;area.required=true;label.append(area);const submit=el('button','pme-action','Post comment');submit.type='submit';form.append(label,submit);mount.append(form,feedback);

form.onsubmit = async (e) => {
  e.preventDefault();
  submit.disabled = true;

  try {
    const result = await send({
      action: 'comment',
      exerciseId: id,
      content: area.value
    });

    area.value = '';

    if (result.status === 'published') {
      await load(id, stats, comments);
      feedback.textContent = 'Comment published successfully!';
    } else {
      feedback.textContent =
        'Comment received! It will appear after moderation.';
    }

  } catch (err) {
    feedback.textContent = err.message;
  } finally {
    submit.disabled = false;
  }
};

}
mounts.forEach(m=>init(m).catch(e=>{m.append(el('p','pme-community-muted',e.message));}));
