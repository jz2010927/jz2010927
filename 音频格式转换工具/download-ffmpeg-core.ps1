$ErrorActionPreference = "Stop"

$version = "0.12.10"
$downloadUrl = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@$version/dist/umd/ffmpeg-core.wasm"
$targetDirectory = Join-Path $PSScriptRoot "vendor\ffmpeg-core"
$targetFile = Join-Path $targetDirectory "ffmpeg-core.wasm"
$temporaryFile = "$targetFile.download"
$minimumExpectedBytes = 30000000

if (Test-Path -LiteralPath $targetFile) {
    $existingFile = Get-Item -LiteralPath $targetFile
    if ($existingFile.Length -ge $minimumExpectedBytes) {
        Write-Host "FFmpeg core is ready."
        exit 0
    }

    Write-Host "Existing FFmpeg core is incomplete and will be downloaded again."
    Remove-Item -LiteralPath $targetFile -Force
}

New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
Remove-Item -LiteralPath $temporaryFile -Force -ErrorAction SilentlyContinue

try {
    Write-Host "FFmpeg core was not found."
    Write-Host "Downloading @ffmpeg/core $version (about 32 MB)..."

    $progressPreference = "SilentlyContinue"
    Invoke-WebRequest -Uri $downloadUrl -OutFile $temporaryFile -UseBasicParsing

    $downloadedFile = Get-Item -LiteralPath $temporaryFile
    if ($downloadedFile.Length -lt $minimumExpectedBytes) {
        throw "Downloaded file is too small ($($downloadedFile.Length) bytes)."
    }

    Move-Item -LiteralPath $temporaryFile -Destination $targetFile -Force
    Unblock-File -LiteralPath $targetFile -ErrorAction SilentlyContinue
    Write-Host "FFmpeg core download completed."
    exit 0
}
catch {
    Remove-Item -LiteralPath $temporaryFile -Force -ErrorAction SilentlyContinue
    Write-Host "Download error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
