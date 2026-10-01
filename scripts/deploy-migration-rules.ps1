param([string]$ProjectId = "inmo-nicaragua")

$ErrorActionPreference = "Stop"
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) { throw "Node.js/npm no está disponible." }

Write-Host "Proyecto objetivo: $ProjectId"
Write-Host "Se desplegarán SOLO las reglas propuestas de Firestore y Storage."
Write-Host "No se despliega la web ni se modifica ningún documento."

npx --yes firebase-tools deploy --project $ProjectId --config firebase.migration.json --only firestore:rules,storage
if ($LASTEXITCODE -ne 0) { throw "El despliegue de reglas falló." }
Write-Host "Reglas de migración desplegadas correctamente."