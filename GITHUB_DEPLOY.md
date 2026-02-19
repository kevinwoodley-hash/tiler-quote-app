# Tiler Quote App — GitHub Deployment Guide

## One-time setup (5 minutes)

### Step 1 — Create a GitHub account
Go to https://github.com and sign up if you don't have an account.

### Step 2 — Create a new repository
1. Click the **+** button top right → **New repository**
2. Name it `tiler-quote-app` (or anything you like)
3. Set to **Public**
4. Leave all other options as default
5. Click **Create repository**

### Step 3 — Upload the project files
On the new empty repo page, click **uploading an existing file**:
1. Drag and drop ALL files from this zip (keep the folder structure)
2. Scroll down, click **Commit changes**

Or use Git from terminal:
```bash
cd tiler-app
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tiler-quote-app.git
git push -u origin main
```

### Step 4 — Enable GitHub Pages
1. Go to your repo → **Settings** tab
2. Scroll to **Pages** in the left sidebar
3. Under **Source**, select **GitHub Actions**
4. Click **Save**

### Step 5 — Trigger a deploy
Go to the **Actions** tab in your repo. You should see the workflow running automatically. If not:
1. Click **Deploy to GitHub Pages**
2. Click **Run workflow** → **Run workflow**

Wait ~2 minutes for it to complete.

### Step 6 — Visit your live app
Your app will be live at:
```
https://YOUR_USERNAME.github.io/tiler-quote-app/
```

---

## Updating the app

Every time you push changes to the `main` branch, GitHub Actions automatically rebuilds and redeploys. No manual steps needed.

```bash
# Make your changes, then:
git add .
git commit -m "Update rates / add feature"
git push
```

The app is live again within ~2 minutes.

---

## Install on Android from GitHub Pages

Once live, open the URL in **Chrome on Android**:
1. Tap the three-dot menu
2. Tap **Add to Home screen**
3. Tap **Add**

The app installs to your home screen, runs fullscreen, and works offline — exactly like a native app, no Play Store needed.

---

## Custom domain (optional)

If you own a domain (e.g. `quotes.yourbusiness.co.uk`):
1. Repo → Settings → Pages → Custom domain
2. Enter your domain and save
3. Add a CNAME DNS record pointing to `YOUR_USERNAME.github.io`
