import { ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, Shape } from './vendor/three.js';

// Contours traced from the opaque red symbol in assets/logo.png (3112 × 3112).
// Keep its three original diamonds and their spacing; depth is genuine geometry.
const contours = [
  [[1569,452],[2062,851],[1560,1244],[1058,851]],
  [[1007,903],[1500,1303],[998,1696],[496,1303]],
  [[2122,904],[2615,1303],[2113,1696],[1611,1303]],
];
export const SYMBOL_WIDTH = 2119 / 900;

export function createLogo() {
  const group = new Group();
  const face = new MeshStandardMaterial({color:0xe61009, roughness:.42, metalness:.04, transparent:true});
  const edge = new MeshStandardMaterial({color:0xa61913, roughness:.5, metalness:.06, transparent:true});
  const geometries = contours.map(points => {
    const shape = new Shape();
    points.forEach(([x,y],index) => shape[index ? 'lineTo' : 'moveTo']((x-1555.5)/900,(1074-y)/900));
    shape.closePath();
    const geometry = new ExtrudeGeometry(shape, {depth:.24, bevelEnabled:true, bevelSize:.009, bevelThickness:.012, bevelSegments:2, steps:1, curveSegments:1});
    geometry.translate(0,0,-.12);
    group.add(new Mesh(geometry,[face,edge]));
    return geometry;
  });
  return {group, setOpacity(value) {face.opacity=edge.opacity=value;}, dispose() {geometries.forEach(g=>g.dispose()); face.dispose(); edge.dispose();}};
}
