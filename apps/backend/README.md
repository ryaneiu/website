
# setup

in root of the project
**LINUX/WSL**
```
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
cd apps/backend
```

**WINDOWS**
```
py -m venv .venv
.venv\Scripts\activate
py -m pip install -r requirements.txt
cd apps/backend
```

# usage
linux:
```
python3 manage.py runserver 8000 #Or higher if needed
```
windows:
```
py manage.py runserver 8000 #Or higher if needed
```

