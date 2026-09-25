import crypto from 'crypto';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

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
 * Detect if two texts contradict each other via negation.
 * Small models (3B) are notoriously bad at understanding negation,
 * so we catch obvious cases in code before sending to the LLM.
 */
function detectNegationContradiction(textA: string, textB: string): boolean {
  const a = textA.toLowerCase();
  const b = textB.toLowerCase();

  const negationWords = ['no ', 'not ', 'none', 'never', 'without', 'lack of', 'absent', 'missing', 'don\'t', 'doesn\'t', 'isn\'t', 'aren\'t', 'wasn\'t', 'weren\'t', 'hasn\'t', 'haven\'t', 'won\'t', 'cannot', 'can\'t'];
  
  const aHasNegation = negationWords.some(neg => a.includes(neg));
  const bHasNegation = negationWords.some(neg => b.includes(neg));

  // If only ONE of them has negation words, they likely contradict
  if (aHasNegation !== bHasNegation) {
    // Check if they share key nouns (at least 2 content words in common)
    const wordsA = getContentWords(a);
    const wordsB = getContentWords(b);
    const shared = [...wordsA].filter(w => wordsB.has(w));
    
    if (shared.length >= 2) {
      return true;
    }
  }

  return false;
}

/**
 * Extract meaningful content words from text, stripping stop words.
 */
function getContentWords(text: string): Set<string> {
  const stopWords = new Set([
    'the', 'a', 'an', 'in', 'on', 'at', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'there', 'it', 'its', 'this', 'that',
    'of', 'to', 'for', 'with', 'by', 'from', 'and', 'or', 'but', 'so', 'no', 'not',
    'room', 'which', 'also', 'very', 'some', 'all', 'any', 'each', 'every',
  ]);
  return new Set((text.match(/\w+/g) || []).filter(w => w.length > 2 && !stopWords.has(w)));
}

/**
 * Detect if two texts contain opposing quality/sentiment words about the same subject.
 * Catches cases like "fans are good" vs "fans have broken blades" where there's no
 * explicit negation but the qualities described are contradictory.
 * 
 * Small LLMs (3B) often see shared nouns ("fans") and wrongly classify as DUPLICATE,
 * missing that the adjectives/qualities are in direct opposition.
 */
function detectQualityContradiction(textA: string, textB: string): boolean {
  const a = textA.toLowerCase();
  const b = textB.toLowerCase();

  // Pairs of opposing quality words. Each sub-array contains words that are
  // semantically positive vs negative for the same attribute.
  const opposingPairs: [string[], string[]][] = [
    // Condition / state
    [['good', 'fine', 'excellent', 'great', 'perfect', 'intact', 'clean', 'new', 'proper', 'adequate', 'satisfactory', 'acceptable'],
     ['bad', 'poor', 'broken', 'damaged', 'cracked', 'defective', 'faulty', 'worn', 'deteriorated', 'rusted', 'corroded', 'dirty', 'old', 'improper', 'inadequate', 'unsatisfactory', 'unacceptable']],
    // Working status
    [['working', 'functional', 'operational', 'functioning', 'running', 'active', 'operable'],
     ['broken', 'malfunctioning', 'non-functional', 'nonfunctional', 'inoperable', 'failed', 'dead', 'faulty', 'defective', 'stopped']],
    // Presence / existence
    [['present', 'available', 'installed', 'exists', 'found', 'equipped', 'provided'],
     ['absent', 'missing', 'removed', 'unavailable', 'uninstalled', 'gone', 'lacking']],
    // Safety
    [['safe', 'secure', 'stable', 'sturdy', 'strong', 'solid'],
     ['unsafe', 'insecure', 'unstable', 'loose', 'weak', 'wobbly', 'hazardous', 'dangerous']],
    // Cleanliness
    [['clean', 'tidy', 'maintained', 'well-maintained', 'polished', 'spotless'],
     ['dirty', 'filthy', 'stained', 'moldy', 'mouldy', 'dusty', 'grimy', 'neglected', 'unmaintained']],
    // Completeness
    [['complete', 'whole', 'full', 'undamaged', 'unbroken'],
     ['incomplete', 'partial', 'broken', 'chipped', 'fractured', 'shattered', 'cracked']],
    // Leakage
    [['dry', 'sealed', 'watertight', 'no leaks'],
     ['leaking', 'leaky', 'dripping', 'wet', 'flooded', 'seeping']],
  ];

  const wordsA = new Set((a.match(/\w+/g) || []).map(w => w.toLowerCase()));
  const wordsB = new Set((b.match(/\w+/g) || []).map(w => w.toLowerCase()));

  for (const [positiveGroup, negativeGroup] of opposingPairs) {
    const aHasPositive = positiveGroup.some(w => wordsA.has(w) || a.includes(w));
    const aHasNegative = negativeGroup.some(w => wordsA.has(w) || a.includes(w));
    const bHasPositive = positiveGroup.some(w => wordsB.has(w) || b.includes(w));
    const bHasNegative = negativeGroup.some(w => wordsB.has(w) || b.includes(w));

    // One text uses positive terms, the other uses negative terms from the same pair
    if ((aHasPositive && !aHasNegative && bHasNegative && !bHasPositive) ||
        (aHasNegative && !aHasPositive && bHasPositive && !bHasNegative)) {
      // Verify they're talking about the same subject (share at least 1 content word)
      const contentA = getContentWords(a);
      const contentB = getContentWords(b);
      // Remove the quality words themselves from content words to find shared subjects
      const qualityWords = new Set([...positiveGroup, ...negativeGroup]);
      const subjectA = [...contentA].filter(w => !qualityWords.has(w));
      const subjectB = [...contentB].filter(w => !qualityWords.has(w));
      const sharedSubjects = subjectA.filter(w => subjectB.includes(w));

      if (sharedSubjects.length >= 1) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Post-LLM validation: catch cases where the small model incorrectly classified
 * contradictory observations as DUPLICATE. This acts as a safety net.
 */
function postValidateResult(
  result: SemanticAnalysisResult,
  textA: string,
  textB: string
): SemanticAnalysisResult {
  // If the LLM said DUPLICATE, double-check for quality contradictions
  if (result.relationship === 'DUPLICATE') {
    if (detectQualityContradiction(textA, textB) || detectNegationContradiction(textA, textB)) {
      console.log('[Post-validation] Overriding DUPLICATE → CONTRADICTORY (opposing qualities detected).');
      return {
        relationship: 'CONTRADICTORY',
        confidence: 0.88,
        reason: 'The observations describe opposing conditions about the same subject. One reports a positive finding while the other reports a negative finding. This requires human review.',
        suggestedAction: 'HUMAN_REVIEW',
        suggestedText: undefined,
      };
    }
  }

  // If the LLM said COMPLEMENTARY but qualities are in direct opposition, override
  if (result.relationship === 'COMPLEMENTARY') {
    if (detectQualityContradiction(textA, textB)) {
      console.log('[Post-validation] Overriding COMPLEMENTARY → CONTRADICTORY (opposing qualities detected).');
      return {
        relationship: 'CONTRADICTORY',
        confidence: 0.85,
        reason: 'The observations make conflicting claims about the condition of the same subject. This is a contradiction that requires human review, not complementary information.',
        suggestedAction: 'HUMAN_REVIEW',
        suggestedText: undefined,
      };
    }
  }

  return result;
}

/**
 * Analyze the semantic relationship between two observations at the same location.
 * Uses a LOCAL LLaMA 3.2 3B model via Ollama — no external API calls, no rate limits.
 * 
 * Includes a negation pre-check to catch obvious contradictions that small models miss.
 * 
 * IMPORTANT: The AI must NOT determine factual truth. It only classifies
 * the relationship and provides suggestions for human review.
 */
export async function analyzeObservationPair(
  input: SemanticAnalysisInput
): Promise<SemanticAnalysisResult> {

  // Pre-check: catch negation-based contradictions that small models miss
  if (detectNegationContradiction(input.observation1.text, input.observation2.text)) {
    console.log('[Negation Pre-check] Detected contradiction via negation.');
    return {
      relationship: 'CONTRADICTORY',
      confidence: 0.92,
      reason: 'One observation affirms a finding while the other explicitly denies it. This is a direct contradiction that requires human review.',
      suggestedAction: 'HUMAN_REVIEW',
    };
  }

  // Pre-check: catch quality/sentiment contradictions (good vs broken, working vs damaged, etc.)
  if (detectQualityContradiction(input.observation1.text, input.observation2.text)) {
    console.log('[Quality Pre-check] Detected contradiction via opposing quality words.');
    return {
      relationship: 'CONTRADICTORY',
      confidence: 0.90,
      reason: 'The observations describe opposing conditions about the same subject — one reports a positive finding while the other reports a negative/damaged condition. This requires human review.',
      suggestedAction: 'HUMAN_REVIEW',
    };
  }

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
- CONTRADICTORY: The observations make incompatible or conflicting claims about the same aspect of the location. PAY CLOSE ATTENTION TO NEGATION WORDS like "no", "not", "none", "without", "missing". If one says something EXISTS and the other says it DOES NOT EXIST, that is CONTRADICTORY.
- INDEPENDENT: The observations describe unrelated aspects of the location.

EXAMPLES:
1. A: "Wall has cracks" / B: "Wall has no cracks" → CONTRADICTORY (one affirms, one denies)
2. A: "Paint is peeling" / B: "Paint is peeling on walls" → DUPLICATE (same finding)
3. A: "Ceiling has water stains" / B: "Floor tiles are broken" → INDEPENDENT (different topics)
4. A: "Window is broken" / B: "Window frame also shows rust damage" → COMPLEMENTARY (adds detail)
5. A: "Fire extinguisher present" / B: "No fire extinguisher found" → CONTRADICTORY (one affirms, one denies)
6. A: "Wiring is exposed in ceiling" / B: "Exposed wiring noticed, looks old" → DUPLICATE (same finding)
7. A: "Plumbing leak in bathroom" / B: "Bathroom walls have mold growth near pipes" → COMPLEMENTARY (related findings)

CRITICAL RULES:
1. You must NOT determine which observation is factually correct. If they conflict, classify as CONTRADICTORY and let a human decide.
2. For COMPLEMENTARY observations, suggest a combined text that preserves information from both observations.
3. For CONTRADICTORY observations, set suggestedAction to "HUMAN_REVIEW". Never claim one inspector is right and the other is wrong.
4. Be conservative with confidence — use values between 0.6 and 0.99.
5. For DUPLICATE, set suggestedAction to "KEEP_ONE".
6. For COMPLEMENTARY, set suggestedAction to "COMBINE".
7. For CONTRADICTORY, set suggestedAction to "HUMAN_REVIEW".
8. For INDEPENDENT, set suggestedAction to "KEEP_BOTH".
9. If one observation says something IS present and the other says it IS NOT present, that is ALWAYS CONTRADICTORY, never DUPLICATE.

Respond with ONLY valid JSON:
{
  "relationship": "DUPLICATE | COMPLEMENTARY | CONTRADICTORY | INDEPENDENT",
  "confidence": <number between 0 and 1>,
  "reason": "<brief explanation of why this classification was chosen>",
  "suggestedAction": "KEEP_ONE | COMBINE | HUMAN_REVIEW | KEEP_BOTH",
  "suggestedText": "<combined or preferred text, only for COMPLEMENTARY or DUPLICATE, null otherwise>"
}`;

  let retries = 3;
  let delay = 1000;

  while (retries > 0) {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.2,
            num_predict: 512,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.response || '';
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanText);

      const validated = validateSemanticResult(parsed);
      // Post-LLM safety net: override if the model misclassified obvious contradictions
      return postValidateResult(validated, input.observation1.text, input.observation2.text);
    } catch (error: any) {
      console.warn(`[Ollama] Error, retrying in ${delay}ms... (${retries - 1} retries left):`, error?.message);
      if (retries <= 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
      retries--;
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
