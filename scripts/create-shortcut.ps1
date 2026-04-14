$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Claw 桌面宠物.lnk")
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Shortcut.TargetPath = "cmd.exe"
$Shortcut.Arguments = "/c cd /d `"$ProjectRoot`" && npm start"
$Shortcut.WorkingDirectory = $ProjectRoot
$Shortcut.Description = "Claw 桌面宠物 - Gateway AI 助手"
$Shortcut.WindowStyle = 7
$Shortcut.Save()
Write-Host "快捷方式已创建!"
