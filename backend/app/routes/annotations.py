from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

annotations_db = []


class Annotation(BaseModel):
    image_id: str
    label: str
    x: int
    y: int


@router.post('/')
def create_annotation(annotation: Annotation):
    annotations_db.append(annotation.dict())
    return {'status': 'saved', 'annotation': annotation}


@router.get('/')
def get_annotations():
    return annotations_db
