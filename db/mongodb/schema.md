# MongoDB Collections (Equivalent Model)

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

Each collection mirrors the SQL structure using ObjectIds and embedded references where appropriate (e.g., `orders` referencing `order_items` by id).

