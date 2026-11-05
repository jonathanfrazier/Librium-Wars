/* Librium Saga — OAuth-backed image uploader. No personal tokens pasted into the website. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const page=$("page"),slot=$("slot"),file=$("file"),publish=$("publish"),status=$("status"),preview=$("preview"),dest=$("destination"),openpage=$("openpage");
const signin=$("github-signin"),signout=$("github-signout"),authmsg=$("auth-state");
let slots=[],chosen=null,previewURL=null,busy=false,authenticated=false,configured=false;
function say(msg,type){status.textContent=msg;status.dataset.type=type||"";}
function groupName(path){return path==="/"?"Homepage":path.replace(/^\//,"").replace(/\/$/,"").replaceAll("/"," → ");}
function refreshButton(){publish.disabled=busy||!authenticated||!chosen||!file.files.length;}
function currentSlot(){return new URLSearchParams(location.search).get("slot");}
async function checkLogin(){
 try{
  const r=await fetch("/.netlify/functions/librium-status",{credentials:"same-origin",cache:"no-store"});
  if(!r.ok)throw Error("Sign-in service is not available yet");
  const data=await r.json();configured=!!data.configured;authenticated=!!data.authenticated;
  if(authenticated){authmsg.textContent="Signed in as "+data.login+". You can publish images.";signin.hidden=true;signout.hidden=false;}
  else if(configured){authmsg.textContent="Sign in with GitHub to publish your artwork.";signin.hidden=false;signout.hidden=true;}
  else{authmsg.textContent="GitHub sign-in needs one-time owner setup in Netlify before it can be used.";signin.hidden=true;signout.hidden=true;$("setup-info").hidden=false;}
 }catch(e){authmsg.textContent=e.message;signin.hidden=true;signout.hidden=true;$("setup-info").hidden=false;}
 refreshButton();
 const auth=new URLSearchParams(location.search).get("auth");
 if(auth==="failed")say("GitHub sign-in could not be completed. Please try again.","error");
 if(auth==="denied")say("You declined GitHub authorization.","error");
 if(auth==="setup")say("The site owner must complete the one-time sign-in setup.","error");
}
async function init(){
 try{
  const r=await fetch("../assets/IMAGE-SLOTS.json",{cache:"no-store"});if(!r.ok)throw Error("Image inventory not available.");
  const data=await r.json();
  slots=(data.slots||[]).filter(x=>/^[a-z0-9-]+$/.test(x.id)&&typeof x.page==="string");
  page.innerHTML="";
  for(const path of [...new Set(slots.map(x=>x.page))]){
   const opt=document.createElement("option");opt.value=path;opt.textContent=groupName(path);page.append(opt);
  }
  const found=slots.find(x=>x.id===currentSlot());
  if(found)page.value=found.page;
  fillSlots(found?.id);
 }catch(e){say("Could not load image slots: "+e.message,"error");}
 await checkLogin();
}
function fillSlots(id){
 slot.innerHTML="";
 for(const entry of slots.filter(x=>x.page===page.value)){
  const option=document.createElement("option");option.value=entry.id;
  option.textContent=entry.purpose+" — "+entry.id+(entry.status==="published"?" (existing)":"");slot.append(option);
 }
 if(id&&slots.some(x=>x.id===id&&x.page===page.value))slot.value=id;
 updateDestination();
}
function updateDestination(){
 chosen=slots.find(x=>x.id===slot.value)||null;
 if(chosen){
  dest.textContent="Selected: "+chosen.purpose+"\nImage ID: "+chosen.id+"\nPage: "+groupName(chosen.page);
  dest.style.whiteSpace="pre-line";
  openpage.href=new URL(".."+chosen.page,location.href).href;
  const url=new URL(location.href);url.searchParams.set("slot",chosen.id);url.searchParams.delete("auth");history.replaceState(null,"",url.href);
 }else dest.textContent="Choose an image position.";
 refreshButton();
}
function imagePreview(){
 if(previewURL)URL.revokeObjectURL(previewURL);previewURL=null;
 const f=file.files[0];preview.style.display="none";
 if(!f){refreshButton();return}
 if(!f.type.startsWith("image/")&&!/\.(heic|heif|jpg|jpeg|png|avif|webp)$/i.test(f.name)){say("Please select an image file.","error");file.value="";refreshButton();return}
 if(f.size>30*1024*1024){say("Choose an image smaller than 30 MB.","error");file.value="";refreshButton();return}
 previewURL=URL.createObjectURL(f);preview.src=previewURL;preview.style.display="block";say("");refreshButton();
}
async function optimize(f){
 const u=URL.createObjectURL(f);
 try{
  const img=new Image();img.src=u;await img.decode();
  const portrait=img.naturalHeight>img.naturalWidth;
  let width,height,max=portrait?1600:2400;
  const scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
  width=Math.round(img.naturalWidth*scale);height=Math.round(img.naturalHeight*scale);
  const cv=document.createElement("canvas");cv.width=width;cv.height=height;
  const ctx=cv.getContext("2d");if(!ctx)throw Error("Unable to process image on this device.");
  ctx.imageSmoothingQuality="high";ctx.drawImage(img,0,0,width,height);
  for(const quality of [0.88,0.8,0.7]){
   const blob=await new Promise((resolve,reject)=>cv.toBlob(resolve,"image/webp",quality));
   if(!blob)throw Error("Unable to encode image.");
   if(blob.type!=="image/webp")throw Error("Your browser does not support WebP image output.");
   if(blob.size<3.8*1024*1024)return blob;
  }
  throw Error("The image is too large even after optimization. Please use a smaller image.");
 }finally{URL.revokeObjectURL(u);}
}
async function encode(blob){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(",")[1]);
  reader.onerror=()=>reject(Error("Failed to read image."));reader.readAsDataURL(blob);
 });
}
async function upload(){
 if(busy||!authenticated||!chosen||!file.files[0])return;
 const place={...chosen},chosenFile=file.files[0];
 if(!confirm('Upload "'+chosenFile.name+'" to\n'+groupName(place.page)+'\n'+place.purpose+'?\n\nThis replaces existing artwork at that location.'))return;
 busy=true;refreshButton();
 try{
  say("Preparing image…");
  const optimized=await optimize(chosenFile);
  say("Uploading directly to the selected image position…");
  const base64=await encode(optimized);
  const r=await fetch("/.netlify/functions/librium-upload",{
   method:"POST",credentials:"same-origin",
   headers:{"content-type":"application/json","x-librium-upload":"yes"},
   body:JSON.stringify({slotId:place.id,content:base64})
  });
  const result=await r.json().catch(()=>({}));
  if(!r.ok||!result.success)throw Error(result.error||"Upload did not complete");
  say("Published to GitHub! Image: "+place.purpose+"\nPage: "+groupName(place.page)+"\nNetlify will deploy the new artwork automatically."+(result.tracked?"":" Note: The image was saved, but the tracker may need refreshing."),"success");
 }catch(err){
  say("Upload failed: "+err.message,"error");
  if(/sign in|expired/i.test(err.message)){authenticated=false;checkLogin();}
 }finally{busy=false;refreshButton();}
}
signin.addEventListener("click",()=>{const u="/.netlify/functions/librium-login"+(chosen?"?slot="+encodeURIComponent(chosen.id):"");location.href=u;});
signout.addEventListener("click",async()=>{
 try{await fetch("/.netlify/functions/librium-logout",{method:"POST",credentials:"same-origin"});authenticated=false;await checkLogin();}catch(e){say(e.message,"error");}
});
page.addEventListener("change",()=>fillSlots(null));
slot.addEventListener("change",updateDestination);
file.addEventListener("change",imagePreview);
publish.addEventListener("click",upload);
window.addEventListener("beforeunload",()=>{if(previewURL)URL.revokeObjectURL(previewURL);});
init();
})();
