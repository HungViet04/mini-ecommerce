/**
 * Reports Service
 * Admin-only reporting endpoints
 */
const database = require('../config/database');

class ReportsService {
  parseDateToSql(value) {
    if (!value || typeof value !== 'string') return null;
    // Expect YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    return value;
  }

  async listProductsForReport({ limit = 200 } = {}) {
    const sql = `
      SELECT id, name, category_id, price
      FROM products
      ORDER BY id ASC
      LIMIT ?
    `;
    const [rows] = await database.query(sql, [limit]);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      categoryId: r.category_id,
      price: r.price,
    }));
  }

  async getTopProductsReport({ from, to, categoryId, productIds } = {}) {
    const startDate = this.parseDateToSql(from);
    const endDate = this.parseDateToSql(to);

    const params = [];
    const conditions = [];

    // Date filter - requires both from and to dates
    if (startDate && endDate) {
      conditions.push('o.created_at >= ? AND o.created_at <= ?');
      params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    } else if (startDate) {
      // Only from date
      conditions.push('o.created_at >= ?');
      params.push(`${startDate} 00:00:00`);
    } else if (endDate) {
      // Only to date
      conditions.push('o.created_at <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    if (categoryId) {
      conditions.push('p.category_id = ?');
      params.push(categoryId);
    }

    if (productIds && productIds.length > 0) {
      conditions.push('oi.product_id IN (' + productIds.map(() => '?').join(',') + ')');
      params.push(...productIds);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Query top products by BOTH quantity and revenue.
    // - quantity: SUM(oi.quantity)
    // - revenue: SUM(oi.quantity * oi.price)
    const sql = `
      SELECT
        p.id as productId,
        p.name as productName,
        p.category_id as categoryId,
        COALESCE(SUM(oi.quantity), 0) as totalQuantity,
        COALESCE(SUM(oi.quantity * oi.price), 0) as totalRevenue,
        CASE
          WHEN COALESCE(SUM(oi.quantity), 0) = 0 THEN 0
          ELSE COALESCE(SUM(oi.quantity * oi.price), 0) / COALESCE(SUM(oi.quantity), 0)
        END as avgPrice
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id
      ${whereClause}
      GROUP BY p.id
      HAVING totalQuantity > 0
      ORDER BY totalQuantity DESC, totalRevenue DESC
      LIMIT 50
    `;

    // Because filterClause uses oi.product_id IN, it's tied to oi join.
    // Ensure where clause order of params matches query order.
    // We constructed params for date first, then productIds.
    const [rows] = await database.query(sql, params);

    return rows.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      categoryId: r.categoryId,
      totalQuantity: Number(r.totalQuantity),
      totalRevenue: Number(r.totalRevenue),
      avgPrice: Number(r.avgPrice),
    }));
  }

  async exportTopProductsCsv({ from, to, categoryId, productIds, res, filenameBase } = {}) {
    const startDate = this.parseDateToSql(from);
    const endDate = this.parseDateToSql(to);

    const params = [];
    const conditions = [];

    // Date filter - requires both from and to dates
    if (startDate && endDate) {
      conditions.push('o.created_at >= ? AND o.created_at <= ?');
      params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    } else if (startDate) {
      // Only from date
      conditions.push('o.created_at >= ?');
      params.push(`${startDate} 00:00:00`);
    } else if (endDate) {
      // Only to date
      conditions.push('o.created_at <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    if (categoryId) {
      conditions.push('p.category_id = ?');
      params.push(categoryId);
    }

    if (productIds && productIds.length > 0) {
      conditions.push('oi.product_id IN (' + productIds.map(() => '?').join(',') + ')');
      params.push(...productIds);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const sql = `
      SELECT
        p.id as productId,
        p.name as productName,
        p.category_id as categoryId,
        COALESCE(SUM(oi.quantity), 0) as totalQuantity,
        COALESCE(SUM(oi.quantity * oi.price), 0) as totalRevenue,
        CASE
          WHEN COALESCE(SUM(oi.quantity), 0) = 0 THEN 0
          ELSE COALESCE(SUM(oi.quantity * oi.price), 0) / COALESCE(SUM(oi.quantity), 0)
        END as avgPrice
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id
      ${whereClause}
      GROUP BY p.id
      HAVING totalQuantity > 0
      ORDER BY totalQuantity DESC, totalRevenue DESC
      LIMIT 50
    `;

    const [rows] = await database.query(sql, params);

    // CSV: encode for Vietnamese Excel.
    const headers = [
      'productId',
      'productName',
      'categoryId',
      'totalQuantity',
      'totalRevenue',
      'avgPrice',
    ];

    const csvRows = [headers.join(',')];

    for (const r of rows) {
      const line = [
        r.productId,
        `"${String(r.productName || '').replace(/"/g, '""')}"`,
        r.categoryId ?? '',
        r.totalQuantity,
        r.totalRevenue,
        r.avgPrice,
      ].join(',');
      csvRows.push(line);
    }

    const csv = '\uFEFF' + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filenameBase}_${new Date().toISOString().split('T')[0]}.csv"`
    );

    res.send(csv);
  }
}

module.exports = new ReportsService();

