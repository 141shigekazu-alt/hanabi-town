import {analyzeMono} from './music-analysis-core.js';
self.onmessage=({data})=>{
 try{const result=analyzeMono(data.samples,data.sampleRate,value=>self.postMessage({progress:value}));self.postMessage({result});}
 catch(error){self.postMessage({error:error.message||'解析できませんでした。'});}
};
