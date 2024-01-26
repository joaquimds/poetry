# Allow mypy generic annotations without causing runtime issues
from __future__ import annotations

import logging
from pathlib import Path
from tempfile import NamedTemporaryFile, _TemporaryFileWrapper
from typing import IO
from urllib.request import urlopen

import cloudinary
import cloudinary.api
import cloudinary.exceptions
import cloudinary.uploader
from django.conf import settings
from django.core.files import File
from django.core.files.storage import Storage

cloudinary.config(
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    secure=True,
)

logger = logging.getLogger(__name__)


def write_to_temp_file(
    source: IO[str], temp_file: _TemporaryFileWrapper[bytes]
) -> None:
    chunk_size = 1024

    if source.readable():
        content = source.read(chunk_size)
        while content:
            if isinstance(content, str):
                bytes = content.encode()
            else:
                bytes = content
            temp_file.write(bytes)
            temp_file.flush()
            content = source.read(chunk_size)


class CloudinaryStorage(Storage):
    def _open(self, name: str, mode: str = "rb") -> File[str]:
        url = self.url(name)

        if not url:
            return File(None)
        if not (url.startswith("http://") or url.startswith("https://")):
            logger.warning(f"Will not open malformed Cloudinary URL {url}")
            return File(None)

        # The nosec B310 here is because Bandit warns opening URLs that are not
        # http:// or https://. This has been checked above, so the call is safe.
        file = urlopen(url)  # nosec B310
        return File(file, name=name)

    def _save(self, name: str, file: File[str]) -> str:
        if file.file is None:
            raise ValueError("File object is empty.")

        with NamedTemporaryFile() as temp_file:
            write_to_temp_file(file.file, temp_file)
            cloudinary.uploader.upload(temp_file.name, public_id=name)

        return name

    def delete(self, name: str) -> None:
        try:
            cloudinary.api.delete_resources([name])
        except cloudinary.exceptions.Error as e:
            logger.warning(f"Could not delete resource from Cloudinary: {e}")

    def exists(self, name: str) -> bool:
        try:
            cloudinary.api.resource(name)
            return True
        except cloudinary.exceptions.NotFound:
            return False

    def get_valid_name(self, name: str) -> str:
        """
        Cloudinary derives file extensions, so
        the local file needs to have its file
        extension removed before being
        uploaded.
        """
        name = super().get_valid_name(name)
        return "poetry/" + str(Path(name).with_suffix(""))

    def size(self, name: str) -> int:
        try:
            response = cloudinary.api.resource(name)
            return int(response.get("bytes", 0))
        except cloudinary.exceptions.NotFound:
            return 0

    def url(self, name: str | None) -> str:
        try:
            response = cloudinary.api.resource(name)
            return str(response.get("secure_url", ""))
        except cloudinary.exceptions.NotFound:
            return ""
