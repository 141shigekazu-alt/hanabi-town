import {replaceRetiredPlan} from './retired-shells.js';
// A favorite is an immutable programme and its original audio, never a recipe to reroll.
const clone=value=>structuredClone(value);
export function captureProgramme({plan,trackId,title,identityTitle=null,original=false,offsetMs=0}){
 if(!plan||!Array.isArray(plan.shots)||!Array.isArray(plan.fans)||!(plan.duration>0))throw Error('音楽付きの構成を準備してから保存してください。');
 return {schema:1,trackId,title,...(identityTitle&&identityTitle!==title?{identityTitle}:{}),original,offsetMs:Number(offsetMs)||0,plan:clone(plan)};
}
function canonical(value){
 if(ArrayBuffer.isView(value))return {type:value.constructor.name,values:Array.from(value)};
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
 return value;
}
export async function hashBytes(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
export function programmeKey(snapshot){const copy=clone(snapshot);if(copy.identityTitle){copy.title=copy.identityTitle;delete copy.identityTitle;}return hashBytes(new TextEncoder().encode(JSON.stringify(canonical(copy))));}
export function favoriteName(s){return `${s.title}　${s.original?'オリジナル':'構成'+((s.plan.analysisSummary?.variation??0)+1)}　${s.plan.feelingLabel??(s.original?'手作り':'自動')}`;}
export function moveFavorite(ids,id,index){const next=ids.filter(value=>value!==id);if(!ids.includes(id))return [...ids];next.splice(Math.max(0,Math.min(next.length,index)),0,id);return next;}
export function orderedFavorites(items,view={}){
 const map=new Map(items.map(item=>[item.id,item]));
 return [...(view.order??[]).filter(id=>map.has(id)),...items.map(i=>i.id).filter(id=>!(view.order??[]).includes(id))].map(id=>({...map.get(id),checked:!(view.unchecked??[]).includes(id)}));
}
export class FavoriteRepository{
 constructor(name='hanabi-favorite-programmes-v1'){this.name=name;}
 open(){return new Promise((resolve,reject)=>{const q=indexedDB.open(this.name,1);q.onupgradeneeded=()=>{for(const name of ['programmes','audio','settings'])q.result.createObjectStore(name,{keyPath:'id'});};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}
 async read(store,id){const db=await this.open();try{return await new Promise((resolve,reject)=>{const q=db.transaction(store).objectStore(store).get(id);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}finally{db.close();}}
 async list(){
  const db=await this.open();let rows;
  try{rows=await new Promise((resolve,reject)=>{const tx=db.transaction(['programmes','settings']),a=tx.objectStore('programmes').getAll(),b=tx.objectStore('settings').get('view');tx.oncomplete=()=>resolve(orderedFavorites(a.result.filter(row=>!row.deletedAt),b.result));tx.onerror=()=>reject(tx.error);});}finally{db.close();}
  return Promise.all(rows.map(async row=>{const plan=replaceRetiredPlan(row.plan);if(plan===row.plan)return row;const playbackKey=await programmeKey(captureProgramme({...row,plan}));return {...row,plan,playbackKey};}));
 }
 async write(stores,action){const db=await this.open();try{await new Promise((resolve,reject)=>{const tx=db.transaction(stores,'readwrite');tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(tx.error??Error('保存を完了できませんでした。'));try{action(tx);}catch(e){tx.abort();reject(e);}});}finally{db.close();}}
 async save(snapshot,bytes){
  if(!(bytes instanceof ArrayBuffer)||!bytes.byteLength)throw Error('音源を保存できませんでした。USB接続中にもう一度お試しください。');
  const [key,audioId]=await Promise.all([programmeKey(snapshot),hashBytes(bytes)]),id='favorite:'+key;
  const equivalent=(await this.list()).find(row=>row.playbackKey===key);const existing=await this.read('programmes',equivalent?.id??id);if(existing){if(existing.deletedAt)await this.restore(id);return {...existing,deletedAt:null};}
  const view=await this.read('settings','view')??{id:'view',order:[],unchecked:[]};
  const item={...clone(snapshot),id,key,audioId,name:favoriteName(snapshot),savedAt:new Date().toISOString()};
  await this.write(['programmes','audio','settings'],tx=>{tx.objectStore('audio').put({id:audioId,bytes});tx.objectStore('programmes').put(item);tx.objectStore('settings').put({...view,order:[...view.order,id]});});
  const verified=await this.read('programmes',id);if(!verified)throw Error('保存結果を確認できませんでした。');return verified;
 }
 async setView(order,unchecked){await this.write(['settings'],tx=>tx.objectStore('settings').put({id:'view',order:[...order],unchecked:[...unchecked]}));}
 async rename(id,name){const item=await this.read('programmes',id);if(!item)throw Error('保存構成が見つかりません。');await this.write(['programmes'],tx=>tx.objectStore('programmes').put({...item,name:name.trim().slice(0,100)||item.name}));}
 async remove(id){const item=await this.read('programmes',id);if(item)await this.write(['programmes'],tx=>tx.objectStore('programmes').put({...item,deletedAt:new Date().toISOString()}));}
 async restore(id){const item=await this.read('programmes',id);if(item)await this.write(['programmes'],tx=>tx.objectStore('programmes').put({...item,deletedAt:null}));}
}
// Decode only the current song and one following song, rather than an entire festival.
export class FavoriteFestival{
 constructor(rows,load){this.rows=clone(rows);this.load=load;this.index=0;this.armed=true;this.phase='armed';this.gapRemaining=0;this.cancelled=false;this.pending=new Map();this.current=null;}
 get row(){return this.rows[this.index];}
 get hasNext(){return this.index+1<this.rows.length;}
 get label(){return `${this.index+1} / ${this.rows.length}曲目 · ${this.row?.title??''}`;}
 get(index){if(!this.pending.has(index))this.pending.set(index,Promise.resolve().then(()=>{if(this.cancelled)throw Error('大会を中止しました。');return this.load(this.rows[index]);}));return this.pending.get(index);}
 async prepare(){const current=await this.get(0);if(this.cancelled)return null;this.current=current;return current;}
 prefetch(){if(this.hasNext&&!this.cancelled)this.get(this.index+1).catch(()=>{});}
 finishTail(){if(this.cancelled||!this.hasNext)return false;this.phase='gap';this.gapRemaining=3;return true;}
 tickGap(dt){if(this.phase!=='gap'||this.cancelled)return false;this.gapRemaining=Math.max(0,this.gapRemaining-Math.max(0,dt));return this.gapRemaining<=1e-8;}
 async advance(){if(this.cancelled||!this.hasNext)return null;const index=this.index+1,next=await this.get(index);if(this.cancelled)return null;this.pending.delete(this.index);this.index=index;this.current=next;return next;}
 cancel(){this.cancelled=true;this.pending.clear();this.current=null;}
}
