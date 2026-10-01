import { gsap, ScrollTrigger } from './vendor/motion.js';
gsap.registerPlugin(ScrollTrigger);

// One scroll timeline owns the persistent scene. No pinning or wheel interception.
export function createJourney(scene) {
  const hero=document.getElementById('homeHero');
  const brand=document.getElementById('homeExperience');
  const recent=document.getElementById('recentPropertiesSection');
  const media=hero.querySelector('.home-hero-media');
  const light=document.querySelector('.home-ambient-light');
  const frame=brand.querySelector('.home-brand-frame');
  const caption=brand.querySelector('.home-brand-caption');
  const initial={x:.585,y:.385,width:.175,rx:.13,ry:-.26,rz:-.08,z:8,opacity:1};
  const state={...initial};
  let timeline, timer, disposed=false, progress=0, brandCue=0, brandCueLength=1;
  const top=element=>element.getBoundingClientRect().top+window.scrollY;
  function paint() {
    scene.update(state);
    const heroProgress=Math.min(1,window.scrollY/hero.offsetHeight);
    media.style.setProperty('--hero-media-y',`${heroProgress*-24}px`);
    media.style.setProperty('--hero-image-y',`${heroProgress*22}px`);
    media.style.setProperty('--hero-image-scale',String(1.08-heroProgress*.045));
    light.style.setProperty('--home-light-y',`${progress*-55}px`);
    frame.style.setProperty('--brand-frame-rotation',`${-10+progress*16}deg`);
    const brandReveal=Math.min(1,Math.max(0,((timeline?.time() || 0)-brandCue)/brandCueLength));
    caption.style.setProperty('--brand-copy-progress',String(brandReveal));
  }
  function build() {
    if(disposed) return;
    timeline?.scrollTrigger?.kill(); timeline?.kill();
    Object.assign(state,initial);
    const vh=window.innerHeight;
    const brandTop=top(brand);
    brandCue=brandTop-vh*.3; brandCueLength=vh*.38;
    const brandEnd=brandTop+brand.offsetHeight-vh;
    const end=top(recent)+vh*.65;
    const stops=[
      [0,initial],
      [hero.offsetHeight*.6,{x:.8,y:.27,width:.21,rx:.18,ry:.38,rz:.03,z:7,opacity:.58}],
      [brandTop-vh*.88,{x:.91,y:.4,width:.23,rx:.1,ry:.52,rz:.06,z:6.7,opacity:.08}],
      [brandTop-vh*.12,{x:.5,y:.4,width:.265,rx:.17,ry:-.34,rz:0,z:6.1,opacity:1}],
      [brandEnd,{x:.5,y:.39,width:.28,rx:.13,ry:-.2,rz:0,z:6.5,opacity:1}],
      [top(recent)+vh*.22,{x:.13,y:.24,width:.19,rx:.2,ry:.65,rz:-.12,z:8.2,opacity:.065}],
      [end,{x:.09,y:.12,width:.13,rx:.24,ry:.8,rz:-.15,z:9.5,opacity:0}],
    ];
    // Content can grow after Firebase resolves. Absolute DOM anchors preserve alignment.
    let previous=0;
    timeline=gsap.timeline({paused:true,onUpdate:paint});
    stops.slice(1).forEach(([position,values])=>{
      const next=Math.max(previous+1,position);
      timeline.to(state,{...values,duration:next-previous,ease:'sine.inOut'},previous);
      previous=next;
    });
    ScrollTrigger.create({animation:timeline,start:0,end:previous,scrub:.55,onUpdate:trigger=>{progress=trigger.progress;}});
    timeline.progress(Math.min(1,Math.max(0,window.scrollY/previous)));
    paint();
  }
  function refresh() {clearTimeout(timer); timer=setTimeout(()=>{scene.resize();build();},180);}
  const observer=new ResizeObserver(refresh);
  observer.observe(document.getElementById('mainContent'));
  window.addEventListener('resize',refresh,{passive:true});
  build();
  return {diagnostics:()=>({progress,triggers:ScrollTrigger.getAll().length}),dispose(){
    disposed=true;clearTimeout(timer);observer.disconnect();window.removeEventListener('resize',refresh);
    timeline?.scrollTrigger?.kill();timeline?.kill();
    [[media,['--hero-media-y','--hero-image-y','--hero-image-scale']],[light,['--home-light-y']],[frame,['--brand-frame-rotation']],[caption,['--brand-copy-progress']]].forEach(([element,properties])=>properties.forEach(p=>element.style.removeProperty(p)));
  }};
}
