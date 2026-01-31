export interface LexiconTerm {
  term: string;
  definition: string;
  durmah_explanation: string;
}

export const STARTER_TERMS: LexiconTerm[] = [
  {
    term: "Ratio Decidendi",
    definition: "The core legal principle or reason for a court's decision.",
    durmah_explanation:
      "Think of this as the 'soul' of the judgment. It's the binding part of a case that other courts must follow in the future. If you're arguing a case, the Ratio is what you want to extract and apply to your own facts.",
  },
  {
    term: "Obiter Dictum",
    definition:
      "An incidental remark or observation by a judge that is not binding.",
    durmah_explanation:
      "Derived from Latin meaning 'something said by the way'. While not binding like the Ratio, Obiter remarks from high-level judges carry persuasive weight and can hint at how future cases might be decided.",
  },
  {
    term: "Stare Decisis",
    definition: "The doctrine that courts should stand by previous decisions.",
    durmah_explanation:
      "This is the bedrock of English Law. It ensures consistency and predictability. It means once a legal point is settled by a superior court, stay with it unless there is a very powerful reason to depart.",
  },
  {
    term: "Novus Actus Interveniens",
    definition: "A new intervening act that breaks the chain of causation.",
    durmah_explanation:
      "A classic in Tort and Criminal law. It's the 'Wait, what happened next?' moment. If someone did something so unexpected that it effectively took over as the cause of the harm, the original wrongdoer might be off the hook for that specific damage.",
  },
  {
    term: "Caveat Emptor",
    definition: "Let the buyer beware.",
    durmah_explanation:
      "Old school Contract Law. It puts the burden on the buyer to check the goods before purchasing. In modern law, we have consumer protection, but in business-to-business deals, this principle still holds significant weight.",
  },
  {
    term: "Res Ipsa Loquitur",
    definition: "The thing speaks for itself.",
    durmah_explanation:
      "Used when negligence is so obvious that there's no need for complex proof. Like finding a snail in a sealed ginger beer bottle—the fact it's there is enough to suggest someone wasn't careful.",
  },
  {
    term: "Ultra Vires",
    definition: "Beyond the powers.",
    durmah_explanation:
      "The foundation of Judicial Review. It's used when a public body or official does something they literally don't have the legal authority to do. If they go outside their 'legal box', their action is Ultra Vires and therefore void.",
  },
  {
    term: "Prima Facie",
    definition: "At first sight / Based on the first impression.",
    durmah_explanation:
      "It's the evidence that is sufficient to establish a fact unless it's disproved. If you have a 'Prima Facie' case, you've got enough to start the process, but the other side will surely try to knock it down.",
  },
];
