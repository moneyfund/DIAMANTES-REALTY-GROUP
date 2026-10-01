import assert from "node:assert/strict";
import test from "node:test";
import { cleanPublicFormValue } from "../src/lib/firebase/forms";

test("public form sanitizer strips angle brackets and normalizes whitespace",()=>{
  assert.equal(cleanPublicFormValue("  Hola   <script> mundo  ",100),"Hola script mundo");
});

test("public form sanitizer enforces maximum length",()=>{
  assert.equal(cleanPublicFormValue("abcdefghij",5),"abcde");
});
