import { NextRequest, NextResponse } from "next/server";

const MAX_IMAGE_BYTES=15*1024*1024;
const FETCH_TIMEOUT_MS=12000;

function allowedHost(hostname:string){
  const host=hostname.toLowerCase();
  return host==="firebasestorage.googleapis.com"||
    host==="storage.googleapis.com"||
    host==="googleusercontent.com"||
    host.endsWith(".googleusercontent.com");
}

export async function GET(request:NextRequest){
  const raw=request.nextUrl.searchParams.get("url")||"";
  let imageUrl:URL;
  try{imageUrl=new URL(raw)}catch{return NextResponse.json({error:"URL inválida"},{status:400})}
  if(imageUrl.protocol!=="https:"||!allowedHost(imageUrl.hostname))return NextResponse.json({error:"Origen no permitido"},{status:403});
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),FETCH_TIMEOUT_MS);
  try{
    const upstream=await fetch(imageUrl,{signal:controller.signal,redirect:"follow",headers:{Accept:"image/*,*/*;q=0.8","User-Agent":"DiamantesRealtyGroup-Next/2.0"}});
    if(!upstream.ok)return NextResponse.json({error:"No fue posible obtener la imagen"},{status:upstream.status>=400&&upstream.status<500?upstream.status:502});
    const contentType=(upstream.headers.get("content-type")||"").split(";")[0].trim().toLowerCase();
    if(!contentType.startsWith("image/"))return NextResponse.json({error:"El recurso no es una imagen"},{status:415});
    const contentLength=Number(upstream.headers.get("content-length")||0);
    if(contentLength>MAX_IMAGE_BYTES)return NextResponse.json({error:"Imagen demasiado grande"},{status:413});
    const bytes=await upstream.arrayBuffer();
    if(bytes.byteLength>MAX_IMAGE_BYTES)return NextResponse.json({error:"Imagen demasiado grande"},{status:413});
    return new NextResponse(bytes,{status:200,headers:{"Content-Type":contentType,"Cache-Control":"public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400","X-Content-Type-Options":"nosniff"}});
  }catch(error){
    if((error as {name?:string})?.name==="AbortError")return NextResponse.json({error:"Tiempo de espera agotado"},{status:504});
    console.error("[DRG sheet proxy]",error);
    return NextResponse.json({error:"No fue posible procesar la imagen"},{status:502});
  }finally{clearTimeout(timeout)}
}
