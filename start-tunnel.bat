@echo off
echo Dang khoi dong ket noi LocalTunnel (shopkydethuong.loca.lt)...
set PATH=C:\Program Files\nodejs;%PATH%
call npx localtunnel --port 8090 --subdomain shopkydethuong
pause
