"use client";

import { validatePropertyVideo, type PropertyVideoType } from "@/lib/properties/video";

export function PropertyVideoPreview({type,url}:{type:PropertyVideoType;url:string}){
  const result=validatePropertyVideo(type,url);
  if(!type&&!url.trim())return <p className="drg-video-preview-empty">Agrega un enlace de YouTube o TikTok para previsualizarlo.</p>;
  if(!result.valid)return <p className="drg-video-preview-error">{result.message}</p>;
  if(!result.value)return null;
  if(result.value.type==="youtube"||result.value.embedUrl.includes("tiktok.com/embed")){
    return <div className="drg-video-preview-frame"><iframe src={result.value.embedUrl} title="Vista previa del video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/></div>;
  }
  return <a className="drg-video-preview-link" href={result.value.url} target="_blank" rel="noreferrer">Abrir vista previa de TikTok ↗</a>;
}
