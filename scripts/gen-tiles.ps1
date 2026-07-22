# Generates the Edge Add-ons promotional tiles into store/.
# Windows only, and deliberately so: System.Drawing ships with the OS, which
# beats adding an image toolchain for two static images. Run: npm run tiles
#
# Note: PowerShell variables are case-insensitive, so $h and $H are the same
# variable. Names here are kept distinct on purpose.

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$iconPath = Join-Path $root 'icons\icon-300.png'
$outDir = Join-Path $root 'store'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$BG = [System.Drawing.ColorTranslator]::FromHtml('#0d1117')
$FG = [System.Drawing.ColorTranslator]::FromHtml('#e6edf3')
$MUTED = [System.Drawing.ColorTranslator]::FromHtml('#8b949e')

$TITLE = 'GitHub Issues to CSV'
$SUBTITLE = 'Export the issues you have filtered, straight into Excel.'

function New-Tile {
    param(
        [int]$TileWidth,
        [int]$TileHeight,
        [int]$IconSize,
        [int]$TitleSize,
        [int]$SubtitleSize,
        [string]$OutFile
    )

    $icon = [System.Drawing.Image]::FromFile($iconPath)
    $bmp = New-Object System.Drawing.Bitmap($TileWidth, $TileHeight)
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    $gfx.Clear($BG)
    $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gfx.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    # Icon on the left, vertically centred; text block fills the rest.
    $pad = [int]($TileWidth * 0.06)
    $iconY = [int](($TileHeight - $IconSize) / 2)
    $gfx.DrawImage($icon, $pad, $iconY, $IconSize, $IconSize)

    $textX = $pad + $IconSize + [int]($TileWidth * 0.045)
    $textW = $TileWidth - $textX - $pad

    $titleFont = New-Object System.Drawing.Font('Segoe UI', $TitleSize, [System.Drawing.FontStyle]::Bold)
    $subFont = New-Object System.Drawing.Font('Segoe UI', $SubtitleSize, [System.Drawing.FontStyle]::Regular)
    $titleBrush = New-Object System.Drawing.SolidBrush($FG)
    $subBrush = New-Object System.Drawing.SolidBrush($MUTED)

    $titleH = $gfx.MeasureString($TITLE, $titleFont, $textW).Height
    $subH = $gfx.MeasureString($SUBTITLE, $subFont, $textW).Height
    $gap = [int]($TileHeight * 0.035)
    $blockY = [int](($TileHeight - ($titleH + $gap + $subH)) / 2)

    $gfx.DrawString($TITLE, $titleFont, $titleBrush,
        (New-Object System.Drawing.RectangleF($textX, $blockY, $textW, $titleH)))
    $gfx.DrawString($SUBTITLE, $subFont, $subBrush,
        (New-Object System.Drawing.RectangleF($textX, ($blockY + $titleH + $gap), $textW, $subH)))

    $target = Join-Path $outDir $OutFile
    $gfx.Dispose()
    $bmp.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose(); $icon.Dispose()
    $titleFont.Dispose(); $subFont.Dispose(); $titleBrush.Dispose(); $subBrush.Dispose()
    Write-Output "wrote store/$OutFile"
}

New-Tile -TileWidth 440 -TileHeight 280 -IconSize 110 -TitleSize 17 -SubtitleSize 9 -OutFile 'promo-440x280.png'
New-Tile -TileWidth 1400 -TileHeight 560 -IconSize 300 -TitleSize 52 -SubtitleSize 26 -OutFile 'promo-1400x560.png'
