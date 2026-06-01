param(
    [string]$Port,
    [string[]]$States = @("running", "approval", "done", "error", "idle", "running"),
    [double]$Brightness = 0.12,
    [int]$Baud = 115200
)

if (-not $Port) {
    $ports = [System.IO.Ports.SerialPort]::GetPortNames() | Sort-Object
    Write-Host "Available serial ports:"
    foreach ($candidate in $ports) {
        Write-Host "  $candidate"
    }
    throw "Pass -Port COMx, for example: -Port COM7"
}

if ($States.Count -gt 6) {
    throw "At most 6 states are supported."
}

$validStates = @("idle", "running", "approval", "done", "error", "cleared")
foreach ($state in $States) {
    if ($validStates -notcontains $state) {
        throw "Invalid state '$state'. Valid states: $($validStates -join ', ')"
    }
}

$payload = @{
    slots = $States
    brightness = $Brightness
} | ConvertTo-Json -Compress

$serial = [System.IO.Ports.SerialPort]::new($Port, $Baud, [System.IO.Ports.Parity]::None, 8, [System.IO.Ports.StopBits]::One)
$serial.NewLine = "`n"
$serial.DtrEnable = $true
$serial.RtsEnable = $true

try {
    $serial.Open()
    Start-Sleep -Milliseconds 250
    $serial.WriteLine($payload)
    Write-Host "Sent to $Port: $payload"
}
finally {
    if ($serial.IsOpen) {
        $serial.Close()
    }
    $serial.Dispose()
}

