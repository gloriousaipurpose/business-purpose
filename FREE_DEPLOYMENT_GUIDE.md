# 🌐 Simple Free 24/7 Deployment Guide (Using SQLite)

This guide explains how to deploy both the **Python Backend** and **React Frontend** for **100% FREE**, running 24/7 in the cloud with **SQLite database**, without needing your PC to be on!

---

## 📌 Step 1: Deploy Backend on Render.com (Free 24/7 Backend)

1. Sign up for free at **[Render.com](https://render.com)**.
2. Click **New +** $\rightarrow$ **Web Service**.
3. Select **Build and deploy from a Git repository** $\rightarrow$ Connect your repository `https://github.com/gloriousaipurpose/business-purpose`.
4. Configure these fields:
   - **Name**: `business-radar-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python seed.py`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`

5. Scroll down to **Environment Variables** and add:
   - `GROQ_API_KEY` = *(Your Groq API key)*
   - `GROQ_MODEL` = `openai/gpt-oss-120b`
   - `DATABASE_URL` = `sqlite:///./radar.db`
   - `RUN_INTERVAL_HOURS` = `5`
   - `TIMEZONE` = `Asia/Kolkata`

6. Click **Create Web Service**.
   Render will deploy your backend and give you a free HTTPS link (e.g. `https://business-radar-backend.onrender.com`).

---

## 📌 Step 2: Deploy Frontend on Vercel.com (Free 24/7 Frontend)

1. Sign up for free at **[Vercel.com](https://vercel.com)**.
2. Click **Add New Project** $\rightarrow$ Select your GitHub repo `business-purpose`.
3. Set **Root Directory** to `frontend`.
4. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://business-radar-backend.onrender.com` *(Your Render backend link from Step 1)*
5. Click **Deploy**. Vercel will give you a live frontend URL (e.g. `https://business-purpose.vercel.app`).

---

## ✅ Done!
Your Business Radar is live 24/7 in the cloud for free with your SQLite database!
