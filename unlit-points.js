// Keep the approved fragment output, blending, timing and size calculations.
// Only fragments with exactly zero RGB emission may stop hiding passthrough.
const enabled={value:true};
const installed=new WeakSet();
export function omitUnlitFragments(material,pendingChildAge=null){
 if(installed.has(material))return material;
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);
  if(pendingChildAge){
   shader.uniforms.hanabiChildAge=pendingChildAge;
   shader.vertexShader='attribute float hanabiChildAt;\nuniform float hanabiChildAge;\nvarying float hanabiKeepDark;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nhanabiKeepDark = ( hanabiChildAge >= 0.14 && hanabiChildAge < hanabiChildAt ) ? 1.0 : 0.0;');
   shader.fragmentShader='varying float hanabiKeepDark;\n'+shader.fragmentShader;
  }
  const end='#include <premultiplied_alpha_fragment>';
  if(!shader.fragmentShader.includes(end))throw Error('Unlit point shader hook missing');
  shader.uniforms.hanabiOmitUnlit=enabled;
  shader.fragmentShader='uniform bool hanabiOmitUnlit;\n'+shader.fragmentShader.replace(end,end+'\nif ( hanabiOmitUnlit && '+(pendingChildAge?'hanabiKeepDark < 0.5 && ':'')+'max( gl_FragColor.r, max( gl_FragColor.g, gl_FragColor.b ) ) <= 0.0 ) discard;');
 };
 material.customProgramCacheKey=()=>key+'|omit-unlit-v2'+(pendingChildAge?'|pending-senrin':'');
 installed.add(material);return material;
}
