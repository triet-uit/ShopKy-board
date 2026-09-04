Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\oobe\Downloads\aether-shop"
WshShell.Run "cmd /c start-server.bat", 0, False
WshShell.Run "cmd /c run-tunnel.bat", 0, False
