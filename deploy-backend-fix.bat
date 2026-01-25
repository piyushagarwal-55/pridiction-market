@echo off
REM Fix backend deployment - Add missing Google AI package

echo 🔧 Adding Google Generative AI to requirements.txt...

REM Add only the changed file
git add apps/backend/requirements.txt

REM Commit
git commit -m "fix: Add google-generativeai to backend requirements"

REM Push
git push

echo ✅ Backend fix pushed! Railway/Render will auto-deploy.
echo 🔗 Check your deployment dashboard for status.

pause
