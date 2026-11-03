import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmailCodeFlow, emailCodeError } from '../auth-build/email-code-flow.js';
function setup() {
  const calls=[];
  let time=100000;
  const auth={emailOtp:{sendVerificationOtp:async args=>{calls.push(['send',args]);return {}; }},signIn:{emailOtp:async args=>{calls.push(['verify',args]);return {data:{user:{id:'test'}}};}}};
  const flow=createEmailCodeFlow(auth,{now:()=>time});
  return {auth,flow,calls,advance:ms=>{time+=ms;}};
}
test('sign-in verifies the address that received the code, without a redirect or password',async()=>{
  const {flow,calls}=setup();
  await flow.send(' student@example.com ');await flow.verify(' 123456 ');
  assert.deepEqual(calls,[['send',{email:'student@example.com',type:'sign-in'}],['verify',{email:'student@example.com',otp:'123456'}]]);
  assert.equal(Object.hasOwn(flow.state(),'otp'),false);
});
test('resends are throttled and changing address clears the verification target',async()=>{
  const {flow,advance,calls}=setup();await flow.send('a@example.com');flow.reset();
  await assert.rejects(flow.verify('123456'),/Request a code first/);
  await assert.rejects(flow.send('b@example.com'),/wait before/);
  advance(60000);await flow.send('b@example.com');await flow.verify('654321');
  assert.equal(calls.at(-1)[1].email,'b@example.com');
});
test('a failed send never enables verification or leaves a busy request',async()=>{
  const {auth,flow}=setup();auth.emailOtp.sendVerificationOtp=async()=>({error:{code:'RATE_LIMIT'}});
  await assert.rejects(flow.send('a@example.com'));
  assert.deepEqual(flow.state(),{email:null,pending:false,retryAfter:0});
  await assert.rejects(flow.verify('123456'),/Request a code first/);
});
test('expired codes can be retried without losing the verified target',async()=>{
  const {auth,flow}=setup();await flow.send('a@example.com');
  auth.signIn.emailOtp=async()=>({error:{code:'OTP_EXPIRED'}});
  await assert.rejects(flow.verify('123456'));
  assert.equal(flow.state().pending,false);assert.equal(flow.state().email,'a@example.com');
  assert.match(emailCodeError({code:'OTP_EXPIRED'}),/request a new code/);
});
test('double requests do not send duplicate messages',async()=>{
  const {auth,flow}=setup();let finish;
  auth.emailOtp.sendVerificationOtp=()=>new Promise(resolve=>{finish=resolve;});
  const first=flow.send('a@example.com');await assert.rejects(flow.send('a@example.com'),/current request/);
  assert.throws(()=>flow.reset(),/current request/);finish({});await first;
  assert.equal(flow.state().pending,false);
});
test('empty and malformed input is rejected before contacting Neon',async()=>{
  const {flow,calls}=setup();await assert.rejects(flow.send('bad address'));
  await flow.send('a@example.com');await assert.rejects(flow.verify('  '));
  assert.equal(calls.length,1);
});
