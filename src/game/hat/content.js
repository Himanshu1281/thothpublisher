// Zizoun's Hat Town — all story content, in Arabic (from the book, with tashkeel) and English.
// Book: صانع القبعات / The Hat Maker — written by Faten Abu Al-Laban, illustrated by Latifa Ahmed (Thoth, 2025).
// /public/hat/pages holds the book's pages, used only as the "scan this page" reference.
// Characters and places are 3D models (chars3d.js, town3d.js).

export const PAGE = p => `/hat/pages/p${String(p).padStart(2, '0')}.jpg`;

/* ---------- the week ---------- */
export const DAYS = [
  { q: 1, icon: 'hat', title: { en: 'The Closed Shop', ar: 'المتجر المغلق' }, learn: { en: 'Cause and effect', ar: 'السبب والنتيجة' } },
  { q: 2, icon: 'notebook', title: { en: 'The Old Orders Notebook', ar: 'دفتر الطلبات القديم' }, learn: { en: 'Reading names, kind invitations', ar: 'قراءة الأسماء والدعوات اللطيفة' } },
  { q: 3, icon: 'tape', title: { en: 'Measure Every Head', ar: 'قِس كل رأس' }, learn: { en: 'Measuring, animal and plant facts', ar: 'القياس وحقائق عن الحيوانات والنباتات' } },
  { q: 4, icon: 'scissors', title: { en: 'The Hat Studio', ar: 'استوديو القبعات' }, learn: { en: 'Designing for someone else', ar: 'التصميم من أجل الآخرين' } },
  { q: 5, icon: 'route', title: { en: 'The Secret Delivery', ar: 'التوصيل السري' }, learn: { en: 'Planning a route', ar: 'التخطيط للطريق' } },
  { q: 6, icon: 'drum', title: { en: 'Workshop Beat', ar: 'إيقاع الورشة' }, learn: { en: 'Rhythm and love of work', ar: 'الإيقاع وحب العمل' } },
  { q: 7, icon: 'bunting', title: { en: 'The Grand Reopening', ar: 'الافتتاح الكبير' }, learn: { en: 'Reading a speech aloud', ar: 'إلقاء كلمة بصوت عالٍ' } },
];

/* ---------- characters ---------- */
export const CUSTOMERS = [
  { id: 'strawberry', f: true, art: 'strawberry', col: '#e8504f', bg: '#ffe1dc', name: { en: 'Miss Strawberry', ar: 'الآنسة فراولة' }, readName: 'الآنِسَةُ فَراوِلَةُ اللَّطيفَةُ', shortName: 'فَراوِلَةُ' },
  { id: 'frog', art: 'frog', col: '#5c9e3c', bg: '#e1f6e8', name: { en: 'Mr. Frog', ar: 'السيد ضفدع' }, readName: 'السَّيِّدُ ضِفْدَعٌ', shortName: 'ضِفْدَعٌ' },
  { id: 'swan', f: true, art: 'swan', col: '#e98bb5', bg: '#ffe9f1', name: { en: 'Mrs. Zakiyya the swan', ar: 'السيدة زكية البجعة' }, readName: 'السَّيِّدَةُ زَكِيَّةُ البَجَعَةُ الأَنيقَةُ', shortName: 'زَكِيَّةُ' },
  { id: 'corn', art: 'corn', col: '#e3a81b', bg: '#fff3c4', name: { en: 'Mazyoun the corn cob', ar: 'عرنوس الذرة مزيون' }, readName: 'عَرْنوسُ الذُّرَةِ مَزْيونٌ', shortName: 'مَزْيونٌ' },
  { id: 'ostrich', f: true, art: 'ostrich', col: '#2d3a8c', bg: '#e9e4f9', name: { en: 'Hashoura the ostrich', ar: 'النعامة حشورة' }, readName: 'النَّعامَةُ حَشورَةُ', shortName: 'حَشورَةُ' },
];
export const cust = id => CUSTOMERS.find(c => c.id === id);
/** Arabic verbs agree with the customer: use the `_f` string for Miss Strawberry, Mrs. Zakiyya and Hashoura. */
export const gk = (key, c, lang) => key + (lang === 'ar' && c?.f ? '_f' : '');
export const CAST = [
  { id: 'said', art: 'said', name: { en: 'Said', ar: 'سعيد' }, bg: '#ffe7b0' },
  { id: 'zizoun', art: 'zizoun', name: { en: 'Uncle Zizoun', ar: 'العم زيزون' }, bg: '#e1f6e8' },
  ...CUSTOMERS,
];

/* ---------- Day 1: page 5 read-aloud, one window lights per line ---------- */
export const P5 = {
  little: ['السَّيِّدُ زيزون أَفْضَلُ صانِعِ قُبَّعاتٍ.', 'بَدَأَ النّاسُ يَبْتَعِدونَ عَنْ مَتْجَرِهِ.'],
  early: ['السَّيِّدُ زيزون أَفْضَلُ صانِعِ قُبَّعاتٍ في الْبَلَدِ كُلِّها،', 'لَكِنَّهُ بَدَأَ يَفْقِدُ مَكانَتَهُ في سوقِ الْعَمَلِ،', 'وَبَدَأَ النّاسُ يَبْتَعِدونَ عَنْ مَتْجَرِهِ.'],
  reader: ['السَّيِّدُ زيزون أَفْضَلُ صانِعِ قُبَّعاتٍ في الْبَلَدِ كُلِّها،', 'وَصاحِبُ اسْمٍ شَهيرٍ في هَذِهِ الْمِهْنَةِ،', 'لَكِنَّهُ مُنْذُ عِدَّةِ سَنَواتٍ بَدَأَ يَفْقِدُ مَكانَتَهُ في سوقِ الْعَمَلِ،', 'وَبَدَأَ النّاسُ يَبْتَعِدونَ عَنْ مَتْجَرِهِ وَيَنْصَرِفونَ عَنْ شِراءِ مُنْتَجاتِهِ.'],
  en: { little: ['Mr. Zizoun is the best hat maker.', 'People started staying away from his shop.'],
    early: ['Mr. Zizoun is the best hat maker in the whole land,', 'but he began to lose his place in the market,', 'and people started staying away from his shop.'],
    reader: ['Mr. Zizoun is the best hat maker in the whole land,', 'and a famous name in this trade,', 'but for some years he has been losing his place in the market,', 'and people stay away from his shop and stop buying what he makes.'] },
};
export const GLOSS = {
  'مَتْجَرِهِ': { en: 'his shop', ar: 'دكانه' }, 'مَكانَتَهُ': { en: 'his standing', ar: 'منزلته' }, 'يَبْتَعِدونَ': { en: 'stay away', ar: 'يبعدون' },
  'مُنْتَجاتِهِ': { en: 'his products', ar: 'ما يصنعه' }, 'الْمِهْنَةِ': { en: 'the trade', ar: 'العمل' }, 'شَهيرٍ': { en: 'famous', ar: 'معروف' },
  'قُبَّعاتٍ': { en: 'hats', ar: 'قبعات' }, 'افْتِتاحَ': { en: 'opening', ar: 'فتح' }, 'نُسْخَةً': { en: 'copy', ar: 'صورة مكررة' },
  'فَزّاعَةٍ': { en: 'scarecrow', ar: 'فزاعة الحقل' }, 'أَصْلَعُ': { en: 'bald', ar: 'بلا شعر' }, 'ذَوْقَ': { en: 'taste', ar: 'ما يحبه' },
  'تَسْقُطُ': { en: 'fall', ar: 'تقع' }, 'واسِعَةً': { en: 'wide', ar: 'كبيرة' }, 'خَجولَةٌ': { en: 'shy', ar: 'تستحي' },
};

/* Day 1 choice moment: Said shows a new design, the child picks Zizoun's answer */
export const Q1_ROUNDS = [
  { who: 'frog', ask: { en: 'Said made a hat with a strap so it stays on when Mr. Frog jumps.', ar: 'صنع سعيد قبعة بشريط حتى لا تسقط عندما يقفز السيد ضفدع.' } },
  { who: 'strawberry', ask: { en: 'Said made an open hat so Miss Strawberry\'s leaves can breathe.', ar: 'صنع سعيد قبعة مفتوحة حتى تتنفس أوراق الآنسة فراولة.' } },
  { who: 'corn', ask: { en: 'Said made a wide hat for Mazyoun\'s long hair.', ar: 'صنع سعيد قبعة واسعة لشعر مزيون الطويل.' } },
];
export const Q1_REPLIES = [
  { kind: 'old', en: '“What are these strange designs? Where is the class, boy?!”', ar: '«ما هذه التصاميم الغريبة؟ أين الأصالة والرقي يا ولد؟!»' },
  { kind: 'old', en: '“Everyone must wear my classic hat. That is elegance!”', ar: '«على الجميع أن يلبسوا قبعتي القديمة. هذه هي الأناقة!»' },
  { kind: 'old', en: '“New designs are cheap and ugly. Put it away!”', ar: '«التصاميم الجديدة رخيصة وقبيحة. ضعها جانباً!»' },
  { kind: 'open', en: '“Interesting… let\'s ask the customer what they like.”', ar: '«فكرة لطيفة… لنسأل الزبون ماذا يحب.»' },
];
export const Q1_CAUSE = {
  q: { en: 'Why did the customers stop coming?', ar: 'لماذا توقف الزبائن عن المجيء؟' },
  opts: [
    { ok: true, en: 'Zizoun refused anything new, so nobody found a hat that suited them.', ar: 'رفض زيزون كل جديد، فلم يجد أحد قبعة تناسبه.' },
    { ok: false, en: 'The hats were too expensive.', ar: 'القبعات كانت غالية جداً.' },
    { ok: false, en: 'The shop was too far away.', ar: 'المتجر كان بعيداً جداً.' },
  ],
};

/* ---------- Day 2 ---------- */
export const ROOM_SPOTS = [ // positions in % of page 11 (living room)
  { id: 'blanket', x: 72, y: 47, w: 26, h: 13, find: 'key', label: { en: 'the blanket', ar: 'البطانية' } },
  { id: 'drawer', x: 3, y: 70, w: 15, h: 9, find: 'notebook', needs: 'key', label: { en: 'the drawer', ar: 'الدرج' } },
  { id: 'lamp', x: 0, y: 40, w: 10, h: 24, label: { en: 'the lamp', ar: 'المصباح' } },
  { id: 'frame', x: 12, y: 10, w: 17, h: 28, label: { en: 'the picture', ar: 'اللوحة' } },
  { id: 'mirror', x: 69, y: 11, w: 18, h: 27, label: { en: 'the mirror', ar: 'المرآة' } },
  { id: 'floor', x: 22, y: 83, w: 46, h: 6, label: { en: 'under the sofa', ar: 'تحت الكنبة' } },
];
export const NEWSPAPER = { x: 33, y: 44, w: 39, h: 23 };
export const POSTER_TITLES = [
  { ok: true, en: 'Hat shop reopening! Special designs for everyone!', ar: 'إعادة افتتاح متجر القبعات! تصاميم خاصة لكل زبون!' },
  { ok: false, en: 'Old hats only. Take it or leave it!', ar: 'قبعات قديمة فقط. خذها أو اتركها!' },
  { ok: false, en: 'Our hats are better than every other shop\'s!', ar: 'قبعاتنا أفضل من كل المتاجر الأخرى!' },
];
export const STICKERS = ['hat', 'feather', 'ribbon', 'flower', 'star', 'bunting', 'scissors', 'spool'];
export const NET_RULES = [
  { ok: true, en: 'Send the invitation to the customers in Zizoun\'s notebook', ar: 'أرسل الدعوة إلى الزبائن في دفتر زيزون' },
  { ok: false, en: 'Post a customer\'s home address for everyone to see', ar: 'انشر عنوان بيت زبون ليراه الجميع' },
  { ok: true, en: 'Use kind and true words', ar: 'استخدم كلمات لطيفة وصادقة' },
  { ok: false, en: 'Write mean comments about other shops', ar: 'اكتب تعليقات سيئة عن المتاجر الأخرى' },
];

/* ---------- Day 3: heads + fact cards (pages 26–27) ---------- */
export const HEADS = {
  frog: { cm: 30, how: { en: 'Mr. Frog never stops jumping! Tap “Measure” while he is in the air.', ar: 'السيد ضفدع لا يتوقف عن القفز! اضغط «قِس» وهو في الهواء.' },
    problem: { en: 'Round and bald: hats slide right off!', ar: 'رأس مستدير وأصلع: القبعات تنزلق عنه!' } },
  corn: { cm: 38, how: { en: 'So much hair! Push it aside to find Mazyoun\'s head.', ar: 'شعر كثير! أزِحه جانباً لتجد رأس مزيون.' },
    problem: { en: 'Huge long hair needs a lot of room.', ar: 'الشعر الطويل يحتاج إلى مكان واسع.' } },
  swan: { cm: 14, how: { en: 'Mrs. Zakiyya\'s head is so high! Climb the ladder to reach it.', ar: 'رأس السيدة زكية عالٍ جداً! اصعد السلم لتصل إليه.' },
    problem: { en: 'A tiny head on a very long neck.', ar: 'رأس صغير على رقبة طويلة جداً.' } },
  strawberry: { cm: 26, how: { en: 'Pull the tape gently. Don\'t squash the leaves!', ar: 'اسحب الشريط بلطف. لا تضغط على الأوراق!' },
    problem: { en: 'A leafy top that must not be squashed.', ar: 'أوراق خضراء يجب ألا تُضغط.' } },
  ostrich: { cm: 20, how: { en: 'Hashoura is shy and hides. Talk softly into the microphone to coax her out. Shouting makes her hide again!', ar: 'حشورة خجولة وتختبئ. تكلّم بهدوء في الميكروفون لتخرج. الصراخ يجعلها تختبئ من جديد!' },
    problem: { en: 'Too shy to come out.', ar: 'خجولة جداً لتخرج.' } },
};
export const HEAD_ORDER = ['frog', 'corn', 'swan', 'strawberry', 'ostrich'];
// Facts as printed on pages 26–27. The ostrich card's "buries its head in the sand" is a myth, so it is
// used only as Hashoura's shy personality, never taught as a fact.
export const FACTS = {
  strawberry: { page: 26, en: ['A small, shiny red fruit.', 'It has vitamins that make the body strong and help fight colds.', 'It gives energy to busy children.'],
    ar: ['فاكهة حمراء صغيرة ولامعة.', 'فيها فيتامين يقوّي الجسم ويحمي من نزلات البرد.', 'تعطي الطاقة والمرح للأطفال النشيطين.'] },
  corn: { page: 26, en: ['A tall plant with shiny yellow grains.', 'It gives the body energy (carbohydrates).', 'It has fibre that helps the tummy.'],
    ar: ['نبات طويل يحمل حبات صفراء لامعة.', 'تعطي الجسم طاقة لأنها غنية بالكربوهيدرات.', 'فيها ألياف مفيدة للمعدة.'] },
  swan: { page: 27, en: ['A beautiful bird with a long neck.', 'It lives near lakes and rivers and swims gracefully.', 'Swans fly far and migrate together in groups.'],
    ar: ['طائر جميل ذو رقبة طويلة.', 'تعيش قرب البحيرات والأنهار وتسبح برشاقة.', 'تطير لمسافات بعيدة وتهاجر مع أصدقائها في جماعات.'] },
  ostrich: { page: 27, en: ['The biggest bird on Earth.', 'It cannot fly, but it runs very fast.', 'It lives in deserts.'],
    ar: ['أكبر طائر على وجه الأرض.', 'لا تستطيع الطيران لكنها تجري بسرعة كبيرة.', 'تعيش في الصحاري.'] },
  frog: { page: 27, en: ['An amphibian: it lives in water and on land.', 'Strong back legs help it jump high.', 'It eats insects like flies and mosquitoes.'],
    ar: ['حيوان برمائي يعيش في الماء وعلى اليابسة.', 'له أرجل خلفية قوية تساعده على القفز عالياً.', 'يأكل الحشرات مثل الذباب والبعوض.'] },
};
export const FACT_QUIZ = [
  { q: { en: 'Who cannot fly but runs very fast?', ar: 'من لا يستطيع الطيران لكنه يجري بسرعة كبيرة؟' }, a: 'ostrich', opts: ['ostrich', 'swan', 'frog'] },
  { q: { en: 'Who lives in water and on land?', ar: 'من يعيش في الماء وعلى اليابسة؟' }, a: 'frog', opts: ['corn', 'frog', 'strawberry'] },
  { q: { en: 'Who has vitamins that help fight colds?', ar: 'من فيها فيتامين يحمي من نزلات البرد؟' }, a: 'strawberry', opts: ['strawberry', 'ostrich', 'swan'] },
  { q: { en: 'Who migrates with friends in groups?', ar: 'من يهاجر مع أصدقائه في جماعات؟' }, a: 'swan', opts: ['frog', 'swan', 'corn'] },
];

/* ---------- Day 4: Hat Studio ---------- */
export const SHAPES = [
  { id: 'classic', en: "Zizoun's classic", ar: 'قبعة زيزون القديمة' },
  { id: 'strap', en: 'Cap with a chin strap', ar: 'قبعة بشريط للذقن' },
  { id: 'ring', en: 'Open-top bonnet', ar: 'قبعة مفتوحة من الأعلى' },
  { id: 'bonnet', en: 'Small bonnet', ar: 'قبعة صغيرة' },
  { id: 'wide', en: 'Wide brim', ar: 'قبعة عريضة' },
  { id: 'flower', en: 'Flower hat', ar: 'قبعة الزهرة' },
];
export const FABRICS = [
  { id: 'felt', en: 'Felt', ar: 'لباد' }, { id: 'stripes', en: 'Stripes', ar: 'مخطط' }, { id: 'dots', en: 'Dots', ar: 'منقط' }, { id: 'straw', en: 'Straw', ar: 'قش' },
];
export const COLOURS = ['#7a3a6b', '#e8504f', '#f2a7c3', '#c9b6ef', '#5bb7a6', '#3f8fd2', '#e3a81b', '#5c9e3c', '#2d3a8c', '#f4ead2'];
export const DECOS = [
  { id: 'none', en: 'Nothing', ar: 'بلا زينة', icon: 'none' }, { id: 'feather', en: 'Feather', ar: 'ريشة', icon: 'feather' }, { id: 'flowers', en: 'Flowers', ar: 'زهور', icon: 'flower' },
  { id: 'ribbon', en: 'Ribbon', ar: 'شريطة', icon: 'ribbon' }, { id: 'bow', en: 'Bow tie', ar: 'فيونكة', icon: 'bow' }, { id: 'tassels', en: 'Tassels', ar: 'شراشيب', icon: 'tassels' },
];
export const NEEDS = {
  frog: { shape: 'strap', deco: 'bow', colour: '#7a3a6b',
    note: { long: 'أُريدُ قُبَّعَةً لا تَسْقُطُ عِنْدَما أَقْفِزُ، وَأُحِبُّ الفِيونْكَةَ.', short: 'قُبَّعَةٌ لا تَسْقُطُ.', en: 'I want a hat that stays on when I jump. I love bow ties.' },
    fail: { en: 'Boing! The hat flew off when Mr. Frog jumped.', ar: 'بوينغ! طارت القبعة عندما قفز السيد ضفدع.' } },
  strawberry: { shape: 'ring', deco: 'flowers', colour: '#5bb7a6',
    note: { long: 'لا تَضْغَطوا عَلى أَوْراقي الخَضْراءِ، وَأُحِبُّ الزُّهورَ.', short: 'لا تَضْغَطوا عَلى أَوْراقي.', en: 'Don\'t squash my green leaves. I love flowers.' },
    fail: { en: 'Squish! The hat squashed Miss Strawberry\'s leaves.', ar: 'أوه! ضغطت القبعة على أوراق الآنسة فراولة.' } },
  swan: { shape: 'bonnet', deco: 'ribbon', colour: '#c9b6ef',
    note: { long: 'رَأْسي صَغيرٌ، أُريدُ قُبَّعَةً صَغيرَةً لا تُغَطّي عَيْنَيَّ.', short: 'قُبَّعَةٌ صَغيرَةٌ.', en: 'My head is small. I want a small hat that doesn\'t cover my eyes.' },
    fail: { en: 'Bump! The big hat covered Mrs. Zakiyya\'s eyes.', ar: 'بوم! غطت القبعة الكبيرة عيني السيدة زكية.' } },
  corn: { shape: 'wide', deco: 'tassels', colour: '#e3a81b',
    note: { long: 'شَعْري طَويلٌ جِدًّا، أَحْتاجُ قُبَّعَةً واسِعَةً.', short: 'قُبَّعَةٌ واسِعَةٌ.', en: 'My hair is very long. I need a wide hat.' },
    fail: { en: 'Pop! Mazyoun\'s hair pushed the hat right off.', ar: 'بوب! دفع شعر مزيون القبعة بعيداً.' } },
  ostrich: { shape: 'flower', deco: 'feather', colour: '#e8504f',
    note: { long: 'أَنا خَجولَةٌ، أُحِبُّ قُبَّعَةً ناعِمَةً كَالزَّهْرَةِ مَعَ ريشَةٍ.', short: 'قُبَّعَةٌ كَالزَّهْرَةِ.', en: 'I\'m shy. I like a soft hat like a flower, with a feather.' },
    fail: { en: 'Oh no! The heavy hat made Hashoura hide her head.', ar: 'أوه لا! القبعة الثقيلة جعلت حشورة تخفي رأسها.' } },
};

/* ---------- Day 6: the jingle (book tagline, page 3) ---------- */
export const HAT_SONG = {
  melody: [[67, 1], [67, 1], [72, 1], [71, 1], [69, 2], [67, 2], [65, 1], [67, 1], [69, 1], [67, 1], [64, 4],
    [65, 1], [65, 1], [69, 1], [67, 1], [65, 2], [64, 2], [62, 1], [64, 1], [67, 1], [65, 1], [60, 4]],
  bass: [48, 53, 48, 43, 41, 48, 43, 48],
  lyrics: [
    { en: 'Hats are like us,', ar: 'القُبَّعاتُ مِثْلُنا،', at: 0 },
    { en: 'no two are the same!', ar: 'لا واحِدَةَ تُشْبِهُ الأُخْرى!', at: 8 },
    { en: 'A hat for every head,', ar: 'لِكُلِّ رَأْسٍ قُبَّعَةٌ،', at: 16 },
    { en: 'made with love and care!', ar: 'نَصْنَعُها بِحُبٍّ وَإِتْقانٍ!', at: 24 },
  ],
};
export const TOOLS = [
  { id: 'needle', icon: 'needle', en: 'tick-tick', ar: 'تك تك' }, { id: 'snip', icon: 'scissors', en: 'snip', ar: 'قص' }, { id: 'tap', icon: 'hammer', en: 'tap', ar: 'طق' },
];

/* ---------- Day 7: Said's speech (page 19) ---------- */
export const SPEECH = {
  little: [
    { ar: 'الرُّؤوسُ لَيْسَتْ نُسْخَةً واحِدَةً!', en: 'Heads are not all the same!' },
    { ar: 'القُبَّعاتُ مِثْلُنا، لا واحِدَةَ تُشْبِهُ الأُخْرى.', en: 'Hats are like us: no two are alike.' },
  ],
  early: [
    { ar: 'نَحْنُ سُعَداءُ بِأَنْ نُعيدَ افْتِتاحَ مَصْنَعِ زيزون لِلْقُبَّعاتِ!', en: 'We are happy to reopen Zizoun\'s hat workshop!' },
    { ar: 'فَالرُّؤوسُ لَيْسَتْ نُسْخَةً واحِدَةً،', en: 'Heads are not all copies of one another,' },
    { ar: 'وَإِلّا كانَ لِلْجَميعِ رَأْسٌ أَصْلَعُ كَالسَّيِّدِ ضِفْدَعٍ!', en: 'or else everyone would have a bald head like Mr. Frog!', joke: true },
  ],
  reader: [
    { ar: 'نَحْنُ سُعَداءُ بِأَنْ نُعيدَ افْتِتاحَ مَصْنَعِ زيزون الْعَريقِ لِلْقُبَّعاتِ،', en: 'We are happy to reopen Zizoun\'s famous hat workshop,' },
    { ar: 'وَتَأَكَّدوا بِأَنَّهُ لَنْ يَكونَ بِالْجَوْدَةِ الَّتي تُناسِبُكُمْ وَحَسْبُ،', en: 'and be sure it will not only have the quality you like,' },
    { ar: 'بَلْ أَيْضًا بِالتَّصاميمِ الَّتي تُناسِبُ ذَوْقَ كُلِّ واحِدٍ؛', en: 'but also designs that suit everyone\'s taste;' },
    { ar: 'فَالرُّؤوسُ لَيْسَتْ نُسْخَةً واحِدَةً،', en: 'because heads are not all copies of one another,' },
    { ar: 'وَإِلّا لَوَجَبَ عَلى الْجَميعِ أَنْ يَكونَ لَهُمْ رَأْسُ فَزّاعَةٍ مِثْلي!', en: 'or else everyone would need a scarecrow head like mine!', joke: true },
    { ar: 'أَوْ شَعْرٌ طَويلٌ كَعَرْنوسِ الذُّرَةِ مَزْيونٍ!', en: 'Or long hair like Mazyoun the corn cob!', joke: true },
    { ar: 'أَوْ رَأْسٌ أَصْلَعُ كَالسَّيِّدِ ضِفْدَعٍ!', en: 'Or a bald head like Mr. Frog!', joke: true },
  ],
};
export const ENDING = [
  { page: 20, en: 'Uncle Zizoun laughed and clapped for a long time. He finally understood.', ar: 'ضحك العم زيزون وصفّق طويلاً. لقد فهم أخيراً.' },
  { page: 20, en: '“We should not put our own taste above other people\'s, or force them to think like us.”', ar: '«لا ينبغي علينا تفضيل أذواقنا على أذواق الناس، ولا إجبارهم على التفكير كما نفكر.»' },
  { page: 21, en: 'The customers rushed to buy their hats, and everyone congratulated Zizoun, the best hat maker.', ar: 'وأسرع الزبائن لاقتناء قبعاتهم، وقدّموا التهاني للسيد زيزون، أفضل صانع للقبعات.' },
];
export const Q7_TICKET = { en: 'Zizoun learned that everyone\'s taste is different. What does someone you love like that is different from what you like?', ar: 'تعلّم زيزون أن لكل واحد ذوقاً مختلفاً. ما الشيء الذي يحبه شخص تحبه ويختلف عمّا تحبه أنت؟' };
export const Q7_CHIPS = { en: ['A different food', 'A different colour', 'A different game', 'Different music'], ar: ['أكلة مختلفة', 'لون مختلف', 'لعبة مختلفة', 'موسيقى مختلفة'] };
