import { DirectionalLight, HemisphereLight, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer } from './vendor/three.js';
import { createLogo, SYMBOL_WIDTH } from './logo-geometry.js';

export function createScene(host, onContextLost) {
  const renderer = new WebGLRenderer({alpha:true, antialias:true, powerPreference:'low-power'});
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.5));
  renderer.domElement.setAttribute('aria-hidden','true');
  host.append(renderer.domElement);
  const scene = new Scene();
  const camera = new PerspectiveCamera(32,1,.1,30);
  const logo = createLogo();
  scene.add(logo.group);
  scene.add(new HemisphereLight(0xffffff,0xaeb7c0,2.2));
  const key = new DirectionalLight(0xffffff,2);
  key.position.set(-3,4,6);
  scene.add(key);
  const rim = new DirectionalLight(0xffcfc5,.7);
  rim.position.set(5,1,-2);
  scene.add(rim);

  let width=1, height=1, frame=0, disposed=false, visible=!document.hidden, frames=0;
  let state={x:.585,y:.385,width:.175,rx:.13,ry:-.26,rz:-.08,z:8,opacity:1};
  const pointer={x:0,y:0,targetX:0,targetY:0};
  function render() {
    frame=0;
    if(disposed || !visible) return;
    pointer.x+=(pointer.targetX-pointer.x)*.15;
    pointer.y+=(pointer.targetY-pointer.y)*.15;
    camera.position.set(pointer.x*.07,pointer.y*.05,state.z);
    camera.lookAt(0,0,0);
    const viewHeight=2*Math.tan(camera.fov*Math.PI/360)*state.z;
    const viewWidth=viewHeight*width/height;
    logo.group.position.set((state.x-.5)*viewWidth,(.5-state.y)*viewHeight,0);
    logo.group.scale.setScalar(state.width*viewWidth/SYMBOL_WIDTH);
    logo.group.rotation.set(state.rx+pointer.y*.035,state.ry+pointer.x*.045,state.rz);
    logo.group.visible=state.opacity>.002;
    logo.setOpacity(state.opacity);
    renderer.render(scene,camera);
    frames++;
    if(state.opacity>.01 && (Math.abs(pointer.x-pointer.targetX)>.001 || Math.abs(pointer.y-pointer.targetY)>.001)) requestRender();
  }
  function requestRender() {if(!frame && !disposed && visible) frame=requestAnimationFrame(render);}
  function resize() {
    width=window.innerWidth; height=window.innerHeight;
    camera.aspect=width/height; camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);
    requestRender();
  }
  const contextLost=event=>{event.preventDefault(); onContextLost();};
  renderer.domElement.addEventListener('webglcontextlost',contextLost);
  resize();
  return {
    update(next) {state={...next}; requestRender();},
    pointer(x,y) {if(state.opacity>.01){pointer.targetX=x;pointer.targetY=y;requestRender();}},
    resize,
    pause(paused) {visible=!paused; if(paused){cancelAnimationFrame(frame);frame=0;}else requestRender();},
    diagnostics() {return {frames,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,pixelRatio:renderer.getPixelRatio(),opacity:state.opacity};},
    dispose() {
      if(disposed) return;
      disposed=true; cancelAnimationFrame(frame);
      renderer.domElement.removeEventListener('webglcontextlost',contextLost);
      logo.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    }
  };
}
