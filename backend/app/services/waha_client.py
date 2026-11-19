import logging
import asyncio
from typing import Dict, Any, List, Optional
import httpx

logger = logging.getLogger(__name__)

class WahaClient:
    """
    Cliente direto para a API HTTP do WAHA (WhatsApp HTTP API).
    """
    def __init__(self, base_url: str = "http://192.168.1.25:3000", api_key: Optional[str] = None):
        url = (base_url or "http://192.168.1.25:3000").rstrip("/")
        if not url or "localhost" in url or "127.0.0.1" in url:
            url = "http://192.168.1.25:3000"
        self.base_url = url
        self.api_key = (api_key or "6f1186b6522246c1b0015b9117d56d05").strip()
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        if self.api_key:
            self.headers["X-Api-Key"] = self.api_key
            self.headers["Authorization"] = f"Bearer {self.api_key}"

    async def list_sessions(self) -> List[Dict[str, Any]]:
        """Lista todas as sessões registradas no WAHA com status."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # 1. Tenta com ?all=true para listar todas as sessões (WORKING, STOPPED, STARTING, SCAN_QR_CODE)
                resp = await client.get(f"{self.base_url}/api/sessions?all=true", headers=self.headers)
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, list):
                        return data
                # 2. Tenta sem ?all=true
                resp2 = await client.get(f"{self.base_url}/api/sessions", headers=self.headers)
                if resp2.status_code == 200:
                    data = resp2.json()
                    if isinstance(data, list):
                        return data
                logger.warning(f"[WAHA] Status ao listar sessões em {self.base_url}: {resp.status_code} - {resp.text}")
        except Exception as e:
            logger.warning(f"[WAHA] Erro ao listar sessões em {self.base_url}: {e}")
        return []

    async def get_session(self, session_name: str) -> Optional[Dict[str, Any]]:
        """Obtém detalhes e status de uma sessão específica."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/api/sessions/{session_name}", headers=self.headers)
                if resp.status_code == 200:
                    return resp.json()
        except Exception as e:
            logger.warning(f"[WAHA] Erro ao obter sessão {session_name}: {e}")
        return None

    async def create_session(self, session_name: str, start: bool = True) -> bool:
        """Cria uma nova sessão no WAHA."""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                payload = {"name": session_name, "start": start}
                resp = await client.post(f"{self.base_url}/api/sessions", headers=self.headers, json=payload)
                if resp.status_code in (200, 201):
                    return True
                resp2 = await client.post(f"{self.base_url}/api/sessions", headers=self.headers, json={"name": session_name})
                return resp2.status_code in (200, 201)
        except Exception as e:
            logger.warning(f"[WAHA] Erro ao criar sessão {session_name}: {e}")
            return False

    async def start_session(self, session_name: str) -> bool:
        """Inicia uma sessão no WAHA."""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                # Tenta endpoints suportados pelo WAHA
                resp = await client.post(f"{self.base_url}/api/sessions/{session_name}/start", headers=self.headers)
                if resp.status_code in (200, 201):
                    return True
                resp2 = await client.post(f"{self.base_url}/api/sessions/start", headers=self.headers, json={"name": session_name})
                return resp2.status_code in (200, 201)
        except Exception as e:
            logger.warning(f"[WAHA] Erro ao iniciar sessão {session_name}: {e}")
            return False

    async def stop_session(self, session_name: str) -> bool:
        """Para uma sessão ativa no WAHA."""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(f"{self.base_url}/api/sessions/{session_name}/stop", headers=self.headers)
                if resp.status_code in (200, 201):
                    return True
                resp2 = await client.post(f"{self.base_url}/api/sessions/stop", headers=self.headers, json={"name": session_name})
                return resp2.status_code in (200, 201)
        except Exception as e:
            logger.warning(f"[WAHA] Erro ao parar sessão {session_name}: {e}")
            return False

    async def restart_session(self, session_name: str) -> bool:
        """Reinicia uma sessão no WAHA."""
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(f"{self.base_url}/api/sessions/{session_name}/restart", headers=self.headers)
                if resp.status_code in (200, 201):
                    return True
                await self.stop_session(session_name)
                await asyncio.sleep(2)
                return await self.start_session(session_name)
        except Exception as e:
            logger.warning(f"[WAHA] Erro ao reiniciar sessão {session_name}: {e}")
            return False

    async def logout_session(self, session_name: str) -> bool:
        """Desconecta a conta do WhatsApp (logout) no WAHA."""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(f"{self.base_url}/api/sessions/{session_name}/logout", headers=self.headers)
                if resp.status_code in (200, 201):
                    return True
                resp2 = await client.post(f"{self.base_url}/api/{session_name}/auth/logout", headers=self.headers)
                return resp2.status_code in (200, 201)
        except Exception as e:
            logger.warning(f"[WAHA] Erro ao deslogar sessão {session_name}: {e}")
            return False

    async def get_session_me(self, session_name: str) -> Optional[Dict[str, Any]]:
        """Obtém detalhes do número conectado no WhatsApp (JID, pushName, etc)."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/api/{session_name}/me", headers=self.headers)
                if resp.status_code == 200:
                    return resp.json()
                resp2 = await client.get(f"{self.base_url}/api/sessions/{session_name}/me", headers=self.headers)
                if resp2.status_code == 200:
                    return resp2.json()
        except Exception:
            pass
        return None

    async def get_qr_code(self, session_name: str) -> Optional[Dict[str, Any]]:
        """Obtém o QR Code para pareamento da sessão formatado como base64 ou imagem."""
        import base64
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Tenta endpoint direto da sessão
                resp = await client.get(f"{self.base_url}/api/{session_name}/auth/qr", headers=self.headers)
                if resp.status_code == 200:
                    c_type = resp.headers.get("content-type", "")
                    if "image" in c_type:
                        b64_img = base64.b64encode(resp.content).decode("utf-8")
                        return {"format": "image", "data": f"data:image/png;base64,{b64_img}"}
                    try:
                        data = resp.json()
                        val = data.get("value") or data.get("data")
                        if val:
                            if str(val).startswith("data:image"):
                                return {"format": "image", "data": val}
                            else:
                                return {"format": "text", "value": val}
                        return data
                    except Exception:
                        pass
                # Tenta endpoint alternativo
                resp2 = await client.get(f"{self.base_url}/api/sessions/{session_name}/auth/qr", headers=self.headers)
                if resp2.status_code == 200:
                    if "image" in resp2.headers.get("content-type", ""):
                        b64_img = base64.b64encode(resp2.content).decode("utf-8")
                        return {"format": "image", "data": f"data:image/png;base64,{b64_img}"}
                    return resp2.json()
        except Exception as e:
            logger.warning(f"[WAHA] Erro ao obter QR Code {session_name}: {e}")
        return None

    def _format_groups(self, data: list) -> List[Dict[str, Any]]:
        groups = []
        for g in data:
            participants = g.get("participants", [])
            count = len(participants) if isinstance(participants, list) else g.get("size", 0)
            groups.append({
                "id": g.get("id"),
                "name": g.get("name") or g.get("subject", "Sem Nome"),
                "participants_count": count,
                "is_announce": g.get("announce", False),
                "is_read_only": g.get("isReadOnly", False),
                "participants": participants
            })
        return groups

    async def list_groups(self, session_name: str) -> List[Dict[str, Any]]:
        """
        Lista todos os grupos do WhatsApp para a sessão informada.
        Retorna informações como: id, name, participants count, announce (apenas avisos).
        """
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                # 1. Tenta endpoint padrão /api/{session}/groups
                resp = await client.get(f"{self.base_url}/api/{session_name}/groups", headers=self.headers)
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, list):
                        return self._format_groups(data)
                # 2. Tenta /api/groups?session={session}
                resp2 = await client.get(f"{self.base_url}/api/groups?session={session_name}", headers=self.headers)
                if resp2.status_code == 200:
                    data = resp2.json()
                    if isinstance(data, list):
                        return self._format_groups(data)
                # 3. Tenta /api/{session}/chats
                resp3 = await client.get(f"{self.base_url}/api/{session_name}/chats", headers=self.headers)
                if resp3.status_code == 200:
                    data = resp3.json()
                    if isinstance(data, list):
                        group_chats = [c for c in data if str(c.get("id", "")).endswith("@g.us")]
                        return self._format_groups(group_chats)
        except Exception as e:
            logger.warning(f"[WAHA] Erro ao listar grupos ({session_name}): {e}")
        return []

    async def start_typing(self, session_name: str, chat_id: str):
        """Simula status 'digitando...' no grupo/conversa."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                payload = {"session": session_name, "chatId": chat_id}
                await client.post(f"{self.base_url}/api/startTyping", headers=self.headers, json=payload)
        except Exception:
            pass

    async def stop_typing(self, session_name: str, chat_id: str):
        """Para simulação de digitação."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                payload = {"session": session_name, "chatId": chat_id}
                await client.post(f"{self.base_url}/api/stopTyping", headers=self.headers, json=payload)
        except Exception:
            pass

    async def send_text(
        self,
        session_name: str,
        chat_id: str,
        text: str,
        simulate_typing: bool = True,
        mentions: Optional[List[str]] = None
    ) -> bool:
        """Envia mensagem de texto via WAHA com simulação opcional de digitação."""
        if simulate_typing:
            await self.start_typing(session_name, chat_id)
            await asyncio.sleep(2.0)
            await self.stop_typing(session_name, chat_id)

        payload: Dict[str, Any] = {
            "session": session_name,
            "chatId": chat_id,
            "text": text
        }
        if mentions:
            payload["mentions"] = mentions

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(f"{self.base_url}/api/sendText", headers=self.headers, json=payload)
                if resp.status_code in (200, 201):
                    return True
                logger.error(f"[WAHA] Falha ao enviar texto para {chat_id}: {resp.status_code} - {resp.text}")
                return False
        except Exception as e:
            logger.error(f"[WAHA] Erro de rede ao enviar texto para {chat_id}: {e}")
            return False

    async def send_image(
        self,
        session_name: str,
        chat_id: str,
        caption: str,
        image_base64: Optional[str] = None,
        image_url: Optional[str] = None,
        simulate_typing: bool = True
    ) -> bool:
        """Envia imagem (base64 ou URL) com legenda via WAHA."""
        if simulate_typing:
            await self.start_typing(session_name, chat_id)
            await asyncio.sleep(2.0)
            await self.stop_typing(session_name, chat_id)

        file_payload: Dict[str, Any] = {
            "mimetype": "image/jpeg",
            "filename": "oferta.jpg"
        }
        if image_base64:
            file_payload["data"] = image_base64
        elif image_url:
            file_payload["url"] = image_url
        else:
            # Sem imagem, envia como texto
            return await self.send_text(session_name, chat_id, caption, simulate_typing=False)

        payload = {
            "session": session_name,
            "chatId": chat_id,
            "file": file_payload,
            "caption": caption
        }

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                resp = await client.post(f"{self.base_url}/api/sendImage", headers=self.headers, json=payload)
                if resp.status_code in (200, 201):
                    return True
                logger.error(f"[WAHA] Falha ao enviar imagem para {chat_id}: {resp.status_code} - {resp.text}")
                return False
        except Exception as e:
            logger.error(f"[WAHA] Erro de rede ao enviar imagem para {chat_id}: {e}")
            return False
