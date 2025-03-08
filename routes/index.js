var express = require('express');
var router = express.Router();
var mongodb = require('mongodb');
const { createEmbeddings } = require('./embeddings');

/* GET home page. */
router.get('/', async function (req, res, next) {
  try {
    const connection = await mongodb.MongoClient.connect(process.env.DB);
    const db = connection.db('rag_docs');
    const collection = db.collection('documents');
    await collection.insertOne({ test: "success" });
    await connection.close();
    res.json({ title: 'Express' });
  } catch (error) {
    console.log(error);
  }
});

router.get('/embeddings', async function (req, res, next) {
  try {
    const embeddings = await createEmbeddings("Hello, world!");
    res.json(embeddings);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
