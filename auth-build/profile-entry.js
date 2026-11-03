import { createAuthClient } from '@neondatabase/auth';
import { loadAuthConfig } from '../assets/js/auth-config.js';

async function start() {
const { authUrl: AUTH_URL } = await loadAuthConfig();
const auth=createAuthClient(AUTH_URL);
const $=id=>document.getElementById(id);
const status=$('profile-status'), form=$('profile-form');

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

const { profile } = await api('GET');

if (profile) {
  $('nickname').value = profile.nickname;
  $('newsletter').checked = profile.subscribed === true;
} else {
  $('newsletter').checked = true;
}

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
}
start().catch(error => { document.getElementById('profile-status').textContent = error.message; });
