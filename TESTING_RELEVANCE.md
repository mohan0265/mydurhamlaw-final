# Testing: Legal News Relevance Scoring

This document contains test queries to verify the deterministic relevance scoring engine.

## Test Setup

Use the following endpoint:
```
GET /api/news/latest?query=<query>&debug=1
```

The `debug=1` parameter shows scoring breakdown.

---

## Test Cases

### Test 1: Contract Law - Consideration & Promissory Estoppel

**Query**: `"Contract Law: consideration and promissory estoppel"`

**Expected**:
- Top results should contain terms like "consideration", "promissory estoppel", "contract", "breach", "remedies"
- Score ≥ 20 for items with exact doctrine matches
- "Why" should mention: "Matches: promissory estoppel, consideration — Helps you discuss enforceability/remedies and apply doctrine in problem questions."

**Reject**:
- Generic court news without contract-specific content
- Criminal/tort news unless it also mentions contract principles

---

### Test 2: Public Law - Judicial Review & Procedural Fairness

**Query**: `"Public Law: judicial review, procedural fairness"`

**Expected**:
- Top results contain "judicial review", "ultra vires", "legitimate expectation", "procedural fairness", "proportionality"
- Administrative law cases, government decisions, constitutional matters
- "Why" should mention: "Matches: judicial review, procedural fairness — Useful for tutorials on JR grounds, institutional balance, rights analysis."

**Reject**:
- Private law contract disputes
- Criminal cases unless about judicial review of government action

---

### Test 3: Tort - Negligence Duty of Care & Causation

**Query**: `"Tort: negligence duty of care and causation"`

**Expected**:
- Top results contain "negligence", "duty of care", "breach", "causation", "remoteness", "damages"
- Personal injury, medical negligence, occupiers' liability cases
- "Why" should mention: "Matches: duty of care, negligence, causation — Useful for analyzing duty, breach, causation in tutorials and essays."

**Reject**:
- Contract breach cases
- Criminal sentencing news

---

### Test 4: EU Law - Direct Effect & Supremacy

**Query**: `"EU Law: direct effect and supremacy"`

**Expected**:
- Top results contain "direct effect", "supremacy", "CJEU", "directive", "regulation", "treaty"
- European Court judgments, EU/UK trade/Brexit discussions
- "Why" should mention: "Matches: direct effect, supremacy — Helpful for understanding supremacy, direct effect, and enforcement in EU context."

**Reject**:
- Domestic UK law without EU connection
- General international law unless EU-specific

---

### Test 5: Land Law - Proprietary Estoppel & Adverse Possession

**Query**: `"Land: proprietary estoppel and adverse possession"`

**Expected**:
- Top results contain "proprietary estoppel", "adverse possession", "land", "property", "title", "tenancy"
- Housing disputes, eviction, planning, mortgage cases
- "Why" should mention: "Matches: proprietary estoppel, adverse possession — Relevant for property rights, interests, and remedies discussions."

**Reject**:
- Intellectual property cases
- Contract law unless involving land transactions

---

### Test 6: Criminal Law - Mens Rea & Self-Defence

**Query**: `"Criminal: mens rea and self-defence"`

**Expected**:
- Top results contain "mens rea", "actus reus", "self defence", "criminal intent", "prosecution", "conviction"
- Criminal appeals, sentencing, fraud, terrorism cases
- "Why" should mention: "Matches: mens rea, self defence — Relevant for mens rea/actus reus analysis and sentencing discussions."

**Reject**:
- Civil negligence cases
- Administrative law unless criminal context

---

### Test 7: Equity & Trusts - Constructive Trust & Breach

**Query**: `"equity and trusts: constructive trust and breach of trust"`

**Expected**:
- Top results contain "constructive trust", "breach of trust", "fiduciary", "beneficiary", "remedies", "tracing"
- Asset recovery, fraud cases involving trusts, family home disputes
- "Why" should mention: "Matches: constructive trust, breach of trust — Useful for fiduciary duties, remedies, and equitable doctrines."

**Reject**:
- General contract breaches
- Criminal fraud unless involving trust law

---

## Verification Checklist

For each test query:

- [ ] **Ranked items have non-zero scores**: Items with score < 10 should be filtered out
- [ ] **Reasons mention correct matched terms**: "Why" field should reference detected keywords
- [ ] **No generic junk dominates**: Items matching only "court", "judge", "legal" should score 0
- [ ] **Recency boost applied**: Recent items (≤3 days) should get +8, ≤7 days +5, ≤14 days +3
- [ ] **Module detection works**: Query "Contract Law..." should detect `contract` module and load related keywords
- [ ] **Phrase matching prioritized**: Exact matches like "promissory estoppel" should score higher than separate words "promissory" + "estoppel"
- [ ] **Debug mode shows breakdown**: `?debug=1` should return `matchedTerms` and `recencyBoost` arrays

---

## Manual Testing Steps

1. **Setup**:
   ```bash
   npm run dev
   ```

2. **Populate cache** (if empty):
   ```bash
   curl -X POST http://localhost:3000/api/news/refresh
   ```

3. **Test ranking**:
   ```bash
   curl "http://localhost:3000/api/news/latest?query=Contract%20Law:%20consideration%20and%20promissory%20estoppel&debug=1"
   ```

4. **Verify response**:
   - Check `ranked` array exists
   - Verify `score` values are reasonable (top item should be 15-40 range)
   - Confirm `why` field contains matched terms
   - If `debug=1`, check `matchedTerms` and `recencyBoost` are populated

5. **Test edge cases**:
   - Empty query: Should return most recent 10 items
   - Generic query "law news": Should return fallback with "Broad legal news" disclaimer
   - Very specific query "promissory estoppel in construction contracts": Should match contract + doctrine terms

---

## Expected Scoring Ranges

Based on the algorithm:

- **Excellent match (30-50)**: Multiple doctrine phrases + core keywords + recent
- **Good  match (15-29)**: Doctrine phrase or several core keywords
- **Borderline (10-14)**: Few core keywords or module + hotspot matches
- **Rejected (<10)**: Generic terms only, filtered out

---

## Debugging Common Issues

### Issue: All items score 0
**Cause**: Either cache is empty or query has no matching terms
**Fix**: Check cache contents, verify module keywords contain expected terms

### Issue: Generic news dominates
**Cause**: Generic penalty not triggering
**Fix**: Review `GENERIC_LEGAL_TERMS` set, ensure it includes common legal words

### Issue: Recency boost not working
**Cause**: `published_at` not in ISO format
**Fix**: Check `/api/news/refresh` normalizes dates correctly

### Issue: Synonyms not expanding
**Cause**: Synonym map not loading or not matching normalized form
**Fix**: Log `termWeights` to verify synonym inclusion

---

## Next Steps

After verification:
1. Integrate into Durmah voice hooks
2. Add Durmah tool for `get_relevant_legal_news(query)`
3. Update Durmah system prompt to suggest using news for context
4. Add UI in dashboard to display ranked news with scores

---

**Test Owner**: AG Agent  
**Created**: 2026-01-17  
**Status**: Ready for manual testing
