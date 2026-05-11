"""
Cadence AI AutoCAD plugin download endpoints.
"""
from __future__ import annotations

import json
import os
import hashlib
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from botocore.exceptions import ClientError

from ..services.s3_service import S3Service

router = APIRouter(prefix="/api/v1/plugin", tags=["plugin"])
PLUGIN_META_KEY = os.getenv("PLUGIN_META_KEY", "plugin/latest.json")
STREAM_CHUNK_SIZE = 1024 * 256


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _source_repo_root() -> Path:
    configured = os.getenv("PLUGIN_SOURCE_REPO")
    if configured:
        return Path(configured).expanduser().resolve()
    return (_repo_root().parent / "SKN23-FINAL-2TEAM").resolve()


def _bundle_dir() -> Path:
    configured = os.getenv("PLUGIN_BUNDLE_DIR")
    if configured:
        return Path(configured).expanduser().resolve()
    return (_source_repo_root() / "CadSllmAgent.Bundle").resolve()


def _configured_zip() -> Path | None:
    configured = os.getenv("PLUGIN_BUNDLE_ZIP_PATH")
    if not configured:
        return None
    path = Path(configured).expanduser().resolve()
    return path if path.is_file() else None


def _latest_build_zip() -> Path | None:
    build_output = _source_repo_root() / "build_output"
    if not build_output.is_dir():
        return None
    candidates = sorted(
        build_output.glob("CadSllmAgent_v*.zip"),
        key=lambda item: item.stat().st_mtime,
        reverse=True,
    )
    return candidates[0] if candidates else None


def _version() -> str:
    version_file = _bundle_dir() / "Contents" / "version.txt"
    if version_file.is_file():
        value = version_file.read_text(encoding="utf-8", errors="ignore").strip()
        if value:
            return value
    return "1.0.0"


def _plugin_zip_path() -> Path | None:
    return _configured_zip() or _latest_build_zip()


def _configured_installer_exe() -> Path | None:
    configured = os.getenv("PLUGIN_INSTALLER_EXE_PATH")
    if not configured:
        return None
    path = Path(configured).expanduser().resolve()
    return path if path.is_file() else None


def _latest_installer_exe() -> Path | None:
    source_root = _source_repo_root()
    direct_candidates = [
        source_root / "build_output" / "installer_publish" / "CadSllmAgent.Installer.exe",
        source_root / "build_output" / "CadSllmAgent.Installer.exe",
        source_root
        / "CadSllmAgent.Installer"
        / "bin"
        / "Release"
        / "net10.0-windows"
        / "win-x64"
        / "publish"
        / "CadSllmAgent.Installer.exe",
    ]
    candidates = [path for path in direct_candidates if path.is_file()]

    release_dir = source_root / "CadSllmAgent.Installer" / "bin" / "Release"
    if release_dir.is_dir():
        candidates.extend(release_dir.glob("**/CadSllmAgent.Installer.exe"))

    if not candidates:
        return None

    return sorted(candidates, key=lambda item: item.stat().st_mtime, reverse=True)[0]


def _installer_exe_path() -> Path | None:
    return _configured_installer_exe() or _latest_installer_exe()


def _s3_metadata() -> dict | None:
    try:
        response = S3Service.client.get_object(
            Bucket=S3Service.BUCKET_NAME,
            Key=PLUGIN_META_KEY,
        )
        return json.loads(response["Body"].read().decode("utf-8"))
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code")
        if code in {"NoSuchKey", "404", "NotFound"}:
            return None
        raise HTTPException(status_code=500, detail="Plugin metadata could not be loaded.")
    except Exception:
        raise HTTPException(status_code=500, detail="Plugin metadata could not be loaded.")


def _s3_size(zip_key: str, fallback: int | None = None) -> int | None:
    try:
        response = S3Service.client.head_object(
            Bucket=S3Service.BUCKET_NAME,
            Key=zip_key,
        )
        return int(response.get("ContentLength") or 0)
    except Exception:
        return fallback


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _stream_s3_object(zip_key: str, not_found_detail: str, error_detail: str):
    try:
        return S3Service.client.get_object(
            Bucket=S3Service.BUCKET_NAME,
            Key=zip_key,
        )
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code")
        if code in {"NoSuchKey", "404", "NotFound"}:
            raise HTTPException(status_code=404, detail=not_found_detail)
        raise HTTPException(status_code=500, detail=error_detail)


def _stream_body(body):
    try:
        while True:
            chunk = body.read(STREAM_CHUNK_SIZE)
            if not chunk:
                break
            yield chunk
    finally:
        body.close()


@router.get("/metadata")
def get_plugin_metadata():
    installer_path = _installer_exe_path()
    installer_size = installer_path.stat().st_size if installer_path else None
    installer_checksum = _sha256(installer_path) if installer_path else None

    s3_meta = _s3_metadata()
    if s3_meta and s3_meta.get("zip_key"):
        zip_key = str(s3_meta["zip_key"])
        installer_key = s3_meta.get("installer_key")
        bundle_size = _s3_size(zip_key, s3_meta.get("file_size"))
        if installer_key:
            installer_size = _s3_size(str(installer_key), s3_meta.get("installer_file_size"))
            installer_checksum = s3_meta.get("installer_sha256")
        return {
            "success": True,
            "name": "Cadence AI AutoCAD Installer",
            "version": s3_meta.get("latest_version", "1.0.0"),
            "platform": "Windows 10/11 64-bit",
            "cad": "AutoCAD for Windows",
            "mac_supported": False,
            "file_format": "EXE",
            "download_kind": "installer",
            "file_size": installer_size,
            "installer_file_size": installer_size,
            "installer_ready": bool(installer_key or installer_path),
            "bundle_file_size": bundle_size,
            "bundle_sha256": s3_meta.get("sha256"),
            "sha256": installer_checksum,
            "bundle_ready": True,
        }

    zip_path = _plugin_zip_path()
    bundle_size = zip_path.stat().st_size if zip_path else None
    bundle_checksum = _sha256(zip_path) if zip_path else None

    return {
        "success": True,
        "name": "Cadence AI AutoCAD Installer",
        "version": _version(),
        "platform": "Windows 10/11 64-bit",
        "cad": "AutoCAD for Windows",
        "mac_supported": False,
        "file_format": "EXE",
        "download_kind": "installer",
        "file_size": installer_size,
        "installer_file_size": installer_size,
        "installer_ready": bool(installer_path),
        "bundle_file_size": bundle_size,
        "bundle_sha256": bundle_checksum,
        "sha256": installer_checksum,
        "bundle_ready": bool(zip_path),
    }


@router.get("/version-check")
def version_check():
    s3_meta = _s3_metadata()
    if s3_meta and s3_meta.get("zip_key"):
        zip_key = str(s3_meta["zip_key"])
        return {
            "latest_version": s3_meta.get("latest_version", "1.0.0"),
            "release_notes": s3_meta.get("release_notes", ""),
            "file_size": _s3_size(zip_key, s3_meta.get("file_size")) or 0,
        }

    zip_path = _plugin_zip_path()
    return {
        "latest_version": _version(),
        "release_notes": "",
        "file_size": zip_path.stat().st_size if zip_path else 0,
    }


@router.get("/installer/download")
def download_installer():
    s3_meta = _s3_metadata()
    version = (s3_meta or {}).get("latest_version") or _version()

    if s3_meta and s3_meta.get("installer_key"):
        installer_key = str(s3_meta["installer_key"])
        s3_object = _stream_s3_object(
            installer_key,
            "Plugin installer was not found in S3.",
            "Plugin installer could not be loaded.",
        )
        filename = f"CadenceAI-AutoCAD-Installer-v{version}.exe"
        headers = {
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Plugin-Version": str(version),
            "X-Content-Type-Options": "nosniff",
        }
        content_length = s3_object.get("ContentLength") or s3_meta.get("installer_file_size")
        if content_length:
            headers["Content-Length"] = str(content_length)
        if s3_meta.get("installer_sha256"):
            headers["X-Installer-SHA256"] = str(s3_meta["installer_sha256"])

        return StreamingResponse(
            _stream_body(s3_object["Body"]),
            media_type="application/vnd.microsoft.portable-executable",
            headers=headers,
        )

    installer_path = _installer_exe_path()
    if installer_path is None:
        raise HTTPException(status_code=404, detail="Plugin installer has not been built yet.")

    filename = f"CadenceAI-AutoCAD-Installer-v{version}.exe"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "X-Plugin-Version": str(version),
        "X-Content-Type-Options": "nosniff",
        "X-Installer-SHA256": _sha256(installer_path),
    }

    return FileResponse(
        path=installer_path,
        media_type="application/vnd.microsoft.portable-executable",
        filename=filename,
        headers=headers,
    )


@router.get("/download")
def download_plugin():
    s3_meta = _s3_metadata()
    if s3_meta and s3_meta.get("zip_key"):
        zip_key = str(s3_meta["zip_key"])
        version = s3_meta.get("latest_version", "latest")

        s3_object = _stream_s3_object(
            zip_key,
            "Plugin bundle was not found in S3.",
            "Plugin bundle could not be loaded.",
        )

        body = s3_object["Body"]

        filename = f"CadenceAI-AutoCAD-Plugin-v{version}.zip"
        headers = {
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Plugin-Version": str(version),
            "X-Content-Type-Options": "nosniff",
        }
        content_length = s3_object.get("ContentLength") or s3_meta.get("file_size")
        if content_length:
            headers["Content-Length"] = str(content_length)
        if s3_meta.get("sha256"):
            headers["X-Plugin-SHA256"] = str(s3_meta["sha256"])

        return StreamingResponse(_stream_body(body), media_type="application/zip", headers=headers)

    zip_path = _plugin_zip_path()

    if zip_path is None:
        raise HTTPException(status_code=404, detail="Plugin bundle has not been built yet.")

    version = _version()
    filename = f"CadenceAI-AutoCAD-Plugin-v{version}.zip"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "X-Plugin-Version": version,
        "X-Content-Type-Options": "nosniff",
    }
    headers["X-Plugin-SHA256"] = _sha256(zip_path)

    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=filename,
        headers=headers,
    )
