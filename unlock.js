(function(){
'use strict';
var form=document.getElementById('unlockForm'),input=document.getElementById('password'),status=document.getElementById('status'),button=document.getElementById('unlock'),frame=document.getElementById('game'),audioUrl=null;
function bytes64(value){var s=atob(value),r=new Uint8Array(s.length);for(var i=0;i<s.length;i++)r[i]=s.charCodeAt(i);return r;}
document.getElementById('showPassword').onchange=function(){input.type=this.checked?'text':'password';};
form.onsubmit=async function(event){
 event.preventDefault();
 if(!window.crypto||!window.crypto.subtle||!window.TextEncoder||!window.TextDecoder){status.textContent='Этот браузер не поддерживает защищённый запуск. Обновите браузер телевизора или подключите ноутбук по HDMI.';return;}
 button.disabled=true;status.textContent='Открываем игру…';
 var plaintext=null,packageData=null;
 try{
  var response=await fetch('game.enc',{cache:'no-store'});
  if(!response.ok)throw new Error('download');
  var packed=new Uint8Array(await response.arrayBuffer());
  if(packed.length<45)throw new Error('download');
  var material=await crypto.subtle.importKey('raw',new TextEncoder().encode(input.value),{name:'PBKDF2'},false,['deriveKey']);
  var key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:packed.slice(0,16),iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
  plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:packed.slice(16,28),tagLength:128},key,packed.slice(28));
  packageData=JSON.parse(new TextDecoder().decode(plaintext));
  audioUrl=URL.createObjectURL(new Blob([bytes64(packageData.audio)],{type:'audio/mpeg'}));
  frame.srcdoc=packageData.html.replace("fetch('audio/subway-party.mp3')","fetch("+JSON.stringify(audioUrl)+")");
  input.value='';input.type='password';document.getElementById('showPassword').checked=false;
  document.getElementById('gate').style.display='none';document.getElementById('stage').style.display='block';status.textContent='';
 }catch(err){
  status.textContent=err.name==='OperationError'?'Пароль не подошёл или файл игры повреждён. Проверьте регистр букв и попробуйте снова.':'Не удалось открыть игру. Проверьте интернет и повторите попытку.';
 }finally{if(plaintext)new Uint8Array(plaintext).fill(0);packageData=null;button.disabled=false;}
};
document.getElementById('lock').onclick=function(){
 frame.srcdoc='';if(audioUrl){URL.revokeObjectURL(audioUrl);audioUrl=null;}
 document.getElementById('stage').style.display='none';document.getElementById('gate').style.display='flex';input.value='';input.focus();
};
})();
