$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$PSScriptRoot\SkllPlayer.lnk")
$Shortcut.TargetPath = "$PSScriptRoot\start.bat"
$Shortcut.WorkingDirectory = $PSScriptRoot
$Shortcut.WindowStyle = 7  # Minimized
$Shortcut.Save()
Write-Host "Atalho SkllPlayer.lnk criado!" -ForegroundColor Green
