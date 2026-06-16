# storage_utils.py
"""Helpers for the private invoice-photos storage bucket.

Access is always brokered by the backend service role. Clients never touch
storage directly; instead they receive short-lived signed URLs produced here.
"""

import mimetypes
import os

from dependencies import supabase

INVOICE_PHOTOS_BUCKET = "invoice-photos"
SIGNED_URL_TTL_SECONDS = 60 * 60  # 1 hour


def extension_for(filename: str | None, content_type: str | None) -> str:
    if filename and "." in filename:
        ext = os.path.splitext(filename)[1].lower()
        if ext:
            return ext
    guessed = mimetypes.guess_extension(content_type or "")
    return guessed or ".jpg"


def create_signed_url(storage_path: str) -> str | None:
    try:
        response = supabase.storage.from_(INVOICE_PHOTOS_BUCKET).create_signed_url(
            storage_path, SIGNED_URL_TTL_SECONDS
        )
        if isinstance(response, dict):
            return response.get("signedURL") or response.get("signedUrl")
        return None
    except Exception:
        return None


def attach_signed_urls(
    photos: list[dict], include_storage_path: bool = True
) -> list[dict]:
    enriched: list[dict] = []
    for photo in photos:
        storage_path = photo.get("storage_path")
        item = {**photo}
        if not include_storage_path:
            item.pop("storage_path", None)
        item["signed_url"] = create_signed_url(storage_path) if storage_path else None
        enriched.append(item)
    return enriched


def remove_objects(storage_paths: list[str]) -> None:
    paths = [path for path in storage_paths if path]
    if not paths:
        return
    try:
        supabase.storage.from_(INVOICE_PHOTOS_BUCKET).remove(paths)
    except Exception:
        # Storage cleanup is best-effort; never block the primary DB operation.
        pass
