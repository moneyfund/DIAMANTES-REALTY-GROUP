"use client";

import { useMemo, useState, useEffect, type FormEvent } from "react";
import { useDrgAuth } from "@/components/auth/AuthProvider";
import { drgWritesEnabled } from "@/lib/config/writes";
import { publishPropertyComment, publishPropertyReview, subscribePropertyInteractions, type PropertyInteraction } from "@/lib/firebase/interactions";

function dateText(value:unknown){
  if(!value||typeof value!=="object"||!("seconds" in value))return"";
  const seconds=Number((value as {seconds?:unknown}).seconds||0); if(!seconds)return"";
  return new Intl.DateTimeFormat("es-NI",{dateStyle:"medium",timeStyle:"short"}).format(new Date(seconds*1000));
}
function initials(name:string){return name.trim().split(/\s+/).slice(0,2).map(v=>v[0]||"").join("").toUpperCase()||"U"}

export function PropertyInteractions({propertyId}:{propertyId:string}){
  const {profile,signInWithGoogle}=useDrgAuth();
  const [comments,setComments]=useState<PropertyInteraction[]>([]);
  const [reviews,setReviews]=useState<PropertyInteraction[]>([]);
  const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
  const [comment,setComment]=useState("");
  const [rating,setRating]=useState(0);
  const [message,setMessage]=useState("");

  useEffect(()=>{
    setStatus("loading");
    return subscribePropertyInteractions(propertyId,{
      comments:items=>{setComments(items);setStatus("ready")},
      reviews:items=>{setReviews(items);setStatus("ready")},
      error:error=>{console.warn("[DRG interactions]",error);setStatus("error")}
    });
  },[propertyId]);

  const average=useMemo(()=>reviews.length?reviews.reduce((sum,item)=>sum+item.rating,0)/reviews.length:0,[reviews]);

  async function submitComment(event:FormEvent){
    event.preventDefault();
    if(!profile.user){setMessage("Inicia sesión con Google para comentar.");return}
    if(!drgWritesEnabled){setMessage("La publicación de comentarios sigue bloqueada en esta Preview.");return}
    try{await publishPropertyComment(propertyId,profile.user,comment);setComment("");setMessage("Comentario publicado.");}
    catch(error){setMessage(error instanceof Error?error.message:"No fue posible publicar el comentario.")}
  }
  async function submitReview(event:FormEvent){
    event.preventDefault();
    if(!profile.user){setMessage("Inicia sesión con Google para publicar una reseña.");return}
    if(!drgWritesEnabled){setMessage("La publicación de reseñas sigue bloqueada en esta Preview.");return}
    try{await publishPropertyReview(propertyId,profile.user,rating);setRating(0);setMessage("Reseña publicada.");}
    catch(error){setMessage(error instanceof Error?error.message:"No fue posible publicar la reseña.")}
  }

  return <section className="drg-interactions">
    <header className="drg-interactions-head"><div><p className="drg-kicker">Comunidad</p><h2>Comentarios y reseñas</h2></div><div className="drg-interactions-average"><strong>{average.toFixed(1)}</strong><span>★★★★★</span><small>{reviews.length} reseña{reviews.length===1?"":"s"}</small></div></header>
    <div className="drg-interaction-auth">{profile.user?<><span>Sesión activa como <strong>{profile.user.displayName||profile.user.email}</strong></span><small>{drgWritesEnabled?"Puedes participar en la conversación.":"Lectura activa · publicaciones bloqueadas durante la migración."}</small></>:<><span>Para comentar o valorar una propiedad debes iniciar sesión.</span><button onClick={()=>void signInWithGoogle()}>Ingresar con Google</button></>}</div>
    {message?<p className="drg-interaction-message">{message}</p>:null}
    {status==="error"?<p className="drg-detail-muted">No pudimos cargar las interacciones en este momento.</p>:null}
    <div className="drg-interactions-grid">
      <article>
        <h3>Comentarios</h3>
        <form className="drg-interaction-form" onSubmit={submitComment}><textarea rows={4} maxLength={1200} value={comment} onChange={e=>setComment(e.target.value)} placeholder="Escribe un comentario…"/><button type="submit">{drgWritesEnabled?"Publicar comentario":"Publicación bloqueada"}</button></form>
        <div className="drg-interaction-list">{comments.map(item=><div className="drg-interaction-item" key={item.id}><div className="drg-interaction-person">{item.userPhoto?<img src={item.userPhoto} alt=""/>:<span>{initials(item.userName)}</span>}<div><strong>{item.userName}</strong><small>{dateText(item.createdAt)}</small></div></div><p>{item.comment}</p></div>)}{status==="ready"&&!comments.length?<p className="drg-detail-muted">Aún no hay comentarios.</p>:null}</div>
      </article>
      <article>
        <div className="drg-review-heading"><h3>Reseñas</h3><span>{average.toFixed(1)} ★ · {reviews.length}</span></div>
        <form className="drg-review-form" onSubmit={submitReview}><div>{[1,2,3,4,5].map(value=><button type="button" key={value} className={value<=rating?"is-active":""} onClick={()=>setRating(value)} aria-label={value+" estrellas"}>★</button>)}</div><button type="submit">{drgWritesEnabled?"Publicar reseña":"Publicación bloqueada"}</button></form>
        <div className="drg-interaction-list">{reviews.map(item=><div className="drg-interaction-item" key={item.id}><div className="drg-interaction-person">{item.userPhoto?<img src={item.userPhoto} alt=""/>:<span>{initials(item.userName)}</span>}<div><strong>{item.userName}</strong><small>{dateText(item.createdAt)}</small></div></div><p className="drg-stars">{"★".repeat(item.rating)}{"☆".repeat(5-item.rating)}</p></div>)}{status==="ready"&&!reviews.length?<p className="drg-detail-muted">Aún no hay reseñas.</p>:null}</div>
      </article>
    </div>
  </section>;
}
