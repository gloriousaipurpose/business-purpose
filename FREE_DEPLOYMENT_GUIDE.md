# 🌐 24/7 Cloud Deployment & Persistent Database Guide

This guide explains how to deploy both the **Python Backend** and **React Frontend** for **100% FREE**, running 24/7 in the cloud without losing analysis history across deployments!

---

## ⚠️ Important Note on Database Persistence

- **Render Free Tier Containers use Ephemeral Disks**: When you use a local SQLite file (`sqlite:///./radar.db`), new analysis runs saved inside the container are reset whenever Render rebuilds a new container from Git.
- **For Permanent Cloud Persistence (Recommended)**: Use a **Free PostgreSQL Database** on Render or Neon.tech. Setting `DATABASE_URL` to an external PostgreSQL database guarantees that **all 5-hour automatic runs, findings, scores, and history are permanently preserved forever and never disappear when you deploy new code!**

---

## 📌 Step 1: Deploy Backend on Render.com

### Option A: 100% Persistent Free Cloud Database (Recommended)
1. Sign up for free at **[Render.com](https://render.com)**.
2. In your Render Dashboard, click **New +** $\rightarrow$ **PostgreSQL**.
3. Name it `radar-db` and select **Free** tier $\rightarrow$ Click **Create Database**.
4. Copy the **Internal Database URL** (or External Database URL).

### Option B: Deploy Backend Service
1. Click **New +** $\rightarrow$ **Web Service**.
2. Select **Build and deploy from a Git repository** $\rightarrow$ Connect `https://github.com/gloriousaipurpose/business-purpose`.
3. Configure these fields:
   - **Name**: `business-radar-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt` *(DO NOT run seed.py during builds; it preserves all existing analysis history)*
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`

4. Scroll down to **Environment Variables** and add:
   - `GROQ_API_KEY` = *(Your Groq API key)*
   - `GROQ_MODEL` = `llama-3.3-70b-versatile`
   - `DATABASE_URL` = *(Your PostgreSQL URL from Option A, OR `sqlite:///./radar.db` to use the committed SQLite database)*
   - `RUN_INTERVAL_HOURS` = `5`
   - `TIMEZONE` = `Asia/Kolkata`

5. Click **Create Web Service**.
   Render will deploy your backend and provide your live HTTPS API URL (e.g., `https://business-radar-backend.onrender.com`).

---

## 📌 Step 2: Deploy Frontend on Vercel.com

1. Sign up for free at **[Vercel.com](https://vercel.com)**.
2. Click **Add New Project** $\rightarrow$ Select your GitHub repo `business-purpose`.
3. Set **Root Directory** to `frontend`.
4. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://business-radar-backend.onrender.com` *(Your Render backend URL from Step 1)*
5. Click **Deploy**. Vercel will give you a live frontend URL (e.g., `https://business-purpose.vercel.app`).

---

## ✅ Done!
Your Business Opportunity Radar is live 24/7 in the cloud with permanent analysis history!
