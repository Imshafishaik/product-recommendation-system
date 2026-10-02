from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    customer_ref = Column(String, unique=True, index=True)
    name = Column(String)
    email = Column(String)
    segment = Column(String, default="New")  # RFM segment
    transactions = relationship("Transaction", back_populates="customer")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    product_ref = Column(String, unique=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    category = Column(String, index=True)
    subcategory = Column(String, index=True)
    brand = Column(String)
    price = Column(Float)
    tags = Column(String) # comma separated
    in_stock = Column(Boolean, default=True)
    transactions = relationship("Transaction", back_populates="product")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    transaction_ref = Column(String, unique=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="transactions")
    product = relationship("Product", back_populates="transactions")
