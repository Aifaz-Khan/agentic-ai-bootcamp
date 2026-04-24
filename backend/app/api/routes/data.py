import json
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.api.dependencies import get_data_service
from app.services.forecasting_service import ForecastingService
from app.api.dependencies import get_forecasting_service

router = APIRouter(prefix="/data", tags=["Data Upload"])


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)) -> dict:
    """
    Upload a CSV or JSON file to replace the active dataset.
    CSV format: must have date, store_id, product_id, units_sold columns.
    JSON format: array of objects with same fields.
    """
    ds = get_data_service()

    # Clear model cache when new data is uploaded
    fs = get_forecasting_service()
    fs._model_cache.clear()

    content = await file.read()
    filename = file.filename or "uploaded_file"

    try:
        if filename.endswith(".json"):
            data = json.loads(content)
            if not isinstance(data, list):
                raise HTTPException(status_code=400, detail="JSON must be an array of objects")
            result = ds.load_uploaded_json(data, filename)
        elif filename.endswith(".csv"):
            result = ds.load_uploaded_csv(content, filename)
        else:
            raise HTTPException(status_code=400, detail="Only CSV and JSON files are supported")

        return {
            "message": f"Successfully loaded {result['rows']} rows from {filename}",
            "rows": result["rows"],
            "stores": result["stores"],
            "products": result["products"],
            "source": result["source"],
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/reset")
def reset_data() -> dict:
    """Reset back to the default retail_store_inventory.csv dataset."""
    ds = get_data_service()
    fs = get_forecasting_service()
    fs._model_cache.clear()
    result = ds.reset_to_default()
    return {
        "message": "Reset to default dataset",
        "rows": result["rows"],
        "stores": result["stores"],
        "source": result["source"],
    }


@router.get("/info")
def data_info() -> dict:
    """Get info about the currently loaded dataset."""
    ds = get_data_service()
    return {
        "source": ds.source,
        "rows": len(ds.get_dataframe()),
        "stores": ds.list_stores(),
        "total_products": len(ds.list_products()),
    }
