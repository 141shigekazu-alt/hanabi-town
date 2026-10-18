export const PANEL_BUILD_VERSION='1.3.5';
// Theme is a view preference, shared across versions; no show or library state.
export const PANEL_THEME_KEY='hanabi-town-panel-theme-v1';
export const PANEL_THEMES=[{value:'gold',label:'LANTERN & GOLD（ゴールド）'},{value:'cyber',label:'CYBER FESTIVAL（サイバー）'}];
const palettes={
 gold:{success:'#ade8cf',successSurface:'#17342e',successLine:'#6eb69e',example:'#849399',text:'#eee9dd',muted:'#b0babd',accent:'#dec18a',panel:['#142027f5','#101920f2','#141b20f0'],surface:'#1d2a31',line:'#8ba3ae45',edge:['#d9bc8690','#7a694b55','#d9bc8670'],primary:['#b49a60','#e2c88d','#d0ae69','#b99551','#d5b577'],primaryInk:'#221d16',primaryEdge:'#f3dab6b0',highlight:['#b68b4e','#eed4a0'],track:'#41505a',knob:'#f1dbaf',selected:'#b4955c25',selectedLine:'#d0ac6b90',selectedCard:['#302d29','#1c2a33'],hover:'#34434b',overlay:'#111c23fc',danger:'#edb7ac',dangerSurface:'#37252b',disabled:'#283138',disabledText:'#8c999e'},
 cyber:{success:'#a9ebe5',successSurface:'#19343f',successLine:'#69b9c3',example:'#9395ae',text:'#efeaf8',muted:'#bec0d2',accent:'#d7a3e8',panel:['#1a1830f5','#141a2bf2','#12212bf0'],surface:'#24273d',line:'#9eabe450',edge:['#e66cda','#a17de2','#61cef1'],primary:['#df79ca','#bb8ce1','#82c7ed'],primaryInk:'#20162b',primaryEdge:'#efb2f3bb',highlight:['#e479cf','#b99be9','#72ccef'],track:'#41455f',knob:'#ecd4f6',selected:'#a183d52b',selectedLine:'#b99be890',selectedCard:['#30273e','#263049'],hover:'#3a3d59',overlay:'#191d32fc',danger:'#efb6ce',dangerSurface:'#382638',disabled:'#2b2d40',disabledText:'#9699b0'}
};
let current='gold';try{const saved=globalThis.localStorage?.getItem(PANEL_THEME_KEY);if(Object.hasOwn(palettes,saved))current=saved;}catch{}
export const panelTheme=()=>palettes[current];
export const panelThemeId=()=>current;
export const panelBarColor=active=>active?(current==='cyber'?0x8bdbf3:0xffdfa1):0xf2f5f8;
export const panelPrimaryFill=(c,x,y,w,h)=>panelGradient(c,x,y,current==='gold'?0:w,current==='gold'?h:0,panelTheme().primary);
export const panelFont=(size,weight=300)=>`${weight} ${size}px "Hanabi UI", "Hiragino Sans", sans-serif`;
export function panelGradient(c,x,y,w,h,colors){const g=c.createLinearGradient(x,y,x+w,y+h);colors.forEach((color,i)=>g.addColorStop(i/(colors.length-1),color));return g;}
function applyDocument(){if(!globalThis.document)return;document.documentElement.dataset.panelTheme=current;const p=panelTheme(),vars={success:p.success,successSurface:p.successSurface,successLine:p.successLine,example:p.example,text:p.text,muted:p.muted,accent:p.accent,surface:p.surface,line:p.line,overlay:p.overlay,track:p.track,knob:p.knob,selected:p.selected,selectedLine:p.selectedLine,danger:p.danger,dangerSurface:p.dangerSurface,primaryInk:p.primaryInk,panel:`linear-gradient(145deg,${p.panel.join(',')})`,primary:`linear-gradient(${current==='gold'?'180':'105'}deg,${p.primary.join(',')})`,highlight:`linear-gradient(90deg,${p.highlight.join(',')})`};for(const [key,value]of Object.entries(vars))document.documentElement.style.setProperty('--panel-'+key,value);}
export function setPanelTheme(id,{persist=true}={}){if(!Object.hasOwn(palettes,id))return false;const changed=current!==id;current=id;applyDocument();if(persist)try{globalThis.localStorage?.setItem(PANEL_THEME_KEY,id);}catch{}return changed;}
applyDocument();
// One local variable font, including Japanese. Saved by the app's offline cache.
export const panelFontReady=globalThis.document?.fonts?document.fonts.load(panelFont(25),'花火街 お気に入り').then(()=>true).catch(()=>false):Promise.resolve(false);
