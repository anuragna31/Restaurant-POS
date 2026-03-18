# Database Setup

This project supports **multiple databases** so developers can choose what fits their environment:

- **PostgreSQL**
- **MySQL / MariaDB**
- **SQL Server**
- **MongoDB**

The backend uses a shared query layer configured via `DB_CLIENT` in `.env`.

## SQL Schemas

- `postgres/schema.sql`
- `mysql/schema.sql`
- `sqlserver/schema.sql`

Each file defines equivalent tables for:

- `users`
- `tables`
- `shifts`
- `table_assignments`
- `menu_categories`
- `menu_items`
- `orders`
- `order_items`
- `order_item_events`
- `kitchen_alerts`
- `notifications`

## MongoDB

- `mongodb/schema.md` documents the equivalent collections and indexes.

