var express = require('express');
var router = express.Router();
var mongodb = require('mongodb');

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

module.exports = router;
