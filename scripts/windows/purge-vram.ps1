param(
    [int]$PollSeconds = 2,
    [int]$TimeoutSeconds = 20,
    [int]$StableDeltaMiB = 64,
    [switch]$KillOllama,
    [switch]$KillPython
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-NvidiaSmiValue {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Query
    )

    $result = & nvidia-smi --query-gpu=$Query --format=csv,noheader,nounits 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $result) {
        throw "nvidia-smi query failed for '$Query'."
    }

    return ($result | Select-Object -First 1).Trim()
}

function Get-GpuSnapshot {
    $name = Get-NvidiaSmiValue -Query "name"
    $total = [int](Get-NvidiaSmiValue -Query "memory.total")
    $free = [int](Get-NvidiaSmiValue -Query "memory.free")
    $used = [int](Get-NvidiaSmiValue -Query "memory.used")
    $displayActive = Get-NvidiaSmiValue -Query "display_active"

    return [pscustomobject]@{
        Name = $name
        TotalMiB = $total
        FreeMiB = $free
        UsedMiB = $used
        DisplayActive = $displayActive
    }
}

function Get-ComputeApps {
    $lines = & nvidia-smi --query-compute-apps=pid,process_name,used_memory --format=csv,noheader 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $lines) {
        return @()
    }

    return $lines |
        Where-Object { $_.Trim() } |
        ForEach-Object {
            $parts = $_.Split(",").ForEach({ $_.Trim() })
            [pscustomobject]@{
                Pid = $parts[0]
                ProcessName = $parts[1]
                UsedMemory = $parts[2]
            }
        }
}

function Stop-ProcessByName {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    $null = & cmd /c "taskkill /F /IM $Name >nul 2>nul"
}

function Show-Snapshot {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Label,
        [Parameter(Mandatory = $true)]
        [pscustomobject]$Snapshot
    )

    Write-Host ""
    Write-Host "[$Label]" -ForegroundColor Cyan
    Write-Host ("  GPU           : {0}" -f $Snapshot.Name)
    Write-Host ("  Total VRAM    : {0} MiB" -f $Snapshot.TotalMiB)
    Write-Host ("  Free VRAM     : {0} MiB" -f $Snapshot.FreeMiB)
    Write-Host ("  Used VRAM     : {0} MiB" -f $Snapshot.UsedMiB)
    Write-Host ("  Display Active: {0}" -f $Snapshot.DisplayActive)
}

$before = Get-GpuSnapshot
Show-Snapshot -Label "Before purge" -Snapshot $before

Write-Host ""
Write-Host "[Action] Stopping LLM processes" -ForegroundColor Yellow
Stop-ProcessByName -Name "llama-server.exe"
Stop-ProcessByName -Name "llama-bench.exe"
if ($KillOllama) {
    Stop-ProcessByName -Name "ollama.exe"
}
if ($KillPython) {
    Stop-ProcessByName -Name "python.exe"
}

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
$previousUsed = $before.UsedMiB

do {
    Start-Sleep -Seconds $PollSeconds
    $current = Get-GpuSnapshot
    $delta = [math]::Abs($current.UsedMiB - $previousUsed)
    $previousUsed = $current.UsedMiB
} while ((Get-Date) -lt $deadline -and $delta -gt $StableDeltaMiB)

$after = Get-GpuSnapshot
Show-Snapshot -Label "After purge" -Snapshot $after

$freed = $after.FreeMiB - $before.FreeMiB
Write-Host ""
Write-Host ("Freed VRAM: {0} MiB" -f $freed) -ForegroundColor Green

$apps = @(Get-ComputeApps)
if ($apps.Count -gt 0) {
    Write-Host ""
    Write-Host "[Active compute apps]" -ForegroundColor Yellow
    $apps | Format-Table -AutoSize
} else {
    Write-Host ""
    Write-Host "[Active compute apps] none" -ForegroundColor Green
}

Write-Host ""
Write-Host "Note: Windows graphics/UI processes can still reserve a few hundred MiB even after purge." -ForegroundColor DarkGray
