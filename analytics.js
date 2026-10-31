// Basic consent: no Google script or requests before an explicit opt-in.
export const MEASUREMENT_ID='G-CCZWT6D5LF';
const KEY='hanabi-analytics-consent-v1';
const production=location.origin==='https://141shigekazu-alt.github.io'&&location.pathname.startsWith('/hanabi-town/');
let choice=null,started=false;
try{choice=localStorage.getItem(KEY);}catch{}
const permitted=()=>production&&choice==='granted'&&navigator.onLine!==false;
function command(){window.dataLayer.push(arguments);}
function start(){
 if(!permitted()||started)return;
 started=true;window.dataLayer=window.dataLayer||[];
 command('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
 command('consent','update',{analytics_storage:'granted'});
 command('js',new Date());
 let referrer='';try{referrer=new URL(document.referrer).origin;}catch{}
 command('config',MEASUREMENT_ID,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_path:'/hanabi-town/',page_referrer:referrer,page_location:location.origin+location.pathname,page_title:'花火街'});
 command('event','page_view',{send_to:MEASUREMENT_ID,page_location:location.origin+location.pathname,page_title:'花火街',page_referrer:referrer});
 const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+MEASUREMENT_ID;document.head.append(script);
}
export function trackUsage(name){
 try{
  if(!['mr_enter','vr_enter','show_start'].includes(name)||!permitted())return;
  start();command('event',name,{send_to:MEASUREMENT_ID,page_location:location.origin+location.pathname,page_title:'花火街',page_referrer:''});
 }catch{}
}
function setChoice(value){
 choice=value;try{localStorage.setItem(KEY,value);}catch{}
 window['ga-disable-'+MEASUREMENT_ID]=value!=='granted';
 if(value==='granted'){if(started)command('consent','update',{analytics_storage:'granted'});start();}
 else if(started){command('consent','update',{analytics_storage:'denied'});window.dataLayer.length=0;}
 if(value!=='granted'){
  for(const cookie of document.cookie.split(';')){const name=cookie.split('=')[0].trim();if(name==='_ga'||name.startsWith('_ga_'))document.cookie=name+'=; Max-Age=0; Path=/hanabi-town/; SameSite=Lax';}
 }
 document.getElementById('usageConsent').hidden=true;
 document.getElementById('usageSettings').textContent=value==='granted'?'アクセス解析：許可中（変更）':'アクセス解析：送信しない（変更）';
}
function mount(){
 const box=document.createElement('section');box.id='usageConsent';box.setAttribute('aria-label','アクセス解析の選択');box.hidden=choice==='granted'||choice==='denied';
 box.innerHTML='<strong>花火街の改善にご協力いただけますか？</strong><p>Google Analyticsで訪問・MR入場・開演などを集計します。許可するとCookieを使用し、利用情報をGoogleへ送信します。取り込んだ曲名・音源・音声入力は送りません。許可しなくても同じように遊べます。 <a href="privacy.html" target="_blank" rel="noopener">詳しく見る</a></p><div><button type="button" id="usageAllow">許可する</button><button type="button" id="usageDeny">送信しない</button></div>';
 const settings=document.createElement('button');settings.type='button';settings.id='usageSettings';settings.textContent=choice==='granted'?'アクセス解析：許可中（変更）':choice==='denied'?'アクセス解析：送信しない（変更）':'アクセス解析の設定';
 settings.onclick=()=>{box.hidden=!box.hidden;};document.body.append(box,settings);
 document.getElementById('usageAllow').onclick=()=>setChoice('granted');document.getElementById('usageDeny').onclick=()=>setChoice('denied');
 start();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
addEventListener('online',()=>{try{start();}catch{}});
addEventListener('storage',e=>{if(e.key===KEY){choice=e.newValue;window['ga-disable-'+MEASUREMENT_ID]=choice!=='granted';if(choice==='granted')start();else if(started)window.dataLayer.length=0;}});
