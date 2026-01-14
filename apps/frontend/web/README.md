# Frontend

How to...

**Setup**
GET: https://nodejs.org/en/download
```
cd apps/frontend/web
npm install
```

**config**
ports, api endpoint, etc.
in `apps/frontend/web/Config.ts`

**Test (dev server)**
```
cd apps/frontend/web
npm run dev
```

**Build**
```
cd apps/frontend/web
npm run build
```

Copy files from `apps/frontend/web/dist` to the destination where you serve assets.

> **Important**
> All files inside `apps/frontend/web/dist` must be served correctly by the frontend server.

