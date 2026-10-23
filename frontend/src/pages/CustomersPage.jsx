import { ArrowUpRight, Filter, Search, Upload } from 'lucide-react'
import { MiniStat, PageHeader } from '../components'

export default function CustomersPage({
  customers: rows,
  search,
  setSearch,
  segment,
  setSegment,
  onOpenImport,
  onSelectCustomer,
}) {
  const filtered = rows.filter(
    (customer) =>
      (segment === 'All segments' || customer.segment === segment) &&
      customer.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <section className="page-view">
      <PageHeader
        eyebrow="CUSTOMER INTELLIGENCE"
        title="All customers"
        description="Monitor engagement, value, and retention risk across your customer base in PostgreSQL loyum_db."
        action={
          <button className="primary-button" onClick={onOpenImport}>
            <Upload size={15} /> Import transactions
          </button>
        }
      />
      <div className="customer-page-stats">
        <MiniStat label="Total customers" value={rows.length} />
        <MiniStat
          label="Loyal customers"
          value={rows.filter((row) => row.segment === 'Loyal').length}
        />
        <MiniStat
          label="At risk"
          value={rows.filter((row) => row.segment === 'At risk').length}
        />
        <MiniStat
          label="Avg. health"
          value={`${Math.round(
            rows.reduce((sum, row) => sum + row.score, 0) / (rows.length || 1),
          )} / 100`}
        />
      </div>
      <div className="panel full-panel">
        <div className="customer-toolbar">
          <div className="search-field">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customers"
            />
          </div>
          <div className="select-wrap">
            <Filter size={15} />
            <select value={segment} onChange={(event) => setSegment(event.target.value)}>
              <option>All segments</option>
              <option>Loyal</option>
              <option>At risk</option>
              <option>Inactive</option>
              <option>New</option>
              <option>Growing</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Segment</th>
                <th>Health score</th>
                <th>Last seen</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.email}>
                  <td>
                    <div className="customer-cell">
                      <div className={`avatar avatar-${customer.tone}`}>{customer.initials}</div>
                      <div>
                        <strong>{customer.name}</strong>
                        <span>{customer.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`segment-pill ${customer.tone}`}>{customer.segment}</span>
                  </td>
                  <td>
                    <div className="score-cell">
                      <div className="score-bar">
                        <span
                          className={`score-fill ${customer.tone}`}
                          style={{ width: `${customer.score}%` }}
                        />
                      </div>
                      <strong>{customer.score}</strong>
                    </div>
                  </td>
                  <td className="muted">{customer.lastSeen}</td>
                  <td>
                    <button
                      className="row-button"
                      title="View Customer Profile & History"
                      onClick={() => onSelectCustomer(customer)}
                    >
                      <ArrowUpRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
