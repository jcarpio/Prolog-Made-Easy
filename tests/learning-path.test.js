import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters, prefix, canAccess, complete, mergeProgress } from '../assets/js/course-model.js';
test('new learners can only open the first chapter, including direct URLs',()=>{
 assert.equal(canAccess([],chapters[0].id),true);
 for(const c of chapters.slice(1))assert.equal(canAccess([],c.id),false);
 assert.equal(canAccess([],'unknown'),false);
});
test('completion unlocks exactly one next chapter and permits review',()=>{
 let done=[];
 for(let i=0;i<chapters.length;i++){
  if(i+1<chapters.length)assert.throws(()=>complete(done,chapters[i+1].id));
  done=complete(done,chapters[i].id);
  assert.equal(done.length,i+1);
  assert.deepEqual(complete(done,chapters[i].id),done);
  for(let j=0;j<=i;j++)assert.equal(canAccess(done,chapters[j].id),true);
 }
});
test('malformed or discontinuous browser progress does not bypass prerequisites',()=>{
 assert.deepEqual(prefix(null),[]);
 assert.deepEqual(prefix([chapters[2].id]),[]);
 assert.deepEqual(prefix([chapters[0].id,chapters[3].id]),[chapters[0].id]);
});
test('merging device progress retains the longest contiguous path in either order',()=>{
 const a=chapters.slice(0,1).map(c=>c.id), b=chapters.slice(0,4).map(c=>c.id);
 assert.deepEqual(mergeProgress(a,b),b);assert.deepEqual(mergeProgress(b,a),b);
});
