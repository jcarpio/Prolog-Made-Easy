/* Experimental Scryer Prolog WASM worker.
 * Official API pattern: import { init, Prolog } from 'scryer'; await init();
 * Version pinned at npm 0.7.0 via esm.sh for the browser-only prototype.
 * A fully offline production distribution should self-host the bundled JS + WASM.
 */
function describe(e){return e instanceof Error ? `${e.name}: ${e.message}\n${e.stack||''}` : String(e);}
function parseTerm(v){
  if(typeof v==='number') return v;
  if(v && typeof v==='object') {
    if(Number.isInteger(v.integer)) return v.integer;
    if(Array.isArray(v.list)) return v.list.map(parseTerm);
  }
  return null;
}
function parseSudoku(bindings){
 const rows=parseTerm(bindings?.Rows);
 return Array.isArray(rows)&&rows.length===9&&rows.every(r=>Array.isArray(r)&&r.length===9&&r.every(v=>Number.isInteger(v)&&v>=1&&v<=9))?rows:null;
}
self.onmessage=async({data})=>{
 try {
  self.postMessage({type:'status',message:'Loading Scryer Prolog…',detail:'Downloading WASM and JavaScript.'});
  const {init,Prolog}=await import('https://esm.sh/scryer@0.7.0');
  await init();
  self.postMessage({type:'status',message:'Executing your query…',detail:'Scryer WASM initialized.',kind:'ok'});
  const pl=new Prolog();
  pl.consultText(data.code);
  const answers=pl.query(data.query);
  const first=answers[Symbol.iterator]().next();
  if(first.done){self.postMessage({type:'fail'});return;}
  const binding=first.value?.bindings||{};
  const board=parseSudoku(binding);
  const pretty=board?board.map(row=>row.join(' ')).join('\n'):
     Object.keys(binding).length?JSON.stringify(binding,(_key,value)=>typeof value==='bigint'?value.toString():value,2):'true.';
  self.postMessage({type:'success',text:pretty,board});
 }catch(e){self.postMessage({type:'error',message:describe(e)});}
};
