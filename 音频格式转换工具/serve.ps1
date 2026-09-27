<#
  serve.ps1 —— 音频格式转换工具 · 本地静态服务器（零依赖）

  为什么必须有这个服务器：
    浏览器禁止 file:// 页面加载 Web Worker 与本地脚本，而 ffmpeg.wasm 必须
    在 Worker 里运行。因此需要通过 http:// 提供页面。
    以前这里用 python -m http.server，但本机只有微软商店的 0 字节 python.exe
    假壳（执行后立刻以 9009 退出），导致“连接被拒绝”。现在改为只用 Windows
    自带的 PowerShell + .NET HttpListener，不再需要安装任何东西。

  用法：
    powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1
    可选参数： -Port 8765  -NoBrowser  -MaxPortTries 20
#>
[CmdletBinding()]
param(
    [int]    $Port         = 8765,
    [string] $Root         = '',
    [switch] $NoBrowser,
    [int]    $MaxPortTries = 20
)

$ErrorActionPreference = 'Stop'
$HostAddr = '127.0.0.1'

# 注意：不要把 $PSScriptRoot 写在 param 块默认值里。
# 带 [CmdletBinding()] 的脚本用 powershell.exe -File 调用时，该默认值会变成空字符串。
if ([string]::IsNullOrEmpty($Root)) { $Root = $PSScriptRoot }
if ([string]::IsNullOrEmpty($Root)) { $Root = (Get-Location).Path }
if ([string]::IsNullOrEmpty($Root)) {
    Write-Host '[ERROR] 无法确定要发布的目录，请用 -Root 指定。' -ForegroundColor Red
    exit 1
}

$MimeMap = @{
    '.html'  = 'text/html; charset=utf-8'
    '.htm'   = 'text/html; charset=utf-8'
    '.js'    = 'application/javascript; charset=utf-8'
    '.mjs'   = 'application/javascript; charset=utf-8'
    '.css'   = 'text/css; charset=utf-8'
    '.json'  = 'application/json; charset=utf-8'
    '.map'   = 'application/json; charset=utf-8'
    '.txt'   = 'text/plain; charset=utf-8'
    '.wasm'  = 'application/wasm'
    '.svg'   = 'image/svg+xml'
    '.png'   = 'image/png'
    '.jpg'   = 'image/jpeg'
    '.jpeg'  = 'image/jpeg'
    '.gif'   = 'image/gif'
    '.ico'   = 'image/x-icon'
    '.woff'  = 'font/woff'
    '.woff2' = 'font/woff2'
    '.mp3'   = 'audio/mpeg'
    '.wav'   = 'audio/wav'
    '.flac'  = 'audio/flac'
    '.ogg'   = 'audio/ogg'
    '.m4a'   = 'audio/mp4'
    '.pdf'   = 'application/pdf'
}

function Test-TcpPort {
    param([string]$Address, [int]$Port, [int]$TimeoutMs = 700)
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect($Address, $Port, $null, $null)
        if (-not $async.AsyncWaitHandle.WaitOne($TimeoutMs)) { return $false }
        $client.EndConnect($async)
        return $true
    }
    catch { return $false }
    finally { $client.Close() }
}

function Test-OurServer {
    param([string]$Address, [int]$Port)
    try {
        $r = Invoke-WebRequest -Uri ('http://{0}:{1}/' -f $Address, $Port) -UseBasicParsing -TimeoutSec 3
        return ($r.StatusCode -eq 200)
    }
    catch { return $false }
}

# ---------------- 选择可用端口（避免端口被占导致“连接被拒绝”） ----------------
$listenPort = 0
$reused     = $false
for ($candidate = $Port; $candidate -lt ($Port + $MaxPortTries); $candidate++) {
    if (-not (Test-TcpPort -Address $HostAddr -Port $candidate)) { $listenPort = $candidate; break }
    if (Test-OurServer -Address $HostAddr -Port $candidate) { $listenPort = $candidate; $reused = $true; break }
    Write-Host ('  端口 {0} 已被其它程序占用，尝试下一个端口…' -f $candidate) -ForegroundColor Yellow
}
if ($listenPort -eq 0) {
    Write-Host ('[ERROR] 端口 {0}-{1} 全部被占用，无法启动服务器。' -f $Port, ($Port + $MaxPortTries - 1)) -ForegroundColor Red
    exit 1
}

$url = 'http://{0}:{1}/' -f $HostAddr, $listenPort

if ($reused) {
    Write-Host ''
    Write-Host '  检测到本工具已在运行，直接打开浏览器。' -ForegroundColor Green
    Write-Host ('  地址: {0}' -f $url)
    Write-Host ''
    if (-not $NoBrowser) { Start-Process $url }
    exit 0
}

# ---------------- 路径解析（含 ../ 穿越防护） ----------------
$rootFull = [System.IO.Path]::GetFullPath($Root).TrimEnd('\') + '\'

function Resolve-FilePath {
    param([string]$UrlPath, [string]$RootFullPath)

    $p = $UrlPath
    $i = $p.IndexOf('?'); if ($i -ge 0) { $p = $p.Substring(0, $i) }
    $i = $p.IndexOf('#'); if ($i -ge 0) { $p = $p.Substring(0, $i) }
    try { $p = [System.Uri]::UnescapeDataString($p) } catch { }
    if ($p -eq '' -or $p -eq '/') { $p = '/index.html' }

    $rel  = $p.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    $full = [System.IO.Path]::GetFullPath((Join-Path $RootFullPath $rel))

    if (-not $full.StartsWith($RootFullPath, [System.StringComparison]::OrdinalIgnoreCase)) { return $null }
    if ([System.IO.Directory]::Exists($full)) { $full = Join-Path $full 'index.html' }
    if ([System.IO.File]::Exists($full)) { return $full }
    return $null
}

function Write-PlainError {
    param($Response, [int]$Code, [string]$Text)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
    $Response.StatusCode = $Code
    $Response.ContentType = 'text/plain; charset=utf-8'
    $Response.ContentLength64 = $bytes.Length
    $Response.OutputStream.Write($bytes, 0, $bytes.Length)
}

function Send-Response {
    param($Context)

    $req  = $Context.Request
    $resp = $Context.Response
    $resp.KeepAlive = $false
    $method = $req.HttpMethod

    if ($method -ne 'GET' -and $method -ne 'HEAD') {
        Write-PlainError -Response $resp -Code 405 -Text 'Only GET / HEAD is supported.'
        Write-Host ('  405 {0} {1}' -f $method, $req.RawUrl)
        return
    }

    $file = Resolve-FilePath -UrlPath $req.RawUrl -RootFullPath $rootFull
    if (-not $file) {
        Write-PlainError -Response $resp -Code 404 -Text ('404 Not Found: ' + $req.RawUrl)
        Write-Host ('  404 {0}' -f $req.RawUrl) -ForegroundColor DarkYellow
        return
    }

    $info = Get-Item -LiteralPath $file
    $ext  = $info.Extension.ToLowerInvariant()
    $contentType = 'application/octet-stream'
    if ($MimeMap.ContainsKey($ext)) { $contentType = $MimeMap[$ext] }

    $resp.StatusCode      = 200
    $resp.ContentType     = $contentType
    $resp.ContentLength64 = $info.Length
    $resp.Headers['Cache-Control'] = 'no-cache'
    $resp.Headers['Last-Modified'] = $info.LastWriteTimeUtc.ToString('R')

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    if ($method -eq 'GET') {
        $stream = [System.IO.File]::Open($file, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
        try {
            # 用 .NET 原生 CopyTo（纯 C# 循环），比在 PowerShell 里逐块读写快一个数量级
            $stream.CopyTo($resp.OutputStream, 1048576)
        }
        finally { $stream.Dispose() }
    }
    $sw.Stop()
    Write-Host ('  200 {0}  {1,12:N0} B  {2,6:N2}s  {3}' -f $req.RawUrl, $info.Length, $sw.Elapsed.TotalSeconds, $contentType)
}

# ---------------- 启动监听（绑定成功后才打开浏览器） ----------------
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
$listener.IgnoreWriteExceptions = $true

try {
    $listener.Start()
}
catch {
    Write-Host ('[ERROR] 无法绑定 {0}' -f $url) -ForegroundColor Red
    Write-Host ('        {0}: {1}' -f $_.Exception.GetType().Name, $_.Exception.Message) -ForegroundColor Red
    Write-Host '        端口可能被占用，请关闭占用程序后重试。' -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host '  ================================================' -ForegroundColor Cyan
Write-Host '   音频格式转换工具 · 本地服务器已启动' -ForegroundColor Green
Write-Host '  ================================================' -ForegroundColor Cyan
Write-Host ('   地址   : {0}' -f $url)
Write-Host ('   目录   : {0}' -f $rootFull)
Write-Host '   说明   : 关闭本窗口或按 Ctrl+C 即可停止服务' -ForegroundColor DarkGray
Write-Host ''

if (-not $NoBrowser) { Start-Process $url }

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try   { Send-Response $context }
        catch { Write-Host ('  [warn] {0}' -f $_.Exception.Message) -ForegroundColor DarkYellow }
        finally { try { $context.Response.Close() } catch { } }
    }
}
finally {
    try { $listener.Stop(); $listener.Close() } catch { }
    Write-Host ''
    Write-Host '  服务器已停止。' -ForegroundColor DarkGray
}
