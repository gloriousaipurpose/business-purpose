from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class RawItemData(BaseModel):
    source: str
    url: str
    title: str
    text: str
    published_at: Optional[datetime] = None

class Source(ABC):
    name: str

    @abstractmethod
    async def fetch(self) -> List[RawItemData]:
        """Fetch raw items from source. Must raise or handle errors gracefully."""
        pass
