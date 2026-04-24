from fastapi import APIRouter, Depends
from app.models.schemas import ForecastRequest, ForecastResponse, TrendExplanation
from app.services.forecasting_service import ForecastingService
from app.services.data_service import DataService
from app.api.dependencies import get_forecasting_service, get_data_service

router = APIRouter(prefix="/forecast", tags=["Forecasting"])


@router.get("/stores")
def get_stores(ds: DataService = Depends(get_data_service)) -> dict:
    return {"stores": ds.list_stores()}


@router.get("/products")
def get_products(store_id: str, ds: DataService = Depends(get_data_service)) -> dict:
    return {"products": ds.list_products(store_id)}


@router.post("/", response_model=ForecastResponse)
async def get_forecast(
    req: ForecastRequest,
    service: ForecastingService = Depends(get_forecasting_service),
) -> ForecastResponse:
    return await service.forecast(req.store_id, req.product_id, req.horizon_days)


@router.get("/trends", response_model=TrendExplanation)
async def get_trends(
    store_id: str,
    product_id: str,
    service: ForecastingService = Depends(get_forecasting_service),
) -> TrendExplanation:
    return await service.explain_trends(store_id, product_id)
