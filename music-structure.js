// Audio-only model output. Authored reference times never enter this adapter or the planner.
const LABELS={intro:'イントロ',verse:'歌の節',chorus:'サビ候補',bridge:'ブリッジ',break:'間奏・休止',inst:'器楽部',solo:'ソロ',outro:'アウトロ',start:'曲の始まり',end:'曲の終わり'};
export function applyMusicStructure(analysis,structure){
 if(!structure?.segments?.length||!structure.beats?.length)throw Error('曲構造の解析結果がありません。');
 const segments=structure.segments.filter(s=>Number.isFinite(s.start)&&Number.isFinite(s.end)&&s.end>s.start&&s.start<analysis.duration).map(s=>({...s,start:Math.max(0,s.start),end:Math.min(analysis.duration,s.end)}));
 if(!segments.length)throw Error('曲構造の区間が曲の長さと一致しません。');
 const beats=structure.beats.filter(t=>Number.isFinite(t)&&t>=0&&t<analysis.duration).map(time=>({time,strength:analysis.beats.reduce((best,b)=>Math.abs(b.time-time)<Math.abs(best.time-time)?b:best,analysis.beats[0]).strength}));
 const periods=beats.slice(1).map((b,i)=>b.time-beats[i].time).filter(t=>t>.2&&t<1.5).sort((a,b)=>a-b),period=periods[Math.floor(periods.length/2)];
 if(!period)throw Error('曲構造の拍を読み取れませんでした。');
 const sections=segments.map((s,index)=>{const rows=analysis.energy.filter(e=>e.time>=s.start&&e.time<s.end),old=analysis.sections.find(p=>p.at<=s.start&&p.end>s.start)||analysis.sections[0];return{...old,index,at:s.start,end:s.end,role:s.label,label:LABELS[s.label]||s.label,level:rows.reduce((v,e)=>v+e.level,0)/Math.max(1,rows.length),rms:rows.reduce((v,e)=>v+e.rms,0)/Math.max(1,rows.length),motif:['intro','verse','chorus','bridge','break','inst','solo','outro','start','end'].indexOf(s.label)+1};});
 const chorusRuns=[];for(const s of sections){if(s.role!=='chorus')continue;const last=chorusRuns.at(-1);if(last&&Math.abs(last.end-s.at)<.02)last.end=s.end;else chorusRuns.push({at:s.at,end:s.end});}const chorus=chorusRuns.filter(c=>c.end-c.at>=4);
 const repeatAnalysis=structure.repeatAnalysis?{...structure.repeatAnalysis,heads:(structure.repeatAnalysis.heads||[]).filter(c=>Number.isFinite(c.at)&&Number.isFinite(c.similarity)&&chorus.some(run=>c.at>run.at&&c.at<run.end)).map(c=>({...c}))}:null;
 return{...analysis,repeatAnalysis,version:2,bpm:structure.bpm,period,beats,downbeats:structure.downbeats,sections,chorus,signalSections:analysis.sections,structure:{model:structure.model,elapsedSeconds:structure.elapsedSeconds,manualTimingUsed:false},method:analysis.method+'; audio-only '+structure.model+' structural labels and tracked beats. Chorus labels are model estimates, not verified lyrics or authored cues.'};
}
