import { ParsedGrammarPoint } from '../utils/grammarParser';

export const HARDWIRED_GRAMMAR: Record<string, ParsedGrammarPoint[]> = {
  // --- GENKI 1 (N5) ---
  'genki1_1': [
    { id: 'g1-1-1', point: 'XはYです', meaning: 'X is Y', sentences: '私は学生です。' },
    { id: 'g1-1-2', point: '...ですか', meaning: 'Question marker', sentences: '学生ですか。' },
    { id: 'g1-1-3', point: 'Noun A の Noun B', meaning: 'Possessive/Connector', sentences: '私の本です。' }
  ],
  'genki1_2': [
    { id: 'g1-2-1', point: 'これ・それ・あれ・どれ', meaning: 'Demonstrative pronouns', sentences: 'これは何ですか。' },
    { id: 'g1-2-2', point: 'この・その・あの・どの', meaning: 'Demonstrative adjectives', sentences: 'この本は私のです。' },
    { id: 'g1-2-3', point: 'ここ・そこ・あそこ・どこ', meaning: 'Place pronouns', sentences: 'ここはどこですか。' },
    { id: 'g1-2-4', point: '誰の', meaning: 'Whose', sentences: '誰の本ですか。' },
    { id: 'g1-2-5', point: 'も', meaning: 'Also/Too', sentences: '私も学生です。' },
    { id: 'g1-2-6', point: '~じゃないです', meaning: 'Negative of です', sentences: '学生じゃないです。' },
    { id: 'g1-2-7', point: 'Sentence Enders ね/よ', meaning: 'Emphasis/Confirmation', sentences: 'おいしいですね。' }
  ],
  'genki1_3': [
    { id: 'g1-3-1', point: 'Verb Masu Form', meaning: 'Polite present tense', sentences: '食べます。' },
    { id: 'g1-3-2', point: 'Masu-Negative (~ません)', meaning: 'Polite negative tense', sentences: '食べません。' },
    { id: 'g1-3-3', point: 'Object Particle を', meaning: 'Object marker', sentences: 'ご飯を食べます。' },
    { id: 'g1-3-4', point: 'Location Particle で', meaning: 'Action location', sentences: 'うちで食べます。' },
    { id: 'g1-3-5', point: 'Time Particle に', meaning: 'Specific time marker', sentences: '八時に食べます。' },
    { id: 'g1-3-6', point: 'Direction Particles に・へ', meaning: 'Direction of movement', sentences: '学校に行きます。' },
    { id: 'g1-3-7', point: 'Polite Invitations ~ませんか', meaning: 'Won\'t you...?', sentences: '食べませんか。' },
    { id: 'g1-3-8', point: 'Frequency Adverbs', meaning: 'Often, usually, etc.', sentences: 'よく食べます。' },
    { id: 'g1-3-9', point: 'Topic Particle は', meaning: 'Topic marker', sentences: '今日は忙しいです。' }
  ],
  'genki1_4': [
    { id: 'g1-4-1', point: 'あります/います', meaning: 'Existential verbs (inanimate/animate)', sentences: '本があります。犬がいます。' },
    { id: 'g1-4-2', point: 'Location Expressions + の', meaning: 'Under, on, next to', sentences: '机の上にあります。' },
    { id: 'g1-4-3', point: 'Past Tense of です', meaning: 'Was', sentences: '学生でした。' },
    { id: 'g1-4-4', point: 'Past Tense of Verbs', meaning: 'Polite past', sentences: '食べました。' },
    { id: 'g1-4-5', point: 'Particle も', meaning: 'Also (past/multiple context)', sentences: '昨日も行きました。' },
    { id: 'g1-4-6', point: 'Particle と', meaning: 'And (between nouns)', sentences: 'パンと水を食べました。' },
    { id: 'g1-4-7', point: 'Duration Expressions (~時間)', meaning: 'Time duration', sentences: '三時間勉強しました。' },
    { id: 'g1-4-8', point: 'Quantity Word たくさん', meaning: 'Many/A lot', sentences: 'たくさん食べました。' }
  ],
  'genki1_5': [
    { id: 'g1-5-1', point: 'I-Adjectives (Present)', meaning: 'Positive/Negative i-adj', sentences: '寒いです。' },
    { id: 'g1-5-2', point: 'Na-Adjectives (Present)', meaning: 'Positive/Negative na-adj', sentences: '元気です。' },
    { id: 'g1-5-3', point: 'I-Adjectives (Past)', meaning: 'Past positive/negative', sentences: '寒かったです。' },
    { id: 'g1-5-4', point: 'Na-Adjectives (Past)', meaning: 'Past positive/negative', sentences: '元気でした。' },
    { id: 'g1-5-5', point: 'Modifying Nouns', meaning: 'Adjectives before nouns', sentences: '寒い日です。元気な人です。' },
    { id: 'g1-5-6', point: 'Likes/Dislikes (すき・きらい)', meaning: 'Expressing preferences', sentences: 'お茶が好きです。' },
    { id: 'g1-5-7', point: 'Suggestions (~ましょう)', meaning: 'Let\'s...', sentences: '行きましょう。' },
    { id: 'g1-5-8', point: 'Counting (~まい)', meaning: 'Counter for flat objects', sentences: '切手が三枚あります。' }
  ],
  'genki1_6': [
    { id: 'g1-6-1', point: 'Te-form', meaning: 'Connecting form', sentences: '食べて、寝ます。' },
    { id: 'g1-6-2', point: '~てください', meaning: 'Please do...', sentences: '食べてください。' },
    { id: 'g1-6-3', point: '~てもいいですか', meaning: 'May I...?', sentences: '食べてもいいですか。' },
    { id: 'g1-6-4', point: '~てはいけません', meaning: 'You must not...', sentences: '食べてはいけません。' },
    { id: 'g1-6-5', point: 'Connecting Verbs (Sequence)', meaning: 'Describing a series of actions', sentences: '起きて、ご飯を食べて、行きます。' },
    { id: 'g1-6-6', point: '~から (Reason)', meaning: 'Because...', sentences: '寒いから、行きません。' },
    { id: 'g1-6-7', point: '~ましょうか', meaning: 'Shall I...?', sentences: '窓を開けましょうか。' }
  ],
  'genki1_7': [
    { id: 'g1-7-1', point: '~ている (Continuous)', meaning: 'Action in progress', sentences: '食べています。' },
    { id: 'g1-7-2', point: '~ている (Resultant State)', meaning: 'State after an action', sentences: '結婚しています。' },
    { id: 'g1-7-3', point: 'Describing People', meaning: 'Stature, hair color, etc.', sentences: '背が高いです。' },
    { id: 'g1-7-4', point: 'Clothing States', meaning: 'Wearing clothes', sentences: '眼鏡をかけています。' },
    { id: 'g1-7-5', point: 'Connecting Adjectives and Nouns', meaning: 'Te-form for adjectives', sentences: '安くて、おいしいです。' },
    { id: 'g1-7-6', point: 'Purpose of Movement', meaning: 'Going to do something', sentences: '買いに行きます。' },
    { id: 'g1-7-7', point: 'Counting People (~人)', meaning: 'Counter for people', sentences: '五人います。' }
  ],
  'genki1_8': [
    { id: 'g1-8-1', point: 'Short Form (Present & Future)', meaning: 'Informal affirmative/negative', sentences: '食べる。' },
    { id: 'g1-8-2', point: 'Short Form (Negative)', meaning: 'Informal negative', sentences: '食べない。' },
    { id: 'g1-8-3', point: 'Informal Speech Guidelines', meaning: 'Rules for talking to friends', sentences: '元気？' },
    { id: 'g1-8-4', point: '~と思います', meaning: 'I think...', sentences: '明日、雨が降ると思います。' },
    { id: 'g1-8-5', point: '~と言っていました', meaning: 'They said...', sentences: '田中さんは忙しいと言っていました。' },
    { id: 'g1-8-6', point: '~ないでください', meaning: 'Please don\'t...', sentences: '食べないでください。' },
    { id: 'g1-8-7', point: '~のが (Nominalization)', meaning: 'Verb to noun', sentences: '泳ぐのが好きです。' },
    { id: 'g1-8-8', point: 'The Particle が', meaning: 'New information / specific subject', sentences: '私が作りました。' },
    { id: 'g1-8-9', point: 'なにか・なにも', meaning: 'Something/Nothing', sentences: '何か食べますか。何も食べません。' }
  ],
  'genki1_9': [
    { id: 'g1-9-1', point: 'Short Form Past (Affirmative)', meaning: 'Informal past', sentences: '食べた。' },
    { id: 'g1-9-2', point: 'Short Form Past (Negative)', meaning: 'Informal past negative', sentences: '食べなかった。' },
    { id: 'g1-9-3', point: 'Qualifying Nouns (Relative Clauses)', meaning: 'Sentences modifying nouns', sentences: '昨日食べたパン。' },
    { id: 'g1-9-4', point: 'まだ〜ていません', meaning: 'Have not yet done', sentences: 'まだ食べていません。' },
    { id: 'g1-9-5', point: '~から (Because)', meaning: 'Polite reason', sentences: '忙しいですから、行きません。' }
  ],
  'genki1_10': [
    { id: 'g1-10-1', point: 'AのほうがBより', meaning: 'A is more than B', sentences: 'リンゴのほうがオレンジより好きです。' },
    { id: 'g1-10-2', point: 'どちら/どっちのほうが', meaning: 'Which is more...?', sentences: 'どっちのほうがいいですか。' },
    { id: 'g1-10-3', point: 'Category のなかでAがいちばん', meaning: 'A is the most in category', sentences: '果物の中でリンゴがいちばん好きです。' },
    { id: 'g1-10-4', point: 'Adjective / Noun + の', meaning: 'One/The one', sentences: '赤いのをください。' },
    { id: 'g1-10-5', point: '~つもりです', meaning: 'Plan to do...', sentences: '行くつもりです。' },
    { id: 'g1-10-6', point: '~なる', meaning: 'To become', sentences: '寒くなりました。' },
    { id: 'g1-10-7', point: 'どこか・どこにも', meaning: 'Somewhere/Nowhere', sentences: 'どこかに行きましたか。どこにも行きませんでした。' },
    { id: 'g1-10-8', point: 'Particle で (Means/Method)', meaning: 'Using...', sentences: 'バスで行きます。' }
  ],
  'genki1_11': [
    { id: 'g1-11-1', point: '〜たい', meaning: 'Want to do...', sentences: '食べたいです。' },
    { id: 'g1-11-2', point: '〜たり〜たり', meaning: 'Doing things like A and B', sentences: '本を読んだり、音楽を聞いたりしました。' },
    { id: 'g1-11-3', point: '〜たことがある', meaning: 'Have the experience of...', sentences: '富士山に登ったことがあります。' },
    { id: 'g1-11-4', point: '〜や', meaning: 'And such (incomplete list)', sentences: 'パンや水を買いました。' }
  ],
  'genki1_12': [
    { id: 'g1-12-1', point: '〜んです', meaning: 'Explaining/Asking for reason', sentences: '雨が降っているんです。' },
    { id: 'g1-12-2', point: '〜すぎる', meaning: 'Too much...', sentences: '食べすぎました。' },
    { id: 'g1-12-3', point: '〜ほうがいい', meaning: 'Had better...', sentences: '寝たほうがいいですよ。' },
    { id: 'g1-12-4', point: '〜ので', meaning: 'Because (formal/soft)', sentences: '忙しいので、手伝えません。' },
    { id: 'g1-12-5', point: '〜なきゃいけません', meaning: 'Must do...', sentences: '行かなきゃいけません。' },
    { id: 'g1-12-6', point: '〜でしょう', meaning: 'Probably/Right?', sentences: '明日は晴れるでしょう。' }
  ],

  // --- GENKI 2 (N4) ---
  'genki2_13': [
    { id: 'g2-13-1', point: '可能形 (Potential Form)', meaning: 'Can do...', sentences: '日本語を話せます。' },
    { id: 'g2-13-2', point: '〜し、〜し', meaning: 'Giving multiple reasons', sentences: '安いし、おいしいし、いいですね。' },
    { id: 'g2-13-3', point: '〜てみる', meaning: 'Try doing...', sentences: '食べてみます。' },
    { id: 'g2-13-4', point: '〜そう', meaning: 'Looks like...', sentences: 'おいしそうです。' },
    { id: 'g2-13-5', point: '〜なら', meaning: 'If/As for...', sentences: 'ひらがななら書けます。' },
    { id: 'g2-13-6', point: 'Period of Time に Frequency', meaning: 'Times per...', sentences: '一週間に一回。' },
    { id: 'g2-13-7', point: 'i-Adjective → Adverb', meaning: 'Happily, quickly, etc.', sentences: '早く起きました。' }
  ],
  'genki2_14': [
    { id: 'g2-14-1', point: '名詞がほしい', meaning: 'Want something', sentences: '新しい車がほしいです。' },
    { id: 'g2-14-2', point: '〜がる／〜たがる', meaning: 'Someone else wants...', sentences: '子供が行きたがっています。' },
    { id: 'g2-14-3', point: 'あげる・くれる・もらう', meaning: 'Gift giving and receiving', sentences: '花をあげました。' },
    { id: 'g2-14-4', point: '〜たらどうですか', meaning: 'Why don\'t you...?', sentences: '病院に行ったらどうですか。' },
    { id: 'g2-14-5', point: '〜かもしれない', meaning: 'Might...', sentences: '雨が降るかもしれません。' },
    { id: 'g2-14-6', point: '〜しか...ない', meaning: 'Only (negative focus)', sentences: '千円しかありません。' },
    { id: 'g2-14-7', point: '〜も', meaning: 'As many as...', sentences: '十枚も食べました。' }
  ],
  'genki2_15': [
    { id: 'g2-15-1', point: 'Volitional Form', meaning: 'Let\'s... (casual)', sentences: '食べよう。' },
    { id: 'g2-15-2', point: 'Volitional + と思う／と思っています', meaning: 'Intentions', sentences: '日本に行こうと思っています。' },
    { id: 'g2-15-3', point: '～ておく', meaning: 'Doing in preparation', sentences: '予約しておきます。' },
    { id: 'g2-15-4', point: '(Short Form Sentence) + Noun', meaning: 'Qualifying nouns', sentences: '私が作った料理。' }
  ],
  'genki2_16': [
    { id: 'g2-16-1', point: '〜てあげる・〜てくれる・〜てもらう', meaning: 'Giving/Receiving favors', sentences: '手伝ってくれました。' },
    { id: 'g2-16-2', point: '〜ていただけませんか・〜てくれませんか', meaning: 'Asking context/polite favors', sentences: '教えていただけませんか。' },
    { id: 'g2-16-3', point: '〜といいですね・〜といいんですが', meaning: 'I hope...', sentences: '晴れるといいですね。' },
    { id: 'g2-16-4', point: '〜とき', meaning: 'When...', sentences: '子供のとき、よく遊びました。' },
    { id: 'g2-16-5', point: '〜てすみませんでした', meaning: 'Apologizing for an action', sentences: '遅れてすみませんでした。' }
  ],
  'genki2_17': [
    { id: 'g2-17-1', point: '〜そうです (Hearsay)', meaning: 'I heard that...', sentences: '降るそうです。' },
    { id: 'g2-17-2', point: '〜って', meaning: 'Quoting (casual)', sentences: '忙しいって。' },
    { id: 'g2-17-3', point: '〜たら', meaning: 'If/When (conditional)', sentences: '安かったら買います。' },
    { id: 'g2-17-4', point: '〜なくてもいいです', meaning: 'Don\'t have to...', sentences: '来なくてもいいですよ。' },
    { id: 'g2-17-5', point: '〜みたいです', meaning: 'Looks like... (resemblence)', sentences: '夢みたいです。' },
    { id: 'g2-17-6', point: '〜前に / 〜てから', meaning: 'Before / After', sentences: '食べる前に。食べてから。' }
  ],
  'genki2_18': [
    { id: 'g2-18-1', point: '他動詞・自動詞 (Transitive/Intransitive)', meaning: 'Transitivity pairs', sentences: 'ドアを開けます。ドアが開きます。' },
    { id: 'g2-18-2', point: '〜てしまう／〜ちゃう', meaning: 'Regret/Completion', sentences: '忘れてしまいました。' },
    { id: 'g2-18-3', point: '〜と (Conditional)', meaning: 'Whenever/Natural result', sentences: '冬になると寒くなります。' },
    { id: 'g2-18-4', point: '〜ながら', meaning: 'While doing...', sentences: '音楽を聞きながら勉強します。' },
    { id: 'g2-18-5', point: '〜ばよかった', meaning: 'I wish I had...', sentences: '行けばよかったです。' }
  ],
  'genki2_19': [
    { id: 'g2-19-1', point: 'Honorific Verbs (Special)', meaning: 'Special Keigo', sentences: '召し上がってください。' },
    { id: 'g2-19-2', point: 'Honorifics (General)', meaning: 'お〜になる', sentences: 'お書きになります。' },
    { id: 'g2-19-3', point: 'Respectful Commands', meaning: 'お〜ください', sentences: 'お座りください。' },
    { id: 'g2-19-4', point: 'Thanking for Actions', meaning: '〜てくださって', sentences: '手伝ってくださってありがとうございます。' },
    { id: 'g2-19-5', point: '〜てよかった', meaning: 'Glad I did...', sentences: '会えてよかったです。' },
    { id: 'g2-19-6', point: '〜はずです', meaning: 'Supposed to / Expected to', sentences: '来るはずです。' }
  ],
  'genki2_20': [
    { id: 'g2-20-1', point: 'Humble Expressions (Special)', meaning: 'Special Humble Verbs', sentences: '申し上げます。' },
    { id: 'g2-20-2', point: 'Humble Expressions (General)', meaning: 'お〜する', sentences: 'お持ちします。' },
    { id: 'g2-20-3', point: '〜ないで', meaning: 'Without doing...', sentences: '傘を持たないで出かけました。' },
    { id: 'g2-20-4', point: 'Embedded Questions (〜か)', meaning: 'Question within a sentence', sentences: '誰が来たか知りません。' },
    { id: 'g2-20-5', point: 'Embedded Yes/No (〜かどうか)', meaning: 'Whether or not...', sentences: '行くかどうか分かりません。' },
    { id: 'g2-20-6', point: '〜という', meaning: 'Called/Named', sentences: '「Nexus」というアプリ。' },
    { id: 'g2-20-7', point: '〜やすい／〜にくい', meaning: 'Easy/Hard to do', sentences: '書きやすいです。' }
  ],
  'genki2_21': [
    { id: 'g2-21-1', point: 'Passive Form (Ukemi)', meaning: 'Being acted upon', sentences: '叱られました。' },
    { id: 'g2-21-2', point: '～てある', meaning: 'State produced purposely', sentences: '置いてあります。' },
    { id: 'g2-21-3', point: '～あいだに', meaning: 'While / During', sentences: '寝ている間に。' },
    { id: 'g2-21-4', point: 'Adjective + する', meaning: 'Making something better, colder, etc.', sentences: '静かにしてください。' },
    { id: 'g2-21-5', point: '～てほしい', meaning: 'Want someone to do...', sentences: '教えてほしいです。' }
  ],
  'genki2_22': [
    { id: 'g2-22-1', point: 'Causative Form (〜させる)', meaning: 'Make/Let someone do', sentences: '泳がせました。' },
    { id: 'g2-22-2', point: 'Causative + あげる／くれる／もらう', meaning: 'Permission favors', sentences: '行かせてくれました。' },
    { id: 'g2-22-3', point: 'Command Form (〜なさい)', meaning: 'Do it! (parental)', sentences: '食べなさい。' },
    { id: 'g2-22-4', point: 'Imperative Form (〜ろ / 〜え)', meaning: 'Strong command', sentences: '起きろ！' },
    { id: 'g2-22-5', point: 'Conditional ～ば', meaning: 'If...', sentences: '安ければ買います。' },
    { id: 'g2-22-6', point: '～のに', meaning: 'Despite / Although', sentences: '雨なのに、出かけました。' },
    { id: 'g2-22-7', point: '～のように / ～のような', meaning: 'Like / Similar to', sentences: '花のような人。' }
  ],
  'genki2_23': [
    { id: 'g2-23-1', point: 'Causative-Passive (〜させられる)', meaning: 'Forced to do...', sentences: '食べさせられました。' },
    { id: 'g2-23-2', point: '～ても', meaning: 'Even if...', sentences: '雨が降っても行きます。' },
    { id: 'g2-23-3', point: '～ことにする', meaning: 'Decide to do...', sentences: '行くことにしました。' },
    { id: 'g2-23-4', point: '～ことにしている', meaning: 'Be in the habit of...', sentences: '毎日走ることにしています。' },
    { id: 'g2-23-5', point: '～まで', meaning: 'Until...', sentences: '終わるまで。' },
    { id: 'g2-23-6', point: '～方', meaning: 'How to...', sentences: '書き方。' }
  ]
};

export const getHardwiredModuleForChapter = (chapterNum: number): string => {
  if (chapterNum <= 12) return 'genki1';
  if (chapterNum <= 23) return 'genki2';
  return 'genki1'; 
};

export const getAllHardwiredPoints = (): ParsedGrammarPoint[] => {
  return Object.values(HARDWIRED_GRAMMAR).flat();
};
