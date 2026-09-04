@echo off
set PATH=C:\Program Files\nodejs;%PATH%
:loop
call npx localtunnel --port 8090 --subdomain shopkydethuong
timeout /t 5 >nul
goto loop
