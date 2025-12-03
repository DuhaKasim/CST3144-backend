import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function start() {

  // MongoDB connection
  const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bakzamu.mongodb.net/${process.env.DB_NAME}?appName=Cluster0`;
  const client = new MongoClient(url);

  await client.connect();
  const db = client.db('FullStackDB');

  const app = express();

  app.use(express.json());
  app.use(cors());

  // Logger middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Serve images
  app.use('/images', express.static(path.join(__dirname, '../assets')));


  // --- API routes ---
  app.get('/api/products', async (req, res) => {
    const products = await db.collection('products').find({}).toArray();
    res.json(products);
  });

  async function populateCartIds(ids) {
    return Promise.all(ids.map(id => db.collection('products').findOne({ id })));
  }

  app.get('/api/users/:userId/cart', async (req, res) => {
    const user = await db.collection('users').findOne({ id: req.params.userId });
    const populatedCart = await populateCartIds(user.cartItems);
    res.json(populatedCart);
  });

  app.get('/api/products/:productId', async (req, res) => {
    const productId = req.params.productId;
    const product = await db.collection('products').findOne({ id: productId });
    res.json(product);
  });

  app.put('/api/products/:productId/spaces', async (req, res) => {
    const productId = req.params.productId;

    try {
      const product = await db.collection('products').findOne({ id: productId });
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (typeof product.spaces !== 'number') {
        product.spaces = 10;
      }

      const newSpaces = Math.max(0, product.spaces - 1);

      await db.collection('products').updateOne(
        { id: productId },
        { $set: { spaces: newSpaces } }
      );

      const updatedProduct = await db.collection('products').findOne({ id: productId });
      res.json(updatedProduct);

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

app.post('/api/users/:userId/cart', async (req, res) => {
  const userId = req.params.userId;
  const productId = req.body.id;

  // Add to cart
  await db.collection('users').updateOne({ id: userId }, {
    $addToSet: { cartItems: productId },
  });

  // Decrease spaces
  await db.collection('products').updateOne(
    { id: productId },
    { $inc: { spaces: -1 } }
  );

  // Fetch updated cart
  const user = await db.collection('users').findOne({ id: userId });
  const populatedCart = await populateCartIds(user.cartItems);
  res.json(populatedCart);
});

app.delete('/api/users/:userId/cart/:productId', async (req, res) => {
  const userId = req.params.userId;
  const productId = req.params.productId;

  // Remove from cart
  await db.collection('users').updateOne({ id: userId }, {
    $pull: { cartItems: productId },
  });

  // Increase spaces
  await db.collection('products').updateOne(
    { id: productId },
    { $inc: { spaces: 1 } }
  );

  // Fetch updated cart
  const user = await db.collection('users').findOne({ id: userId });
  const populatedCart = await populateCartIds(user.cartItems);
  res.json(populatedCart);
});


  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
}

start();
