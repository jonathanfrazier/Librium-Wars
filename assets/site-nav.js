/* Shared site navigation, powered by the URL of this script so links work from every page depth. */
(function(){
  var current=document.currentScript;
  if(!current)return;
  var root=new URL('../',current.src);
  var sections=[
    ['Home',''],
    ['Nations','nations/'],
    ['Nine Ages','ages/'],
    ['Religions','religions/'],
    ['Social Orders','social-orders/'],
    ['Characters','characters/']
  ];
  function link(item){
    var a=document.createElement('a');
    a.href=new URL(item[1],root).href;
    a.textContent=item[0];
    var path=window.location.pathname;
    var resolved=new URL(item[1],root).pathname;
    if(item[1]===''?path===resolved:path.startsWith(resolved))a.setAttribute('aria-current','page');
    return a;
  }
  var nav=document.createElement('nav');
  nav.className='ls-global-nav';
  nav.setAttribute('aria-label','Main site navigation');
  var inner=document.createElement('div');inner.className='ls-nav-inner';
  var brand=document.createElement('a');brand.className='ls-nav-brand';brand.href=root.href;brand.textContent='LIBRIUM SAGA';
  inner.appendChild(brand);
  var desktop=document.createElement('div');desktop.className='ls-nav-links';
  sections.forEach(function(item){desktop.appendChild(link(item));});
  inner.appendChild(desktop);
  var upload=document.createElement('a');
  upload.href=new URL('upload-images/',root).href;
  upload.className='ls-upload-button';
  upload.textContent='Upload Images';
  upload.setAttribute('aria-label','Open image uploader');
  inner.appendChild(upload);
  var mobile=document.createElement('details');mobile.className='ls-nav-mobile';
  var toggle=document.createElement('summary');toggle.textContent='Explore';toggle.setAttribute('aria-label','Open site navigation');mobile.appendChild(toggle);
  var panel=document.createElement('div');panel.className='ls-mobile-panel';
  sections.forEach(function(item){var a=link(item);a.addEventListener('click',function(){mobile.open=false});panel.appendChild(a);});
  mobile.appendChild(panel);inner.appendChild(mobile);nav.appendChild(inner);
  document.body.insertBefore(nav,document.body.firstChild);
  /* Enable image uploads and automatic placement on every archive page. */
  var css=document.createElement('link');css.rel='stylesheet';css.href=new URL('assets/slot-upload-links.css',root).href;document.head.appendChild(css);
  var loader=document.createElement('script');loader.src=new URL('assets/slot-images.js',root).href;document.body.appendChild(loader);
  if(window.location.pathname===root.pathname){document.body.classList.add('ls-is-home');}
  document.addEventListener('keydown',function(e){if(e.key==='Escape')mobile.open=false;});
})();
