export type VenueArea = "ml" | "cv" | "nlp" | "ai";

export type VenueRank = "A*" | "A";

export type Venue = {
  key: string;
  label: string;
  fullName: string;
  area: VenueArea;
  rank: VenueRank;
  aliases: string[];
};

export const AREA_LABELS: Record<VenueArea, string> = {
  ml: "Machine Learning",
  cv: "Computer Vision",
  nlp: "Natural Language Processing",
  ai: "Artificial Intelligence",
};

export const VENUES: Venue[] = [
  {
    key: "neurips",
    label: "NeurIPS",
    fullName: "Neural Information Processing Systems",
    area: "ml",
    rank: "A*",
    aliases: [
      "neurips",
      "nips",
      "neural information processing systems",
      "advances in neural information processing systems",
    ],
  },
  {
    key: "icml",
    label: "ICML",
    fullName: "International Conference on Machine Learning",
    area: "ml",
    rank: "A*",
    aliases: ["icml", "international conference on machine learning"],
  },
  {
    key: "pmlr",
    label: "PMLR",
    fullName: "Proceedings of Machine Learning Research",
    area: "ml",
    rank: "A",
    aliases: ["proceedings of machine learning research", "pmlr"],
  },
  {
    key: "iclr",
    label: "ICLR",
    fullName: "International Conference on Learning Representations",
    area: "ml",
    rank: "A*",
    aliases: ["iclr", "international conference on learning representations"],
  },
  {
    key: "kdd",
    label: "KDD",
    fullName: "ACM SIGKDD Conference on Knowledge Discovery and Data Mining",
    area: "ml",
    rank: "A*",
    aliases: [
      "kdd",
      "sigkdd",
      "knowledge discovery and data mining",
      "acm sigkdd",
    ],
  },
  {
    key: "aistats",
    label: "AISTATS",
    fullName: "Artificial Intelligence and Statistics",
    area: "ml",
    rank: "A",
    aliases: ["aistats", "artificial intelligence and statistics"],
  },
  {
    key: "uai",
    label: "UAI",
    fullName: "Conference on Uncertainty in Artificial Intelligence",
    area: "ml",
    rank: "A",
    aliases: ["uai", "uncertainty in artificial intelligence"],
  },
  {
    key: "aaai",
    label: "AAAI",
    fullName: "AAAI Conference on Artificial Intelligence",
    area: "ai",
    rank: "A*",
    aliases: [
      "aaai conference on artificial intelligence",
      "proceedings of the aaai conference on artificial intelligence",
    ],
  },
  {
    key: "ijcai",
    label: "IJCAI",
    fullName: "International Joint Conference on Artificial Intelligence",
    area: "ai",
    rank: "A*",
    aliases: [
      "ijcai",
      "international joint conference on artificial intelligence",
    ],
  },
  {
    key: "cvpr",
    label: "CVPR",
    fullName: "Conference on Computer Vision and Pattern Recognition",
    area: "cv",
    rank: "A*",
    aliases: [
      "cvpr",
      "computer vision and pattern recognition",
      "ieee/cvf conference on computer vision and pattern recognition",
    ],
  },
  {
    key: "iccv",
    label: "ICCV",
    fullName: "International Conference on Computer Vision",
    area: "cv",
    rank: "A*",
    aliases: ["iccv", "international conference on computer vision"],
  },
  {
    key: "eccv",
    label: "ECCV",
    fullName: "European Conference on Computer Vision",
    area: "cv",
    rank: "A*",
    aliases: ["eccv", "european conference on computer vision"],
  },
  {
    key: "wacv",
    label: "WACV",
    fullName: "Winter Conference on Applications of Computer Vision",
    area: "cv",
    rank: "A",
    aliases: [
      "wacv",
      "winter conference on applications of computer vision",
      "applications of computer vision",
    ],
  },
  {
    key: "acl",
    label: "ACL",
    fullName: "Annual Meeting of the Association for Computational Linguistics",
    area: "nlp",
    rank: "A*",
    aliases: [
      "acl",
      "annual meeting of the association for computational linguistics",
      "findings of the association for computational linguistics",
    ],
  },
  {
    key: "emnlp",
    label: "EMNLP",
    fullName: "Empirical Methods in Natural Language Processing",
    area: "nlp",
    rank: "A*",
    aliases: [
      "emnlp",
      "empirical methods in natural language processing",
      "findings of emnlp",
    ],
  },
  {
    key: "naacl",
    label: "NAACL",
    fullName: "North American Chapter of the ACL",
    area: "nlp",
    rank: "A",
    aliases: [
      "naacl",
      "north american chapter of the association for computational linguistics",
      "naacl-hlt",
    ],
  },
  {
    key: "eacl",
    label: "EACL",
    fullName: "European Chapter of the ACL",
    area: "nlp",
    rank: "A",
    aliases: [
      "eacl",
      "european chapter of the association for computational linguistics",
    ],
  },
  {
    key: "coling",
    label: "COLING",
    fullName: "International Conference on Computational Linguistics",
    area: "nlp",
    rank: "A",
    aliases: ["coling", "international conference on computational linguistics"],
  },
];

export const DEFAULT_VENUE_KEYS = VENUES.map((venue) => venue.key);
