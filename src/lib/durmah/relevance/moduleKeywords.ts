// Module-specific keyword dictionaries for legal news relevance scoring

export const MODULE_KEYWORDS = {
  contract: {
    core: ["contract", "agreement", "breach", "damages", "consideration", "offer", "acceptance", "terms", "remedies"],
    doctrines: ["promissory estoppel", "frustration", "misrepresentation", "duress", "undue influence", "privity", "penalty clause"],
    remedies: ["specific performance", "injunction", "liquidated damages"],
    commercial: ["consumer rights", "unfair terms", "supply", "services", "sale of goods", "refund", "warranty"]
  },
  tort: {
    core: ["tort", "negligence", "duty of care", "breach of duty", "causation", "remoteness", "damages"],
    doctrines: ["nuisance", "defamation", "trespass", "occupiers liability", "product liability"],
    hotspots: ["personal injury", "medical negligence", "privacy", "harassment"]
  },
  public_law: {
    core: ["public law", "constitutional", "government", "parliament", "minister", "rule of law"],
    admin: ["judicial review", "ultra vires", "procedural fairness", "legitimate expectation", "proportionality"],
    rights: ["human rights", "ECHR", "freedom of expression", "privacy", "assembly", "discrimination"]
  },
  criminal: {
    core: ["criminal", "offence", "prosecution", "conviction", "sentence", "appeal"],
    doctrines: ["mens rea", "actus reus", "intention", "recklessness", "self defence", "joint enterprise"],
    hotspots: ["fraud", "cybercrime", "terrorism", "hate crime", "sexual offences"]
  },
  eu_law: {
    core: ["EU", "European Union", "CJEU", "directive", "regulation", "treaty", "single market"],
    doctrines: ["direct effect", "supremacy", "state liability", "proportionality", "mutual recognition"],
    hotspots: ["competition", "data protection", "trade", "Brexit"]
  },
  land: {
    core: ["land law", "property", "lease", "tenancy", "easement", "mortgage", "title", "land registry"],
    doctrines: ["proprietary estoppel", "adverse possession", "trust", "co-ownership", "overreaching"],
    hotspots: ["housing", "rent", "eviction", "planning"]
  },
  equity_trusts: {
    core: ["equity", "trust", "fiduciary", "beneficiary", "settlor", "breach of trust"],
    doctrines: ["constructive trust", "resulting trust", "proprietary estoppel", "tracing", "remedies"],
    hotspots: ["asset recovery", "fraud", "crypto", "family home"]
  }
} as const;

export const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
  "has", "he", "in", "is", "it", "its", "of", "on", "that", "the",
  "to", "was", "will", "with", "this", "but", "they", "have", "had",
  "what", "when", "where", "who", "which", "why", "how"
]);

// Module aliases for detection
export const MODULE_ALIASES: Record<string, keyof typeof MODULE_KEYWORDS> = {
  "contract": "contract",
  "contracts": "contract",
  "contractual": "contract",
  "tort": "tort",
  "torts": "tort",
  "negligence": "tort",
  "public law": "public_law",
  "constitutional": "public_law",
  "admin": "public_law",
  "administrative": "public_law",
  "judicial review": "public_law",
  "criminal": "criminal",
  "crime": "criminal",
  "EU": "eu_law",
  "EU law": "eu_law",
  "european": "eu_law",
  "CJEU": "eu_law",
  "land": "land",
  "land law": "land",
  "property": "land",
  "equity": "equity_trusts",
  "trusts": "equity_trusts",
  "equity and trusts": "equity_trusts"
};

// Curated synonym map for query expansion
export const SYNONYMS: Record<string, string[]> = {
  "judicial review": ["JR", "review of decision", "public authority", "administrative decision"],
  "promissory estoppel": ["estoppel", "promise relied", "reliance"],
  "duty of care": ["foreseeability", "proximity"],
  "data protection": ["GDPR", "ICO", "privacy"],
  "defamation": ["libel", "slander"],
  "mens rea": ["criminal intent", "guilty mind"],
  "actus reus": ["criminal act", "guilty act"],
  "breach of contract": ["breach", "non-performance"],
  "specific performance": ["equitable remedy", "enforcement"],
  "legitimate expectation": ["procedural fairness", "substantive fairness"]
};

// Generic legal terms (low weight, not filtered out entirely)
export const GENERIC_LEGAL_TERMS = new Set([
  "law", "legal", "court", "case", "judge", "ruling", "decision", "justice"
]);
