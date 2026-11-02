import { createAuthClient } from '@neondatabase/auth';
const AUTH_URL='https://ep-calm-mouse-bapjwd5s.neonauth.c-8.eu-central-1.aws.neon.tech/neondb/auth';
const auth=createAuthClient(AUTH_URL);
const $=id=>document.getElementById(id);
const status=$('profile-status'), form=$('profile-form');

async function token() {
  const { data, error } = await auth.token();

  if (error) {
    throw new Error(error.message || 'Unable to get authentication token.');
  }

  const jwt = data?.token;

  if (!jwt || typeof jwt !== 'string') {
    throw new Error('Please sign in first.');
  }

  return jwt;
}

async function api(method, body){
 const response=await fetch('/api/profile', {method,headers:{'Authorization':`Bearer ${await token()}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
 const data=await response.json().catch(()=>({}));
 if (!response.ok) throw new Error(data.error||`HTTP ${response.status}`);
 return data;
}
async function init(){
 try {
  const {data,error}=await auth.getSession(); if(error)throw error;
  if(!data?.user){location.assign('/login.html');return;}
  $('signed-name').textContent=data.user.name||'Logic Explorer';
  const {profile}=await api('GET');
  if(profile){$('nickname').value=profile.nickname;$('newsletter').checked=profile.subscribed;}
  form.hidden=false; status.textContent=profile?'Update your community profile.':'Choose a nickname to join the discussion.';
 }catch(e){status.textContent=e.message||'Unable to load profile.';}
}
form.addEventListener('submit',async event=>{
 event.preventDefault(); const button=$('save-profile'); button.disabled=true;
 try{
  const body={nickname:$('nickname').value.trim(),newsletter:$('newsletter').checked};
  const result=await api('POST',body);
  status.textContent=`Saved! Welcome, ${result.profile.nickname}.`;
 }catch(e){status.textContent=e.message||'Could not save profile.';}
 finally{button.disabled=false;}
});
init();
