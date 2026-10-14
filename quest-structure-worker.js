import * as ort from './vendor/ort/ort.webgpu.min.mjs';
import {LinkSeg,computeMelWindows,decode} from './vendor/linkseg/linkseg-web.js';
import {analyzeMono} from './music-analysis-core.js';
import {applyMusicStructure} from './music-structure.js';
import {phraseFeatures,detectPhraseReturns} from './quest-repeat-analysis.js';
ort.env.wasm.wasmPaths=new URL('./vendor/ort/',import.meta.url).href;
ort.env.wasm.numThreads=globalThis.crossOriginIsolated?Math.max(1,Math.min(3,navigator.hardwareConcurrency||1)):1;
const clock=()=>performance.now(),seconds=(a,b)=>+( (b-a)/1000 ).toFixed(3);
let model=null;
const status=(phase,progress)=>postMessage({phase,progress});
self.onmessage=async({data})=>{
 const start=clock(),timings={},audio=new Float32Array(data.samples);try{
  const rate=data.sampleRate;if(rate!==22050)throw Error('解析用の波形は22050Hzにしてください。');
  status('Quest内で拍と強弱を解析中…',.04);let tick=clock();const half=new Float32Array(Math.floor(audio.length/2));for(let i=0;i<half.length;i++)half[i]=(audio[i*2]+audio[i*2+1])*.5;
  const wave=analyzeMono(half,11025,p=>status('Quest内で拍と強弱を解析中…',.04+.18*p));timings.waveformSeconds=seconds(tick,clock());
  status('Quest内のAIモデルを準備中…',.23);tick=clock();if(!model)model=await LinkSeg.load({modelUrl:new URL('./models/linkseg_7c.onnx',import.meta.url).href,cacheKey:'hanabi-linkseg-7c-local-v1',backend:data.backend==='auto'&&/OculusBrowser|Quest/.test(navigator.userAgent)?'wasm':data.backend||'wasm'});timings.modelLoadSeconds=seconds(tick,clock());
  status('Quest内で曲構造の特徴を計算中…',.35);tick=clock();const win=await computeMelWindows({audio,sampleRate:rate,beats:wave.beats.map(b=>b.time)});timings.melSeconds=seconds(tick,clock());
  status('Quest内のAIでサビと曲構造を推定中…',.50);tick=clock();let activations,gpuFallback=null;
  try{activations=await model.runModel(win);}catch(e){if(model.backend!=='webgpu')throw e;gpuFallback=String(e);await model.session.release();model=await LinkSeg.load({modelUrl:new URL('./models/linkseg_7c.onnx',import.meta.url).href,cacheKey:'hanabi-linkseg-7c-local-v1',backend:'wasm'});activations=await model.runModel(win);}timings.inferenceSeconds=seconds(tick,clock());
  const labelCounts=Array(7).fill(0),labelMeans=Array(7).fill(0);let finite=true;
  for(let i=0;i<win.count;i++){let best=0;for(let c=0;c<7;c++){const v=activations.label[i*7+c];finite&&=Number.isFinite(v);labelMeans[c]+=v/win.count;if(v>activations.label[i*7+best])best=c;}labelCounts[best]++;}
  const activationDiagnostics={finite,labelCounts,labelMeans,labelLength:activations.label.length,boundLength:activations.bound.length,beatCount:win.count};
  tick=clock();const rawSections=decode(activations.bound,activations.label,win.beatTimes,wave.duration,{peakWindowSeconds:8,mergeRepeatedLabels:false});timings.decodeSeconds=seconds(tick,clock());
  const structure={model:'LinkSeg 7c ONNX · full mix, Quest-local beat grid',bpm:wave.bpm,beats:wave.beats.map(b=>b.time),downbeats:[],segments:rawSections.map(s=>({start:s.start,end:s.end,label:s.label.toLowerCase()})),manualTimingUsed:false};
  status('Quest内でサビの繰り返しを比較中…',.80);tick=clock();const features=phraseFeatures(half,11025,p=>status('Quest内で繰り返しの特徴を計算中…',.80+.15*p));structure.repeatAnalysis=detectPhraseReturns(features,structure);timings.repeatSeconds=seconds(tick,clock());
  structure.elapsedSeconds=seconds(start,clock());structure.inferenceLocation='browser';structure.backend=model.backend;structure.timings=timings;
  const analysis=applyMusicStructure(wave,structure);
  postMessage({result:{structure,analysis,rawSections,activationDiagnostics,backend:model.backend,gpuFallback,timings,workerTotalSeconds:structure.elapsedSeconds,estimatedBeatCount:win.count,manualTimingUsed:false}});
 }catch(error){postMessage({error:String(error),timings,workerElapsedSeconds:seconds(start,clock())});}
};
