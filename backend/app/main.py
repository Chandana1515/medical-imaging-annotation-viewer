from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from . import database, models
from .database import get_db

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnnotationCreate(BaseModel):
    image_id: str
    label: str
    x: int
    y: int


class AnnotationRead(AnnotationCreate):
    id: int

    class Config:
        orm_mode = True


@app.get('/')
def root():
    return {'message': 'Medical Imaging Annotation API'}


@app.post('/annotations', response_model=AnnotationRead)
def create_annotation(
    annotation: AnnotationCreate, db: Session = Depends(get_db)
):
    db_annotation = models.AnnotationModel(**annotation.dict())
    db.add(db_annotation)
    db.commit()
    db.refresh(db_annotation)
    return db_annotation


@app.get('/annotations', response_model=List[AnnotationRead])
def get_annotations(
    image_id: Optional[str] = Query(None), db: Session = Depends(get_db)
):
    query = db.query(models.AnnotationModel)
    if image_id:
        query = query.filter(models.AnnotationModel.image_id == image_id)
    return query.all()
