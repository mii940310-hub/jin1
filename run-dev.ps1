param(
  [int]$Port = 3000,
  [switch]$CleanCache
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeDir = Join-Path $projectRoot '.tools\node'
$nodeExe = Join-Path $nodeDir 'node.exe'
$nextBin = Join-Path $projectRoot 'node_modules\next\dist\bin\next'

if (-not (Test-Path -LiteralPath $nodeExe)) {
  throw "Local Node.js was not found at '$nodeExe'."
}

if (-not (Test-Path -LiteralPath $nextBin)) {
  throw "Next.js CLI was not found at '$nextBin'."
}

$env:Path = "$nodeDir;$env:Path"
Set-Location -LiteralPath $projectRoot

# Stop stale local Next dev processes for this workspace before starting a fresh one.
$staleProcesses = Get-CimInstance Win32_Process |
  Where-Object {
    $_.CommandLine -and
    $_.CommandLine -like "*$projectRoot*" -and
    $_.CommandLine -like "*node_modules\\next\\dist\\bin\\next* dev*"
  }

foreach ($process in $staleProcesses) {
  try {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction Stop
  } catch {
    Write-Warning "Could not stop stale dev process $($process.ProcessId): $($_.Exception.Message)"
  }
}

$portListener = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $_.LocalPort -eq $Port } |
  Select-Object -First 1

if ($portListener) {
  $portProcesses = Get-CimInstance Win32_Process |
    Where-Object {
      $_.ProcessId -eq $portListener.OwningProcess -or
      $_.ParentProcessId -eq $portListener.OwningProcess
    }

  foreach ($process in $portProcesses) {
    try {
      Stop-Process -Id $process.ProcessId -Force -ErrorAction Stop
    } catch {
      Write-Warning "Could not stop process on port $Port ($($process.ProcessId)): $($_.Exception.Message)"
    }
  }

  Start-Sleep -Seconds 1
}

if ($CleanCache) {
  $nextCachePath = Join-Path $projectRoot '.next'
  if (Test-Path -LiteralPath $nextCachePath) {
    Remove-Item -LiteralPath $nextCachePath -Recurse -Force
  }
}

Write-Host "Starting Next.js dev server in webpack mode on http://localhost:$Port" -ForegroundColor Green
Write-Host "Workspace: $projectRoot" -ForegroundColor DarkGray

$nextArgs = @($nextBin, 'dev', '--webpack', '--port', $Port) + $args
& $nodeExe @nextArgs
