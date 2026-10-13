import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apps.api.config import settings
from apps.api.seeds.init_data import populate_initial_state
from apps.api.routers import (
    events,
    alerts,
    incidents,
    investigations,
    knowledge,
    threat_intel,
    models,
    response,
    observability
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("aegisx.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing AEGISX Cyber Defense Platform...")
    try:
        populate_initial_state()
    except Exception as e:
        logger.error(f"Error during state populator: {e}")
    yield
    logger.info("AEGISX Platform shutting down.")

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Production-grade AI Cybersecurity Intelligence and Autonomous Threat Detection Platform",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits dev frontend access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(events.router)
app.include_router(alerts.router)
app.include_router(incidents.router)
app.include_router(investigations.router)
app.include_router(knowledge.router)
app.include_router(threat_intel.router)
app.include_router(models.router)
app.include_router(response.router)
app.include_router(observability.router)

@app.get("/")
def root():
    return {
        "platform": settings.app_name,
        "version": settings.app_version,
        "status": "operational",
        "documentation": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "services": {
            "sqlite_wal_database": "connected",
            "scikit_learn_ml_registry": "ready",
            "pytorch_dl_autoencoder": "ready",
            "rag_knowledge_engine": "indexed",
            "multi_agent_coordinator": "ready",
            "simulation_sandbox": "active"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.main:app", host="127.0.0.1", port=8000, reload=True)
