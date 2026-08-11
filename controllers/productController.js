const pool = require('../config/db');

// GET /api/products?category=Sofas&search=sofa
const getProducts = async (req, res) => {
  const { category, search } = req.query;

  let query = 'SELECT * FROM products';
  const params = [];
  const conditions = [];

  if (category && category.toLowerCase() !== 'all') {
    params.push(category);
    conditions.push(`LOWER(category) = LOWER($${params.length})`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    conditions.push(
      `(LOWER(name) LIKE $${params.length} OR LOWER(category) LIKE $${params.length})`
    );
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  try {
    const result = await pool.query(query, params);
    return res.status(200).json({ products: result.rows });
  } catch (err) {
    console.error('Get products error:', err.message);
    return res.status(500).json({ message: 'Server error fetching products.' });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(parseInt(id, 10))) {
    return res.status(400).json({ message: 'Invalid product ID.' });
  }

  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    return res.status(200).json({ product: result.rows[0] });
  } catch (err) {
    console.error('Get product by id error:', err.message);
    return res.status(500).json({ message: 'Server error fetching product.' });
  }
};

// POST /api/products  (admin only)
const createProduct = async (req, res) => {
  const { name, category, price, description, images } = req.body;

  if (!name || !category || !price) {
    return res.status(400).json({ message: 'Name, category and price are required.' });
  }

  const validCategories = ['Sofas', 'Cots', 'Curtains'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      message: `Invalid category. Must be one of: ${validCategories.join(', ')}.`,
    });
  }

  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ message: 'Price must be a valid positive number.' });
  }

  const imageArray = Array.isArray(images) ? images : [];

  try {
    const result = await pool.query(
      `INSERT INTO products (name, category, price, description, images)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), category, parsedPrice, description || '', JSON.stringify(imageArray)]
    );

    return res.status(201).json({ product: result.rows[0] });
  } catch (err) {
    console.error('Create product error:', err.message);
    return res.status(500).json({ message: 'Server error creating product.' });
  }
};

// PUT /api/products/:id  (admin only)
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, category, price, description, images } = req.body;

  if (isNaN(parseInt(id, 10))) {
    return res.status(400).json({ message: 'Invalid product ID.' });
  }

  try {
    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const current = existing.rows[0];

    const updatedName = name ? name.trim() : current.name;
    const updatedCategory = category || current.category;
    const updatedPrice =
      price !== undefined ? parseFloat(price) : parseFloat(current.price);
    const updatedDescription =
      description !== undefined ? description : current.description;
    const updatedImages = Array.isArray(images) ? images : current.images;

    if (category) {
      const validCategories = ['Sofas', 'Cots', 'Curtains'];
      if (!validCategories.includes(updatedCategory)) {
        return res.status(400).json({
          message: `Invalid category. Must be one of: ${validCategories.join(', ')}.`,
        });
      }
    }

    if (isNaN(updatedPrice) || updatedPrice < 0) {
      return res.status(400).json({ message: 'Price must be a valid positive number.' });
    }

    const result = await pool.query(
      `UPDATE products
       SET name = $1, category = $2, price = $3, description = $4, images = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        updatedName,
        updatedCategory,
        updatedPrice,
        updatedDescription,
        JSON.stringify(updatedImages),
        id,
      ]
    );

    return res.status(200).json({ product: result.rows[0] });
  } catch (err) {
    console.error('Update product error:', err.message);
    return res.status(500).json({ message: 'Server error updating product.' });
  }
};

// DELETE /api/products/:id  (admin only)
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  if (isNaN(parseInt(id, 10))) {
    return res.status(400).json({ message: 'Invalid product ID.' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    return res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Delete product error:', err.message);
    return res.status(500).json({ message: 'Server error deleting product.' });
  }
};

// GET /api/products/stats  (admin only)
const getProductStats = async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM products');
    const byCategory = await pool.query(
      'SELECT category, COUNT(*) as count FROM products GROUP BY category'
    );

    const stats = {
      total: parseInt(total.rows[0].count, 10),
      byCategory: {},
    };

    byCategory.rows.forEach((row) => {
      stats.byCategory[row.category] = parseInt(row.count, 10);
    });

    return res.status(200).json({ stats });
  } catch (err) {
    console.error('Get stats error:', err.message);
    return res.status(500).json({ message: 'Server error fetching stats.' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
};