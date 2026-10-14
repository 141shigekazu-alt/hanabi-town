// Evaluation/display only. This file is never imported by the analyzer or planner.
export const CHORUS_REFERENCE={
 'mou-ichido-dake':{basis:'1.2.28 手作り版の曲構成・本人の計測。静かなサビ182秒は区間メモ。全曲を厳密に注釈した正解データではありません。',targets:[{at:56.7,label:'最初のサビ',type:'chorus'},{at:125.8,label:'２回目のサビ',type:'chorus'},{at:182,label:'静かなサビ',type:'chorus'},{at:195.05,label:'大サビの爆発',type:'impact'}]},
 'pastel-parasite':{basis:'1.2.28 本人のストップウォッチ計測。138秒は大きな入りとして確定。全てのサビの時刻は未指定。',targets:[{at:138,label:'2:18の大爆発',type:'impact'},{at:18.2,label:'イントロ明けの一斉打ち',type:'other'}]},
 'hanabi-no-yoru':{basis:'本人の今回の鑑賞メモ。曲の変化を比較。サビ開始と確定した時刻ではありません。',targets:[15,25,35,53,74,104].map(at=>({at,label:at===104?'静かになる':'盛り上がり・変化',type:'change'}))},
 'natsu-no-nagori':{basis:'本人の今回の鑑賞メモ。28秒まで静か、55・69秒で変化、83・139秒で盛り上がり、165秒から静か。00219は2分19秒として解釈。サビと確定した時刻ではありません。',targets:[28,55,69,83,139,165].map(at=>({at,label:at===165?'静かになる':at===28?'静かな導入の終わり':at===83||at===139?'盛り上がり':'曲の変化',type:'change'}))}
};
export const timeLabel=t=>`${Math.floor(t/60)}:${(t%60).toFixed(2).padStart(5,'0')}`;
export function compareChorus(analysis,id){
 const reference=CHORUS_REFERENCE[id]||{basis:'この曲の手作り版の正解時刻はありません。',targets:[]};
 const starts=analysis.chorus?.map(s=>s.at)||[],boundaries=analysis.sections.filter(s=>s.at>=4).map(s=>s.at);
 const rows=reference.targets.map(target=>{const pool=target.type==='chorus'?starts:boundaries;const predicted=pool.length?pool.reduce((a,b)=>Math.abs(a-target.at)<Math.abs(b-target.at)?a:b):null;const signalBoundaries=analysis.signalSections?.filter(s=>s.at>=4).map(s=>s.at)||[];const signalPredicted=signalBoundaries.length?signalBoundaries.reduce((a,b)=>Math.abs(a-target.at)<Math.abs(b-target.at)?a:b):null;return{...target,predicted,signalPredicted,delta:predicted===null?null:+(predicted-target.at).toFixed(3),insideChorus:analysis.chorus?.some(s=>target.at>=s.at&&target.at<s.end)||false};});
 // One-to-one boundary matches only. Impact cues may be inside an already-started chorus.
 const truth=rows.filter(r=>r.type==='chorus'),available=new Set(starts),matches=[];
 const edges=truth.flatMap(r=>starts.map(at=>({truth:r.at,predicted:at,error:Math.abs(at-r.at)}))).sort((a,b)=>a.error-b.error),used=new Set();
 for(const edge of edges)if(edge.error<=2&&!used.has(edge.truth)&&available.has(edge.predicted)){matches.push(edge);used.add(edge.truth);available.delete(edge.predicted);}
 return{basis:reference.basis,starts,rows,scoredTargets:truth.length,withinHalfSecond:matches.filter(m=>m.error<=.5).length,withinTwoSeconds:matches.length,unmatchedTargets:truth.filter(r=>!used.has(r.at)).map(r=>r.at),matches,completeGroundTruth:false};
}
