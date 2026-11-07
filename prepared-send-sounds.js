import {isPatternShell} from './pattern-shells.js';
import {isCreativeShell} from './creative-shells.js';
import {playLaunchSend as playPlayfulSend} from './launch-send-sound.js?v=1.3.25';
import {playRecordedSend} from './recorded-send-sound.js?v=1.3.25';
export function preparedSendFamily(shell){return isPatternShell(shell?.kind)||isCreativeShell(shell?.kind)?'playful':'recorded';}
export function playPreparedSend(context,destination,hand,shell){
 return preparedSendFamily(shell)==='playful'?playPlayfulSend(context,destination,hand):playRecordedSend(context,destination,hand);
}
