import {
  ArrowUpDown,
  Bath,
  BedDouble,
  Briefcase,
  Building2,
  Car,
  CircleDollarSign,
  DoorOpen,
  Droplets,
  Fence,
  FileText,
  Hammer,
  House,
  LandPlot,
  Layers,
  MapPin,
  Mountain,
  Route,
  Ruler,
  Shield,
  Sofa,
  Sprout,
  Tractor,
  Trees,
  Truck,
  Utensils,
  WashingMachine,
  Warehouse,
  Waves,
  Wifi,
  Zap,
  type LucideIcon
} from "lucide-react";

function normalize(value:string){
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}

function iconForLabel(label:string):LucideIcon{
  const value=normalize(label);

  if(value.includes("habitacion")||value.includes("dormitorio"))return BedDouble;
  if(value.includes("bano"))return Bath;
  if(value.includes("construccion")||value.includes("estado de construccion"))return Hammer;
  if(value.includes("area")||value.includes("frente"))return Ruler;
  if(value.includes("terreno")||value.includes("suelo")||value.includes("forma del terreno"))return LandPlot;
  if(value.includes("parqueo")||value.includes("garaje"))return Car;
  if(value.includes("nivel")||value.includes("piso"))return Layers;
  if(value.includes("ascensor"))return ArrowUpDown;
  if(value.includes("seguridad"))return Shield;
  if(value.includes("electric")||value.includes("energia"))return Zap;
  if(value.includes("agua")||value.includes("pozo")||value.includes("rio")||value.includes("quebrada"))return Droplets;
  if(value.includes("piscina"))return Waves;
  if(value.includes("jardin")||value.includes("entorno natural")||value.includes("vegetacion")||value.includes("recursos naturales"))return Trees;
  if(value.includes("topografia"))return Mountain;
  if(value.includes("cultivo"))return Sprout;
  if(value.includes("potrero")||value.includes("cerca"))return Fence;
  if(value.includes("ganader")||value.includes("agricult"))return Tractor;
  if(value.includes("camion"))return Truck;
  if(value.includes("bodega")||value.includes("industrial"))return Warehouse;
  if(value.includes("oficina")||value.includes("corporativ")||value.includes("reunion")||value.includes("recepcion"))return Briefcase;
  if(value.includes("internet")||value.includes("conectividad"))return Wifi;
  if(value.includes("document")||value.includes("permiso")||value.includes("estudio"))return FileText;
  if(value.includes("plusval")||value.includes("mantenimiento"))return CircleDollarSign;
  if(value.includes("acceso")||value.includes("calle")||value.includes("trafico")||value.includes("via principal"))return Route;
  if(value.includes("ubicacion")||value.includes("zona"))return MapPin;
  if(value.includes("sala")||value.includes("amuebl"))return Sofa;
  if(value.includes("comedor")||value.includes("cocina"))return Utensils;
  if(value.includes("lavado"))return WashingMachine;
  if(value.includes("balcon")||value.includes("terraza")||value.includes("patio"))return DoorOpen;
  if(value.includes("casa")||value.includes("infraestructura"))return House;
  if(value.includes("comercial")||value.includes("proyecto"))return Building2;
  return LandPlot;
}

export function PropertyFeatureIcon({label,size=20,className}:{label:string;size?:number;className?:string}){
  const Icon=iconForLabel(label);
  return <Icon size={size} className={className} aria-hidden="true"/>;
}
