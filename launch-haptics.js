// Feedback follows a successful prepared-shell send, never a raw trigger press.
export function pulseLaunch(source){
 if(!source||source.hand)return false;
 const actuator=source.gamepad?.hapticActuators?.find(a=>typeof a?.pulse==='function')??source.gamepad?.vibrationActuator;
 if(typeof actuator?.pulse!=='function')return false;
 try{actuator.pulse(.50,55)?.catch?.(()=>{});return true;}catch{return false;}
}
