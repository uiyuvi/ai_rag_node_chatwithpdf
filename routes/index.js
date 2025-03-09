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
    //load document
    await pdfParser.loadPDF("./doc/optima-secure-revision-policywording.pdf");

    //parse document
    pdfParser.on("pdfParser_dataReady", async (pdfData) => {
      await fs.writeFileSync(
        "./context.txt",
        pdfParser.getRawTextContent()
      );
      const content = await fs.readFileSync("./context.txt", "utf8");

      //chunk document
      const splittedContentsByNewLine = content.split("\n");


      //establish connection with mongodb
      const connection = await mongodb.MongoClient.connect(process.env.DB);
      const db = connection.db('rag_docs');
      const collection = db.collection('documents');

      //This takes lot of time depends on the document, since this is for learning, optimisation like utilising multiple core or parallelisation techniques are ignored 
      for (const splittedContent of splittedContentsByNewLine) {
        // using openAI encoder, convert chunked text to embeddings(vectors)
        const embeddings = await createEmbeddings(splittedContent)

        // load vectors to mongodb
        await collection.insertOne({
          text: splittedContent,
          embedding: embeddings.data[0].embedding
        });
      }

      //close connection
      await connection.close();

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
