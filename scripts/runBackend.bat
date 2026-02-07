@echo off

rem Run backend utility script

rem Activate Virtual Environment
echo Activating .venv
call .venv/Scripts/activate

echo Starting Server

rem Run Server
cd apps/backend
py manage.py runserver 8000 
