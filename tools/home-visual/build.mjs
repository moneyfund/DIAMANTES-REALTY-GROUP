import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url));
for (const [entry, output] of [['three-entry.js', 'three.js'], ['motion-entry.js', 'motion.js']]) {
  await build({entryPoints:[path.join(root,entry)], bundle:true, format:'esm', minify:true, legalComments:'eof', target:['es2020'], outfile:path.join(root,'../../js/home/vendor',output)});
}
