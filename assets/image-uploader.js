/* Librium Saga uploader. Browser-only token, GitHub REST Contents API.
   Do not store access tokens in repository, localStorage, cookies or URLs. */
(function(){
"use strict";
const OWNER="jonathanfrazier", REPO="Librium-Wars", BRANCH="main";
const $=id=>document.getElementById(id);
const page=$("page"),slot=$("slot"),file=$("file"),token=$("token"),publish=$("publish"),status=$("status"),preview=$("preview"),dest=$("destination"),openpage=$("openpage");
let slots=[],chosen=null,previewURL=null,busy=false;
function say(message,type){status.textContent=message;status.dataset.type=type||"";}
function groupName(path){return path==="/"?"Homepage":path.replace(/^\//,"").replace(/\/$/,"").replaceAll("/"," → ");}
function refreshButton(){publish.disabled=busy||!chosen||!file.files.length||!token.value.trim();}
function currentSlug(){return new URLSearchParams(location.search).get("slot");}
async function init(){
 try{
  const r=await fetch("../assets/IMAGE-SLOTS.json",{cache:"no-store"});
  if(!r.ok)throw new Error("Image inventory not available");
  const data=await r.json();
  slots=(data.slots||[]).filter(x=>/^[a-z0-9-]+$/.test(x.id)&&typeof x.page==="string");
  const groups=[...new Set(slots.map(x=>x.page))];
  page.innerHTML="";
  for(const path of groups){const opt=document.createElement("option");opt.value=path;opt.textContent=groupName(path);page.append(opt);}
  const id=currentSlug();
  const found=slots.find(x=>x.id===id);
  if(found)page.value=found.page;
  fillSlots(found?found.id:null);
 }catch(e){say("Could not load the image inventory: "+e.message,"error");page.innerHTML='<option>Unavailable</option>';}
}
function fillSlots(selected){
 slot.innerHTML="";
 const list=slots.filter(x=>x.page===page.value);
 for(const entry of list){
   const o=document.createElement("option");o.value=entry.id;
   o.textContent=entry.purpose+" — "+entry.id+(entry.status==="published"?" (existing)":"");
   slot.append(o);
 }
 if(selected&&list.some(x=>x.id===selected))slot.value=selected;
 updateDestination();
}
function updateDestination(){
 chosen=slots.find(x=>x.id===slot.value)||null;
 if(!chosen){dest.textContent="Choose a placement";openpage.href="../";refreshButton();return;}
 dest.textContent="Selected: "+chosen.purpose+"\nSlot ID: "+chosen.id+"\nPage: "+groupName(chosen.page);
 dest.style.whiteSpace="pre-line";
 openpage.href=new URL(".."+chosen.page,location.href).href;
 const url=new URL(location.href);url.searchParams.set("slot",chosen.id);history.replaceState(null,"",url.href);
 refreshButton();
}
function imagePreview(){
 if(previewURL)URL.revokeObjectURL(previewURL);
 previewURL=null;
 const f=file.files[0];
 if(!f){preview.style.display="none";refreshButton();return;}
 if(!f.type.startsWith("image/")){say("Please select an image file.","error");file.value="";preview.style.display="none";refreshButton();return;}
 if(f.size>30*1024*1024){say("Please use an image smaller than 30 MB.","error");file.value="";preview.style.display="none";refreshButton();return;}
 previewURL=URL.createObjectURL(f);preview.src=previewURL;preview.style.display="block";say("");refreshButton();
}
async function optimize(f){
 const url=URL.createObjectURL(f);
 try{
  const image=new Image();
  image.src=url;
  await image.decode();
  if(!image.naturalWidth||!image.naturalHeight)throw new Error("Could not decode this image. Try a PNG or JPEG.");
  const portrait=image.naturalHeight>image.naturalWidth;
  const limit=portrait?1600:2400;
  const scale=Math.min(1,limit/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
  canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Image editor could not start on this device.");
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
  ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Could not optimize this image.")),"image/webp",0.88));
  if(blob.type!=="image/webp")throw new Error("WebP is unavailable in this browser. Try the latest Safari or Chrome.");
  return blob;
 }finally{URL.revokeObjectURL(url);}
}
function base64(blob){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(",")[1]);
  reader.onerror=()=>reject(new Error("Could not read the selected image."));reader.readAsDataURL(blob);
 });
}
async function api(method,path,secret,body){
 const response=await fetch("https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/"+path,{
  method,headers:{"Accept":"application/vnd.github+json","Authorization":"Bearer "+secret,...(body?{"Content-Type":"application/json"}:{})},
  ...(body?{body:JSON.stringify(body)}:{})
 });
 const result=await response.json().catch(()=>({}));
 if(response.status===404&&method==="GET")return null;
 if(!response.ok)throw new Error(result.message||"GitHub "+response.status+" "+response.statusText);
 return result;
}
async function publishImage(){
 if(busy||!chosen||!file.files.length||!token.value.trim())return;
 const selected={...chosen},f=file.files[0],secret=token.value.trim();
 if(!confirm("Publish \""+f.name+"\" to:\n\n"+groupName(selected.page)+"\n"+selected.purpose+"\n\nExact slot: "+selected.id+"\n\nThis replaces any previous image in this slot."))return;
 busy=true;refreshButton();
 try{
  say("Preparing and optimizing your image…");
  const blob=await optimize(f);
  say("Uploading "+(blob.size/1024).toFixed(0)+" KB to GitHub…");
  const path="assets/images/slots/"+selected.id+".webp";
  const found=await api("GET",path,secret);
  const content=await base64(blob);
  const payload={message:"Publish image for "+selected.id,content,branch:BRANCH};
  if(found?.sha)payload.sha=found.sha;
  await api("PUT",path,secret,payload);
  say("Image uploaded to GitHub. Updating the image tracker…");
  let trackerWarning="";
  try{
   const entry=await api("GET","assets/IMAGE-SLOTS.json",secret);
   if(entry?.content&&entry?.sha){
    const decoded=atob(entry.content.replace(/\s/g,""));
    const bytes=Uint8Array.from(decoded,c=>c.charCodeAt(0));
    const registry=JSON.parse(new TextDecoder().decode(bytes));
    const target=(registry.slots||[]).find(x=>x.id===selected.id);
    if(target){
      target.assetPath=path;target.status="published";
      const encoded=await base64(new Blob([JSON.stringify(registry,null,2)+"\n"],{type:"application/json"}));
      await api("PUT","assets/IMAGE-SLOTS.json",secret,{message:"Mark "+selected.id+" image as published",content:encoded,sha:entry.sha,branch:BRANCH});
    }
   }
  }catch(e){trackerWarning=" The image uploaded, but the tracker update failed: "+e.message;}
  say("Published to GitHub for: "+selected.purpose+" ("+selected.id+"). Netlify will deploy this image automatically."+trackerWarning,"success");
  openpage.focus();
 }catch(e){
   const msg=e.message.includes("401")?"Authorization failed. Check your GitHub token.":e.message;
   say("Upload failed: "+msg,"error");
 }finally{busy=false;refreshButton();}
}
page.addEventListener("change",()=>fillSlots(null));
slot.addEventListener("change",updateDestination);
file.addEventListener("change",imagePreview);
token.addEventListener("input",refreshButton);
publish.addEventListener("click",publishImage);
window.addEventListener("beforeunload",()=>{if(previewURL)URL.revokeObjectURL(previewURL);});
init();
})();