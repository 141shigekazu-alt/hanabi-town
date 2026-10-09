const VERSION='1.1.37',PREFIX='hanabi-town-offline-',CACHE=PREFIX+VERSION,BASE=new URL('./',self.location.href),MARKER=new URL('__offline_complete__',BASE).href;
const FILES=[{"path": "app.js", "bytes": 105868, "sha256": "72637755dc4b6d81e112bdeac04476af33d8fa6fcbcfa3d5c7cae545af9f4d9f"}, {"path": "audio.js", "bytes": 14799, "sha256": "0e92a8dee2cd8adab1d31baff120ec1db0a63360ec7c8a723d2c58df7abd710b"}, {"path": "boat-cruise.js", "bytes": 4354, "sha256": "597b17124ef124247d14f887f0f769e3e75c45ffe61d59495b6160310a7cf1e6"}, {"path": "bridge-view.js", "bytes": 7640, "sha256": "3e597f6c214fcfe34d6a66cf8af93b2d9faddde63c5962485461b3cac6fff14d"}, {"path": "candy-big-stars.js", "bytes": 2077, "sha256": "d54de302f437b878daaf5e48507fde6924f885cd70a691ac245c0e32caaa9fcc"}, {"path": "candy-colors.js", "bytes": 1237, "sha256": "284b0280247528fc12272a2d0f7de45fa40f5fc21258e7d2f6ffbbff516f4e9b"}, {"path": "city-layout.js", "bytes": 1612, "sha256": "b5dfa1648db1b6be13933ff858867bbe3b630e4f498889d35cacb66986a2fc1b"}, {"path": "comets.js", "bytes": 10592, "sha256": "b10e06c01f18ecf55b7205164f5f50211f2905998f02622fc0a74dc41dfd2eaf"}, {"path": "entry-tip.js", "bytes": 2067, "sha256": "2f46110515c2e8cb048e77b3761e7fff337834cd39177ad9d8829f751832cbf6"}, {"path": "fireworks.js", "bytes": 8339, "sha256": "1f24f9fa6b70028f98b3531440c422238950211f3d5bbb4d48464ad409fd61a0"}, {"path": "golden-ears.js", "bytes": 3189, "sha256": "1cb34f1fac212798ed409a097711f56333e9752596b8a5b8379f1dc3ba33c115"}, {"path": "index.html", "bytes": 14927, "sha256": "2b2473c75ebaf1b5ec81dd11c5554ce0f2526103f7babbbc29eef72350699381"}, {"path": "mr-dimming.js", "bytes": 1054, "sha256": "ae27a403d265affbafd9d6e26976f9585ed4d4819011d5c5d26ccd96342c5dc9"}, {"path": "mr-panel.js", "bytes": 22190, "sha256": "0ce1a2f6aa0966d51e03b23ea6b96397189b30e1cbc19f0e65edb7292f707efd"}, {"path": "mr-test.js", "bytes": 2098, "sha256": "62a74909bc03b737d9721b73486d33c621059febd2b7533dfc9406fb888d9032"}, {"path": "music-plan.js", "bytes": 37513, "sha256": "6ad9f4d8a1f173d1cd56aa4eeec556d096c00dc2a608ba7e11307827db3edb12"}, {"path": "music-shows.js", "bytes": 872, "sha256": "b794b43f0078153de81cfa39f584bf83eb37667dc969843ec75c7e57f4567042"}, {"path": "music-transport.js", "bytes": 2917, "sha256": "8d6c9c8ab1e3ea5670f25a9e4d574012cdfbab339bb16b563ddc78edaede4485"}, {"path": "natsu-nagori-plan.js", "bytes": 47271, "sha256": "43d5a59da2c43fb6f61845b11ef5bce9bf55b28052957944f9366c368ff9297d"}, {"path": "offline.js", "bytes": 2891, "sha256": "82576fe39e8cf3bf8bf906fdea7a0cc69febb64af2bee2fe6a9e3955f0d6d557"}, {"path": "pastel-plan.js", "bytes": 117544, "sha256": "0facc14e956542d72c547393ffb28f182ec3251bec360adf4d7a68024a914503"}, {"path": "programs.js", "bytes": 5972, "sha256": "2655e1f0a5dd25d31ca5ead242da19e295caed4f6bfdf919df0b4ef6a2a4d9ce"}, {"path": "river-night.js", "bytes": 20239, "sha256": "0c55d728f29aa33516c66b3aa1074e10b059c44ae5593684ff94ac130769d022"}, {"path": "show-info.js", "bytes": 6941, "sha256": "f326a176ca4e4556e82aa7f71a12f37e86482a5dc2b1ae1dc6f4889976e03507"}, {"path": "star-bundles.js", "bytes": 9155, "sha256": "5111e533ab0b576a782b27af6dedd195c960c227e4760f7fb1799385e0c8a4f0"}, {"path": "style.css", "bytes": 6304, "sha256": "e8590e48d087d97b9c3d438b2e08ec39793a32ed21a576d9583062ca8aa13e3c"}, {"path": "sunflower-motion.js", "bytes": 1243, "sha256": "2a839ead0be6f746990e93de5e66882a916046069640a060a1e56e10ace53171"}, {"path": "tower-lighting.js", "bytes": 3545, "sha256": "405932ecc454ed32112298521db2695529e76393868c1dcc7d43bff6a9183aa1"}, {"path": "trigger-embers.js", "bytes": 6266, "sha256": "c88315eca27dee17c9703675abb167a10ac3db9c0b525b6f4a6acb91b02e3298"}, {"path": "vendor/three.module.js", "bytes": 1314681, "sha256": "ce1fa418de16a19495a9f72495580e3015d7745c296d3ce0485897f902ddedfb"}, {"path": "water.js", "bytes": 3841, "sha256": "50c3280ddf59d38c611c28f224fd7a0b736b7a4cfd7683a819f41ae1c04c8714"}, {"path": "wrist-menu.js", "bytes": 10624, "sha256": "ce584232b2217b24d5b450b45210c274119bf42e17cc5f4bfecf1a60b1700238"}, {"path": "xr-controls.js", "bytes": 6954, "sha256": "57dec72ef27855a7aa7bcab57013727514c88f49e0ea9fe99e2e1068a055809b"}, {"path": "パステル・パラサイト.wav", "bytes": 33675282, "sha256": "314be1209a2cb4f15ca790ed312916f58aa1bb7075ff8a8cf4fb5cd363bab5b9"}, {"path": "夏の名残.wav", "bytes": 34566160, "sha256": "23251eab38bbc4b0e6ee15b4c38686a414c4bcfacfcfdd72f8bd53ab2c701c03"}, {"path": "花火の夜.wav", "bytes": 22977040, "sha256": "c41db429440ef3937a0df6ec9dc8477e4ad2ad7b6821778414b6eefec71d036c"}];
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
