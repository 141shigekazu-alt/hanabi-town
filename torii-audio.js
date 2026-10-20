import {TORII_SAMPLES} from './torii-samples.js?v=1.3.15';
export {TORII_SAMPLES};
export const isTorii=key=>typeof key==='string'&&Object.hasOwn(TORII_SAMPLES,key);
export const TORII_OPENINGS=Object.freeze({
  2:['Torii_V023'],3:['Torii_V024','Torii_V028'],5:['Torii_V031'],
  10:['Torii_Shaku_001','Torii_V011','Torii_V030','Torii_V032','Torii_V022_S1_07','Torii_V026_S1_06'],
  20:['Torii_2Shaku_001','Torii_V022','Torii_V026']
});
export const TORII_LAUNCHES=Object.freeze({
  2:['Torii_V002','Torii_V003','Torii_V004','Torii_V005','Torii_V006'],3:['Torii_V001','Torii_V024','Torii_V033'],
  5:['Torii_V001','Torii_V007','Torii_V033','Torii_V034'],
  10:['Torii_V029','Torii_V034'],20:['Torii_Launch_001','Torii_V025']
});
export const TORII_TORA=['Torii_V002','Torii_V003','Torii_V004','Torii_V005','Torii_V006'];
export const TORII_TAILS=['Torii_V009','Torii_V010'];
export function toriiSamples(key){
  const s=TORII_SAMPLES[key];if(!s)throw Error('Unknown recording: '+key);
  const raw=Uint8Array.from(atob(s.data),c=>c.charCodeAt(0)),v=new DataView(raw.buffer);
  const channels=Array.from({length:s.channels},()=>new Float32Array(s.frames)),data=new Float32Array(s.frames);
  for(let i=0;i<s.frames;i++)for(let c=0;c<s.channels;c++){
    const value=v.getInt16((i*s.channels+c)*2,true)/32768;channels[c][i]=value;data[i]+=value/s.channels;
  }
  return {data,channels,rate:s.rate,onset:s.onset};
}
