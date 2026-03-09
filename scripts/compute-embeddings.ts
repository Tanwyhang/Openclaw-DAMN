import { pipeline } from '@xenova/transformers';
import { PCA } from 'ml-pca';

export interface EmbeddingResult {
  embedding: number[];
  position3D: { x: number; y: number; z: number };
}

let embeddingModel: any = null;

/**
 * Initialize the embedding model (singleton pattern)
 */
async function initModel() {
  if (!embeddingModel) {
    console.log('Loading embedding model...');
    embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Model loaded successfully');
  }
  return embeddingModel;
}

/**
 * Generate text embedding using transformers.js
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = await initModel();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * PCA implementation for dimensionality reduction
 */
function performPCA(embeddings: number[][], targetDimensions: number = 3): number[][] {
  const pca = new PCA(embeddings);
  const projected = pca.predict(embeddings, { nComponents: targetDimensions });
  return projected.to2DArray();
}

/**
 * Normalize 3D positions to unit sphere
 */
function normalizeToSphere(positions: number[][]): { x: number; y: number; z: number }[] {
  return positions.map(([x, y, z]) => {
    const length = Math.sqrt(x * x + y * y + z * z);
    if (length === 0) {
      return { x: 0, y: 1, z: 0 }; // Default to top of sphere
    }
    return {
      x: x / length,
      y: y / length,
      z: z / length,
    };
  });
}

/**
 * Generate embeddings for all texts and reduce to 3D positions
 */
export async function generateEmbeddingsAndPositions(
  texts: string[]
): Promise<EmbeddingResult[]> {
  console.log(`Generating embeddings for ${texts.length} texts...`);
  
  // Generate embeddings
  const embeddings: number[][] = [];
  for (let i = 0; i < texts.length; i++) {
    if (i % 50 === 0) {
      console.log(`  Progress: ${i}/${texts.length}`);
    }
    const embedding = await generateEmbedding(texts[i]);
    embeddings.push(embedding);
  }
  
  console.log('Performing dimensionality reduction to 3D...');
  const positions3D = performPCA(embeddings, 3);
  
  console.log('Normalizing to unit sphere...');
  const spherePositions = normalizeToSphere(positions3D);
  
  return embeddings.map((embedding, i) => ({
    embedding,
    position3D: spherePositions[i],
  }));
}
