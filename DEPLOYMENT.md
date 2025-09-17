# 🚀 Deployment Guide

## Backend Deployment (Render)

### 1. Create Render Account
- Go to [render.com](https://render.com)
- Sign up with GitHub

### 2. Deploy Backend
1. **Create New Web Service**
2. **Connect Repository** (select your GitHub repo)
3. **Configure Settings:**
   - **Name**: `kochi-metro-ai-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
   - **Instance Type**: `Free`

### 3. Get Backend URL
- After deployment, copy the URL (e.g., `https://kochi-metro-ai-backend.onrender.com`)
- Update `script.js` line 3 with your actual Render URL

## Frontend Deployment (GitHub Pages)

### 1. Create GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/kochi-metro-ai.git
git push -u origin main
```

### 2. Enable GitHub Pages
1. Go to repository **Settings**
2. Scroll to **Pages** section
3. **Source**: Deploy from a branch
4. **Branch**: `main`
5. **Folder**: `/docs`
6. Click **Save**

### 3. Update API URL
1. Replace `your-render-app.onrender.com` in `docs/script.js` with your actual Render URL
2. Replace `your-github-username.github.io` in `app.py` CORS settings with your GitHub Pages URL

## Configuration Steps

### Backend (app.py)
```python
# Update CORS origins with your GitHub Pages URL
CORS(app, origins=['https://YOUR_USERNAME.github.io'])
```

### Frontend (docs/script.js)
```javascript
// Update API_BASE with your Render URL
const API_BASE = 'https://YOUR_RENDER_APP.onrender.com/api';
```

## Testing
1. **Backend**: Visit `https://YOUR_RENDER_APP.onrender.com/api/trains`
2. **Frontend**: Visit `https://YOUR_USERNAME.github.io/REPO_NAME`

## Files Structure
```
├── app.py              # Backend Flask app
├── requirements.txt    # Python dependencies
├── Procfile           # Render deployment config
├── runtime.txt        # Python version
└── docs/              # Frontend files for GitHub Pages
    ├── index.html
    ├── script.js
    └── styles.css
```

## Environment Variables (Optional)
- No environment variables needed for basic deployment
- For production, consider adding:
  - `FLASK_ENV=production`
  - `SECRET_KEY=your-secret-key`