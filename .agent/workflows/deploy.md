---
description: How to deploy Memora to Vercel and Qdrant Cloud
---

# 🚀 Deployment Guide for Memora

This guide covers deploying Memora for the Qdrant Hackathon. We recommend using **Vercel** for the frontend and **Qdrant Cloud** for the vector database.

## Prerequisites
1.  A [GitHub](https://github.com/) account.
2.  A [Vercel](https://vercel.com/) account.
3.  A [Qdrant Cloud](https://cloud.qdrant.io/) account (Free Tier is sufficient).
4.  An [OpenAI API Key](https://platform.openai.com/) (for Vision features).

---

## Part 1: Set up Qdrant Cloud (The Brain)

1.  Log in to [Qdrant Cloud](https://cloud.qdrant.io/).
2.  Click **"Create Cluster"**.
3.  Name it `memora-cluster`.
4.  Choose the **Free Tier** (1GB RAM is enough).
5.  Wait for it to provision (takes ~1 min).
6.  Once ready, get your **API Key** and **Cluster URL**.
    *   Click "Data Access Control" -> "Create API Key".
    *   Copy the `URL` (e.g., `https://xyz-example.us-east-1.aws.cloud.qdrant.io`).
    *   Copy the `API Key` (starts with `th-`).

---

## Part 2: Deploy to Vercel (The Body)

1.  Go to your project folder in the terminal and push your latest code to GitHub:
    ```bash
    git push origin main
    ```
2.  Go to [Vercel Dashboard](https://vercel.com/new).
3.  Import your `memora` repository.
4.  **Configure Environment Variables**:
    *   Add the following variables in the "Environment Variables" section:
    
    | Name | Value | Description |
    | :--- | :--- | :--- |
    | `QDRANT_URL` | `https://...` | Your Qdrant Cloud URL |
    | `QDRANT_API_KEY` | `th-...` | Your Qdrant Cloud API Key |
    | `OPENAI_API_KEY` | `sk-...` | OpenAI Key for Vision/GPT-4o |
    | `NEXT_PUBLIC_SITE_URL` | *(Optional)* | Your production URL once generated |

5.  Click **Deploy**.

---

## Part 3: Verify & Test

1.  Once deployed, Vercel will give you a URL (e.g., `memora-app.vercel.app`).
2.  Open the URL.
3.  Go to the **Search** tab.
4.  Type **"Hello world"**.
5.  Check your Qdrant Cloud Dashboard -> "Collections". You should see `memora_moments` created automatically.

---

## Option B: Self-Hosting (Docker)

If you have a VPS (DigitalOcean, AWS EC2, Hetzner) with Docker installed:

1.  Clone the repo on your server.
2.  Create `.env.local` with your keys.
3.  Run:
    ```bash
    docker-compose up -d --build
    ```
4.  The app will be available on `http://YOUR_SERVER_IP:3000`.
