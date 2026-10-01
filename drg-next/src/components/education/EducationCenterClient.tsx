"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { buying, checklist, documents, faqs, glossary, guides, mistakes, myths, paths, quiz, selling, type EducationStep } from "@/lib/education/content";

function Journey({ title, steps }: { title: string; steps: EducationStep[] }) {
  const [index, setIndex] = useState(0);
  const current = steps[index];
  return (
    <div className="drg-edu-journey">
      <div className="drg-edu-step-tabs">{steps.map((step, i) => <button key={step.title} type="button" className={i===index?"is-active":""} onClick={()=>setIndex(i)}><span>{i+1}</span>{step.title}</button>)}</div>
      <article className="drg-edu-step-detail"><p>Paso {index+1} de {steps.length}</p><h3>{current.title}</h3><p>{current.text}</p><div><section><h4>Comprueba</h4><ul>{current.check.map(item=><li key={item}>{item}</li>)}</ul></section><section><h4>Evita</h4><p>{current.avoid}</p></section><section><h4>Acción recomendada</h4><p>{current.action}</p></section></div></article>
    </div>
  );
}

export function EducationCenterClient() {
  const [pathId,setPathId]=useState("comprar");
  const [checks,setChecks]=useState<boolean[]>(checklist.map(()=>false));
  const [calc,setCalc]=useState<{gross:number;grossYield:number;netYield:number;currency:string}|null>(null);
  const [calcError,setCalcError]=useState("");
  const [glossSearch,setGlossSearch]=useState("");
  const [letter,setLetter]=useState("all");
  const [profile,setProfile]=useState("Compradores");
  const [guideId,setGuideId]=useState<number|null>(null);
  const [quizIndex,setQuizIndex]=useState(0);
  const [score,setScore]=useState(0);
  const [answer,setAnswer]=useState<number|null>(null);

  const activePath=paths.find(path=>path.id===pathId) || paths[0];
  const letters=[...new Set(glossary.map(item=>item.term[0]))];
  const glossaryRows=useMemo(()=>{
    const norm=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    return glossary.filter(item=>(letter==="all"||item.term[0]===letter)&&norm(item.term+" "+item.definition).includes(norm(glossSearch)));
  },[glossSearch,letter]);
  const checked=checks.filter(Boolean).length;
  const currentGuide=guideId===null?null:guides[guideId];
  const q=quiz[quizIndex];

  function calculate(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    const price=Number(data.get("price")); const income=Number(data.get("income")); const expenses=Number(data.get("expenses")); const currency=String(data.get("currency")||"USD");
    if(!price||price<=0||income<0||expenses<0||!Number.isFinite(price+income+expenses)){setCalcError("Ingresa valores válidos; el precio debe ser mayor que cero.");setCalc(null);return}
    const gross=income*12; setCalcError(""); setCalc({gross,grossYield:gross/price*100,netYield:(gross-expenses)/price*100,currency});
  }

  function chooseAnswer(index:number){
    if(answer!==null)return;
    setAnswer(index);
    if(index===q.answer)setScore(value=>value+1);
  }

  function nextQuiz(){
    if(quizIndex===quiz.length-1){setQuizIndex(quiz.length);return}
    setQuizIndex(value=>value+1); setAnswer(null);
  }

  function resetQuiz(){setQuizIndex(0);setScore(0);setAnswer(null)}

  return (
    <>
      <section className="drg-edu-trust"><div className="drg-container"><span>Contenido enfocado en Nicaragua</span><span>Orientación para comprar y vender</span><span>Principios legales y comerciales</span><span>Acompañamiento inmobiliario</span></div></section>
      <nav className="drg-edu-nav"><div className="drg-container">{[["rutas","Rutas"],["compra","Compra"],["venta","Venta"],["inversion","Inversión"],["documentos","Documentos"],["diccionario","Diccionario"],["guias","Guías"],["preguntas","Preguntas"]].map(([id,label])=><a key={id} href={"#"+id}>{label}</a>)}</div></nav>

      <section className="drg-edu-section drg-container" id="rutas">
        <header className="drg-edu-heading"><p className="drg-kicker">Aprendizaje a tu medida</p><h2>¿Qué quieres aprender?</h2><p>Selecciona un objetivo para explorar contenidos organizados y accionables.</p></header>
        <div className="drg-edu-paths">{paths.map(path=><button key={path.id} className={path.id===pathId?"is-active":""} onClick={()=>setPathId(path.id)}><span>{path.id===pathId?"Ruta activa":"Seleccionar"}</span><strong>{path.title}</strong><small>{path.description}</small><b>{path.modules.length} temas</b></button>)}</div>
        <article className="drg-edu-path-panel"><div><p className="drg-kicker">Ruta seleccionada</p><h3>{activePath.title}</h3><p>{activePath.description}</p></div><ol>{activePath.modules.slice(0,5).map((module,index)=><li key={index}><span>{index+1}</span>{typeof module==="string"?module:module.title}</li>)}</ol></article>
      </section>

      <section className="drg-edu-section drg-edu-tint" id="compra"><div className="drg-container"><header className="drg-edu-heading"><p className="drg-kicker">Proceso de compra</p><h2>Avanza paso a paso, no por impulso</h2></header><Journey title="Compra" steps={buying}/></div></section>

      <section className="drg-edu-section drg-container" id="venta"><header className="drg-edu-heading"><p className="drg-kicker">Proceso de venta</p><h2>Prepara una salida al mercado con criterio</h2></header><Journey title="Venta" steps={selling}/>
        <div className="drg-edu-check"><div><p className="drg-kicker">Diagnóstico local</p><h3>¿Está tu propiedad lista para venderse?</h3><p>{checked} de {checks.length} pasos preparados</p><div><span style={{width:(checked/checks.length*100)+"%"}}/></div></div><div>{checklist.map((item,index)=><label key={item}><input type="checkbox" checked={checks[index]} onChange={()=>setChecks(values=>values.map((value,i)=>i===index?!value:value))}/><span>{item}</span></label>)}</div></div>
      </section>

      <section className="drg-edu-section drg-edu-dark" id="inversion"><div className="drg-container"><header className="drg-edu-heading"><p className="drg-kicker">Análisis responsable</p><h2>Inversión inmobiliaria sin promesas irreales</h2><p>Comprende cómo ubicación, plusvalía, liquidez, demanda, riesgo y horizonte se relacionan.</p></header><div className="drg-edu-concepts">{(paths[2].modules as readonly string[]).map(item=><span key={item}>{item}</span>)}</div>
        <div className="drg-edu-calculator"><form onSubmit={calculate}><h3>Ejemplo orientativo de rentabilidad</h3><p>No representa asesoría financiera y no guarda información.</p><label>Moneda<select name="currency"><option value="USD">USD — dólares</option><option value="NIO">NIO — córdobas</option></select></label><label>Precio de compra<input name="price" type="number" min="0" step="0.01" required/></label><label>Ingreso mensual estimado<input name="income" type="number" min="0" step="0.01" required/></label><label>Gastos anuales estimados<input name="expenses" type="number" min="0" step="0.01" required/></label><button type="submit">Calcular estimación</button><p className="is-error">{calcError}</p></form><div className="drg-edu-results">{calc?<><span>Ingreso bruto anual<strong>{new Intl.NumberFormat("es-NI",{style:"currency",currency:calc.currency}).format(calc.gross)}</strong></span><span>Rentabilidad bruta estimada<strong>{calc.grossYield.toFixed(2)} %</strong></span><span>Rentabilidad neta orientativa<strong>{calc.netYield.toFixed(2)} %</strong></span></>:<p>Completa los campos para ver el ejemplo.</p>}</div></div>
      </div></section>

      <section className="drg-edu-section drg-container" id="documentos"><header className="drg-edu-heading"><p className="drg-kicker">Documentos y procesos en Nicaragua</p><h2>Una ruta general para ordenar la operación</h2></header><ol className="drg-edu-process">{(paths[3].modules as readonly string[]).map((item,index)=><li key={item}><span>{index+1}</span><strong>{item}</strong></li>)}</ol><div className="drg-edu-docs">{documents.map(item=><span key={item}>{item}</span>)}</div><p className="drg-edu-legal">Los requisitos pueden variar según el tipo de propiedad, municipio, antecedentes registrales y características de la operación. La documentación debe revisarse con profesionales competentes antes de firmar o realizar pagos.</p></section>

      <section className="drg-edu-section drg-edu-tint" id="diccionario"><div className="drg-container"><header className="drg-edu-heading"><p className="drg-kicker">Conceptos claros</p><h2>Diccionario inmobiliario</h2></header><div className="drg-edu-gloss-controls"><input value={glossSearch} onChange={e=>setGlossSearch(e.target.value)} placeholder="Ej. plusvalía, avalúo…"/><div><button className={letter==="all"?"is-active":""} onClick={()=>setLetter("all")}>Todos</button>{letters.map(item=><button className={letter===item?"is-active":""} onClick={()=>setLetter(item)} key={item}>{item}</button>)}</div></div><div className="drg-edu-glossary">{glossaryRows.map(item=><article key={item.term}><h3>{item.term}</h3><p>{item.definition}</p></article>)}</div>{!glossaryRows.length?<p>No encontramos conceptos con esos criterios.</p>:null}</div></section>

      <section className="drg-edu-section drg-container"><header className="drg-edu-heading"><p className="drg-kicker">Criterio sobre creencias comunes</p><h2>Mitos y realidades del mercado inmobiliario</h2></header><div className="drg-edu-myths">{myths.map(([myth,reality],index)=><details key={myth}><summary><span>Mito {index+1}</span><strong>{myth}</strong></summary><p><b>Realidad:</b> {reality}</p></details>)}</div></section>

      <section className="drg-edu-section drg-edu-tint"><div className="drg-container"><header className="drg-edu-heading"><p className="drg-kicker">Evita puntos ciegos</p><h2>Errores comunes por perfil</h2></header><div className="drg-edu-segments">{Object.keys(mistakes).map(item=><button className={profile===item?"is-active":""} onClick={()=>setProfile(item)} key={item}>{item}</button>)}</div><ol className="drg-edu-mistakes">{mistakes[profile].map((item,index)=><li key={item}><span>{String(index+1).padStart(2,"0")}</span>{item}</li>)}</ol></div></section>

      <section className="drg-edu-section drg-container" id="guias"><header className="drg-edu-heading"><p className="drg-kicker">Biblioteca esencial</p><h2>Guías prácticas</h2></header><div className="drg-edu-guides">{guides.map(guide=><article key={guide.id}><span>{guide.category}</span><h3>{guide.title}</h3><p>{guide.description}</p><small>{guide.time} de lectura</small><button onClick={()=>setGuideId(guide.id)}>Leer guía</button></article>)}</div>{currentGuide?<div className="drg-edu-guide-open"><button onClick={()=>setGuideId(null)}>×</button><p className="drg-kicker">{currentGuide.category} · {currentGuide.time}</p><h2>{currentGuide.title}</h2><p>{currentGuide.description}</p><ol>{currentGuide.body.map(item=><li key={item}>{item}</li>)}</ol></div>:null}</section>

      <section className="drg-edu-section drg-edu-quiz"><div className="drg-container"><header className="drg-edu-heading"><p className="drg-kicker">Evaluación educativa</p><h2>Pon a prueba tus conocimientos</h2></header>{quizIndex<quiz.length?<article><p>Pregunta {quizIndex+1} de {quiz.length}</p><h3>{q.question}</h3><div>{q.options.map((option,index)=><button key={option} disabled={answer!==null} className={answer!==null&&index===q.answer?"is-correct":""} onClick={()=>chooseAnswer(index)}>{option}</button>)}</div>{answer!==null?<p>{answer===q.answer?"Correcto. ":"Sigue aprendiendo. "}{q.feedback}</p>:null}<button disabled={answer===null} onClick={nextQuiz}>{quizIndex===quiz.length-1?"Ver resultado":"Siguiente pregunta"}</button></article>:<article><p className="drg-kicker">Resultado</p><h3>{score} de {quiz.length} respuestas correctas</h3><p>{score>=5?"Buena base para tomar decisiones.":score>=3?"Vas por buen camino.":"Te recomendamos repasar algunos conceptos."}</p><button onClick={resetQuiz}>Intentar nuevamente</button></article>}</div></section>

      <section className="drg-edu-section drg-container" id="preguntas"><header className="drg-edu-heading"><p className="drg-kicker">Respuestas breves</p><h2>Preguntas frecuentes</h2></header><div className="drg-edu-faq">{faqs.map(([question,response])=><details key={question}><summary>{question}<span>+</span></summary><p>{response}</p></details>)}</div></section>

      <section className="drg-edu-section drg-container"><div className="drg-edu-final"><p className="drg-kicker">Acompañamiento profesional</p><h2>El conocimiento es el primer paso. El acompañamiento correcto hace la diferencia.</h2><p>Habla con un agente de Diamantes Realty Group y recibe orientación según tu objetivo, presupuesto y tipo de propiedad.</p><div><a href="https://wa.me/50577265009" target="_blank" rel="noreferrer">Hablar con un agente</a><Link href="/propiedades">Explorar propiedades</Link><Link href="/quieres-vender">Quiero vender mi propiedad</Link></div></div><p className="drg-edu-legal">Este contenido es informativo y no sustituye la revisión de un abogado, notario, contador, valuador u otro profesional competente.</p></section>
    </>
  );
}
