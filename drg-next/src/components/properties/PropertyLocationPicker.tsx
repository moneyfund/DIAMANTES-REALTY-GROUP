"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

type SearchResult={lat:number;lng:number;label:string;type:string};

export function PropertyLocationPicker({
  lat,lng,onChange,locationText=""
}:{lat:number|null;lng:number|null;onChange:(lat:number,lng:number)=>void;locationText?:string}){
  const containerRef=useRef<HTMLDivElement>(null);
  const mapRef=useRef<LeafletMap|null>(null);
  const markerRef=useRef<LeafletMarker|null>(null);
  const [query,setQuery]=useState(locationText);
  const [results,setResults]=useState<SearchResult[]>([]);
  const [searching,setSearching]=useState(false);
  const [searchError,setSearchError]=useState("");
  const requestRef=useRef<AbortController|null>(null);

  useEffect(()=>{
    let cancelled=false;
    if(!containerRef.current||mapRef.current)return;
    void import("leaflet").then(L=>{
      if(cancelled||!containerRef.current)return;
      const initial:[number,number]=lat!==null&&lng!==null?[lat,lng]:[12.8654,-85.2072];
      const map=L.map(containerRef.current,{zoomControl:true,scrollWheelZoom:true}).setView(initial,lat!==null&&lng!==null?14:7);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap contributors"}).addTo(map);
      const icon=L.divIcon({className:"drg-map-pin-shell",html:'<span class="drg-map-pin"></span>',iconSize:[34,42],iconAnchor:[17,42]});
      if(lat!==null&&lng!==null)markerRef.current=L.marker([lat,lng],{icon,draggable:true}).addTo(map).on("dragend",event=>{const point=(event.target as LeafletMarker).getLatLng();onChange(point.lat,point.lng)});
      map.on("click",event=>{
        const point=event.latlng;
        if(!markerRef.current)markerRef.current=L.marker(point,{icon,draggable:true}).addTo(map).on("dragend",dragEvent=>{const next=(dragEvent.target as LeafletMarker).getLatLng();onChange(next.lat,next.lng)});
        else markerRef.current.setLatLng(point);
        onChange(point.lat,point.lng);
      });
      mapRef.current=map;
      setTimeout(()=>map.invalidateSize(),50);
    });
    return()=>{cancelled=true;mapRef.current?.remove();mapRef.current=null;markerRef.current=null};
  },[]);

  useEffect(()=>{
    if(!mapRef.current||lat===null||lng===null)return;
    markerRef.current?.setLatLng([lat,lng]);
  },[lat,lng]);

  useEffect(()=>{
    const clean=query.trim();
    if(clean.length<3){setResults([]);setSearchError("");return}
    const timer=window.setTimeout(async()=>{
      requestRef.current?.abort();
      const controller=new AbortController();requestRef.current=controller;setSearching(true);setSearchError("");
      try{
        const params=new URLSearchParams({q:clean,format:"jsonv2",countrycodes:"ni",addressdetails:"1",limit:"5","accept-language":"es"});
        const response=await fetch("https://nominatim.openstreetmap.org/search?"+params.toString(),{signal:controller.signal,headers:{Accept:"application/json"}});
        if(!response.ok)throw new Error("HTTP "+response.status);
        const data=await response.json() as Array<Record<string,unknown>>;
        setResults(data.map(item=>({lat:Number(item.lat),lng:Number(item.lon),label:String(item.display_name||item.name||""),type:String(item.type||item.class||"Ubicación")})).filter(item=>Number.isFinite(item.lat)&&Number.isFinite(item.lng)&&item.label));
      }catch(error){if((error as {name?:string})?.name!=="AbortError"){console.warn("[DRG geocoding]",error);setSearchError("No fue posible buscar ubicaciones en este momento.")}}
      finally{if(!controller.signal.aborted)setSearching(false)}
    },650);
    return()=>window.clearTimeout(timer);
  },[query]);

  function choose(result:SearchResult){
    onChange(result.lat,result.lng);setQuery(result.label);setResults([]);
    if(mapRef.current){mapRef.current.setView([result.lat,result.lng],15);void import("leaflet").then(L=>{const icon=L.divIcon({className:"drg-map-pin-shell",html:'<span class="drg-map-pin"></span>',iconSize:[34,42],iconAnchor:[17,42]});if(!markerRef.current)markerRef.current=L.marker([result.lat,result.lng],{icon,draggable:true}).addTo(mapRef.current!);else markerRef.current.setLatLng([result.lat,result.lng])})}
  }

  return <div className="drg-location-picker">
    <div className="drg-location-search"><label>Buscar ubicación en Nicaragua<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Barrio, ciudad, carretera o referencia"/></label>{searching?<span>Buscando…</span>:null}{searchError?<span className="is-error">{searchError}</span>:null}{results.length?<div>{results.map((result,index)=><button type="button" key={result.label+index} onClick={()=>choose(result)}><strong>{result.label}</strong><small>{result.type}</small></button>)}</div>:null}</div>
    <div ref={containerRef} className="drg-location-map" aria-label="Mapa de ubicación de la propiedad"/>
    <p>Haz clic en el mapa o arrastra el marcador para ajustar la ubicación exacta.</p>
  </div>;
}
