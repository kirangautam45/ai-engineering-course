// Downloads the local AI models during the BUILD, so the first visitor doesn't wait for them.
// Run: npm run warm-models  (render.yaml runs it after npm ci)
import { EMBEDDING_MODEL, embed } from "../../lib/embeddings.js";
import { rerank, RERANK_MODEL } from "../../lib/rerank.js";

if (!EMBEDDING_MODEL.includes(":")) {
  // Local embeddings (no "provider:" prefix): download that model too
  await embed("warm up");
  console.log(`✅ ${EMBEDDING_MODEL}`);
}
if (process.env.RERANK !== "off") {
  await rerank("warm up", [{ text: "warm up" }]);
  console.log(`✅ ${RERANK_MODEL}`);
}
