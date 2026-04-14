# Liquidax Deployment Guide

Follow these steps to deploy your DeFi dashboard.

## 1. Backend (Google App Engine)

### Prerequisites
- Google Cloud Project with Billing enabled.
- Google Cloud SDK (`gcloud`) installed locally.
- A **Google Cloud SQL (PostgreSQL)** instance.

### Configuration
1.  **Environment (GAE Standard)**: We use the **App Engine Standard** environment (`F1` instances) for cost-efficiency.
2.  **Persistence**: Since Standard has an ephemeral filesystem, we use **Google Cloud Storage (GCS)** to persist the SQLite database.
    - Create a GCS bucket (e.g., `borrow-rates-db`).
    - Update `app.yaml` with your `GCS_BUCKET_NAME` and `ALCHEMY_API_KEY`.
3.  **Service Account**: Ensure your App Engine default service account has **Storage Object Admin** permissions for the bucket.
3.  **Build & Deploy**:
    ```bash
    npm run build
    gcloud app deploy
    ```

## 2. Frontend (GitHub Pages)

### Configuration
1.  **API URL**: I have updated `.github/workflows/deploy_frontend.yml` with your App Engine URL: `https://borrow-rates-api.uc.r.appspot.com/api`.
2.  **Deployment**:
    - Push your changes to the `main` branch.
    - GitHub Actions will automatically build and deploy the `frontend/dist` folder to the `gh-pages` branch.
3.  **Enable GitHub Pages**:
    - Go to your GitHub Repository **Settings** > **Pages**.
    - Under **Build and deployment** > **Source**, ensure it is set to **Deploy from a branch**.
    - Select the `gh-pages` branch and the `/ (root)` folder.
    - Click **Save**.

## 3. Important Notes
- **CORS**: Ensure the backend `src/api.ts` allows requests from your GitHub Pages domain (typically `https://<username>.github.io`).
- **Persistence**: GAE standard environment instances are ephemeral. Data stored in SQLite will be lost on restarts. Use Cloud SQL for persistence.
- **Sync Scripts**: You can run the rate sync periodically using **Google Cloud Scheduler** hitting an authenticated endpoint or using a Cron job in `app.yaml`.
