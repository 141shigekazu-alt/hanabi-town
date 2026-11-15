// A handheld AR-capable phone is still a flat browser for viewpoint buttons.
// Explicit MR entry remains separate; headset browsers retain immersive entry.
export function autoImmersiveView({userAgent='',mobile=false,platform='',maxTouchPoints=0,ar=false,vr=false}={}){
 if(!ar&&!vr)return false;
 const headset=/OculusBrowser|Quest|Wolvic/i.test(userAgent);
 const handheld=!headset&&(mobile||/Android|iPhone|iPad|iPod/i.test(userAgent)||platform==='MacIntel'&&maxTouchPoints>1);
 return !handheld;
}
