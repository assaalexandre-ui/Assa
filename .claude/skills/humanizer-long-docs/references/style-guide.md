# Style Guide: Register Detection and Handling

The same AI-tell can be a real problem in one register and a total non-issue in another — a contraction is a tell in a methods section and invisible in a Slack update. Detect the register first (from context: file name, stated audience, existing formatting, who it's addressed to), then apply the adjustments below. When two registers plausibly overlap (a "professional report" that's also somewhat "business"), pick the closer fit and say which one you picked if it's not obvious.

For each register: what to flex toward natural human writing, and what must stay fixed regardless.

---

## Academic

**Flex:** Vary sentence length even within formal register — academic humans don't write uniform 25-word sentences either. Cut hedging stacks ("it could be argued that it may potentially suggest") down to one hedge, not three. Replace "-ing" pseudo-analysis with an actual claim plus citation.

**Stays fixed:** No contractions. No first-person opinion asides unless the source used them (some fields allow "I argue that..."; most don't). Citations, terminology, and claims of the form "X found Y" must map exactly to what's in the source — never soften "found" to "suggested" or vice versa, since that changes the epistemic claim.

---

## Technical

**Flex:** Cut abstract vocabulary ("leverage the intricate interplay of the system") down to concrete description of what the thing does. Prefer active voice for explanations of how something works. Vary sentence length even in a dense explanation — uniform sentences make technical prose harder to follow, not more rigorous.

**Stays fixed:** Precision above all — never trade an exact technical term for an approximate "friendlier" one. Command syntax, flag names, file paths, and version numbers are copied exactly, never paraphrased. No promotional language ("seamlessly," "powerful") — technical readers actively distrust it.

---

## Documentation

**Flex:** Imperative mood for instructions ("run the script," not "the script should be run" or "users should run the script"). Cut hedging and throat-clearing — docs are read by people mid-task who want the answer. Break wall-of-text procedures into steps where the source content is genuinely sequential.

**Stays fixed:** Same precision bar as Technical — syntax, flags, paths, and versions verbatim. Consistency of terminology matters more here than variety: if the source calls it a "connector" throughout, don't cycle to "integration" / "plugin" for elegant variation (this is the one register where synonym-cycling avoidance is a hard rule, not a preference, because inconsistent terms in docs actively confuse readers).

---

## Business

**Flex:** Cut filler and hedging aggressively — business writing rewards getting to the point. Replace copula-avoidance ("the initiative serves as a catalyst for") with plain statements of what happened or what's proposed. Short sentences for decisions/asks, longer ones for context.

**Stays fixed:** Numbers, dates, and named stakeholders exactly as given. Keep it professional — this isn't the register for first-person tangents or humor unless the person's own voice already uses them.

---

## Email

**Flex:** Most permissive register for contractions and a conversational opener/closer. Vary sentence length freely. A little personality is good here — email is where "I" and a genuine reaction read as normal, not unprofessional.

**Stays fixed:** Match the formality of who it's to (a note to a manager isn't the same register as one to a peer) — don't over-casual-ify a message to someone senior just because "email" generally allows it. Keep any specific asks, dates, or numbers exact.

---

## Casual

**Flex:** Contractions, idioms, sentence fragments where they read as natural speech, first person throughout. This is the register where "let some mess in" applies most literally — trailing thoughts and asides are a feature, not a bug.

**Stays fixed:** Even casual writing shouldn't invent detail to sound more colorful. Specific facts, names, and numbers stay exact even when everything around them loosens up.

---

## Storytelling

**Flex:** Pacing varies deliberately — short sentences for tension, longer ones for scene-setting. Sensory and concrete detail over abstract summary. Dialogue, where present, should sound like speech, not like a chatbot's tidy paraphrase of speech.

**Stays fixed:** Plot facts, character names, and any details drawn from a true story stay as given — "storytelling" register is about how it's told, not license to embellish what happened, unless the person has explicitly asked for fiction.

---

## Marketing

**Flex:** This is the one register where some energy and hyperbole are the point — the tell isn't enthusiasm itself, it's *generic* enthusiasm. Replace stock hype words ("unlock the power of," "seamlessly," "cutting-edge," "revolutionize") with specific, concrete claims about what the product actually does. Specificity is what makes marketing copy sound written by someone who used the product, rather than generated about a product.

**Stays fixed:** Actual product claims, pricing, and features — marketing polish is not license to overstate capability. Any specific number or claim needs to be true.

---

## Professional Reports

**Flex:** Cut the "challenges and future outlook" formula entirely in favor of the report's actual specific findings. Reduce inline-header bullet lists to prose where the content is genuinely narrative; keep bullets only where the source data is genuinely a list (e.g., a table of line items).

**Stays fixed:** Formal register, third person, no contractions. All figures, dates, and attributions exact. This register overlaps with Business but leans more formal and less first-person — when in doubt, treat "report" as the more conservative version of "business."
