import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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
  app.use('/assets', express.static(path.join(__dirname, 'assets')));

  // --- Helper function ---
  async function populateCartLessons(ids) {
    return Promise.all(ids.map(id => db.collection('lessons').findOne({ id })));
  }

  // --- API routes ---

  // Get all lessons
  app.get('/api/lessons', async (req, res) => {
    const lessons = await db.collection('lessons').find({}).toArray();
    res.json(lessons);
  });

  // Get a lesson by ID
  app.get('/api/lessons/:lessonId', async (req, res) => {
    const lessonId = req.params.lessonId;
    const lesson = await db.collection('lessons').findOne({ id: lessonId });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    res.json(lesson);
  });

  // Get user cart
  app.get('/api/orders/:userId/cart', async (req, res) => {
    const user = await db.collection('orders').findOne({ id: req.params.userId });
    const populatedCart = await populateCartLessons(user.cartItems);
    res.json(populatedCart);
  });

  // Add lesson to cart
  app.post('/api/orders/:userId/cart', async (req, res) => {
    const userId = req.params.userId;
    const lessonId = req.body.id;

    await db.collection('orders').updateOne(
      { id: userId },
      { $addToSet: { cartItems: lessonId } }
    );

    // Decrease available spaces
    await db.collection('lessons').updateOne(
      { id: lessonId },
      { $inc: { spaces: -1 } }
    );

    const user = await db.collection('orders').findOne({ id: userId });
    const populatedCart = await populateCartLessons(user.cartItems);
    res.json(populatedCart);
  });

  // Update lesson spaces
  app.put('/api/lessons/:lessonId/spaces', async (req, res) => {
    const lessonId = req.params.lessonId;
    const lesson = await db.collection('lessons').findOne({ id: lessonId });
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const newSpaces = Math.max(0, lesson.spaces - 1);
    await db.collection('lessons').updateOne(
      { id: lessonId },
      { $set: { spaces: newSpaces } }
    );

    res.json({ spaces: newSpaces });
  });

  // Remove lesson from cart
  app.delete('/api/orders/:userId/cart/:lessonId', async (req, res) => {
    const userId = req.params.userId;
    const lessonId = req.params.lessonId;

    await db.collection('orders').updateOne(
      { id: userId },
      { $pull: { cartItems: lessonId } }
    );

    // Increase spaces
    await db.collection('lessons').updateOne(
      { id: lessonId },
      { $inc: { spaces: 1 } }
    );

    const user = await db.collection('orders').findOne({ id: userId });
    const populatedCart = await populateCartLessons(user.cartItems);
    res.json(populatedCart);
  });

  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
}

start();