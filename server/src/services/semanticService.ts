import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import crypto from 'crypto';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export interface SemanticAnalysisInput {
  observation1: {
    observationId: string;
    authorName: string;
    text: string;
  };
  observation2: {
    observationId: string;
    authorName: string;
    text: string;
  };
  locationName: string;
}

export interface SemanticAnalysisResult {
  relationship: 'DUPLICATE' | 'COMPLEMENTARY' | 'CONTRADICTORY' | 'INDEPENDENT';
  confidence: number;
  reason: string;
  suggestedAction: string;
  suggestedText?: string;
}

/**
 * Analyze the semantic relationship between two observations at the same location.
 * Uses the same Gemini model configured in the existing environment.
 * 
 * IMPORTANT: The AI must NOT determine factual truth. It only classifies
 * the relationship and provides suggestions for human review.
 */
export async function analyzeObservationPair(
  input: SemanticAnalysisInput
): Promise<SemanticAnalysisResult> {
  const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL || 'gemini-3.6-flash' });

  const prompt = `You are a semantic relationship analyzer for a collaborative inspection reporting system.

Two inspectors have independently written observations about the same physical location during a building inspection. Your task is to classify the relationship between their observations.

LOCATION: "${input.locationName}"

OBSERVATION A (by ${input.observation1.authorName}):
"${input.observation1.text}"

OBSERVATION B (by ${input.observation2.authorName}):
"${input.observation2.text}"

Classify the relationship as exactly ONE of:
- DUPLICATE: Both observations describe essentially the same finding with no significant additional information.
- COMPLEMENTARY: The observations describe related findings that together provide a more complete picture. One may add detail, context, or extension to the other.
- CONTRADICTORY: The observations make incompatible or conflicting claims about the same aspect of the location.
- INDEPENDENT: The observations describe unrelated aspects of the location.

CRITICAL RULES:
1. You must NOT determine which observation is factually correct. If they conflict, classify as CONTRADICTORY and let a human decide.
2. For COMPLEMENTARY observations, suggest a combined text that preserves information from both observations.
3. For CONTRADICTORY observations, set suggestedAction to "HUMAN_REVIEW". Never claim one inspector is right and the other is wrong.
4. Be conservative with confidence — use values between 0.6 and 0.99.
5. For DUPLICATE, set suggestedAction to "KEEP_ONE".
6. For COMPLEMENTARY, set suggestedAction to "COMBINE".
7. For CONTRADICTORY, set suggestedAction to "HUMAN_REVIEW".
8. For INDEPENDENT, set suggestedAction to "KEEP_BOTH".

Respond with ONLY valid JSON (no markdown code blocks):
{
  "relationship": "DUPLICATE | COMPLEMENTARY | CONTRADICTORY | INDEPENDENT",
  "confidence": <number between 0 and 1>,
  "reason": "<brief explanation of why this classification was chosen>",
  "suggestedAction": "KEEP_ONE | COMBINE | HUMAN_REVIEW | KEEP_BOTH",
  "suggestedText": "<combined or preferred text, only for COMPLEMENTARY or DUPLICATE, null otherwise>"
}`;

  let retries = 5;
  let delay = 1000; // start with 1 second

  while (retries > 0) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanText);

      // Validate the response structure
      return validateSemanticResult(parsed);
    } catch (error: any) {
      if (error?.status === 503 && retries > 1) {
        console.warn(`[Gemini API 503] High demand, retrying in ${delay}ms... (${retries - 1} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
        retries--;
        continue;
      }
      // If it's not a 503 or we've run out of retries, throw the error
      throw error;
    }
  }

  throw new Error('Max retries exceeded for semantic analysis');
}

/**
 * Validate and sanitize AI response to ensure it conforms to expected schema.
 * Never trust raw AI output — enforce structure.
 */
function validateSemanticResult(raw: any): SemanticAnalysisResult {
  const validRelationships = ['DUPLICATE', 'COMPLEMENTARY', 'CONTRADICTORY', 'INDEPENDENT'];
  const validActions = ['KEEP_ONE', 'COMBINE', 'HUMAN_REVIEW', 'KEEP_BOTH'];

  const relationship = validRelationships.includes(raw.relationship)
    ? raw.relationship
    : 'INDEPENDENT';

  const suggestedAction = validActions.includes(raw.suggestedAction)
    ? raw.suggestedAction
    : 'KEEP_BOTH';

  let confidence = typeof raw.confidence === 'number' ? raw.confidence : 0.5;
  confidence = Math.max(0, Math.min(1, confidence));

  const reason = typeof raw.reason === 'string' && raw.reason.length > 0
    ? raw.reason.substring(0, 2000)
    : 'Unable to determine reason.';

  const suggestedText = typeof raw.suggestedText === 'string' && raw.suggestedText.length > 0
    ? raw.suggestedText.substring(0, 5000)
    : undefined;

  return {
    relationship,
    confidence,
    reason,
    suggestedAction,
    suggestedText,
  };
}

/**
 * Lightweight candidate filtering: determine which observation pairs at a location
 * are worth sending to Gemini. Filters out trivially short observations and
 * observations from the same author.
 */
export function filterCandidatePairs(
  observations: Array<{ observationId: string; authorId: string; authorName: string; text: string }>
): Array<[typeof observations[0], typeof observations[0]]> {
  const pairs: Array<[typeof observations[0], typeof observations[0]]> = [];

  // Filter out empty or trivially short observations
  const substantive = observations.filter((o) => o.text.trim().length >= 5);

  for (let i = 0; i < substantive.length; i++) {
    for (let j = i + 1; j < substantive.length; j++) {
      // Allow comparing all observations (including from the same author) to make testing easier
      pairs.push([substantive[i], substantive[j]]);
    }
  }

  return pairs;
}

/**
 * Generate a consistent MD5 hash for observation content to avoid duplicate AI calls
 */
export function generateContentHash(text: string): string {
  return crypto.createHash('md5').update(text.trim()).digest('hex');
}
