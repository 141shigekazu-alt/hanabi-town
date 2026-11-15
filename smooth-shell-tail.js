export const layeredKiku=kind=>['core','double','triple','quad','penta'].includes(kind);
export const smoothRadial=kind=>['sunflower','petalflower','goldflower'].includes(kind);
export const smoothTrailCount=kind=>layeredKiku(kind)||smoothRadial(kind)?96:null;
export const layeredTailStep=size=>.006*(size===20?1.8:size===10?1.25:1);
export function tailLight(j,count,t,lag,ignition=0){return t>=lag+ignition?(j===0?2:.48*Math.exp(-j/27)*Math.min(1,Math.max(0,(t-lag-ignition)/.08))):0;}
