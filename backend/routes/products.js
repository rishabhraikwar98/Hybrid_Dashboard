import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleStock,
  deleteProduct,
} from '../controllers/productController.js';

const router = Router();

router.get('/',getProducts);
router.get('/:id',getProductById);
router.post('/',createProduct);
router.put('/:id',updateProduct);
router.patch('/:id/stock',toggleStock);
router.delete('/:id',deleteProduct);

export default router;