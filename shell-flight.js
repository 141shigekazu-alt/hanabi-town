// Move the whole launch, not just its destination. A mirrored shell keeps the
// source's small natural lean and starts underneath its own opening position.
export function mirrorShellPosition(position={},startAt){
 const next={...position,x:-(position.x??0),startAt,voiceMirrorVersion:1};
 if(Number.isFinite(position.launchX))next.launchX=-position.launchX;
 return next;
}
// 1.2.85/86 voice-more shells mirrored x while retaining the old launchX.
// Repair only that known signature, in memory. Stored favourites/setlists stay
// byte-for-byte intact; a later replay applies the same deterministic repair.
export function repairLegacyVoiceShot(shot){
 if(shot.group!=='voice-more'||shot.position?.voiceMirrorVersion>=1)return shot;
 const position={...shot.position,voiceMirrorVersion:1};
 if(Number.isFinite(position.launchX))position.launchX=-position.launchX;
 return {...shot,position};
}
export function repairLegacyVoicePlan(plan){
 if(!Array.isArray(plan?.shots))return plan;
 let changed=false;const shots=plan.shots.map(s=>{const next=repairLegacyVoiceShot(s);changed||=next!==s;return next;});
 return changed?{...plan,shots}:plan;
}
