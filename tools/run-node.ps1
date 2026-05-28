param(
    [Alias('e')]
    [Parameter(ValueFromPipeline = $false)]
    [string]$Eval,

    [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
    [string[]]$NodeArgs
)

if ($PSBoundParameters.ContainsKey('Eval')) {
    $NodeArgs = @('-e', $Eval) + $NodeArgs
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCommand) {
    & $nodeCommand.Source @NodeArgs
    exit $LASTEXITCODE
}

$codexBin = Join-Path $env:LOCALAPPDATA 'OpenAI\Codex\bin'
$codexNodes = @()
if (Test-Path -LiteralPath $codexBin) {
    $codexNodes = Get-ChildItem -Path $codexBin -Recurse -Filter node.exe -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending
}

if ($codexNodes.Count -gt 0) {
    & $codexNodes[0].FullName @NodeArgs
    exit $LASTEXITCODE
}

Write-Error 'Node.js was not found. Install Node.js or run this project from a Codex environment with bundled Node.'
exit 1
