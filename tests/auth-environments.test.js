import test from 'node:test';
import assert from 'node:assert/strict';
import { serverAuthConfig } from '../api/_lib/auth-config.js';
import { GET } from '../api/auth-config.js';
import { loadAuthConfig } from '../assets/js/auth-config.js';
const prod='https://production.example.com/neondb/auth';
const dev='https://development.example.com/neondb/auth';
test('each environment selects its own Auth URL and derives matching JWKS',()=>{
 for(const authUrl of [prod,dev]){
  const c=serverAuthConfig({NEON_AUTH_URL:authUrl});
  assert.equal(c.authUrl,authUrl);assert.equal(c.jwksUrl,`${authUrl}/.well-known/jwks.json`);
 }
});
test('missing preview configuration never silently selects production',()=>{
 assert.throws(()=>serverAuthConfig({VERCEL_ENV:'preview'}),{status:503});
});
test('stale production keys are rejected for development Auth',()=>{
 assert.throws(()=>serverAuthConfig({NEON_AUTH_URL:dev,NEON_AUTH_JWKS_URL:`${prod}/.well-known/jwks.json`}),{status:503});
 assert.throws(()=>serverAuthConfig({NEON_AUTH_URL:dev,NEON_AUTH_JWKS_URL:'https://development.example.com/other/auth/.well-known/jwks.json'}),{status:503});
});
test('configuration rejects credentials, queries and insecure URLs',()=>{
 for(const value of ['http://example.com/auth','https://user:password@example.com/auth','https://example.com/auth?secret=1','https://example.com/not-auth'])assert.throws(()=>serverAuthConfig({NEON_AUTH_URL:value}),{status:503});
});
test('public config exposes only Auth URL, no credentials or stale cached data',async()=>{
 const original={...process.env};
 try{
  delete process.env.NEON_AUTH_JWKS_URL;
  process.env.DATABASE_URL='postgresql://private-value';
  for(const authUrl of [prod,dev]){
   process.env.NEON_AUTH_URL=authUrl;
   const r=await GET();assert.equal(r.status,200);
   assert.equal(r.headers.get('cache-control'),'no-store');assert.deepEqual(await r.json(),{authUrl});
  }
  delete process.env.NEON_AUTH_URL;const r=await GET();assert.equal(r.status,503);assert.doesNotMatch(await r.text(),/private-value/);
 }finally{
  for(const k of ['NEON_AUTH_URL','NEON_AUTH_JWKS_URL','DATABASE_URL']){if(original[k]===undefined)delete process.env[k];else process.env[k]=original[k];}
 }
});
test('browser uses server-selected environment and fails visibly on unavailable config',async()=>{
 let called;
 const c=await loadAuthConfig(async(path,options)=>{called={path,options};return new Response(JSON.stringify({authUrl:dev}));});
 assert.equal(c.authUrl,dev);assert.equal(called.path,'/api/auth-config');assert.equal(called.options.cache,'no-store');
 await assert.rejects(loadAuthConfig(async()=>new Response('{}',{status:503})),/not configured/);
 await assert.rejects(loadAuthConfig(async()=>new Response(JSON.stringify({authUrl:'http://bad.example/auth'}))),/could not be loaded/);
});
