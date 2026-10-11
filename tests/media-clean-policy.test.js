const test=require('node:test');
const assert=require('node:assert/strict');
const {normalizeDetectedBox,mergeDetectedBoxes,chooseCleanupMethod,expandBox}=require('../lib/media-clean-policy');

test('normalizes logo boxes from common coordinate scales',()=>{
  assert.deepEqual(
    Object.fromEntries(Object.entries(normalizeDetectedBox({box:{xmin:0.02,ymin:0.03,xmax:0.18,ymax:0.14}})).filter(([k])=>['x1','y1','x2','y2'].includes(k))),
    {x1:0.02,y1:0.03,x2:0.18,y2:0.14}
  );
  const pct=normalizeDetectedBox({box:{xmin:2,ymin:3,xmax:18,ymax:14}});
  assert.ok(Math.abs(pct.x2-0.18)<1e-9);
  const thousand=normalizeDetectedBox({box:{xmin:20,ymin:30,xmax:180,ymax:140}});
  assert.ok(Math.abs(thousand.x2-0.18)<1e-9);
});

test('chooses crop for a small edge logo and blur for a central watermark',()=>{
  const edge=chooseCleanupMethod([{box:{xmin:0.01,ymin:0.04,xmax:0.12,ymax:0.14}}]);
  assert.equal(edge.method,'crop');
  assert.equal(edge.crop.edge,'left');
  const center=chooseCleanupMethod([{box:{xmin:0.35,ymin:0.35,xmax:0.64,ymax:0.53}}]);
  assert.equal(center.method,'blur');
});

test('merges nearby detections and expands the protected area',()=>{
  const boxes=mergeDetectedBoxes([
    {box:{xmin:0.02,ymin:0.03,xmax:0.10,ymax:0.12}},
    {box:{xmin:0.09,ymin:0.04,xmax:0.17,ymax:0.12}}
  ]);
  assert.equal(boxes.length,1);
  const expanded=expandBox(boxes[0]);
  assert.ok(expanded.x1<=boxes[0].x1);
  assert.ok(expanded.x2>=boxes[0].x2);
});
