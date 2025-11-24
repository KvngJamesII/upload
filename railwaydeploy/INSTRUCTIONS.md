# Railway Deployment - How to Update Your Files

## Files to Update

### 1. `server/index-prod.ts`
**Replace the entire contents** with the file from this folder:
1. Open `server/index-prod.ts` in your GitHub repo
2. Delete all current content
3. Copy the entire `index-prod.ts` from the `railwaydeploy` folder
4. Paste it in

### 2. `package.json`
**Replace the entire contents** with the file from this folder:
1. Open `package.json` in your GitHub repo
2. Delete all current content
3. Copy the entire `package.json` from the `railwaydeploy` folder
4. Paste it in

## Then Push to GitHub

```bash
git add server/index-prod.ts package.json
git commit -m "Fix: Backend-only setup with CORS for Vercel"
git push origin main
```

## What Changes Were Made

### `index-prod.ts`
- **Removed**: Static file serving (backend no longer tries to serve frontend files)
- **Added**: CORS headers for Vercel frontend communication
- **Added**: `/health` endpoint to test backend

### `package.json`
- **Updated**: Start command from `--loader tsx/esm` to just `tsx` (fixes deprecation error)
- **Verified**: All dependencies match your project versions
- **Removed**: Frontend dependencies (React, Radix UI, etc.) - not needed for backend-only

## Result After Deploying

Railway will:
1. ✅ Auto-detect your GitHub push
2. ✅ Build in 2-3 minutes
3. ✅ Deploy successfully
4. ✅ No more errors!

Test it with:
```bash
curl https://your-railway-url/health
```

Should return:
```json
{"status":"ok","message":"Backend is running!"}
```

## Next: Frontend on Vercel

Once Railway is working:
1. Deploy your frontend to Vercel
2. Set `VITE_API_BASE_URL=https://your-railway-url` in Vercel env vars
3. Frontend will connect to your Railway backend

Questions? Let me know!
