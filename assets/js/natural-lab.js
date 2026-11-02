/* Prolog Made Easy — local Tau Prolog integration (without Web Worker). */
(()=>{'use strict';
const missions=[
 {title:'Mission 1 — Ask the infinite counting machine',intro:'Start with the complete two-clause program. Ask if three is natural. Then change the query to natural(X). and click Next answer a few times. Infinity, one step at a time!',code:'% Zero is a natural number.\nnatural(0).\n\n% If N is natural, its successor is natural.\nnatural(s(N)) :- natural(N).',query:'natural(s(s(s(0)))).',challenge:'Can Prolog recognize the number four?',task:'Change the query to natural(s(s(s(s(0))))). and run it. Then click Check my solution to verify that your program recognizes 0, 2 and 4.',hint:'Count the s( wrappers. Four successors around 0 represent four.',tests:[{name:'Zero is natural',query:'natural(0).',expected:true},{name:'Two is natural',query:'natural(s(s(0))).',expected:true},{name:'Four is natural',query:'natural(s(s(s(s(0))))).',expected:true}]},
 {title:'Mission 2 — Fix the broken number machine',intro:'Oh no! Somebody deleted the recursive rule. Right now this program only knows that zero is natural. Can you repair it?',code:'% Our counting machine has a missing rule!\nnatural(0).\n\n% TODO: add the rule for the successor of N here.',query:'natural(s(s(0))).',challenge:'Restore the missing rule',task:'Write a rule that says: the successor of N is natural if N is natural. Check that 1, 2 and 3 work.',hint:'You need: natural(s(N)) :- natural(N).  Remember the final period!',tests:[{name:'One is natural',query:'natural(s(0)).',expected:true},{name:'Two is natural',query:'natural(s(s(0))).',expected:true},{name:'Three is natural',query:'natural(s(s(s(0)))).',expected:true}]},
 {title:'Mission 3 — Even numbers only, please!',intro:'Ready for a challenge? Write a new relation even/1. Zero is even, and jumping forward by two keeps you even. No loops, no arithmetic operators — only logic!',code:'% Define even/1 using two clauses.\n% TODO: fact: zero is even.\n% TODO: rule: if N is even, so is s(s(N)).',query:'even(s(s(0))).',challenge:'Build an even-number detector',task:'Make even(0), even(s(s(0))) and even(s(s(s(s(0))))) succeed, while even(s(0)) fails.',hint:'Try: even(0).  Then: even(s(s(N))) :- even(N).  The recursive step advances by two.',tests:[{name:'Zero is even',query:'even(0).',expected:true},{name:'Two is even',query:'even(s(s(0))).',expected:true},{name:'Four is even',query:'even(s(s(s(s(0))))).',expected:true},{name:'One is not even',query:'even(s(0)).',expected:false}]}
];

const $ = id => document.getElementById(id);
const program = $('program'), query = $('query'), output = $('output');
const status = $('status'), run = $('run'), next = $('next'), check = $('check');
const feedback = $('feedback'), hint = $('hint'), hintContent = $('hint-content');
const buttons = [...document.querySelectorAll('[data-mission]')];

let mission = 0;
let session = null;
let timeout = null;
let generation = 0;
let mode = null;
let numberAnswers = 0;
let busy = false;
let enginePromise = null;

function showMessage(message) { status.textContent = message; }
function setBusy(value) {
  busy = value;
  run.disabled = value;
  check.disabled = value;
  if (value) next.disabled = true;
}
function cancel() {
  generation += 1; // Invalidate all pending Tau Prolog callbacks.
  if (timeout) clearTimeout(timeout);
  timeout = null;
  session = null;
  mode = null;
  setBusy(false);
  next.disabled = true;
}
function errorString(e) {
  try { return String(e && e.toString ? e.toString() : e); }
  catch (_) { return 'Unknown interpreter error'; }
}
function showError(message, currentMode) {
  const detail = errorString(message);
  if (currentMode === 'check') {
    feedback.className = 'feedback bad';
    feedback.textContent = detail;
  } else {
    output.textContent += (output.textContent ? '\n' : '') + detail;
  }
  showMessage('Please check the error and try again.');
  cancel();
}

// Load locally hosted Tau Prolog in the MAIN DOCUMENT, not a Web Worker.
// Resolve relative to this script so it works from any chapter URL.
function loadEngine() {
  if (window.pl && typeof window.pl.create === 'function') return Promise.resolve(window.pl);
  if (enginePromise) return enginePromise;
  const scripts = [...document.scripts];
  const labScript = scripts.find(s => /(?:^|\/)natural-lab\.js(?:\?|$)/.test(s.src));
  if (!labScript) return Promise.reject(new Error('Could not locate natural-lab.js in this page.'));
  const src = new URL('../vendor/tau-prolog/core.js', labScript.src).href;
  enginePromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      if (window.pl && typeof window.pl.create === 'function') resolve(window.pl);
      else reject(new Error('Tau Prolog loaded, but pl.create is not available.'));
    };
    script.onerror = () => reject(new Error('Could not load local Tau Prolog: ' + src));
    document.head.appendChild(script);
  }).catch(e => { enginePromise = null; throw e; });
  return enginePromise;
}

function watchdog(token) {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => {
    if (token !== generation) return;
    showError('This query took too long. Check your recursion or try a simpler query. (5-second timeout.)', mode);
  }, 5000);
}
function finishAsync(token, callback) {
  return (...args) => {
    if (token !== generation) return;
    callback(...args);
  };
}
function setMission(index) {
  cancel();
  mission = index;
  const m = missions[index];
  program.value = m.code;
  query.value = m.query;
  output.textContent = 'Your answers will appear here.';
  feedback.textContent = '';
  feedback.className = 'feedback';
  $('mission-intro').textContent = m.intro;
  $('challenge-title').textContent = m.challenge;
  $('challenge-text').textContent = m.task;
  hintContent.textContent = m.hint;
  hintContent.hidden = true;
  hint.setAttribute('aria-expanded', 'false');
  hint.textContent = 'Show a hint';
  buttons.forEach((b, j) => {
    b.setAttribute('aria-selected', String(index === j));
    b.tabIndex = index === j ? 0 : -1;
  });
  showMessage('Ready. Change the program or query and give it a try!');
}
function answerNext(token) {
  if (token !== generation || !session) return;
  setBusy(true);
  showMessage('Searching for an answer…');
  watchdog(token);
  try {
    session.answer({
      success: finishAsync(token, answer => {
        clearTimeout(timeout);
        numberAnswers += 1;
        const formatted = session.format_answer(answer);
        output.textContent += (numberAnswers > 1 ? '\n' : '') + numberAnswers + '. ' + formatted;
        setBusy(false);
        next.disabled = numberAnswers >= 12;
        showMessage(numberAnswers >= 12 ? 'Showing the first 12 answers. Edit your query to explore more.' : 'Answer ' + numberAnswers + ' found. Click Next answer to continue.');
      }),
      fail: finishAsync(token, () => {
        output.textContent += (output.textContent ? '\n' : '') + 'false. (No more answers)';
        showMessage('No further answers.');
        cancel();
      }),
      error: finishAsync(token, e => showError('Execution error: ' + errorString(e), 'start')),
      limit: finishAsync(token, () => showError('Computation limit reached. Check the recursive rule or simplify the query.', 'start'))
    });
  } catch (e) { if (token === generation) showError('Execution error: ' + errorString(e), 'start'); }
}

async function start(action) {
  cancel();
  const token = generation;
  mode = action;
  numberAnswers = 0;
  setBusy(true);
  showMessage('Loading the local Prolog interpreter…');
  if (action === 'start') output.textContent = '';
  else { feedback.textContent = 'Checking your solution…'; feedback.className = 'feedback'; }
  watchdog(token);

  let plApi;
  try { plApi = await loadEngine(); }
  catch (e) { if (token === generation) showError(errorString(e), action); return; }
  if (token !== generation) return;
  const source = program.value;

  if (action === 'check') {
    const outcomes = [];
    const tests = missions[mission].tests;
    let index = 0;
    const checkOne = () => {
      if (token !== generation) return;
      if (index >= tests.length) {
        clearTimeout(timeout);
        const ok = outcomes.every(x => x.ok);
        feedback.className = 'feedback ' + (ok ? 'ok' : 'bad');
        feedback.textContent = (ok ? 'Brilliant! All checks passed!' : 'Not quite! Give it another try.') + '\n' + outcomes.map(x => (x.ok ? '✓ ' : '✗ ') + x.name).join('\n');
        showMessage(ok ? 'Mission complete!' : 'Your code ran. Some tests did not pass.');
        cancel();
        return;
      }
      const test = tests[index++];
      let testSession;
      try {
        testSession = plApi.create(1500);
        testSession.consult(source, {
          success: finishAsync(token, () => {
            testSession.query(test.query, {
              success: finishAsync(token, () => {
                testSession.answer({
                  success: finishAsync(token, () => { outcomes.push({name:test.name, ok:test.expected === true}); checkOne(); }),
                  fail: finishAsync(token, () => { outcomes.push({name:test.name, ok:test.expected === false}); checkOne(); }),
                  error: finishAsync(token, e => showError('Test error: ' + errorString(e), 'check')),
                  limit: finishAsync(token, () => showError('Your program exceeded the inference limit during a test.', 'check'))
                });
              }),
              error: finishAsync(token, e => showError('Test query error: ' + errorString(e), 'check'))
            });
          }),
          error: finishAsync(token, e => showError('Program error: ' + errorString(e), 'check'))
        });
      } catch (e) { showError('Test error: ' + errorString(e), 'check'); }
    };
    checkOne();
  } else {
    try {
      session = plApi.create(1500);
      session.consult(source, {
        success: finishAsync(token, () => {
          session.query(query.value.trim(), {
            success: finishAsync(token, () => { showMessage('Prolog is searching for answers…'); answerNext(token); }),
            error: finishAsync(token, e => showError('Query error: ' + errorString(e), 'start'))
          });
        }),
        error: finishAsync(token, e => showError('Program error: ' + errorString(e), 'start'))
      });
    } catch (e) { showError('Interpreter error: ' + errorString(e), 'start'); }
  }
}

run.addEventListener('click', () => start('start'));
next.addEventListener('click', () => { if (!session || numberAnswers >= 12 || busy) return; answerNext(generation); });
check.addEventListener('click', () => start('check'));
$('reset').addEventListener('click', () => setMission(mission));
hint.addEventListener('click', () => {
  const opening = hintContent.hidden;
  hintContent.hidden = !opening;
  hint.setAttribute('aria-expanded', String(opening));
  hint.textContent = opening ? 'Hide hint' : 'Show a hint';
});
buttons.forEach((button, i) => button.addEventListener('click', () => setMission(i)));
program.addEventListener('input', () => { cancel(); showMessage('Program changed. Run again to load the new code.'); });
query.addEventListener('input', () => { cancel(); showMessage('Query changed. Run again to ask the new question.'); });
setMission(0);
})();
