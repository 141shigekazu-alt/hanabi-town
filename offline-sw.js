const VERSION='1.1.51',PREFIX='hanabi-town-offline-',CACHE=PREFIX+VERSION,BASE=new URL('./',self.location.href),MARKER=new URL('__offline_complete__',BASE).href;
const FILES=[{"path":"app.js","bytes":113138,"sha256":"5db49fc1977480b11147b33622703d95343117b54c28d91cd319fc405a7941fc"},{"path":"audio.js","bytes":28437,"sha256":"d98d6a1fc17515bc34d8f572bf1d07df63a32d225ebdecf3d41a49f57cb01370"},{"path":"boat-cruise.js","bytes":4733,"sha256":"a4f6d87385afb66e784a3bb30889b1d3c5dee46d3d29a9ab2a03d602a67fbbf3"},{"path":"bridge-view.js","bytes":7840,"sha256":"f9994ba8ac36e9af6b3fbc1d421ca86b2d3618b76506b84303b2565724f892ee"},{"path":"candy-big-stars.js","bytes":2077,"sha256":"d54de302f437b878daaf5e48507fde6924f885cd70a691ac245c0e32caaa9fcc"},{"path":"candy-colors.js","bytes":1237,"sha256":"284b0280247528fc12272a2d0f7de45fa40f5fc21258e7d2f6ffbbff516f4e9b"},{"path":"city-layout.js","bytes":108,"sha256":"9f1bddc4d4d9134ecebee5c6561eed8c46a3198573b8d28d2b45b71ac8de8896"},{"path":"comets.js","bytes":10592,"sha256":"b10e06c01f18ecf55b7205164f5f50211f2905998f02622fc0a74dc41dfd2eaf"},{"path":"entry-tip.js","bytes":2067,"sha256":"2f46110515c2e8cb048e77b3761e7fff337834cd39177ad9d8829f751832cbf6"},{"path":"firework-samples.js","bytes":7656572,"sha256":"91cefd6406414c7e3eaa10c00f1b56551fc379fa8bb3611cf3e55ce933f6a524"},{"path":"fireworks.js","bytes":8339,"sha256":"63bc9c068312088850b6f5952449a64ebf8873b196e18ba53397160315159cc2"},{"path":"golden-ears.js","bytes":3189,"sha256":"1cb34f1fac212798ed409a097711f56333e9752596b8a5b8379f1dc3ba33c115"},{"path":"index.html","bytes":16127,"sha256":"2a7bc7999f27bf69a23f0337846ddd66d603cf9f4d43440744f02f864e424327"},{"path":"mr-dimming.js","bytes":1054,"sha256":"ae27a403d265affbafd9d6e26976f9585ed4d4819011d5c5d26ccd96342c5dc9"},{"path":"mr-panel.js","bytes":22635,"sha256":"d710783cb1bb2f75ae7eeb2aedd8fa8404be1436c875e2d859ece6118f09163e"},{"path":"mr-test.js","bytes":2098,"sha256":"62a74909bc03b737d9721b73486d33c621059febd2b7533dfc9406fb888d9032"},{"path":"music-plan.js","bytes":37513,"sha256":"6ad9f4d8a1f173d1cd56aa4eeec556d096c00dc2a608ba7e11307827db3edb12"},{"path":"music-shows.js","bytes":872,"sha256":"b794b43f0078153de81cfa39f584bf83eb37667dc969843ec75c7e57f4567042"},{"path":"music-transport.js","bytes":2988,"sha256":"4eff037cc61ce1a9e0972286ebc5caf0ed80af03419cc1a1f63cb0644dc36611"},{"path":"natsu-nagori-plan.js","bytes":47271,"sha256":"43d5a59da2c43fb6f61845b11ef5bce9bf55b28052957944f9366c368ff9297d"},{"path":"offline.js","bytes":2891,"sha256":"dbb35aa45acfd6c412624cce6a4efbe9521aa3ae49dcaf277fcb6510d162465c"},{"path":"pastel-plan.js","bytes":117544,"sha256":"0facc14e956542d72c547393ffb28f182ec3251bec360adf4d7a68024a914503"},{"path":"programs.js","bytes":5972,"sha256":"2655e1f0a5dd25d31ca5ead242da19e295caed4f6bfdf919df0b4ef6a2a4d9ce"},{"path":"recorded-audio.js","bytes":8538,"sha256":"885786475cdfd5a31f2bf8c6137a8d8b3b2c15cb184da8f124769bb8884bb0f1"},{"path":"river-night.js","bytes":20350,"sha256":"1df26a9922f779708cff9115382a2cbacba0e957c607b4434568110c25cc2078"},{"path":"show-info.js","bytes":6941,"sha256":"f326a176ca4e4556e82aa7f71a12f37e86482a5dc2b1ae1dc6f4889976e03507"},{"path":"star-bundles.js","bytes":9155,"sha256":"5111e533ab0b576a782b27af6dedd195c960c227e4760f7fb1799385e0c8a4f0"},{"path":"style.css","bytes":6901,"sha256":"98bfc3713d2c548edf4fbc10a50064e607f3fd34f351508d57ae309c53b3341a"},{"path":"sunflower-motion.js","bytes":1243,"sha256":"2a839ead0be6f746990e93de5e66882a916046069640a060a1e56e10ace53171"},{"path":"tower-lighting.js","bytes":3545,"sha256":"405932ecc454ed32112298521db2695529e76393868c1dcc7d43bff6a9183aa1"},{"path":"trigger-embers.js","bytes":6266,"sha256":"c88315eca27dee17c9703675abb167a10ac3db9c0b525b6f4a6acb91b02e3298"},{"path":"vendor/three.module.js","bytes":1314681,"sha256":"ce1fa418de16a19495a9f72495580e3015d7745c296d3ce0485897f902ddedfb"},{"path":"water.js","bytes":3841,"sha256":"50c3280ddf59d38c611c28f224fd7a0b736b7a4cfd7683a819f41ae1c04c8714"},{"path":"wrist-menu.js","bytes":10624,"sha256":"ce584232b2217b24d5b450b45210c274119bf42e17cc5f4bfecf1a60b1700238"},{"path":"xr-controls.js","bytes":6954,"sha256":"57dec72ef27855a7aa7bcab57013727514c88f49e0ea9fe99e2e1068a055809b"},{"path":"パステル・パラサイト.wav","bytes":33675282,"sha256":"314be1209a2cb4f15ca790ed312916f58aa1bb7075ff8a8cf4fb5cd363bab5b9"},{"path":"夏の名残.wav","bytes":34566160,"sha256":"23251eab38bbc4b0e6ee15b4c38686a414c4bcfacfcfdd72f8bd53ab2c701c03"},{"path":"花火の夜.wav","bytes":22977040,"sha256":"c41db429440ef3937a0df6ec9dc8477e4ad2ad7b6821778414b6eefec71d036c"}];
let saving=null;
const urlFor=path=>new URL(path,BASE).href;
async function readyCache(){
 const keys=(await caches.keys()).filter(k=>k.startsWith(PREFIX)).sort((a,b)=>b.localeCompare(a,undefined,{numeric:true}));
 for(const name of [CACHE,...keys.filter(k=>k!==CACHE)]){if(!keys.includes(name))continue;const c=await caches.open(name),m=await c.match(MARKER);if(m){try{return {cache:c,...await m.json()};}catch{}}}
 return null;
}
async function state(){const saved=await readyCache();if(!saved)return {complete:false,version:VERSION};for(const path of saved.paths){if(!await saved.cache.match(urlFor(path)))return {complete:false,version:VERSION};}return {complete:true,version:saved.version,bytes:saved.bytes};}
async function save(port){
 const existing=await state();if(existing.complete&&existing.version===VERSION)return existing;
 await caches.delete(CACHE);const cache=await caches.open(CACHE);let bytes=0;
 try{
  for(let i=0;i<FILES.length;i++){
   const file=FILES[i],url=urlFor(file.path),response=await fetch(new Request(url,{cache:'no-store',credentials:'same-origin'}));
   if(!response.ok||response.type==='opaque')throw Error('ファイルを取得できません：'+file.path);
   const data=await response.clone().arrayBuffer();const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('');
   if(data.byteLength!==file.bytes||digest!==file.sha256)throw Error('公開版が更新中か、データが一致しません。少し待って保存し直してください。');
   await cache.put(url,response);bytes+=file.bytes;port.postMessage({type:'PROGRESS',done:i+1,total:FILES.length,percent:Math.round(bytes/FILES.reduce((n,f)=>n+f.bytes,0)*100)});
  }
  await cache.put(MARKER,new Response(JSON.stringify({version:VERSION,bytes,paths:FILES.map(f=>f.path)}),{headers:{'Content-Type':'application/json'}}));
  return {complete:true,version:VERSION,bytes};
 }catch(e){await caches.delete(CACHE);throw e;}
}
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{
 const port=event.ports[0];if(!port)return;
 event.waitUntil((async()=>{try{let result;if(event.data.type==='SAVE'){if(!saving)saving=save(port).finally(()=>{saving=null;});result=await saving;}else if(event.data.type==='STATUS')result=await state();else return;port.postMessage(result);}catch(e){port.postMessage({error:e.message});}})());
});
self.addEventListener('fetch',event=>{
 const request=event.request,u=new URL(request.url);if(request.method!=='GET'||u.origin!==BASE.origin||!u.pathname.startsWith(BASE.pathname))return;
 // The browser updates the worker independently; never supply a cached worker.
 if(u.pathname===new URL('offline-sw.js',BASE).pathname)return;
 const relative=decodeURIComponent(u.pathname.slice(BASE.pathname.length));
 // Version queries and excerpt/view queries share the same saved application.
 // Unknown files never fall back to the home page.
 const path=relative===''?'index.html':relative;
 if(!FILES.some(f=>f.path===path))return;
 event.respondWith((async()=>{const saved=await readyCache();if(saved){const response=await saved.cache.match(urlFor(path));if(response)return response;}return fetch(request);})());
});
