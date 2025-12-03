# Medical Imaging Annotation Viewer

A lightweight medical imaging annotation demo using React, Cornerstone.js, FastAPI, and SQLAlchemy.

![Medical Imaging Annotation Viewer screenshot]("C:\Users\Chandhu\Downloads\Screenshot 2026-06-01 181548.png")

## Overview

This project includes:
- A React + Vite frontend using `@cornerstonejs/core` and `@cornerstonejs/dicom-image-loader`
- A FastAPI backend API for saving and loading annotation markers
- A demo image viewer with annotation support and zoom controls

## Features

- Load a sample demo image
- Load an MRI-style demo image
- Load a local DICOM file via browser file picker
- Add annotations by clicking inside the viewer
- Zoom in, zoom out, reset zoom, and mouse-wheel zoom
- Persist annotations through the backend API

## Tech stack

- Frontend: React, TypeScript, Vite, Axios
- Viewer: Cornerstone.js, DICOM image loader
- Backend: FastAPI, SQLAlchemy, Pydantic
- Database: SQLite by default, optional PostgreSQL support

## Getting started

### 1. Install dependencies

#### Frontend

```bash
cd frontend
npm install
```

#### Backend

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the backend

Use Uvicorn from the backend directory:

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.

### 3. Run the frontend

From the frontend directory:

```bash
cd frontend
npm run dev
```

Open the browser at `http://localhost:5173`.

## Docker

This repository includes a `docker-compose.yml` with backend and PostgreSQL services.

By default, the backend uses SQLite at `annotations.db`. To use PostgreSQL, set the `DATABASE_URL` environment variable before starting Docker Compose:

```bash
set DATABASE_URL=postgresql://postgres:postgres@postgres:5432/medicalviewer
docker-compose up --build
```

> Note: `docker-compose.yml` does not currently inject `DATABASE_URL` into the backend container automatically, so the environment variable must be provided on startup.

## App usage

- `Load Demo Image`: Show a color demo image
- `Load MRI Demo`: Show a synthetic MRI-like demo image
- `Load DICOM File`: Pick a `.dcm` file from local disk
- Click inside the viewer to add annotations
- Use zoom buttons or wheel scrolling to zoom the displayed image

## Backend API

### GET `/`

Health check endpoint.

### GET `/annotations`

Query annotations by image ID:

```
GET /annotations?image_id=demo:sample
```

### POST `/annotations`

Create a new annotation:

```json
{
  "image_id": "demo:sample",
  "label": "Marker 1",
  "x": 120,
  "y": 90
}
```

## Notes

- The backend stores annotations in `annotations.db` by default.
- The frontend communicates with the backend at `http://localhost:8000`.
- The demo image loader is implemented in `frontend/src/components/Viewer.tsx`.

## Project structure

```
backend/
  Dockerfile
  requirements.txt
  app/
    main.py
    database.py
    models.py
frontend/
  package.json
  src/
    components/
      Viewer.tsx
      Toolbar.tsx
      AnnotationPanel.tsx
  vite.config.ts
README.md
```

## Future improvements

- Add user authentication
- Add DICOM series and multi-slice support
- Store backend configuration in `.env`
- Improve annotation editing and deletion
