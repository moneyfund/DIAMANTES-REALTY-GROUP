import assert from "node:assert/strict";
import test from "node:test";
import { buildAgentPropertyPayload, emptyAgentPropertyDraft, validateContractDates } from "../src/lib/properties/private";

const user={uid:"uid-agent",email:"agent@example.com",displayName:"Agente Uno"};

test("agent property payload preserves legacy aliases and ownership",()=>{
  const draft={...emptyAgentPropertyDraft(),title:"Casa moderna",priceUsd:125000,location:"Matagalpa, Nicaragua",department:"Matagalpa",description:"Descripción",type:"house",operation:"venta",bedrooms:3,bathrooms:2,details:{constructionArea:180,areaUnit:"m²"},images:["https://example.com/1.jpg"],coverImage:"https://example.com/1.jpg"};
  const payload=buildAgentPropertyPayload(draft,user as never,null);
  assert.equal(payload.title,"Casa moderna");
  assert.equal(payload.titulo,"Casa moderna");
  assert.equal(payload.agentId,"uid-agent");
  assert.equal(payload.ownerId,"uid-agent");
  assert.equal(payload.createdBy,"uid-agent");
  assert.equal(payload.agentEmail,"agent@example.com");
  assert.equal(payload.tipoOperacion,"venta");
  assert.equal(payload.propertyType,"house");
  assert.equal(payload.coverImage,"https://example.com/1.jpg");
});

test("contract validation prevents inverted ranges",()=>{
  assert.equal(validateContractDates("2026-09-30","2026-10-30").valid,true);
  assert.equal(validateContractDates("2026-10-30","2026-09-30").valid,false);
  assert.equal(validateContractDates("2026-10-30","").valid,false);
});
