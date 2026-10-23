"""
Backward-compatibility layer for database access.
The implementation resides in models.database as part of the MVC architecture.
"""
from models.database import (
    DBConnection,
    RowWrapper,
    PostgresCursorWrapper,
    SQLiteCursorWrapper,
    get_db,
    init_db,
    hash_password,
    verify_password,
    CORE_PRODUCTS,
    DEMO_CUSTOMERS,
    FIRST_NAMES,
    LAST_NAMES,
    SQLITE_PATH,
    PG_HOST,
    PG_PORT,
    PG_USER,
    PG_PASSWORD,
    PG_DB,
)

__all__ = [
    "DBConnection",
    "RowWrapper",
    "PostgresCursorWrapper",
    "SQLiteCursorWrapper",
    "get_db",
    "init_db",
    "hash_password",
    "verify_password",
    "CORE_PRODUCTS",
    "DEMO_CUSTOMERS",
    "FIRST_NAMES",
    "LAST_NAMES",
    "SQLITE_PATH",
    "PG_HOST",
    "PG_PORT",
    "PG_USER",
    "PG_PASSWORD",
    "PG_DB",
]

if __name__ == "__main__":
    init_db()
    db_conn = get_db()
    print(f"Connected using: {'PostgreSQL (loyum_db)' if db_conn.is_postgres else 'SQLite fallback'}")
    c = db_conn.cursor()
    c.execute("SELECT COUNT(*) as count FROM customers")
    res = c.fetchone()
    print("Customer count:", res["count"] if isinstance(res, dict) else res[0])
    db_conn.close()
