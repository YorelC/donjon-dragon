@echo off
cd /d C:\_work\my_projects\donjon-dragon
echo === Adresses IP locales ===
ipconfig | findstr /i "IPv4"
echo ===========================
pnpm dev
pause
