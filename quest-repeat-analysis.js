// Browser-only phrase returns. No song title, reference timings or Mac results.
const median=a=>{const b=[...a].sort((x,y)=>x-y);return b.length?(b[Math.floor((b.length-1)/2)]+b[Math.ceil((b.length-1)/2)])/2:0;};
function fft(re,im){const n=re.length;for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[re[i],re[j]]=[re[j],re[i]];}}
 for(let len=2;len<=n;len*=2){const a=-2*Math.PI/len,wr=Math.cos(a),wi=Math.sin(a);for(let i=0;i<n;i+=len){let r=1,m=0;for(let j=0;j<len/2;j++){const k=i+j,h=k+len/2,tr=r*re[h]-m*im[h],ti=r*im[h]+m*re[h];re[h]=re[k]-tr;im[h]=im[k]-ti;re[k]+=tr;im[k]+=ti;const next=r*wr-m*wi;m=r*wi+m*wr;r=next;}}}}
function hzToMel(hz){return hz<1000?hz/(200/3):15+Math.log(hz/1000)/(Math.log(6.4)/27);}
function melToHz(m){return m<15?m*(200/3):1000*Math.exp((m-15)*Math.log(6.4)/27);}
export function phraseFeatures(audio,rate=11025,progress=()=>{}){
 const n=2048,hop=256,count=1+Math.floor(audio.length/hop),re=new Float64Array(n),im=new Float64Array(n),chroma=Array.from({length:12},()=>new Float32Array(count)),mfcc=Array.from({length:12},()=>new Float32Array(count));
 const melPoints=Array.from({length:42},(_,i)=>melToHz(hzToMel(rate/2)*i/41));
 const filters=Array.from({length:40},(_,m)=>{const weights=[];for(let k=0;k<=n/2;k++){const hz=k*rate/n,w=Math.max(0,Math.min((hz-melPoints[m])/(melPoints[m+1]-melPoints[m]),(melPoints[m+2]-hz)/(melPoints[m+2]-melPoints[m+1])))*2/(melPoints[m+2]-melPoints[m]);if(w)weights.push([k,w]);}return weights;});
 const bins=Array.from({length:n/2+1},(_,k)=>{if(!k)return null;const midi=69+12*Math.log2(k*rate/n/440),pc=((midi%12)+12)%12;return [Math.floor(pc),pc%1];});
 const power=new Float64Array(n/2+1),mel=new Float64Array(40);let globalMel=1e-10;
 for(let f=0;f<count;f++){
  im.fill(0);for(let j=0;j<n;j++){let p=f*hop+j-n/2;if(p<0)p=-p;if(p>=audio.length)p=Math.max(0,2*audio.length-2-p);re[j]=(audio[p]??0)*(.5-.5*Math.cos(2*Math.PI*j/n));}fft(re,im);
  for(let k=0;k<=n/2;k++)power[k]=re[k]*re[k]+im[k]*im[k];
  let cmax=1e-10;for(let k=1;k<=n/2;k++){const [pc,d]=bins[k];chroma[pc][f]+=power[k]*(1-d);chroma[(pc+1)%12][f]+=power[k]*d;}
  for(let c=0;c<12;c++)cmax=Math.max(cmax,chroma[c][f]);for(let c=0;c<12;c++)chroma[c][f]/=cmax;
  for(let m=0;m<40;m++){let x=0;for(const [k,w] of filters[m])x+=power[k]*w;mel[m]=10*Math.log10(Math.max(1e-10,x));globalMel=Math.max(globalMel,mel[m]);}
  for(let c=1;c<=12;c++){let x=0;for(let m=0;m<40;m++)x+=mel[m]*Math.cos(Math.PI/40*(m+.5)*c);mfcc[c-1][f]=x*Math.sqrt(2/40);}
  if(f%500===0)progress(f/count);
 }
 for(const row of mfcc){let mean=0;for(const x of row)mean+=x;mean/=count;let sq=0;for(const x of row)sq+=(x-mean)**2;const sd=Math.sqrt(sq/count)+1e-6;for(let i=0;i<count;i++)row[i]=(row[i]-mean)/sd;}
 return {chroma,mfcc,rate,hop,count};
}
function sequence(at,window,rows,features){const result=new Float32Array(rows.length*64);for(let r=0;r<rows.length;r++){const row=rows[r];let sum=0;for(let i=0;i<64;i++){const p=(at+window*i/64)*features.rate/features.hop,lo=Math.min(row.length-1,Math.max(0,Math.floor(p))),hi=Math.min(row.length-1,lo+1),v=row[lo]+(row[hi]-row[lo])*(p-lo);result[r*64+i]=v;sum+=v;}for(let i=0;i<64;i++)result[r*64+i]-=sum/64;}return result;}
function cosine(a,b){let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}return dot/Math.sqrt(Math.max(1e-9,aa*bb));}
export function detectPhraseReturns(features,structure){
 const runs=[];for(const s of structure.segments){if(s.label!=='chorus')continue;if(runs.length&&Math.abs(runs.at(-1).end-s.start)<.02)runs.at(-1).end=s.end;else runs.push({at:s.start,end:s.end});}
 const gaps=structure.beats.slice(1).map((x,i)=>x-structure.beats[i]).filter(x=>x>.2&&x<1.5),period=median(gaps),window=period*16;
 const result={method:'browser-audio-phrase-return-v1: chroma/MFCC sequence comparison on locally detected beats',manualTimingUsed:false,heads:[],windowSeconds:window,candidateGrid:'all locally estimated beats (downbeat phase unavailable)',candidateDiagnostics:[]};
 if(!period||!runs.length)return result;
 const templates=runs.filter(r=>r.end-r.at>=window).map(r=>{const at=structure.beats.find(b=>b>=r.at)??r.at;return{at,c:sequence(at,window,features.chroma,features),m:sequence(at,window,features.mfcc,features)};});result.referenceAnchor='first local beat at or after the model boundary; LinkSeg boundaries fall between beats';if(!templates.length)return result;
 for(const run of runs){const candidates=[];for(const at of structure.beats){if(at<run.at+period*12||at+window>run.end+.3)continue;const c=sequence(at,window,features.chroma,features),m=sequence(at,window,features.mfcc,features);let best=-Infinity,ref=null;for(const t of templates){const score=.75*cosine(c,t.c)+.25*cosine(m,t.m);if(score>best){best=score;ref=t.at;}}candidates.push({at,similarity:best,referenceAt:ref});}
  const values=candidates.map(c=>c.similarity),mid=median(values),threshold=Math.max(.30,mid+3*median(values.map(x=>Math.abs(x-mid))));
  result.candidateDiagnostics.push({runAt:run.at,threshold,top:[...candidates].sort((a,b)=>b.similarity-a.similarity).slice(0,8)});
  const accepted=candidates.filter((c,i)=>{const nearby=candidates.slice(Math.max(0,i-3),i).concat(candidates.slice(i+1,i+4));const shoulders=[candidates[i-4],candidates[i+4]].filter(Boolean);return c.similarity>=threshold&&!nearby.some(n=>n.similarity>=c.similarity)&&c.similarity-Math.max(...shoulders.map(n=>n.similarity),mid)>=.12;}).sort((a,b)=>b.similarity-a.similarity);
  const selected=[];for(const c of accepted){if(selected.some(s=>Math.abs(s.at-c.at)<period*12))continue;selected.push({...c,similarity:+c.similarity.toFixed(4),runAt:run.at,end:run.end,basis:'audio-sequence-return'});}result.heads.push(...selected);
 }
 result.heads.sort((a,b)=>a.at-b.at);return result;
}
