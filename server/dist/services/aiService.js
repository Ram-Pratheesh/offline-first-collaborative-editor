import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
export const generateChangeSummary = async (changes, documentTitle) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
        const prompt = `You are a collaborative document editor assistant. Analyze the following collaborative editing session and generate a clear, human-readable summary.

Document Title: "${documentTitle}"

Active Contributors and the current merged document content (JSON):
${JSON.stringify(changes, null, 2)}

IMPORTANT CONTEXT: This is a real-time collaborative document. Multiple users may have edited simultaneously or while others were offline. The content shown is the MERGED result — individual authorship of specific words cannot be determined. All listed contributors have been actively editing this document.

Generate a response in the following JSON format (and ONLY JSON, no markdown code blocks):
{
  "summary": "A 2-3 sentence narrative. Mention each contributor by name. Example: 'Ram and Som have been collaborating on this document. Ram made edits while Som was offline, and when Som reconnected, his offline changes were successfully merged. The document now contains contributions from both users.'",
  "contributorChanges": [
    {
      "userName": "Name",
      "changes": ["What this person likely contributed based on context"]
    }
  ],
  "importantAdditions": ["Quote short plain-text snippets of notable content in the document"],
  "removedContent": [],
  "noEditsLost": true,
  "totalEdits": <number of contributors>
}

Rules:
1. NEVER include HTML tags like <p>, <em>, <h1> etc. Only plain readable text.
2. List EVERY contributor by their actual name — do NOT attribute all content to just one person.
3. If there are multiple contributors, acknowledge that both/all of them contributed to the document.
4. Mention offline/online sync: e.g. "When Som came back online, his offline edits were merged with Ram's changes."
5. Quote short snippets of the actual document text content.
6. Be honest: say "both users collaborated" rather than falsely attributing specific words to one person when you cannot know.
7. Keep the tone friendly and informative.
8. The summary should read like a story of the collaboration session.`;
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        // Parse the JSON response - strip any markdown code block markers
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanText);
        return parsed;
    }
    catch (error) {
        console.error('AI summary generation failed:', error);
        // Fallback: generate a basic summary without AI
        return generateFallbackSummary(changes);
    }
};
export const generateTrackedChangeSummary = async (perUserChanges, documentTitle) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
        // Build a human-readable description of each user's changes
        const userDescriptions = perUserChanges.map((u) => {
            let desc = `${u.userName}:\n`;
            if (u.insertedText)
                desc += `  - Typed/inserted: "${u.insertedText}"\n`;
            if (u.deletedText)
                desc += `  - Deleted: "${u.deletedText}"\n`;
            if (u.offlineText)
                desc += `  - Typed while OFFLINE (merged when reconnected): "${u.offlineText}"\n`;
            if (!u.insertedText && !u.deletedText && !u.offlineText)
                desc += `  - No tracked changes\n`;
            return desc;
        }).join('\n');
        const prompt = `You are a collaborative document editor assistant. Below is a REAL per-user change log from a collaborative editing session. Each user's actual typed text has been tracked separately by the server.

Document Title: "${documentTitle}"

=== PER-USER CHANGES (server-tracked) ===
${userDescriptions}

Based on this REAL tracked data, generate a response in the following JSON format (and ONLY JSON, no markdown code blocks):
{
  "summary": "A 2-3 sentence narrative summary mentioning each user by name and what they specifically typed. If any user typed while offline, mention that their offline edits were merged when they reconnected.",
  "contributorChanges": [
    {
      "userName": "Actual user name",
      "changes": ["Specific description of what THIS user typed, quoting their actual text"]
    }
  ],
  "importantAdditions": ["Short plain-text quotes of notable content that was added"],
  "removedContent": ["Short plain-text quotes of content that was removed, if any"],
  "noEditsLost": true,
  "totalEdits": ${perUserChanges.length}
}

Rules:
1. NEVER include HTML tags. Only plain readable text.
2. Use each person's ACTUAL NAME from the tracked data above.
3. Attribute each person's changes ONLY based on the tracked data — do NOT guess or mix up attribution.
4. If someone typed while offline, explicitly say so: e.g. "Som typed 'xyz' while offline, which was merged when he reconnected."
5. Quote short snippets of the actual text each person typed.
6. Keep the tone friendly and informative.`;
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanText);
        return parsed;
    }
    catch (error) {
        console.error('Tracked AI summary generation failed:', error);
        // Fallback
        return {
            summary: `${perUserChanges.length} contributor(s) made changes to this document.`,
            contributorChanges: perUserChanges.map((u) => ({
                userName: u.userName,
                changes: [
                    u.insertedText ? `Typed: "${u.insertedText.substring(0, 200)}"` : '',
                    u.offlineText ? `Typed while offline: "${u.offlineText.substring(0, 200)}"` : '',
                    u.deletedText ? `Deleted: "${u.deletedText.substring(0, 200)}"` : '',
                ].filter(Boolean),
            })),
            importantAdditions: perUserChanges.filter((u) => u.insertedText).map((u) => u.insertedText.substring(0, 200)),
            removedContent: perUserChanges.filter((u) => u.deletedText).map((u) => u.deletedText.substring(0, 200)),
            noEditsLost: true,
            totalEdits: perUserChanges.length,
        };
    }
};
export const generateDocumentSummary = async (content, title) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
        const prompt = `Summarize the following document in 2-3 sentences. Be concise and informative.

Title: "${title}"
Content: ${content.substring(0, 3000)}`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    }
    catch (error) {
        return 'Unable to generate summary at this time.';
    }
};
function generateFallbackSummary(changes) {
    const contributorMap = new Map();
    for (const change of changes) {
        const existing = contributorMap.get(change.userName) || [];
        existing.push(`${change.changeType === 'insert' ? 'Added' : change.changeType === 'delete' ? 'Removed' : 'Modified'} content${change.section ? ` in ${change.section}` : ''}`);
        contributorMap.set(change.userName, existing);
    }
    const contributorChanges = Array.from(contributorMap.entries()).map(([userName, userChanges]) => ({
        userName,
        changes: userChanges,
    }));
    return {
        summary: `${changes.length} changes were made by ${contributorMap.size} contributor(s).`,
        contributorChanges,
        importantAdditions: changes
            .filter((c) => c.changeType === 'insert')
            .map((c) => c.affectedContent)
            .slice(0, 5),
        removedContent: changes
            .filter((c) => c.changeType === 'delete')
            .map((c) => c.affectedContent)
            .slice(0, 5),
        noEditsLost: true,
        totalEdits: changes.length,
    };
}
//# sourceMappingURL=aiService.js.map