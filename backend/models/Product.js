import { Schema, model } from 'mongoose';

const productSchema = new Schema({
  name:        { type: String, required: true },
  description: { type: String, required: true },
  price:       { type: Number, required: true, min: 0 },
  category:    { type: String, required: true },
  stock:       { type: Number, required: true, min: 0 },
  version:     { type: Number, default: 0 }, 
}, { timestamps: true });

export default model('Product', productSchema);