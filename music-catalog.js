import {MUSIC_SHOWS} from './music-shows.js';

export let LOCAL_MUSIC_CATALOG=[];
let titles=new Map(),sourceTitles=new Map(),availableIds=null;
export const musicTrackIdentityTitle=(id,fallback)=>sourceTitles.get(id)??fallback;
export const musicTrackTitle=(id,fallback)=>titles.get(id)??fallback;
export function setLocalMusicCatalog(tracks){LOCAL_MUSIC_CATALOG=tracks.filter(t=>t.local&&!t.deleted);availableIds=new Set(tracks.filter(t=>!t.deleted).map(t=>t.id));titles=new Map(tracks.map(t=>[t.id,t.title]));sourceTitles=new Map(tracks.map(t=>[t.id,t.sourceTitle??t.title]));}
export const MUSIC_CATALOG=MUSIC_SHOWS.map(({plan,...track})=>({...track,authored:false}));

// Keep saved automatic tracks in the picker before their programme is prepared.
export function playableMusicChoices(generated){
 const choices=[...MUSIC_CATALOG.filter(t=>!availableIds||availableIds.has(t.id)),...LOCAL_MUSIC_CATALOG.filter(t=>!MUSIC_CATALOG.some(c=>c.id===t.id))].map(track=>generated?.id===track.id?generated:LOCAL_MUSIC_CATALOG.some(t=>t.id===track.id)?{...track,plan:null}:track);
 if(generated&&(generated.savedFavoriteId||!availableIds||availableIds.has(generated.id))&&!choices.some(track=>track.id===generated.id))choices.push(generated);
 return choices.map(track=>({...track,title:track.setlistTitle??musicTrackTitle(track.id,track.title)}));
}
