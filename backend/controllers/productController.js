import Product from '../models/Product.js';
import asyncHandler from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';

export const getProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, search = '', category = '', status = '', catagory = '' } = req.query;
  const activeCategory = (category || catagory).trim();

  const query = {};
  if (search)   query.name     = { $regex: search, $options: 'i' };
  if (activeCategory && activeCategory.toLowerCase() !== 'all') {
    query.category = { $regex: `^${activeCategory}$`, $options: 'i' };
  }
  if (status === 'in-stock')     query.stock = { $gt: 0 };
  if (status === 'out-of-stock') query.stock = 0;

  const pageNum  = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit))); // cap at 100
  const skip     = (pageNum - 1) * limitNum;

  const [total, items, categoryCounts] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query).skip(skip).limit(limitNum).sort({ createdAt: -1 }),
    Product.aggregate([
      { $match: (() => { const q = { ...query }; delete q.category; return q; })() },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    success: true,
    products: items,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    categoryCounts,
  });
});

export const getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));
  res.json({ success: true, product });
});

export const createProduct = asyncHandler(async (req, res, next) => {
  const { name, description, price, category, stock } = req.body;

  if (!name || !description || !category) {
    return next(new AppError('name, description, and category are required', 400));
  }
  if (price === undefined || price < 0) {
    return next(new AppError('price must be 0 or greater', 400));
  }
  if (stock === undefined || stock < 0) {
    return next(new AppError('stock must be 0 or greater', 400));
  }

  const product = await Product.create({ name, description, price, category, stock });
  res.status(201).json({ success: true, product });
});

export const updateProduct = asyncHandler(async (req, res, next) => {
  const { version, ...updates } = req.body;

  // Validate price/stock if provided
  if (updates.price !== undefined && updates.price < 0) {
    return next(new AppError('price must be 0 or greater', 400));
  }
  if (updates.stock !== undefined && updates.stock < 0) {
    return next(new AppError('stock must be 0 or greater', 400));
  }

  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));

  // optimistic locking
  if (version !== undefined && product.version !== version) {
    return next(new AppError('This product was updated elsewhere — please reload to see the latest version.', 409));
  }

  Object.assign(product, updates);
  product.version = (product.version ?? 0) + 1;
  await product.save();

  res.json({ success: true, product });
});

export const toggleStock = asyncHandler(async (req, res, next) => {
  // force failure for rollback demo
  if (req.query.simulateError === 'true') {
    return next(new AppError('Simulated server error for rollback demo', 500));
  }

  const { stock } = req.body;
  if (stock === undefined || stock < 0) {
    return next(new AppError('stock must be 0 or greater', 400));
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { stock },
    { new: true, runValidators: true }
  );
  if (!product) return next(new AppError('Product not found', 404));

  res.json({ success: true, product });
});

export const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));
  res.json({ success: true, message: 'Product deleted' });
});