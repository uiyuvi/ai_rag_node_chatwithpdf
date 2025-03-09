var express = require('express');
var router = express.Router();
var mongodb = require('mongodb');
const { createEmbeddings } = require('./embeddings');
const PDFParser = require('pdf2json');
const fs = require("fs");

const pdfParser = new PDFParser(this, 1);

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

router.post('/loadDocument', async function (request, response) {
  try {
    await pdfParser.loadPDF("./doc/optima-secure-revision-policywording.pdf");
    pdfParser.on("pdfParser_dataReady", async (pdfData) => {
      await fs.writeFileSync(
        "./context.txt",
        pdfParser.getRawTextContent()
      );
      const content = await fs.readFileSync("./context.txt", "utf8");
      response.json({ message: "Document loaded successfully" });
    });

  } catch (error) {
    console.log(error);
    response.status(500).json({ error: error.message });
  }
})

pdfParser.on("pdfParser_dataError", (errData) =>
  console.error(errData.parserError)
);



module.exports = router;
