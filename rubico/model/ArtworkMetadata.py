from pydantic import BaseModel

class ArtworkMetadata(BaseModel):
    title: str
    artist: str
    museum_name: str
    description: str