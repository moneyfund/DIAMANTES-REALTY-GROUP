"use client";

import { useEffect, useMemo, useState } from "react";

function fileKey(file:File){return [file.name,file.size,file.lastModified].join(":")}

export function PropertyImageManager({
  images,coverImage,pendingFiles,pendingCoverKey,onImagesChange,onCoverChange,onPendingFilesChange,onPendingCoverChange,writesEnabled=true
}:{
  images:string[];coverImage:string;pendingFiles:File[];pendingCoverKey:string;
  onImagesChange:(images:string[])=>void;onCoverChange:(url:string)=>void;
  onPendingFilesChange:(files:File[])=>void;onPendingCoverChange:(key:string)=>void;writesEnabled?:boolean;
}){
  const [manualUrl,setManualUrl]=useState("");
  const previews=useMemo(()=>pendingFiles.map(file=>({file,key:fileKey(file),url:URL.createObjectURL(file)})),[pendingFiles]);
  useEffect(()=>()=>{previews.forEach(item=>URL.revokeObjectURL(item.url))},[previews]);

  function moveImage(index:number,delta:number){
    const target=index+delta;if(target<0||target>=images.length)return;
    const next=[...images];[next[index],next[target]]=[next[target],next[index]];onImagesChange(next);
  }
  function removeImage(index:number){
    const removed=images[index];const next=images.filter((_,i)=>i!==index);onImagesChange(next);
    if(removed===coverImage)onCoverChange(next[0]||"");
  }
  function movePending(index:number,delta:number){
    const target=index+delta;if(target<0||target>=pendingFiles.length)return;
    const next=[...pendingFiles];[next[index],next[target]]=[next[target],next[index]];onPendingFilesChange(next);
  }
  function removePending(index:number){
    const removed=pendingFiles[index];const next=pendingFiles.filter((_,i)=>i!==index);onPendingFilesChange(next);
    if(fileKey(removed)===pendingCoverKey)onPendingCoverChange("");
  }
  function addManual(){
    const value=manualUrl.trim();if(!value)return;
    try{const parsed=new URL(value);if(!["http:","https:"].includes(parsed.protocol))return}catch{return}
    if(!images.includes(value)){const next=[...images,value];onImagesChange(next);if(!coverImage)onCoverChange(value)}
    setManualUrl("");
  }

  return <div className="drg-image-manager">
    <div className="drg-image-manager-head"><div><strong>Galería de la propiedad</strong><span>{images.length+pendingFiles.length} imágenes</span></div><label className="drg-image-add">Agregar desde dispositivo<input type="file" accept="image/*" multiple disabled={!writesEnabled} onChange={e=>{const incoming=Array.from(e.target.files||[]);const existing=new Set(pendingFiles.map(fileKey));onPendingFilesChange([...pendingFiles,...incoming.filter(file=>!existing.has(fileKey(file)))]);e.target.value=""}}/></label></div>
    <div className="drg-image-manual"><input type="url" value={manualUrl} onChange={e=>setManualUrl(e.target.value)} placeholder="Agregar URL de imagen"/><button type="button" onClick={addManual}>Agregar URL</button></div>
    <div className="drg-image-grid">
      {images.map((url,index)=><article key={url+"-"+index} className={coverImage===url?"is-cover":""}><div>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={url} alt={"Imagen "+(index+1)}/>{coverImage===url?<em>Portada</em>:null}</div><footer><button type="button" disabled={index===0} onClick={()=>moveImage(index,-1)}>←</button><button type="button" disabled={index===images.length-1} onClick={()=>moveImage(index,1)}>→</button><button type="button" onClick={()=>onCoverChange(url)}>Portada</button><button type="button" className="is-danger" onClick={()=>removeImage(index)}>Quitar</button></footer></article>)}
      {previews.map((item,index)=><article key={item.key} className={"is-pending "+(pendingCoverKey===item.key?"is-cover":"")}><div><img src={item.url} alt={"Nueva imagen "+(index+1)}/><em>{pendingCoverKey===item.key?"Portada al subir":"Pendiente"}</em></div><footer><button type="button" disabled={index===0} onClick={()=>movePending(index,-1)}>←</button><button type="button" disabled={index===pendingFiles.length-1} onClick={()=>movePending(index,1)}>→</button><button type="button" onClick={()=>onPendingCoverChange(item.key)}>Portada</button><button type="button" className="is-danger" onClick={()=>removePending(index)}>Quitar</button></footer></article>)}
    </div>
    {!images.length&&!pendingFiles.length?<p className="drg-image-empty">Aún no hay imágenes. Agrega al menos una antes de publicar una propiedad.</p>:null}
  </div>;
}
export { fileKey as propertyImageFileKey };
