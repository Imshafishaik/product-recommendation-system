import os
import sys
import hashlib
import json
import random
from datetime import datetime, timedelta, timezone
from typing import Any

# Ensure venv site-packages is in sys.path
venv_site_packages = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".venv/lib/python3.12/site-packages")
if os.path.exists(venv_site_packages) and venv_site_packages not in sys.path:
    sys.path.insert(0, venv_site_packages)

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    HAS_PSYCOPG2 = True
except ImportError:
    HAS_PSYCOPG2 = False

import sqlite3

# Database configuration
# Supports JDBC URL (e.g. jdbc:postgresql://localhost:5432/postgres or loyum_db) or standard postgresql://
RAW_DB_URL = os.getenv("DATABASE_URL", "postgresql://localhost:5432/loyum_db")
if RAW_DB_URL.startswith("jdbc:"):
    RAW_DB_URL = RAW_DB_URL[5:]

PG_HOST = os.getenv("POSTGRES_HOST", "localhost")
PG_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
PG_USER = os.getenv("POSTGRES_USER", "postgres")
PG_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")
PG_DB = os.getenv("POSTGRES_DB", "loyum_db")

SQLITE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "recommendation_engine.db")


class DBConnection:
    """Unified wrapper around psycopg2 or sqlite3 connection."""
    def __init__(self, raw_conn: Any, is_postgres: bool):
        self.raw_conn = raw_conn
        self.is_postgres = is_postgres

    def cursor(self):
        if self.is_postgres:
            return PostgresCursorWrapper(self.raw_conn.cursor(cursor_factory=RealDictCursor))
        return SQLiteCursorWrapper(self.raw_conn.cursor())

    def commit(self):
        self.raw_conn.commit()

    def rollback(self):
        self.raw_conn.rollback()

    def close(self):
        self.raw_conn.close()


class RowWrapper:
    """Supports both dictionary key access (row['id']) and integer indexing (row[0])."""
    def __init__(self, data: dict):
        self._data = data
        self._values = list(data.values())

    def __getitem__(self, item):
        if isinstance(item, int):
            return self._values[item]
        return self._data[item]

    def __contains__(self, key):
        return key in self._data

    def get(self, key, default=None):
        return self._data.get(key, default)

    def keys(self):
        return self._data.keys()

    def values(self):
        return self._data.values()

    def items(self):
        return self._data.items()

    def __iter__(self):
        return iter(self._data)

    def __len__(self):
        return len(self._data)

    def __repr__(self):
        return repr(self._data)


class PostgresCursorWrapper:
    """Translates SQL syntax and placeholders for PostgreSQL."""
    def __init__(self, cur):
        self.cur = cur

    def execute(self, sql: str, params: Any = None):
        # Convert SQLite '?' placeholders to PostgreSQL '%s'
        pg_sql = sql.replace("?", "%s")
        if params is not None:
            if isinstance(params, list):
                params = tuple(params)
            return self.cur.execute(pg_sql, params)
        return self.cur.execute(pg_sql)

    def fetchone(self):
        row = self.cur.fetchone()
        return RowWrapper(dict(row)) if row is not None else None

    def fetchall(self):
        rows = self.cur.fetchall()
        return [RowWrapper(dict(r)) for r in rows]

    def close(self):
        self.cur.close()


class SQLiteCursorWrapper:
    """Wraps SQLite cursor with consistent row mapping."""
    def __init__(self, cur):
        self.cur = cur

    def execute(self, sql: str, params: Any = None):
        # Convert '%s' to '?' if needed
        sqlite_sql = sql.replace("%s", "?")
        if params is not None:
            if isinstance(params, list):
                params = tuple(params)
            return self.cur.execute(sqlite_sql, params)
        return self.cur.execute(sqlite_sql)

    def fetchone(self):
        return self.cur.fetchone()

    def fetchall(self):
        return self.cur.fetchall()

    def close(self):
        self.cur.close()


def get_db() -> DBConnection:
    """Returns an active connection to PostgreSQL loyum_db, falling back to SQLite if needed."""
    if HAS_PSYCOPG2:
        # Try connecting with postgres user, then fallback user if needed
        for user in [PG_USER, "shafi"]:
            try:
                conn_kwargs: dict[str, Any] = {
                    "dbname": PG_DB,
                    "host": PG_HOST,
                    "port": PG_PORT,
                    "user": user,
                    "connect_timeout": 3,
                }
                if PG_PASSWORD:
                    conn_kwargs["password"] = PG_PASSWORD

                pg_conn = psycopg2.connect(**conn_kwargs)
                return DBConnection(pg_conn, is_postgres=True)
            except Exception:
                continue

    # Fallback to local SQLite if PostgreSQL is unavailable
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    return DBConnection(sqlite_conn, is_postgres=False)


def hash_password(password: str) -> str:
    salt = "mindsit_salt_2025"
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return key.hex()


def verify_password(plain_password: str, hashed_or_plain: str) -> bool:
    if plain_password == hashed_or_plain:
        return True
    return hash_password(plain_password) == hashed_or_plain


CORE_PRODUCTS = [
    {
        "id": "prod_bundle_01",
        "name": "Weekend discovery bundle",
        "category": "Lifestyle",
        "price": 64.00,
        "reason": "Complements your recent purchases",
    },
    {
        "id": "prod_reward_04",
        "name": "Double points on essentials",
        "category": "Rewards",
        "price": 42.50,
        "reason": "Popular with your customer segment",
    },
    {
        "id": "prod_spring_02",
        "name": "Spring edit overshirt",
        "category": "Fashion",
        "price": 89.00,
        "reason": "Frequently bought with your saved items",
    },
    {
        "id": "prod_home_07",
        "name": "Linen weekend tote",
        "category": "Accessories",
        "price": 36.00,
        "reason": "A lightweight match for your basket",
    },
    {
        "id": "prod_acc_03",
        "name": "Silk twill scarf",
        "category": "Accessories",
        "price": 48.00,
        "reason": "Complements classic lifestyle items",
    },
    {
        "id": "prod_home_09",
        "name": "Cedar & amber scented candle",
        "category": "Home",
        "price": 29.50,
        "reason": "Frequently paired with relaxation bundles",
    },
    {
        "id": "prod_fash_05",
        "name": "Organic cotton chore jacket",
        "category": "Fashion",
        "price": 115.00,
        "reason": "Trending in the fashion edit",
    },
    {
        "id": "prod_rew_02",
        "name": "VIP early access pass",
        "category": "Rewards",
        "price": 15.00,
        "reason": "Boosts engagement for active shoppers",
    },
]

DEMO_CUSTOMERS = [
    {"id": "cus_001", "name": "Sophie Martin", "email": "sophie.martin@email.com", "segment": "Loyal", "health_score": 92, "frequency": 28, "monetary": 1284.0, "recency_days": 2},
    {"id": "cus_002", "name": "Lucas Bernard", "email": "lucas.bernard@email.com", "segment": "At risk", "health_score": 48, "frequency": 14, "monetary": 736.0, "recency_days": 19},
    {"id": "cus_003", "name": "Emma Dubois", "email": "emma.dubois@email.com", "segment": "Loyal", "health_score": 88, "frequency": 34, "monetary": 2104.0, "recency_days": 4},
    {"id": "cus_004", "name": "Thomas Petit", "email": "thomas.petit@email.com", "segment": "Inactive", "health_score": 21, "frequency": 5, "monetary": 214.0, "recency_days": 58},
    {"id": "cus_005", "name": "Camille Leroy", "email": "camille.leroy@email.com", "segment": "New", "health_score": 64, "frequency": 8, "monetary": 408.0, "recency_days": 6},
]

FIRST_NAMES = [
    "Alexandre", "Antoine", "Arthur", "Baptiste", "Benjamin", "Charlotte", "Chloé", "Clara", "Clément",
    "Gabriel", "Hugo", "Inès", "Jules", "Léa", "Louis", "Louise", "Manon", "Mathieu", "Maxime", "Nathan",
    "Paul", "Raphaël", "Sarah", "Théo", "Valentin", "Victoire", "Victor", "Zoé", "Adrien", "Alice",
    "Ambre", "Anna", "Axel", "Basile", "Céleste", "Elena", "Élise", "Émile", "Gaspard", "Jade",
    "Léon", "Lina", "Margaux", "Marius", "Mila", "Noé", "Robin", "Rose", "Simon", "Timothée"
]

LAST_NAMES = [
    "Moreau", "Laurent", "Simon", "Michel", "Lefebvre", "Roux", "David", "Bertrand", "Morel", "Fournier",
    "Girard", "Bonnet", "Dupont", "Lambert", "Fontaine", "Rousseau", "Vincent", "Muller", "Faure", "Andre",
    "Mercier", "Blanc", "Guerin", "Boyer", "Garnier", "Chevalier", "Francois", "Legrand", "Gauthier", "Garcia",
    "Perrin", "Robin", "Caron", "Picard", "Marchand", "Brunet", "Gauthier", "Masson", "Dufour", "Blanchard"
]


def init_db():
    """Initializes tables and seeds dataset in the active database (loyum_db on PostgreSQL)."""
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(64) NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        segment VARCHAR(64) NOT NULL,
        health_score INTEGER NOT NULL,
        frequency INTEGER NOT NULL,
        monetary DOUBLE PRECISION NOT NULL,
        recency_days INTEGER NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(64) NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        reason TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(64) PRIMARY KEY,
        customer_id VARCHAR(64) NOT NULL,
        product_id VARCHAR(64) NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        purchased_at TEXT NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS cart_events (
        id VARCHAR(64) PRIMARY KEY,
        customer_id VARCHAR(64) NOT NULL,
        product_id VARCHAR(64) NOT NULL,
        event VARCHAR(64) NOT NULL,
        occurred_at TEXT NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        job_id VARCHAR(64) PRIMARY KEY,
        status VARCHAR(64) NOT NULL,
        accepted INTEGER NOT NULL,
        customers_scored INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        completed_at TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS campaigns (
        campaign_id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        segment VARCHAR(64) NOT NULL,
        status VARCHAR(64) NOT NULL,
        estimated_recipients INTEGER NOT NULL,
        lift_rate VARCHAR(64),
        created_at TEXT NOT NULL
    )
    """)
    conn.commit()

    # Check if data already seeded
    cur.execute("SELECT COUNT(*) as count FROM users")
    res = cur.fetchone()
    count_val = res["count"] if isinstance(res, dict) else res[0]

    if count_val == 0:
        now_iso = datetime.now(timezone.utc).isoformat()
        cur.execute(
            "INSERT INTO users (id, email, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            ("usr_001", "demo@mindsit.com", "Amelie Laurent", "Administrator", hash_password("demo123"), now_iso)
        )

        # Seed products
        for p in CORE_PRODUCTS:
            cur.execute(
                "INSERT INTO products (id, name, category, price, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (p["id"], p["name"], p["category"], p["price"], p["reason"], now_iso)
            )

        # Seed 248 customers
        for c in DEMO_CUSTOMERS:
            cur.execute(
                "INSERT INTO customers (id, name, email, segment, health_score, frequency, monetary, recency_days, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (c["id"], c["name"], c["email"], c["segment"], c["health_score"], c["frequency"], c["monetary"], c["recency_days"], now_iso)
            )

        # 32 at-risk customers, 248 total customers
        rng = random.Random(42)
        total_needed = 248 - len(DEMO_CUSTOMERS)
        at_risk_needed = 32 - 1
        inactive_needed = 25 - 1
        loyal_needed = 70 - 2
        new_needed = 50 - 1
        growing_needed = total_needed - (at_risk_needed + inactive_needed + loyal_needed + new_needed)

        segments_pool = (
            ["At risk"] * at_risk_needed +
            ["Inactive"] * inactive_needed +
            ["Loyal"] * loyal_needed +
            ["New"] * new_needed +
            ["Growing"] * growing_needed
        )
        rng.shuffle(segments_pool)

        now = datetime.now(timezone.utc)
        product_ids = [p["id"] for p in CORE_PRODUCTS]

        # Insert seed transactions for demo customers
        cur.execute("INSERT INTO transactions VALUES (?, ?, ?, ?, ?)", ("tx_001_1", "cus_001", "prod_bundle_01", 64.0, (now - timedelta(days=2)).isoformat()))
        cur.execute("INSERT INTO transactions VALUES (?, ?, ?, ?, ?)", ("tx_001_2", "cus_001", "prod_spring_02", 89.0, (now - timedelta(days=12)).isoformat()))
        cur.execute("INSERT INTO transactions VALUES (?, ?, ?, ?, ?)", ("tx_001_3", "cus_001", "prod_home_07", 36.0, (now - timedelta(days=25)).isoformat()))
        cur.execute("INSERT INTO transactions VALUES (?, ?, ?, ?, ?)", ("tx_002_1", "cus_002", "prod_spring_02", 89.0, (now - timedelta(days=19)).isoformat()))
        cur.execute("INSERT INTO transactions VALUES (?, ?, ?, ?, ?)", ("tx_002_2", "cus_002", "prod_fash_05", 115.0, (now - timedelta(days=45)).isoformat()))
        cur.execute("INSERT INTO transactions VALUES (?, ?, ?, ?, ?)", ("tx_003_1", "cus_003", "prod_bundle_01", 64.0, (now - timedelta(days=4)).isoformat()))
        cur.execute("INSERT INTO transactions VALUES (?, ?, ?, ?, ?)", ("tx_003_2", "cus_003", "prod_acc_03", 48.0, (now - timedelta(days=16)).isoformat()))
        cur.execute("INSERT INTO transactions VALUES (?, ?, ?, ?, ?)", ("tx_004_1", "cus_004", "prod_home_09", 29.5, (now - timedelta(days=58)).isoformat()))
        cur.execute("INSERT INTO transactions VALUES (?, ?, ?, ?, ?)", ("tx_005_1", "cus_005", "prod_bundle_01", 64.0, (now - timedelta(days=6)).isoformat()))

        for idx, seg in enumerate(segments_pool, start=6):
            cid = f"cus_{idx:03d}"
            fn = rng.choice(FIRST_NAMES)
            ln = rng.choice(LAST_NAMES)
            name = f"{fn} {ln}"
            email = f"{fn.lower().replace('é','e').replace('è','e')}.{ln.lower()}@demo.mindsit.com"

            if seg == "Loyal":
                recency = rng.randint(1, 9)
                freq = rng.randint(20, 40)
                monetary = round(rng.uniform(900.0, 2400.0), 2)
                score = min(98, 70 + freq)
            elif seg == "At risk":
                recency = rng.randint(15, 42)
                freq = rng.randint(10, 18)
                monetary = round(rng.uniform(450.0, 950.0), 2)
                score = max(30, 72 - recency)
            elif seg == "Inactive":
                recency = rng.randint(46, 120)
                freq = rng.randint(3, 8)
                monetary = round(rng.uniform(120.0, 350.0), 2)
                score = max(12, 45 - recency // 2)
            elif seg == "New":
                recency = rng.randint(1, 10)
                freq = rng.randint(1, 8)
                monetary = round(rng.uniform(60.0, 420.0), 2)
                score = min(76, 45 + freq * 2)
            else:  # Growing
                recency = rng.randint(3, 14)
                freq = rng.randint(9, 19)
                monetary = round(rng.uniform(380.0, 850.0), 2)
                score = min(84, 55 + freq)

            cur.execute(
                "INSERT INTO customers (id, name, email, segment, health_score, frequency, monetary, recency_days, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (cid, name, email, seg, score, freq, monetary, recency, now_iso)
            )

            num_tx = min(freq, rng.randint(2, 4))
            for t_i in range(num_tx):
                t_prod = rng.choice(product_ids)
                t_date = (now - timedelta(days=recency + t_i * 7)).isoformat()
                cur.execute(
                    "INSERT INTO transactions VALUES (?, ?, ?, ?, ?)",
                    (f"tx_{idx}_{t_i}", cid, t_prod, round(rng.uniform(25.0, 120.0), 2), t_date)
                )

        # Seed sample campaigns
        cur.execute("INSERT INTO campaigns VALUES (?, ?, ?, ?, ?, ?, ?)", ("cmp_1001", "Spring loyalty preview", "Loyal", "sent", 68, "25%", (now - timedelta(days=2)).isoformat()))
        cur.execute("INSERT INTO campaigns VALUES (?, ?, ?, ?, ?, ?, ?)", ("cmp_1002", "Welcome reward", "New", "sent", 49, "18%", (now - timedelta(days=9)).isoformat()))
        cur.execute("INSERT INTO campaigns VALUES (?, ?, ?, ?, ?, ?, ?)", ("cmp_1003", "At-risk winback", "At risk", "draft", 32, "Ready", now_iso))

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    db_conn = get_db()
    print(f"Connected using: {'PostgreSQL (loyum_db)' if db_conn.is_postgres else 'SQLite fallback'}")
    c = db_conn.cursor()
    c.execute("SELECT COUNT(*) as count FROM customers")
    res = c.fetchone()
    print("Customer count:", res["count"] if isinstance(res, dict) else res[0])
    db_conn.close()
