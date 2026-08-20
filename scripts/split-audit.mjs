import fs from 'fs';
import path from 'path';

const ESLINT_REPORT = './docs/audits/eslint-report.json';
const OUTPUT_DIR = './docs/audits/batches';
const BATCH_SIZE = 4; // Procesaremos 4 archivos defectuosos por Prompt

if (!fs.existsSync(ESLINT_REPORT)) {
  console.error('❌ No se encontró el reporte ESLint. Ejecuta npm run audit:all primero.');
  process.exit(1);
}

const rawData = fs.readFileSync(ESLINT_REPORT, 'utf8');
const report = JSON.parse(rawData);

// Filtrar solo los archivos que tienen errores y mapear la data para ahorrar tokens
const defectiveFiles = report
  .filter(file => file.errorCount > 0 || file.warningCount > 0)
  .map(file => {
    // Extraer solo la ruta relativa para no gastar tokens en rutas absolutas largas
    const relativePath = file.filePath.split(/frontend|backend|shared/)[1] 
      ? file.filePath.match(/(frontend|backend|shared).*/)[0] 
      : file.filePath;

    return {
      file: relativePath.replace(/\\/g, '/'),
      errors: file.messages.map(m => `Línea ${m.line}: [${m.ruleId}] ${m.message}`)
    };
  });

if (defectiveFiles.length === 0) {
  console.log('✅ ¡Cero errores detectados! El código está impecable.');
  process.exit(0);
}

// Crear el directorio de salida si no existe
// LIMPIEZA RADICAL: Borrar la carpeta de batches anterior si existe
if (fs.existsSync(OUTPUT_DIR)) {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
}

// Crear el directorio de salida limpio
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Dividir en lotes (Batches) y generar los Prompts
let batchCount = 1;
for (let i = 0; i < defectiveFiles.length; i += BATCH_SIZE) {
  const batch = defectiveFiles.slice(i, i + BATCH_SIZE);
  
  const promptContent = `
# [SYSTEM OVERRIDE: ATOMIC REFACTORING MODE - BATCH ${batchCount}]

**CONTEXTO:**
Actúa como el Ingeniero de Software Lead. Tienes la tarea de resolver las violaciones de código detectadas por ESLint/SonarJS bajo las reglas estrictas de \`.antigravityrules\`.

**DIRECTIVAS DE EJECUCIÓN:**
1. Resuelve ÚNICAMENTE los errores listados en este lote.
2. Si el error es \`jsdoc/require-jsdoc\`, genera la documentación JSDoc correcta explicando qué hace el método, sus parámetros (\`@param\`) y su retorno (\`@returns\`).
3. Si el error es \`no-explicit-any\`, infiere el tipo correcto o usa \`unknown\`/genéricos.
4. Si el error es \`cognitive-complexity\`, refactoriza el método extrayendo lógica a funciones privadas para reducir la complejidad.
5. NO devuelvas el archivo completo. Utiliza \`// ... existing code\` y muestra solo los bloques modificados con su ruta en la primera línea.

**ERRORES A RESOLVER EN ESTE LOTE:**
\`\`\`json
${JSON.stringify(batch, null, 2)}
\`\`\`

**OUTPUT ESPERADO:**
Ejecuta la refactorización para estos archivos y entrégame los bloques de código corregidos.
`.trim();

  fs.writeFileSync(path.join(OUTPUT_DIR, `batch_${batchCount.toString().padStart(2, '0')}.md`), promptContent);
  batchCount++;
}

console.log(`🚀 Auditoría dividida con éxito. Se generaron ${batchCount - 1} archivos de batch en /docs/audits/batches/`);