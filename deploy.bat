@echo off
cd "C:\Users\kenim\OneDrive\Desktop\Grading  Management System"
echo Building frontend...
call npm run build
echo.
echo Committing changes...
git add .
git commit -m "Remove field prefix from validation error messages and handle all Laravel error formats"
echo.
echo Pushing to GitHub...
git push
echo.
echo Done! Check Railway for deployment.
pause

