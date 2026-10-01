const steps=[
  {number:1,label:"Datos principales"},
  {number:2,label:"Características"},
  {number:3,label:"Ubicación y contrato"},
  {number:4,label:"Multimedia y revisión"}
] as const;

export function PropertyFormStepper({step,onStepChange}:{step:number;onStepChange:(step:number)=>void}){
  return <div className="drg-property-stepper" aria-label="Progreso de la propiedad">
    {steps.map(item=><button
      key={item.number}
      type="button"
      className={item.number===step?"is-active":item.number<step?"is-complete":""}
      disabled={item.number>=step}
      onClick={()=>item.number<step&&onStepChange(item.number)}
      aria-current={item.number===step?"step":undefined}
    >
      <span>{item.number<step?"✓":item.number}</span>
      <strong>{item.label}</strong>
    </button>)}
  </div>;
}
