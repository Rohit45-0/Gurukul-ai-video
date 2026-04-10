$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$stage = Join-Path $root '.railway-deploy'

if (Test-Path $stage) {
  Remove-Item $stage -Recurse -Force
}

New-Item -ItemType Directory -Path $stage | Out-Null
Copy-Item (Join-Path $root 'Dockerfile') -Destination $stage
Copy-Item (Join-Path $root 'railway.json') -Destination $stage
Copy-Item (Join-Path $root '.dockerignore') -Destination $stage
Copy-Item (Join-Path $root 'scripts') -Destination $stage -Recurse

Copy-Item (Join-Path $root 'teacherdesk_mobile') -Destination $stage -Recurse

$tempStage = Join-Path $stage '.temp'
New-Item -ItemType Directory -Path $tempStage | Out-Null
Copy-Item (Join-Path $root '.temp\gurukul-ai-community') -Destination $tempStage -Recurse

Get-ChildItem $stage -Recurse -Directory -Filter 'node_modules' |
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Get-ChildItem $stage -Recurse -Directory |
  Where-Object { $_.Name -in @('dist', '.dart_tool', '.next', '.git', 'build') } |
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Write-Output $stage
