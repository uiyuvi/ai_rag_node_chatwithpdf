const OpenAI = require('openai');
// const axios = require('axios');

async function createEmbeddings(text) {
    try {
        const openai = new OpenAI({ 
            organization: process.env.OPENAI_API_ORGANIZATION,
            apiKey: process.env.OPENAI_API_KEY_PROJECTID_RAG
         });
        const embeddings = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: text,
            encoding_format: "float",          
        });
        /* const response = await axios.post(
            'https://api.openai.com/v1/embeddings',
            {
                model: 'text-embedding-ada-002', // The embedding model (use the free tier model)
                input: text
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY_PROJECTID_RAG}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Organization': process.env.OPENAI_API_ORGANIZATION, // Optional: Include if you're part of an organization
                }
            }
        );

        const embeddings = response.data.data[0].embedding; */
        return embeddings;
    } catch (error) {
        throw new Error(error)
    }
}

module.exports = { createEmbeddings }