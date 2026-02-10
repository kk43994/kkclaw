# 创建桌面龙虾快捷方式
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $DesktopPath "🦞 桌面龙虾.lnk"

# 创建快捷方式对象
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# 设置目标（npm start）
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoExit -Command `"cd 'C:\Users\zhouk\Desktop\02_开发项目\desktop-pet'; npm start`""
$Shortcut.WorkingDirectory = "C:\Users\zhouk\Desktop\02_开发项目\desktop-pet"
$Shortcut.Description = "桌面龙虾 - 透明AI伴侣"
$Shortcut.IconLocation = "C:\Users\zhouk\Desktop\02_开发项目\desktop-pet\icon.ico"
$Shortcut.WindowStyle = 7  # 最小化启动

# 保存快捷方式
$Shortcut.Save()

Write-Host "✅ 快捷方式已创建: $ShortcutPath" -ForegroundColor Green
