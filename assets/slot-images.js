/* Librium Saga image slot display + direct, exact-slot upload links.
   All uploads map to one predictable image filename. No credentials in this script. */
(function(){
  var current=document.currentScript;
  if(!current) return;
  var root=new URL("../",current.src);
  var figures=document.querySelectorAll("[data-slot]");
  figures.forEach(function(figure){
    var id=figure.getAttribute("data-slot");
    if(!/^[a-z0-9-]+$/.test(id))return;
    var file=new URL("assets/images/slots/"+id+".webp",root);
    var probe=new Image();
    probe.onload=function(){
      var img=figure.querySelector("img");
      if(!img){
        img=document.createElement("img");
        figure.prepend(img);
      }
      img.removeAttribute("hidden");
      img.onerror=null;
      img.onload=null;
      img.src=file.href;
      img.alt=figure.getAttribute("aria-label") || id.replace(/-/g," ");
      img.loading=(id==="home-hero"||id==="nations-overview-hero")?"eager":"lazy";
      img.decoding="async";
      figure.classList.add("image-filled");
      figure.querySelectorAll(".slot-upload-link").forEach(function(n){n.remove()});
    };
    probe.src=file.href;
    if(!figure.querySelector(".slot-upload-link")){
      var link=document.createElement("a");
      link.className="slot-upload-link";
      link.href=new URL("upload-images/?slot="+encodeURIComponent(id),root).href;
      link.textContent="Upload this image";
      link.setAttribute("aria-label","Upload image for "+id);
      figure.appendChild(link);
    }
  });
})();
