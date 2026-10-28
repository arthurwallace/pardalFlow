import os
import re
import uuid
from typing import Optional, Callable
import httpx
from PIL import Image

RE_OG_IMAGE = re.compile(
    r'<meta[^>]+property=["\x27]og:image["\x27][^>]+content=["\x27]([^"\x27]+)["\x27]',
    re.IGNORECASE
)

class MediaProcessorService:
    @staticmethod
    async def get_og_image_url(url: str, log_func: Callable[[str], None] = print) -> Optional[str]:
        """Scrapes the og:image from the given webpage URL."""
        if not url:
            return None
        headers = {
            "User-Agent": "WhatsApp/2.24.11.79"
        }
        try:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                resp = await client.get(url, headers=headers, timeout=15.0)
                resp.raise_for_status()
                match = RE_OG_IMAGE.search(resp.text)
                if match:
                    img_url = match.group(1)
                    log_func(f"🖼️ Encontrada og:image: {img_url}")
                    return img_url
        except Exception as e:
            log_func(f"⚠️ Erro ao buscar og:image de {url}: {e}")
        return None

    @staticmethod
    async def download_image_as_jpg(image_url: str, log_func: Callable[[str], None] = print) -> Optional[str]:
        """Downloads an image from URL and guarantees it is saved as standard JPEG."""
        try:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                resp = await client.get(image_url, timeout=20.0)
                resp.raise_for_status()

                temp_path = f"promo_{uuid.uuid4().hex}.jpg"
                temp_raw = f"raw_{uuid.uuid4().hex}.bin"

                with open(temp_raw, "wb") as f:
                    f.write(resp.content)

                try:
                    img = Image.open(temp_raw)
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGB")
                    img.save(temp_path, "JPEG", quality=88)
                finally:
                    if os.path.exists(temp_raw):
                        os.remove(temp_raw)

                log_func(f"📷 Imagem baixada e convertida para JPEG: {temp_path}")
                return temp_path
        except Exception as e:
            log_func(f"❌ Erro ao baixar/converter imagem ({image_url}): {e}")
            return None

    @staticmethod
    async def convert_to_jpg_if_needed(image_path: str, log_func: Callable[[str], None] = print) -> str:
        """Converts an existing image file to JPG if it's PNG/WEBP/BMP/GIF."""
        if not image_path or not os.path.exists(image_path):
            return image_path

        base, ext = os.path.splitext(image_path)
        if ext.lower() in [".jpg", ".jpeg"]:
            return image_path

        try:
            img = Image.open(image_path)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            out_path = f"{base}.jpg"
            img.save(out_path, "JPEG", quality=88)
            log_func(f"🖼️ Imagem convertida de {ext} para JPG: {out_path}")
            return out_path
        except Exception as e:
            log_func(f"⚠️ Falha na conversão de imagem para JPG: {e}")
            return image_path
