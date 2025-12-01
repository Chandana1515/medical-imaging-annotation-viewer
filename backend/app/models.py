"""Placeholder for SQLAlchemy models.

This project starts with a simple in-memory annotations list in `main.py`.
If you want persistent storage, define SQLAlchemy models here and wire them
into `database.py` and the API routes.
"""

from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class AnnotationModel(Base):
    __tablename__ = 'annotations'
    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(String, index=True)
    label = Column(String)
    x = Column(Integer)
    y = Column(Integer)
