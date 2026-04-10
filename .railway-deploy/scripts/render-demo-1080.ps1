param(
  [string]$OutputPath
)

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$workspaceDriveName = (Split-Path $projectRoot -Qualifier).TrimEnd(":")
$workspaceDrive = Get-PSDrive -Name $workspaceDriveName

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  if ($workspaceDrive.Free -gt 512MB) {
    $OutputPath = Join-Path $projectRoot "out\metals-and-non-metals-demo-voiced-1080.mp4"
  } elseif (Test-Path "D:\") {
    $OutputPath = "D:\Gurukul-video-build\out\metals-and-non-metals-demo-voiced-1080.mp4"
  } else {
    throw "No safe output path found. Free some space on $workspaceDriveName`: or provide -OutputPath."
  }
}

$outputDir = Split-Path $OutputPath -Parent
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$tempRoot =
  if (Test-Path "D:\") {
    "D:\Temp\remotion"
  } else {
    Join-Path $projectRoot ".temp\remotion"
  }

New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null
$env:TEMP = $tempRoot
$env:TMP = $tempRoot

Push-Location $projectRoot
try {
  Write-Host "Rendering full HD video to $OutputPath"
  $remotionCli = Join-Path $projectRoot "node_modules\.bin\remotion.cmd"
  & $remotionCli render MetalsAndNonMetalsDemo $OutputPath --codec=h264
} finally {
  Pop-Location
}
