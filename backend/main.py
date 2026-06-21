from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import analyse, projekte, pdf_export
from utils.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🏗️  DachProfi AI Backend startet…")
    yield
    print("👋 DachProfi AI Backend beendet.")


app = FastAPI(
    title="DachProfi AI API",
    version="0.1.0",
    description="Backend für den Solo-Dachdecker Assistenten",
    lifespan=lifespan,
)

# CORS – Frontend-URLs erlauben
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router
app.include_router(analyse.router, prefix="/api", tags=["Analyse"])
app.include_router(projekte.router, prefix="/api", tags=["Projekte"])
app.include_router(pdf_export.router, prefix="/api", tags=["PDF"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
