
import { ImmersionVideo } from '../types';
import { TokenType } from '../types/immersionSchema';

export const MOCK_IMMERSION_VIDEOS: ImmersionVideo[] = [
  {
    id: 'vid_001',
    title: 'Daily Life at a Japanese Cafe',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-being-poured-into-a-cup-2392-large.mp4',
    dialogue: [
      { 
        id: 'l1', 
        speaker: 'Waiter',
        timestampStart: 0, 
        timestampEnd: 3,
        japanese: [
          { text: 'いらっしゃいませ', romaji: 'irasshaimase', type: TokenType.CONTENT, groupId: 1 },
          { text: '！', type: TokenType.PUNCTUATION, groupId: 0 },
          { text: 'お', romaji: 'o', type: TokenType.GRAMMAR, groupId: 2 },
          { text: '一人', romaji: 'hitori', type: TokenType.CONTENT, groupId: 2 },
          { text: '様', romaji: 'sama', type: TokenType.GRAMMAR, groupId: 2 },
          { text: 'です', romaji: 'desu', type: TokenType.GRAMMAR, groupId: 3 },
          { text: 'か', romaji: 'ka', type: TokenType.GRAMMAR, groupId: 3 },
          { text: '？', type: TokenType.PUNCTUATION, groupId: 0 }
        ],
        english: [
          { text: 'Welcome', type: TokenType.CONTENT, groupId: 1 },
          { text: '!', type: TokenType.PUNCTUATION, groupId: 0 },
          { text: 'Is', type: TokenType.GRAMMAR, groupId: 3 },
          { text: 'it', type: TokenType.GRAMMAR, groupId: 0 },
          { text: 'just', type: TokenType.GRAMMAR, groupId: 2 },
          { text: 'for', type: TokenType.GRAMMAR, groupId: 2 },
          { text: 'one', type: TokenType.CONTENT, groupId: 2 },
          { text: 'person', type: TokenType.CONTENT, groupId: 2 },
          { text: '?', type: TokenType.PUNCTUATION, groupId: 0 }
        ]
      },
      { 
        id: 'l2', 
        speaker: 'Customer',
        timestampStart: 3.5, 
        timestampEnd: 6,
        japanese: [
          { text: 'はい', romaji: 'hai', type: TokenType.CONTENT, groupId: 1 },
          { text: '。', type: TokenType.PUNCTUATION, groupId: 0 },
          { text: '窓側', romaji: 'madogawa', type: TokenType.CONTENT, groupId: 2 },
          { text: 'の', romaji: 'no', type: TokenType.GRAMMAR, groupId: 2 },
          { text: '席', romaji: 'seki', type: TokenType.CONTENT, groupId: 2 },
          { text: 'は', romaji: 'wa', type: TokenType.GRAMMAR, groupId: 2 },
          { text: '空いて', romaji: 'aite', type: TokenType.CONTENT, groupId: 3 },
          { text: 'います', romaji: 'imasu', type: TokenType.GRAMMAR, groupId: 3 },
          { text: 'か', romaji: 'ka', type: TokenType.GRAMMAR, groupId: 3 },
          { text: '？', type: TokenType.PUNCTUATION, groupId: 0 }
        ],
        english: [
          { text: 'Yes', type: TokenType.CONTENT, groupId: 1 },
          { text: '.', type: TokenType.PUNCTUATION, groupId: 0 },
          { text: 'Is', type: TokenType.GRAMMAR, groupId: 3 },
          { text: 'the', type: TokenType.GRAMMAR, groupId: 2 },
          { text: 'window', type: TokenType.CONTENT, groupId: 2 },
          { text: 'seat', type: TokenType.CONTENT, groupId: 2 },
          { text: 'available', type: TokenType.CONTENT, groupId: 3 },
          { text: '?', type: TokenType.PUNCTUATION, groupId: 0 }
        ]
      }
    ]
  },
  {
    id: 'vid_002',
    title: 'Sunset Train Ride',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-landscape-of-a-railway-passing-by-the-sunset-42934-large.mp4',
    dialogue: [
      { 
        id: 'v2l1', 
        speaker: 'Announcement',
        timestampStart: 0, 
        timestampEnd: 4,
        japanese: [
          { text: '次', romaji: 'tsugi', type: TokenType.CONTENT, groupId: 1 },
          { text: 'の', romaji: 'no', type: TokenType.GRAMMAR, groupId: 1 },
          { text: '停車駅', romaji: 'teishaeki', type: TokenType.CONTENT, groupId: 1 },
          { text: 'は', romaji: 'wa', type: TokenType.GRAMMAR, groupId: 1 },
          { text: '、', type: TokenType.PUNCTUATION, groupId: 0 },
          { text: '渋谷', romaji: 'shibuya', type: TokenType.CONTENT, groupId: 2 },
          { text: 'です', romaji: 'desu', type: TokenType.GRAMMAR, groupId: 2 },
          { text: '。', type: TokenType.PUNCTUATION, groupId: 0 }
        ],
        english: [
          { text: 'The', type: TokenType.GRAMMAR, groupId: 1 },
          { text: 'next', type: TokenType.CONTENT, groupId: 1 },
          { text: 'stop', type: TokenType.CONTENT, groupId: 1 },
          { text: 'is', type: TokenType.GRAMMAR, groupId: 2 },
          { text: 'Shibuya', type: TokenType.CONTENT, groupId: 2 },
          { text: '.', type: TokenType.PUNCTUATION, groupId: 0 }
        ]
      }
    ]
  }
];
