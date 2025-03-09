var express = require('express');
var router = express.Router();
var { MongoClient, ObjectId } = require('mongodb');
const { createEmbeddings } = require('./embeddings');
const PDFParser = require('pdf2json');
const fs = require("fs");
const OpenAI = require('openai');

const pdfParser = new PDFParser(this, 1);

/* GET home page. */
router.get('/', async function (req, res, next) {
  try {
    const connection = await MongoClient.connect(process.env.DB);
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
      const connection = await MongoClient.connect(process.env.DB);
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

router.post('/conversation', async function (request, response) {
  try {
    let sessionID = request.body.sessionID;

    //establish connection with mongodb
    const connection = await MongoClient.connect(process.env.DB);
    const db = connection.db('rag_docs');

    //if no sessionId is sent, create a new session.
    if (!sessionID) {
      const sessionCollection = db.collection('sessions');
      const sessionData = await sessionCollection.insertOne({ createdAt: new Date() });
      sessionID = sessionData._id;
    }

    if (sessionID) {
      const sessionCollection = db.collection('sessions');
      const sessionData = await sessionCollection.findOne({ _id: new ObjectId(sessionID) });
      if (!sessionData) {
        return response.status(404).json({ message: "session not found" });
      }
    }

    //conversation logic
    const conversationCollection = db.collection('conversations');
    conversationCollection.insertOne({
      sessionID: sessionID,
      message: request.body.message,
      createdAt: new Date(),
      role: "user"
    });

    //convert message to vector
    const messageVector = await createEmbeddings(request.body.message);
    const documentsCollection = db.collection('documents');

    // perform aggregation to find the most similar document
    const vectorSearchResults = await documentsCollection.aggregate([
      {
        $vectorSearch: {
          index: "default", // mongo db > atlas search > name of the index of collection about to search
          path: "embedding", // mogo db > collection > name of the field where vectors are stored
          queryVector: messageVector.data[0].embedding, // user message as vector
          numCandidates: 150, // it can return upto 150 documents
          limit: 10 //limit search results , like take top 10 results
        }
      },
      {
        $project: {
          _id: 0, // do not get the id from the search results  (0 | 1 - boolean)
          text: 1, // get the text from search results (0 | 1 - boolean)
          score: {
            $meta: "vectorSearchScore"
          }
        }
      }
    ]);

    //feed vector search results to chat model to return response in human language
    let finalResults = []
    for await (let result of vectorSearchResults) {
      finalResults.push(result);
    }

    const openai = new OpenAI({
      organization: process.env.OPENAI_API_ORGANIZATION,
      apiKey: process.env.OPENAI_API_KEY_PROJECTID_RAG
    });

    const chat = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are humble helper who can answer for questions asked by users from the given content"
        },
        {
          role: "user",
          content: `${finalResults.map(result => result.text + "\n")}
          \n
          From the above context answer following question: ${request.body.message}`
        }
      ]
    })

    response.json(chat.choices[0].message.content);
  } catch (error) {
    console.log(error);
    response.status(500).json({ error: error.message });
  }

});

module.exports = router;
