// Local signal analysis. No title, lyrics, or authored cue sheet enters this module.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mean=a=>a.reduce((s,x)=>s+x,0)/Math.max(1,a.length);
const percentile=(a,p)=>{const b=Array.from(a).sort((x,y)=>x-y);return b[Math.min(b.length-1,Math.floor(p*(b.length-1)))]??0;};
function fft(re,im){
 const n=re.length;
 for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[re[i],re[j]]=[re[j],re[i]];}}
 for(let len=2;len<=n;len<<=1){const a=-2*Math.PI/len,wr=Math.cos(a),wi=Math.sin(a);
  for(let i=0;i<n;i+=len){let r=1,m=0;for(let j=0;j<len/2;j++){const k=i+j,h=k+len/2,tr=r*re[h]-m*im[h],ti=r*im[h]+m*re[h];re[h]=re[k]-tr;im[h]=im[k]-ti;re[k]+=tr;im[k]+=ti;const next=r*wr-m*wi;m=r*wi+m*wr;r=next;}}
 }
}
function averageRange(a,lo,hi){let sum=0,n=0;for(let i=Math.max(0,lo);i<Math.min(a.length,hi);i++){sum+=a[i];n++;}return sum/Math.max(1,n);}
export function analyzeMono(samples,sampleRate,onProgress=()=>{}){
 if(!(samples instanceof Float32Array)||!Number.isFinite(sampleRate)||sampleRate<8000)throw Error('音源の波形を読み取れませんでした。');
 const duration=samples.length/sampleRate;if(duration<12||duration>600)throw Error('この試作では12秒〜10分の曲を選んでください。');
 const n=1024,hop=Math.round(sampleRate*.02),dt=hop/sampleRate,re=new Float64Array(n),im=new Float64Array(n),window=Float64Array.from({length:n},(_,i)=>.5-.5*Math.cos(2*Math.PI*i/(n-1)));
 const count=Math.ceil(samples.length/hop),rms=new Float32Array(count),flux=new Float32Array(count),centroid=new Float32Array(count),low=new Float32Array(count),high=new Float32Array(count),previous=new Float64Array(32);
 let peak=0,sumSq=0,seed=2166136261;
 for(let i=0;i<samples.length;i++){const x=Number.isFinite(samples[i])?samples[i]:0;peak=Math.max(peak,Math.abs(x));sumSq+=x*x;if(i%997===0)seed=Math.imul(seed^Math.round(x*32767),16777619)>>>0;}
 if(peak<1e-5||Math.sqrt(sumSq/samples.length)<1e-6)throw Error('ほぼ無音の音源です。別の曲を選んでください。');
 for(let f=0;f<count;f++){
  let sq=0;const start=f*hop;im.fill(0);
  for(let j=0;j<n;j++){const x=samples[start+j]??0;re[j]=x*window[j];sq+=x*x;}
  rms[f]=Math.sqrt(sq/n);fft(re,im);const bands=new Float64Array(32);let total=0,weighted=0,bass=0,treble=0;
  for(let k=1;k<n/2;k++){const mag=Math.hypot(re[k],im[k]),hz=k*sampleRate/n;total+=mag;weighted+=hz*mag;if(hz<250)bass+=mag;if(hz>2000)treble+=mag;const band=clamp(Math.floor(Math.log2(1+hz/45)*4),0,31);bands[band]+=mag;}
  centroid[f]=weighted/Math.max(1e-10,total);low[f]=bass/Math.max(1e-10,total);high[f]=treble/Math.max(1e-10,total);
  let change=0;for(let b=0;b<32;b++){const v=Math.log1p(bands[b]);change+=Math.max(0,v-previous[b]);previous[b]=v;}flux[f]=change;
  if(f%250===0)onProgress(.1+.65*f/count);
 }
 // Locally whiten attacks: a consistently loud master must not become one climax.
 const novelty=new Float32Array(count);for(let i=0;i<count;i++)novelty[i]=Math.max(0,flux[i]-averageRange(flux,i-12,i+13)*.85);
 const norm=percentile(novelty,.95)||1;for(let i=0;i<count;i++)novelty[i]=Math.min(4,novelty[i]/norm);
 const minLag=Math.round(60/180/dt),maxLag=Math.round(60/60/dt),corr=new Float64Array(maxLag+1);let bestLag=minLag,bestScore=-1;
 for(let lag=minLag;lag<=maxLag;lag++){let a=0,b=0,c=0;for(let i=lag;i<count;i++){a+=novelty[i]*novelty[i-lag];b+=novelty[i]**2;c+=novelty[i-lag]**2;}corr[lag]=a/Math.sqrt(Math.max(1e-10,b*c));}
 for(let lag=minLag;lag<=maxLag;lag++){const score=corr[lag]+.25*(corr[lag*2]??0)+.12*(corr[Math.round(lag/2)]??0);if(score>bestScore){bestScore=score;bestLag=lag;}}
 // Refine the quantised period against the whole track to prevent accumulated drift.
 const rough=bestLag*dt;let period=rough,phase=0,gridScore=-1;
 for(let step=-12;step<=12;step++){const candidate=rough+step*.00075;
  for(let offset=0;offset<candidate;offset+=dt){let score=0,beats=0;for(let t=offset;t<duration;t+=candidate){const i=Math.round(t/dt);score+=Math.max(novelty[i-1]??0,novelty[i]??0,novelty[i+1]??0);beats++;}score/=Math.max(1,beats);if(score>gridScore){gridScore=score;period=candidate;phase=offset;}}
 }
 const confidence=clamp((corr[bestLag]-mean(Array.from(corr).slice(minLag)))*4,0,1);
 const beats=[];for(let t=phase;t<duration;t+=period){let i=Math.round(t/dt),chosen=i;for(let j=i-3;j<=i+3;j++)if(j>=0&&j<count&&novelty[j]>novelty[chosen])chosen=j;const at=clamp(chosen*dt,0,duration);if(!beats.length||at-beats.at(-1).time>.18)beats.push({time:+at.toFixed(3),strength:+novelty[chosen].toFixed(3)});}
 onProgress(.82);
 const seconds=Math.ceil(duration),energy=[],features=[];const e10=percentile(rms,.10),e90=percentile(rms,.90),silence=peak*.0015;
 for(let t=0;t<seconds;t++){const lo=Math.floor(t/dt),hi=Math.floor((t+1)/dt),e=averageRange(rms,lo,hi),r=clamp((Math.log(e+1e-6)-Math.log(e10+1e-6))/Math.max(.25,Math.log(e90+1e-6)-Math.log(e10+1e-6)),0,1);
  energy.push({time:t,rms:+e.toFixed(6),level:e<silence?0:r});features.push([r,averageRange(low,lo,hi),averageRange(high,lo,hi),averageRange(novelty,lo,hi)]);
 }
 const changes=[];for(let t=4;t<seconds-4;t++){let score=0;for(let b=0;b<4;b++){const left=mean(features.slice(t-4,t).map(f=>f[b])),right=mean(features.slice(t,t+4).map(f=>f[b]));score+=Math.abs(left-right)*(b===0?1:b===3?.4:.7);}changes.push({time:t,score});}
 const snap=t=>{const nearby=beats.filter(b=>Math.abs(b.time-t)<.7);return nearby.sort((a,b)=>Math.abs(a.time-t)-Math.abs(b.time-t))[0]?.time??t;};
 const boundaries=[0],phrase=clamp(period*16,8,18);let cursor=phrase;
 while(cursor<duration-6){const options=changes.filter(x=>x.time>=cursor-3&&x.time<=cursor+3&&x.time>boundaries.at(-1)+7);options.sort((a,b)=>b.score-a.score);const chosen=options[0];const at=snap(chosen?.score>.24?chosen.time:cursor);if(at>boundaries.at(-1)+6)boundaries.push(at);cursor=at+phrase;}
 boundaries.push(duration);
 const sections=[];for(let i=0;i<boundaries.length-1;i++){const start=boundaries[i],end=boundaries[i+1],rows=energy.filter(e=>e.time>=start&&e.time<end),level=mean(rows.map(e=>e.level)),r=mean(rows.map(e=>e.rms)),descriptor=[level,...[1,2,3].map(b=>mean(features.slice(Math.floor(start),Math.ceil(end)).map(f=>f[b])))];
  let motif=i;for(const old of sections){const distance=descriptor.reduce((s,x,b)=>s+Math.abs(x-old.descriptor[b]),0);if(distance<.28&&i-old.index>1){motif=old.motif;break;}}
  sections.push({index:i,at:+start.toFixed(3),end:+end.toFixed(3),level,rms:r,descriptor,motif,label:level<.28?'静かな一節':level>.66?'盛り上がる一節':'広がる一節'});
 }
 let audibleEnd=duration;for(let i=count-1;i>=0;i--)if(rms[i]>Math.max(silence,peak*.003)){audibleEnd=Math.min(duration,(i+1)*dt);break;}
 onProgress(1);
 return {version:1,duration,seed,bpm:+(60/period).toFixed(2),period,beatConfidence:confidence,beats,energy,sections,audibleEnd,peak,method:'Local FFT spectral flux, tempo autocorrelation, whole-track beat grid, relative energy and timbre boundaries. Boundaries and repeated motifs are estimates; no lyrics or supplied cue sheets.'};
}
