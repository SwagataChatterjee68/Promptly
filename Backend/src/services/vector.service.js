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
    filter: metadata ? metadata : undefined,
    includeMetadata: true,
  });
  return data.matches;
}

async function deleteChatMemory(messageIds) {
  try {
    if (!messageIds || messageIds.length === 0) return;

    // Pinecone Starter Tier allows deleting by IDs
    await promptlyIndex.deleteMany(messageIds);

    console.log(`Deleted ${messageIds.length} vectors from Pinecone`);
  } catch (error) {
    console.error("Error deleting vectors from Pinecone:", error);
    // Don't throw, just log. We don't want to crash the request if Pinecone fails.
  }
}

module.exports = {
  createMemory,
  queryMemory,
  deleteChatMemory,
};
