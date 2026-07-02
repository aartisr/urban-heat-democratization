
import numpy as np
from dataclasses import dataclass

@dataclass
class RasterData:
    array: np.ndarray
    nodata: float | None
    transform: any
    crs: any

def load_raster(path: str, max_size: int = 800) -> RasterData:
    import rasterio as rio
    from rasterio.enums import Resampling

    with rio.open(path) as ds:
        nodata = ds.nodata
        scale = max(ds.width, ds.height) / max_size if max(ds.width, ds.height) > max_size else 1.0
        if scale > 1:
            new_h = int(ds.height / scale)
            new_w = int(ds.width / scale)
            arr = ds.read(1, out_shape=(new_h, new_w), resampling=Resampling.bilinear).astype('float32')
            transform = ds.transform * ds.transform.scale(ds.width/new_w, ds.height/new_h)
        else:
            arr = ds.read(1).astype('float32')
            transform = ds.transform
        if nodata is not None:
            arr = np.where(arr == nodata, np.nan, arr)
        return RasterData(arr, nodata, transform, ds.crs)

def normalize(x: np.ndarray, robust: bool = True) -> np.ndarray:
    a = x.astype('float32')
    mask = np.isfinite(a)
    if not np.any(mask):
        return np.zeros_like(a, dtype='float32')
    if robust:
        lo, hi = np.nanpercentile(a[mask], [2, 98])
    else:
        lo, hi = np.nanmin(a[mask]), np.nanmax(a[mask])
    if hi <= lo:
        hi = lo + 1e-6
    out = (a - lo) / (hi - lo)
    out = np.clip(out, 0, 1)
    return np.where(mask, out, np.nan)

def valid_mask(*arrays: np.ndarray) -> np.ndarray:
    mask = np.ones_like(arrays[0], dtype=bool)
    for a in arrays:
        mask &= np.isfinite(a)
    return mask
