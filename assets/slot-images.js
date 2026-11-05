/* Librium Saga: subtle, exact-target image uploader shortcuts.
   No upload credentials stored on the public site. */
(function(){
  "use strict";
  var script=document.currentScript;
  if(!script)return;
  var root=new URL("../",script.src);
  function enhance(figure){
    if(figure.dataset.uploadReady==="yes")return;
    var id=figure.getAttribute("data-slot");
    if(!id||!/^[a-z0-9-]+$/.test(id))return;
    figure.dataset.uploadReady="yes";
    var href=new URL("upload-images/?slot="+encodeURIComponent(id),root).href;
    var existing=figure.querySelector(".slot-upload-link");
    var link=existing||document.createElement("a");
    link.className="slot-upload-link";
    link.href=href;
    link.setAttribute("aria-label","Upload or replace image: "+id.replace(/-/g," "));
    link.title="Upload image to this exact location";
    link.innerHTML='<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4m0 0-4 4m4-4 4 4"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg>';
    if(!existing)figure.appendChild(link);
    /* The complete empty preview is a target, not just the icon. */
    figure.classList.add("slot-can-upload");
    var fileURL=new URL("assets/images/slots/"+id+".webp",root);
    var probe=new Image();
    probe.onload=function(){
      if(!figure.isConnected)return;
      var img=figure.querySelector("img");
      if(!img){img=document.createElement("img");figure.insertBefore(img,figure.firstChild);}
      img.hidden=false;img.removeAttribute("hidden");
      img.onerror=null;img.onload=null;
      img.src=fileURL.href;
      img.alt=figure.getAttribute("aria-label")||id.replace(/-/g," ");
      img.loading=(id==="home-hero"||id==="nations-overview-hero")?"eager":"lazy";
      img.decoding="async";
      figure.classList.add("image-filled");
      figure.classList.remove("slot-can-upload");
    };
    probe.onerror=function(){ /* Keep upload icon on unfilled slots. */ };
    probe.src=fileURL.href;
  }
  function scan(){document.querySelectorAll("[data-slot]").forEach(enhance);}
  scan();
  /* Character Vault cards are constructed after the registry loads. */
  document.addEventListener("librium:slots-updated",scan);
})();
