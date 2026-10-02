import React, { useState } from 'react';

const DUMMY_CUSTOMERS = [
    { id: 1, ref: 'CUST-001', name: 'Alice Johnson', email: 'alice@example.com', segment: 'Loyal', ltv: '$1,200' },
    { id: 2, ref: 'CUST-002', name: 'Bob Smith', email: 'bob@example.com', segment: 'At-Risk', ltv: '$450' },
    { id: 3, ref: 'CUST-003', name: 'Charlie Davis', email: 'charlie@example.com', segment: 'New', ltv: '$120' },
    { id: 4, ref: 'CUST-004', name: 'Diana Prince', email: 'diana@example.com', segment: 'Active', ltv: '$890' },
];

export default function Customers() {
    return (
        <div>
            <header className="page-header">
                <h1>Customers</h1>
                <button className="primary-btn">Import CSV</button>
            </header>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID / Ref</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>RFM Segment</th>
                            <th>Est. LTV</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {DUMMY_CUSTOMERS.map(c => (
                            <tr key={c.id}>
                                <td>{c.ref}</td>
                                <td>{c.name}</td>
                                <td>{c.email}</td>
                                <td><span className={`segment-badge ${c.segment.toLowerCase()}`}>{c.segment}</span></td>
                                <td>{c.ltv}</td>
                                <td><button className="text-btn">View Profile</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}