param(
  [string]$ProjectId = "inmo-nicaragua",
  [string]$Bucket = "inmo-nicaragua.firebasestorage.app"
)

$ErrorActionPreference = "Stop"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$target = "gs://$Bucket/drg-migration-backups/$stamp/firestore"
$manifest = "firestore-backup-$stamp.json"

function Require-Command([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "No se encontró $name. Instala Google Cloud CLI antes de continuar."
  }
}

Require-Command "gcloud"

$account = (gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null | Select-Object -First 1)
if (-not $account) { throw "No hay una cuenta activa. Ejecuta: gcloud auth login" }

Write-Host "Cuenta activa: $account"
Write-Host "Proyecto: $ProjectId"
Write-Host "Destino del backup: $target"
Write-Host "Este comando SOLO crea una exportación; no modifica ni elimina documentos existentes."

gcloud config set project $ProjectId | Out-Host
gcloud firestore export $target --project=$ProjectId --database="(default)"
if ($LASTEXITCODE -ne 0) { throw "La exportación de Firestore falló. No continúes con el despliegue de reglas." }

$info = [ordered]@{
  projectId = $ProjectId
  account = $account
  createdAt = (Get-Date).ToString("o")
  firestoreExport = $target
  productionCommit = "fc653b1375ab48ee615a25d478ef01622ae0cf82"
  drgNextReadOnlyCommit = "4b9133eff45e88c5029106ec017bf5c18a430d25"
}
$info | ConvertTo-Json | Set-Content -Encoding UTF8 $manifest

Write-Host "BACKUP COMPLETADO."
Write-Host "Manifiesto local: $manifest"
Write-Host "Exportación: $target"