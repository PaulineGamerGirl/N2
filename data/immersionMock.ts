
import { VideoAnalysis, TokenType } from '../types/immersionSchema';

export const MOCK_THEATER_DATA: VideoAnalysis = {
  videoId: "vid_001",
  title: "Office Interaction: Kindness in the Workspace",
  nodes: [
    {
      id: "node_1",
      timestampStart: 12.5,
      timestampEnd: 15.8,
      speaker: "Tanaka-san",
      japanese: [
        { text: "その", romaji: "sono", type: TokenType.GRAMMAR, groupId: 1 },
        { text: "社員", romaji: "shain", type: TokenType.CONTENT, groupId: 2 },
        { text: "さん", romaji: "san", type: TokenType.GRAMMAR, groupId: 2 },
        { text: "が", romaji: "ga", type: TokenType.GRAMMAR, groupId: 2 },
        { text: "目薬", romaji: "megusuri", type: TokenType.CONTENT, groupId: 3 },
        { text: "を", romaji: "o", type: TokenType.GRAMMAR, groupId: 3 },
        { text: "貸してくれた", romaji: "kashite-kureta", type: TokenType.CONTENT, groupId: 4 }
      ],
      english: [
        { text: "The", type: TokenType.GRAMMAR, groupId: 2 },
        { text: "employee", type: TokenType.CONTENT, groupId: 2 },
        { text: "there", type: TokenType.GRAMMAR, groupId: 1 },
        { text: "lent", type: TokenType.CONTENT, groupId: 4 },
        { text: "me", type: TokenType.CONTENT, groupId: 4 },
        { text: "eye drops", type: TokenType.CONTENT, groupId: 3 },
        { text: ".", type: TokenType.PUNCTUATION, groupId: 0 }
      ],
      grammarNotes: [
        "〜てくれた (te-kureta) indicates that the action was a favor done for the speaker.",
        "社員 (shain) specifically refers to a company employee."
      ]
    }
  ]
};
