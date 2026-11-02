/* Tau Prolog runs in a separate Web Worker so it can be stopped safely. */
let session=null;
// Tau Prolog expects the browser global `window`; in a classic Worker it is `self`.
self.window = self;
try { importScripts('../vendor/tau-prolog/core.js'); if (typeof pl === 'undefined' || typeof pl.create !== 'function') { throw new Error('core.js loaded, but the Prolog API (pl.create) was not initialized'); } }
catch (e) { postMessage({type:'init-error', message:'Tau Prolog could not be loaded from local assets/vendor/tau-prolog/core.js. '+String(e)}); }
function stringifyError(e){try{return String(e && e.toString ? e.toString() : e);}catch(_){return 'Unknown Prolog error';}}
function consult(program, callback){
  if(typeof pl==='undefined'){postMessage({type:'error',message:'Tau Prolog is unavailable. The interpreter script did not load.'});return;}
  session=pl.create(1500);
  session.consult(program, {success:callback,error:e=>postMessage({type:'error',message:'Program error: '+stringifyError(e)})});
}
function query(goal, onSuccess){
  session.query(goal,{success:onSuccess,error:e=>postMessage({type:'error',message:'Query error: '+stringifyError(e)})});
}
function nextAnswer(){
  if(!session)return;
  session.answer({
    success:answer=>postMessage({type:'answer',text:session.format_answer(answer)}),
    fail:()=>postMessage({type:'end',text:'false.  (No more answers)'}),
    error:e=>postMessage({type:'error',message:'Execution error: '+stringifyError(e)}),
    limit:()=>postMessage({type:'limit',message:'Computation limit reached. Try a smaller query or check the recursive rule.'})
  });
}
function check(program,tests){
  if(typeof pl==='undefined'){postMessage({type:'error',message:'Interpreter unavailable'});return;}
  const outcomes=[];
  let i=0;
  function doOne(){
    if(i>=tests.length){postMessage({type:'checks',outcomes});return;}
    const t=tests[i++];const s=pl.create(1500);
    s.consult(program,{success:()=>s.query(t.query,{success:()=>s.answer({
      success:()=>{outcomes.push({name:t.name,ok:t.expected===true});doOne();},
      fail:()=>{outcomes.push({name:t.name,ok:t.expected===false});doOne();},
      error:e=>postMessage({type:'error',message:'Test error: '+stringifyError(e)}),
      limit:()=>postMessage({type:'limit',message:'Your program did not finish a test within the inference limit.'})
    }),error:e=>postMessage({type:'error',message:'Test query error: '+stringifyError(e)})}),error:e=>postMessage({type:'error',message:'Program error: '+stringifyError(e)})});
  }
  doOne();
}
onmessage=event=>{
  const m=event.data;
  if(m.action==='start')consult(m.program,()=>query(m.query,()=>{postMessage({type:'ready'});nextAnswer();}));
  else if(m.action==='next')nextAnswer();
  else if(m.action==='check')check(m.program,m.tests);
};
