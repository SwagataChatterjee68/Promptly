// Import the Pinecone library
const { Pinecone } = require("@pinecone-database/pinecone");

// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const promptlyIndex = pc.Index("promptly");

async function createMemory({ vectors, metadata, messageID }) {
  await promptlyIndex.upsert([
    {
      id: messageID,
      values: vectors,
      metadata: metadata,
    },
  ]);
}

async function queryMemory({ queryVector, limit = 5, metadata }) {
  const data = await promptlyIndex.query({
    vector: queryVector,
    topK: limit,
    filter:metadata ?  metadata  : undefined,
    includeMetadata: true,
  });
  return data.matches;
}

module.exports = {
  createMemory,
  queryMemory,
};
