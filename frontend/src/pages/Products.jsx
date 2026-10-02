import React from 'react';

const DUMMY_PRODUCTS = [
  { id: 1, ref: 'PRD-100', title: 'Wireless Noise-Canceling Headphones', category: 'Electronics', price: '$299.99', stock: true },
  { id: 2, ref: 'PRD-101', title: 'Ergonomic Office Chair', category: 'Furniture', price: '$199.50', stock: true },
  { id: 3, ref: 'PRD-102', title: 'Mechanical Keyboard (Red Switches)', category: 'Electronics', price: '$89.99', stock: false },
  { id: 4, ref: 'PRD-103', title: 'Stainless Steel Water Bottle 1L', category: 'Accessories', price: '$24.00', stock: true },
];

export default function Products() {
  return (
    <div>
      <header className="page-header">
        <h1>Products</h1>
        <button className="primary-btn">Add Product</button>
      </header>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Title</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {DUMMY_PRODUCTS.map(p => (
              <tr key={p.id}>
                <td>{p.ref}</td>
                <td><strong>{p.title}</strong></td>
                <td>{p.category}</td>
                <td>{p.price}</td>
                <td>
                  {p.stock ? <span className="badge success">In Stock</span> : <span className="badge warning">Out of Stock</span>}
                </td>
                <td><button className="text-btn">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
