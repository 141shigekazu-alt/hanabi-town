import {cue as baseCue,chapter} from './fireworks.js?v=20261005-beta1';
export const PROGRAM_NAMES={one:'プログラム1 · 一玉を味わう',two:'プログラム2 · 街の競演',random:'おまかせ'};
function randomStream(seed){let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
export function createProgram(mode='one',seed=1){
 if(!PROGRAM_NAMES[mode])mode='one';
 const random=randomStream(mode==='random'?seed:mode==='two'?202:101);
 const slots=mode==='two'?[35,75,185,225,250,270]:mode==='random'?[40+Math.floor(random()*12),185+Math.floor(random()*20),235+Math.floor(random()*16),270]:[45,200,250,270];
 return {mode,seed:mode==='random'?seed:mode==='two'?202:101,name:PROGRAM_NAMES[mode],slots,bigAt:130,senrinAt:[105,165]};
}
export function programCue(plan,time,index,lively=false){
 const c=baseCue(time,index,lively);if(!c)return null;
 const random=randomStream((plan.seed+Math.imul(index+1,2654435761))>>>0),part=chapter(time);
 if(plan.mode==='random'){
 const kinds=['core','double','willow','sunflower','spiral'];c.kind=kinds[Math.floor(random()*kinds.length)];
 c.size=part==='幕開け'?[3,3,5][Math.floor(random()*3)]:part==='一玉を味わう'?10:[3,5,5,10][Math.floor(random()*4)];
 if(c.kind==='double'&&c.size!==10)c.kind='core';
 c.interval*=.85+random()*.3;
 }else if(plan.mode==='two'){
 c.kind=['core','sunflower','willow','double','spiral','core'][index%6];
 if(c.kind==='double'&&c.size!==10)c.kind='core';
 if(part!=='一玉を味わう')c.interval*=.88;
 }
 const z=-.45+random()*.8;
 const x=plan.mode==='two'?(index%2===0?-.65:.65):-.8+random()*1.6;
 return {...c,position:{x,z}};
}
