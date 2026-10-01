export type PropertyVideoType=""|"youtube"|"tiktok";
export type ValidPropertyVideo={type:Exclude<PropertyVideoType,"">;url:string;embedUrl:string};

function safeUrl(value:string){
  try{
    const parsed=new URL(value.trim());
    return ["http:","https:"].includes(parsed.protocol)?parsed:null;
  }catch{return null}
}

export function validatePropertyVideo(type:PropertyVideoType,url:string):
  | {valid:true;value:ValidPropertyVideo|null}
  | {valid:false;message:string}{
  const cleanUrl=url.trim();
  if(!type&&!cleanUrl)return {valid:true,value:null};
  if(type&&!cleanUrl)return {valid:false,message:"Seleccionaste un tipo de video. Ingresa la URL."};
  if(!type&&cleanUrl)return {valid:false,message:"Selecciona YouTube o TikTok para el video."};
  const parsed=safeUrl(cleanUrl);
  if(!parsed)return {valid:false,message:"Ingresa una URL de video válida."};

  const host=parsed.hostname.toLowerCase();
  if(type==="youtube"){
    let id="";
    if(host==="youtu.be"||host.endsWith(".youtu.be"))id=parsed.pathname.replace(/^\//,"").split("/")[0]||"";
    else if(host.includes("youtube.com")){
      if(parsed.pathname.startsWith("/shorts/")||parsed.pathname.startsWith("/embed/"))id=parsed.pathname.split("/")[2]||"";
      else id=parsed.searchParams.get("v")||"";
    }
    if(!id)return {valid:false,message:"La URL no corresponde a un video válido de YouTube."};
    return {valid:true,value:{type:"youtube",url:parsed.toString(),embedUrl:"https://www.youtube.com/embed/"+encodeURIComponent(id)}};
  }

  if(type==="tiktok"){
    if(!host.includes("tiktok.com"))return {valid:false,message:"La URL no corresponde a TikTok."};
    const id=parsed.pathname.match(/\/video\/(\d+)/i)?.[1]||"";
    return {valid:true,value:{type:"tiktok",url:parsed.toString(),embedUrl:id?"https://www.tiktok.com/embed/v2/"+id:parsed.toString()}};
  }

  return {valid:false,message:"Tipo de video no válido."};
}
