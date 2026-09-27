export function frameGeometry(width,height,edge,shape,padding){
 if(![width,height,edge].every(n=>Number.isFinite(n)&&n>0))throw new Error('Invalid dimensions');
 const w=shape==='portrait'?Math.round(edge*.75):edge,h=edge;
 const factor=(1-Math.min(.3,Math.max(0,padding)) *2)*(shape==='circle'?1/Math.sqrt(2):1);
 const scale=Math.min(w*factor/width,h*factor/height);
 return {w,h,drawW:width*scale,drawH:height*scale,x:(w-width*scale)/2,y:(h-height*scale)/2,scale};
}
