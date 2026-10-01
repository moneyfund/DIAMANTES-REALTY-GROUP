// Progressive enhancement only. Search, inventory, links and navigation are independent.
const body=document.body;
if(body.classList.contains('home-page')) initHome();

function initHome() {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const desktop=matchMedia('(min-width: 901px) and (pointer: fine)');
  const host=document.getElementById('homeVisualLayer');
  let scene, journey, generation=0, disposed=false, mode='fallback', failed=false;
  let fallbackFrame=0, heroVisible=true;
  const hero=document.getElementById('homeHero');
  const heroMedia=hero.querySelector('.home-hero-media');
  const heroSymbol=hero.querySelector('.home-hero-symbol');
  const setMode=value=>{mode=value;body.dataset.homeRenderer=value;};

  // A single observer handles typography and supporting sections. No per-card animation.
  const revealItems=[...document.querySelectorAll('[data-drg-reveal]')];
  revealItems.forEach(element=>{
    element.dataset.homeReveal='';
    const heading=element.querySelector('.drg-section-heading h2') || (element.matches('.drg-section-heading') ? element.querySelector('h2') : null);
    if(heading && !heading.children.length){
      const mask=document.createElement('span'), line=document.createElement('span');
      mask.className='home-heading-mask';line.textContent=heading.textContent;mask.append(line);heading.replaceChildren(mask);
    }
  });
  const reveals=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');reveals.unobserve(entry.target);}}),{threshold:.06,rootMargin:'0px 0px -25px 0px'});
  revealItems.forEach(element=>reveals.observe(element));
  if(!reduced.matches)body.classList.add('home-move-ready');
  const revealFocus=event=>event.target.closest('[data-home-reveal]')?.classList.add('is-visible');
  document.addEventListener('focusin',revealFocus);

  // Short entrance; static HTML is already visible before this module loads.
  const entrance=[];
  if(!reduced.matches){
    document.querySelectorAll('.home-title-line > span').forEach((line,index)=>entrance.push(line.animate([{transform:'translateY(105%)',opacity:.4},{transform:'translateY(0)',opacity:1}],{duration:750,delay:index*65,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'})));
    entrance.push(document.querySelector('.home-hero-lead').animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:650,delay:220,fill:'backwards'}));
  }

  function fallbackScroll() {
    if(scene || reduced.matches || !heroVisible || document.hidden || fallbackFrame) return;
    fallbackFrame=requestAnimationFrame(()=>{
      fallbackFrame=0;
      const p=Math.min(1,window.scrollY/hero.offsetHeight);
      heroMedia.style.setProperty('--hero-image-y',`${p*12}px`);
      heroSymbol.style.setProperty('--mobile-logo-y',`${p*-18}px`);
    });
  }
  const heroObserver=new IntersectionObserver(([entry])=>{heroVisible=entry.isIntersecting;if(heroVisible)fallbackScroll();});
  heroObserver.observe(hero);
  window.addEventListener('scroll',fallbackScroll,{passive:true});
  function pointer(event){scene?.pointer((event.clientX/innerWidth-.5)*2,(event.clientY/innerHeight-.5)*2);}
  function leave(){scene?.pointer(0,0);}
  function visibility(){scene?.pause(document.hidden);}
  window.addEventListener('pointermove',pointer,{passive:true});
  document.addEventListener('pointerleave',leave);
  document.addEventListener('visibilitychange',visibility);

  function stopScene() {
    journey?.dispose();journey=undefined;scene?.dispose();scene=undefined;
    body.classList.remove('home-webgl');host.classList.remove('is-ready');host.replaceChildren();
  }
  function contextLost(){failed=true;generation++;stopScene();setMode('fallback');}
  async function configure() {
    const current=++generation;
    stopScene();
    if(reduced.matches){entrance.forEach(animation=>animation.cancel());body.classList.remove('home-move-ready');setMode('reduced');return;}
    const capable=desktop.matches && (navigator.deviceMemory || 4)>2 && (navigator.hardwareConcurrency || 4)>2 && !navigator.connection?.saveData;
    setMode('fallback');
    if(!capable || failed || disposed)return;
    try{
      const [sceneModule,journeyModule]=await Promise.all([import('./scene.js'),import('./journey.js')]);
      if(current!==generation || disposed)return;
      scene=sceneModule.createScene(host,contextLost);
      journey=journeyModule.createJourney(scene);
      body.classList.add('home-webgl');host.classList.add('is-ready');setMode('webgl');
    }catch(error){if(current===generation){failed=true;stopScene();setMode('fallback');}}
  }
  function pageHide(event){
    if(event.persisted){scene?.pause(true);return;}
    disposed=true;generation++;stopScene();reveals.disconnect();heroObserver.disconnect();
    cancelAnimationFrame(fallbackFrame);entrance.forEach(animation=>animation.cancel());
    window.removeEventListener('scroll',fallbackScroll);window.removeEventListener('pointermove',pointer);
    document.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',visibility);
    document.removeEventListener('focusin',revealFocus);
    reduced.removeEventListener('change',configure);desktop.removeEventListener('change',configure);
  }
  window.addEventListener('pagehide',pageHide);
  window.addEventListener('pageshow',()=>{scene?.pause(document.hidden);});
  reduced.addEventListener('change',configure);desktop.addEventListener('change',configure);
  Object.defineProperty(window,'drgHomeExperience',{configurable:true,value:Object.freeze({getDiagnostics:()=>({mode,...scene?.diagnostics(),...journey?.diagnostics()})})});
  if('requestIdleCallback' in window)requestIdleCallback(()=>configure(),{timeout:1200});else setTimeout(configure,200);
}
