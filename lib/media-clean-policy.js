function clamp(v,min=0,max=1){return Math.max(min,Math.min(max,Number(v)||0));}

function rawNumber(obj,names){
  for(const name of names){
    const v=obj&&obj[name];
    if(v!==undefined&&v!==null&&Number.isFinite(Number(v)))return Number(v);
  }
  return null;
}

function normalizeScale(values){
  const max=Math.max(...values.map(v=>Math.abs(Number(v)||0)));
  if(max<=1.5)return 1;
  if(max<=100)return 100;
  return 1000;
}

function normalizeDetectedBox(input={}){
  const b=input.box||input.bbox||input.bounding_box||input;
  let x1=rawNumber(b,['xmin','x_min','x1','left']);
  let y1=rawNumber(b,['ymin','y_min','y1','top']);
  let x2=rawNumber(b,['xmax','x_max','x2','right']);
  let y2=rawNumber(b,['ymax','y_max','y2','bottom']);
  if([x1,y1,x2,y2].some(v=>v===null))return null;
  const scale=normalizeScale([x1,y1,x2,y2]);
  x1=clamp(x1/scale);y1=clamp(y1/scale);x2=clamp(x2/scale);y2=clamp(y2/scale);
  if(x2<x1)[x1,x2]=[x2,x1];
  if(y2<y1)[y1,y2]=[y2,y1];
  const width=x2-x1,height=y2-y1,area=width*height;
  if(width<0.008||height<0.008||area<0.00015)return null;
  return {x1,y1,x2,y2,width,height,area,label:String(input.label||input.name||''),score:Number(input.score||input.confidence||0)||0};
}

function overlaps(a,b,pad=0.015){
  return !(a.x2+pad<b.x1||b.x2+pad<a.x1||a.y2+pad<b.y1||b.y2+pad<a.y1);
}

function unionBoxes(a,b){
  const x1=Math.min(a.x1,b.x1),y1=Math.min(a.y1,b.y1),x2=Math.max(a.x2,b.x2),y2=Math.max(a.y2,b.y2);
  return {x1,y1,x2,y2,width:x2-x1,height:y2-y1,area:(x2-x1)*(y2-y1),label:[a.label,b.label].filter(Boolean).join('+'),score:Math.max(a.score||0,b.score||0)};
}

function mergeDetectedBoxes(items=[]){
  const boxes=items.map(normalizeDetectedBox).filter(Boolean);
  const out=[];
  for(const box of boxes){
    let merged=box;
    let changed=true;
    while(changed){
      changed=false;
      for(let i=0;i<out.length;i++){
        if(overlaps(merged,out[i])){
          merged=unionBoxes(merged,out[i]);
          out.splice(i,1);
          changed=true;
          break;
        }
      }
    }
    out.push(merged);
  }
  return out.filter(b=>b.area<0.65);
}

function cropOptionForBox(b,margin=0.025){
  const options=[];
  if(b.x1<=0.08)options.push({edge:'left',fraction:Math.min(0.24,b.x2+margin)});
  if(b.x2>=0.92)options.push({edge:'right',fraction:Math.min(0.24,1-b.x1+margin)});
  if(b.y1<=0.08)options.push({edge:'top',fraction:Math.min(0.24,b.y2+margin)});
  if(b.y2>=0.92)options.push({edge:'bottom',fraction:Math.min(0.24,1-b.y1+margin)});
  return options.filter(x=>x.fraction>=0.015&&x.fraction<=0.18).sort((a,b)=>a.fraction-b.fraction)[0]||null;
}

function chooseCleanupMethod(items=[]){
  const boxes=mergeDetectedBoxes(items);
  if(!boxes.length)return {method:'original',boxes:[]};
  const cropCandidates=boxes.map(cropOptionForBox).filter(Boolean).sort((a,b)=>a.fraction-b.fraction);
  const union=boxes.reduce((acc,b)=>acc?unionBoxes(acc,b):b,null);
  if(cropCandidates.length&&cropCandidates.length===boxes.length&&union.area<=0.16){
    return {method:'crop',boxes,crop:cropCandidates[0]};
  }
  return {method:'blur',boxes};
}

function expandBox(b,pad=0.018){
  const x1=clamp(b.x1-pad),y1=clamp(b.y1-pad),x2=clamp(b.x2+pad),y2=clamp(b.y2+pad);
  return {x1,y1,x2,y2,width:x2-x1,height:y2-y1,area:(x2-x1)*(y2-y1),label:b.label||'',score:b.score||0};
}

module.exports={clamp,normalizeDetectedBox,mergeDetectedBoxes,chooseCleanupMethod,expandBox};
