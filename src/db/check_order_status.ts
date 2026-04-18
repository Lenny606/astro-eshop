import Database from 'better-sqlite3';

const db = new Database('./sqlite.db');

try {
  const ordersCount = db.prepare('SELECT count(*) as count FROM orders').get();
  const itemsCount = db.prepare('SELECT count(*) as count FROM order_items').get();
  console.log(`Orders: ${ordersCount.count}, OrderItems: ${itemsCount.count}`);
  
  const lastOrder = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 1').get();
  console.log('Last Order:', lastOrder);
  
  if (lastOrder) {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(lastOrder.id);
    console.log('Items for last order:', items);
  }
} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}
