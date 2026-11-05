/* Public image submissions via Netlify Forms. No account or repository credentials. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const form=$("artwork-form"),page=$("page"),slot=$("slot"),file=$("file"),publish=$("publish"),status=$("status"),preview=$("preview"),dest=$("destination"),openpage=$("openpage");
let slots=[],chosen=null,previewURL=null,busy=false;
function say(text,type){status.textContent=text;status.dataset.type=type||"";}
function groupName(p){return p==="/"?"Homepage":p.replace(/^\//,"").replace(/\/$/,"").replaceAll("/"," → ");}
function refresh(){publish.disabled=busy||!chosen||!file.files.length;}
function syncSlot(){
 chosen=slots.find(x=>x.id===slot.value)||null;
 $("slot-id").value=chosen?.id||"";
 $("page-path").value=chosen?.page||"";
 if(chosen){
  dest.textContent="Selected: "+chosen.purpose+"\nSlot ID: "+chosen.id+"\nPage: "+groupName(chosen.page);
  dest.style.whiteSpace="pre-line";
  openpage.href=new URL(".."+chosen.page,location.href).href;
  const url=new URL(location.href);url.searchParams.set("slot",chosen.id);history.replaceState(null,"",url.href);
 }else dest.textContent="Choose an image destination.";
 refresh();
}
function fillSlots(id){
 slot.innerHTML="";
 for(const x of slots.filter(x=>x.page===page.value)){
  const option=document.createElement("option");option.value=x.id;
  option.textContent=x.purpose+" — "+x.id;slot.append(option);
 }
 if(id&&slots.some(x=>x.id===id&&x.page===page.value))slot.value=id;
 syncSlot();
}
async function init(){
 try{
  const r=await fetch("../assets/IMAGE-SLOTS.json",{cache:"no-store"});
  if(!r.ok)throw Error("Image inventory unavailable");
  const data=await r.json();
  slots=(data.slots||[]).filter(x=>/^[a-z0-9-]+$/.test(x.id)&&typeof x.page==="string");
  const pages=[...new Set(slots.map(x=>x.page))];
  page.innerHTML="";
  for(const p of pages){const option=document.createElement("option");option.value=p;option.textContent=groupName(p);page.append(option);}
  const id=new URLSearchParams(location.search).get("slot");
  const selected=slots.find(x=>x.id===id);
  if(selected)page.value=selected.page;
  fillSlots(selected?.id||null);
 }catch(e){say("Cannot load the list of image destinations: "+e.message,"error");}
}
function onFile(){
 if(previewURL){URL.revokeObjectURL(previewURL);previewURL=null;}
 preview.style.display="none";
 const chosenFile=file.files[0];
 if(!chosenFile){refresh();return;}
 if(!chosenFile.type.startsWith("image/")&&!/\.(heic|heif|jpe?g|png|avif|webp)$/i.test(chosenFile.name)){
  say("Choose a photo or image file.","error");file.value="";refresh();return;
 }
 if(chosenFile.size>30*1024*1024){
  say("Please choose a smaller image (under 30 MB).","error");file.value="";refresh();return;
 }
 previewURL=URL.createObjectURL(chosenFile);preview.src=previewURL;preview.style.display="block";say("");refresh();
}
async function prepareImage(input){
 const limit=7*1024*1024;
 const name=(chosen?.id||"librium-artwork");
 /* iOS embedded browsers can preview JPEG while failing canvas WebP export.
    Accept the original JPEG first: no canvas conversion required. */
 if((input.type==="image/jpeg"||/\\.jpe?g$/i.test(input.name))&&input.size<limit){
   return new File([input],name+".jpg",{type:"image/jpeg"});
 }
 const url=URL.createObjectURL(input);
 try{
  const img=new Image();
  img.src=url;
  try{await img.decode()}catch{
   await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error("This browser cannot read the selected image."));});
  }
  if(!img.naturalWidth||!img.naturalHeight)throw Error("Image dimensions could not be read.");
  const max=img.naturalHeight>img.naturalWidth?1600:2400;
  const scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
  canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const ctx=canvas.getContext("2d");
  if(!ctx)throw Error("Image processing is unavailable in this browser.");
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
  ctx.drawImage(img,0,0,canvas.width,canvas.height);
  const encode=(mime,quality)=>new Promise(resolve=>{
    try{canvas.toBlob(blob=>resolve(blob),mime,quality);}
    catch{resolve(null);}
  });
  /* JPEG is reliably supported in iPhone webviews; never require WebP. */
  for(const quality of [0.88,0.76,0.62,0.48]){
   const blob=await encode("image/jpeg",quality);
   if(blob&&blob.type==="image/jpeg"&&blob.size<limit){
    return new File([blob],name+".jpg",{type:"image/jpeg"});
   }
  }
  /* Last resort for a modest-sized PNG or WebP when canvas export is blocked. */
  if(input.size<limit&&["image/png","image/webp","image/avif"].includes(input.type)){
   const extension={"image/png":"png","image/webp":"webp","image/avif":"avif"}[input.type];
   return new File([input],name+"."+extension,{type:input.type});
  }
  throw Error("This browser could not prepare the image. Try a smaller JPEG.");
 }finally{URL.revokeObjectURL(url);}
}
form.addEventListener("submit",async event=>{
 event.preventDefault();
 if(!chosen||!file.files[0]||busy)return;
 busy=true;refresh();
 try{
  say("Preparing artwork…");
  const prepared=await prepareImage(file.files[0]);
  const data=new FormData();
  data.append("form-name","librium-artwork");
  data.append("slot-id",chosen.id);
  data.append("page-path",chosen.page);
  data.append("bot-field","");
  data.append("artwork",prepared,prepared.name);
  say("Sending image to the Librium Saga submission inbox…");
  const r=await fetch("/upload-images/",{method:"POST",body:data,credentials:"same-origin",redirect:"follow"});
  if(r.status===404)throw Error("The site has not registered its upload form. Netlify site owner: open Forms, enable form detection, then redeploy. Until then, please send the artwork through ChatGPT instead.");
  if(!r.ok)throw Error("Netlify rejected this image submission (HTTP "+r.status+").");
  say("Submission request sent for "+chosen.purpose+". If Netlify Forms is enabled, the artwork will appear in its inbox; it is not yet published on the website.","success");
  form.reset();file.value="";preview.style.display="none";
  if(previewURL)URL.revokeObjectURL(previewURL);previewURL=null;
  syncSlot();
 }catch(e){say("Submission failed: "+e.message,"error");}
 finally{busy=false;refresh();}
});
page.addEventListener("change",()=>fillSlots(null));
slot.addEventListener("change",syncSlot);
file.addEventListener("change",onFile);
init();
})();