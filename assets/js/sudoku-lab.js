/* Prolog Made Easy · Sudoku Lab · Educational prototype */
const PUZZLE = [
[1,0,0,8,0,4,0,0,0],
[0,2,0,0,0,0,4,5,6],
[0,0,3,2,0,5,0,0,0],
[0,0,0,4,0,0,8,0,5],
[7,8,9,0,5,0,0,0,0],
[0,0,0,0,0,6,2,0,3],
[8,0,1,0,0,0,7,0,0],
[0,0,0,1,2,3,0,8,0],
[2,0,5,0,0,0,0,0,9]];
const REFERENCE = [
[1,5,6,8,9,4,3,2,7],[9,2,8,7,3,1,4,5,6],[4,7,3,2,6,5,9,1,8],
[3,6,2,4,1,7,8,9,5],[7,8,9,3,5,2,6,4,1],[5,1,4,9,8,6,2,7,3],
[8,3,1,5,4,9,7,6,2],[6,9,7,1,2,3,5,8,4],[2,4,5,6,7,8,1,3,9]];
const DEFAULT_CODE = `:- use_module(library(clpz)).
:- use_module(library(lists)).

% Markus Triska's public-domain Sudoku model,
% adapted to Scryer's library(clpz).
sudoku(Rows) :-
    length(Rows, 9),
    maplist(same_length(Rows), Rows),
    append(Rows, Cells),
    Cells ins 1..9,
    maplist(all_distinct, Rows),
    transpose(Rows, Columns),
    maplist(all_distinct, Columns),
    Rows = [A,B,C,D,E,F,G,H,I],
    blocks(A,B,C), blocks(D,E,F), blocks(G,H,I).

blocks([], [], []).
blocks([A,B,C|As], [D,E,F|Bs], [G,H,I|Cs]) :-
    all_distinct([A,B,C,D,E,F,G,H,I]),
    blocks(As, Bs, Cs).

problem(1, [
    [1,_,_,8,_,4,_,_,_],
    [_,2,_,_,_,_,4,5,6],
    [_,_,3,2,_,5,_,_,_],
    [_,_,_,4,_,_,8,_,5],
    [7,8,9,_,5,_,_,_,_],
    [_,_,_,_,_,6,2,_,3],
    [8,_,1,_,_,_,7,_,_],
    [_,_,_,1,2,3,_,8,_],
    [2,_,5,_,_,_,_,_,9]
]).`;
const DEFAULT_QUERY = 'problem(1, Rows), sudoku(Rows), maplist(labeling([ff]), Rows).';
const $ = (id)=>document.getElementById(id);
const program = $('program'),query = $('query'),status = $('lab-status'),output = $('output');
const run = $('run'),stop = $('stop'),reset=$('reset');
let worker=null, watchdog=null;
function render(board,id='puzzle-board') {
 const el=$(id);el.replaceChildren();
 board.forEach((row,r)=>row.forEach((v,c)=>{
   const square=document.createElement('div');
   square.className='sudoku-cell'+(PUZZLE[r][c]?' given':'')+(!PUZZLE[r][c]&&v?' solution':'');
   square.textContent=v||'·';square.setAttribute('role','gridcell');
   square.setAttribute('aria-label',`Row ${r+1}, column ${c+1}: ${v||'empty'}`);
   el.appendChild(square);
 }));
}
function setEngine(state,detail,kind=''){
 $('engine-state').textContent=state;$('engine-detail').textContent=detail;
 $('engine-dot').className='engine-dot '+kind;
}
function setBusy(isBusy){run.disabled=isBusy;stop.disabled=!isBusy;}
function halt(message){if(watchdog)clearTimeout(watchdog);watchdog=null;if(worker){worker.terminate();worker=null;}setBusy(false);if(message)status.textContent=message;}
function showResult(message){output.textContent=message;}
function resetAll(){halt();program.value=DEFAULT_CODE;query.value=DEFAULT_QUERY;showResult('Run a query to see the answer.');status.textContent='Ready to experiment.';setEngine('Engine not loaded yet','Press Run to initialize Scryer Prolog.');render(PUZZLE);}
function start(){
 halt();if(!window.Worker){status.textContent='Web Workers are not available in this browser.';return;}
 try{worker=new Worker('../assets/js/sudoku-worker.js',{type:'module'});}catch(e){status.textContent='Could not start the Scryer worker: '+e.message;return;}
 setBusy(true);showResult('Initializing WebAssembly...');status.textContent='Loading Scryer Prolog; first launch can take a little longer.';setEngine('Loading Scryer…','Fetching the experimental WASM package.');
 worker.onmessage=({data})=>{
  if(data.type==='status'){setEngine(data.message,data.detail||'',data.kind||'');return;}
  if(data.type==='success'){
    setEngine('Scryer Prolog ready','Query completed successfully.','ok');
    showResult(data.text||'true.');status.textContent='Success. The result above was computed by Scryer Prolog.';
    if(data.board){render(data.board);status.textContent='Solved! The grid shows values computed by Scryer Prolog.';}
    halt();return;
  }
  if(data.type==='fail'){showResult('false.\n\nNo solution satisfies the query and its constraints.');setEngine('Scryer Prolog ready','The query has no solutions.','ok');halt('The Prolog query failed (false).');return;}
  if(data.type==='error'){showResult(data.message);setEngine('Execution error','See the detailed message in the output.','bad');halt('Execution failed. See the error below.');return;}
 };
 worker.onerror=(e)=>{showResult(`Worker error: ${e.message||'Unknown error'}\n${e.filename||''}:${e.lineno||''}`);setEngine('Worker error','See the browser console for details.','bad');halt('Unable to run Scryer.');};
 worker.postMessage({code:program.value,query:query.value.trim()});
 watchdog=setTimeout(()=>{showResult('The execution limit was reached. The worker has been terminated.\nTry simplifying the puzzle or query.');setEngine('Stopped','Time limit reached.','bad');halt('Stopped after 20 seconds.');},20000);
}
run.addEventListener('click',start);
stop.addEventListener('click',()=>{halt('Stopped by the learner.');setEngine('Stopped','The Web Worker has been terminated.');});
reset.addEventListener('click',resetAll);
$('show-original').addEventListener('click',()=>render(PUZZLE));
$('show-solution').addEventListener('click',()=>{render(REFERENCE);status.textContent='Displaying the published reference solution, not a new Scryer execution.';});
document.querySelectorAll('[data-query]').forEach(button=>button.addEventListener('click',()=>{query.value=button.dataset.query;status.textContent='Query loaded. Press Run in Scryer.';document.querySelector('#lab').scrollIntoView({behavior:'smooth'});}));
const hero=$('hero-grid');for(let r=0;r<9;r++)for(let c=0;c<9;c++){const el=document.createElement('div');el.className='hero-cell';el.textContent=PUZZLE[r][c]||'';hero.appendChild(el);}
resetAll();
