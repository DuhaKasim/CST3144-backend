import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';


dotenv.config();

  async function start() {

  //Mongodb connection
  const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bakzamu.mongodb.net/${process.env.DB_NAME}?appName=Cluster0`
  const client = new MongoClient(url);

  await client.connect();
  const db = client.db('FullStackDB');

  const app = express();

  
  app.use(express.json());
  app.use(cors());


  app.use('/images', express.static(path.join(__dirname, '../assets')));


  app.get ('/api/products', async (req, res) => {
    const products = await db.collection('products').find({}).toArray();
    res.send(products);

  });

  async function populateCartIds(ids) {
      return Promise.all(ids.map(id => db.collection('products').findOne({ id })));

  };

  app.get('/api/users/:userId/cart', async (req, res) => {
      const user = await db.collection('users').findOne({ id: req.params.userId });
      const populatedCart = await populateCartIds(user.cartItems);
      res.json(populatedCart);

  });

  app.get ('/api/products/:productId', async (req, res) => {
      const productId = req.params.productId;
      const product = await db.collection('products').findOne({ id: productId });
      res.json(product);

  });

  app.post('/api/users/:userId/cart', async (req, res) => {
      const userId = req.params.userId;
      const productId = req.body.id;

      await db.collection('users').updateOne({ id: userId }, {
        $addToSet: { cartItems: productId },
      });


      const user = await db.collection('users').findOne({ id: req.params.userId });
      const populatedCart = await populateCartIds(user.cartItems);
      res.json(populatedCart);

  });

  app.delete('/api/users/:userId/cart/:productId', async (req, res) => {
      const userId = req.params.userId;
      const productId = req.params.productId;

      await db.collection('users').updateOne({ id: userId}, {
        $pull: { cartItems: productId },
      });

      const user = await db.collection('users').findOne({ id: req.params.userId });
      const populatedCart = await populateCartIds(user.cartItems);
      res.json(populatedCart);
  });

  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
  });


  }

  start();