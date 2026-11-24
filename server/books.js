// Default catalogue (the six story worlds). Publishers can edit all of this in the admin panel.
// `locked: true` keeps a world on the map but closed: no codes can be redeemed and no quest runs.
export const HAT_BOOK = {
  id: 'hat', pos: [14, 0, 14], playable: true, published: true, locked: false,
  name: { en: "Zizoun's Hat Town", ar: 'بلدة زيزون للقبعات' }, book: { en: 'The Hat Maker', ar: 'صانع القبعات' },
  value: { en: 'Accepting differences', ar: 'تقبّل الاختلاف' }, skill: { en: 'Designing for others', ar: 'التصميم للآخرين' },
  desc: { en: "Uncle Zizoun's famous hat shop is closed. Be Said's secret helper: you have one week to bring it back to life, without Zizoun finding out!",
          ar: 'متجر العم زيزون الشهير للقبعات مغلق. كن مساعد سعيد السري: أمامك أسبوع واحد لتعيد إليه الحياة، دون أن يعرف زيزون!' },
  teaser: { en: ['Hats are like us…', '…no two are alike.', 'The hat shop is closed. Can you help Said open it again?'],
            ar: ['القبعات مثلنا…', '…لا واحدة تشبه الأخرى.', 'متجر القبعات مغلق. هل تساعد سعيداً على فتحه من جديد؟'] },
  cover: '/hat/pages/p01.jpg', shopUrl: 'https://thothpublisher.com',
};
// what the hat island said before Hat Town existed (used by the migration to tell "untouched" from "edited")
export const OLD_HAT_NAME_EN = 'Hat Market';

export const DEFAULT_BOOKS = [
  { id: 'pearl', pos: [-12, 0, 15], playable: false, published: true, locked: true,
    name: { en: 'Pearl Sea', ar: 'بحر اللؤلؤ' }, book: { en: 'The Story of a Pearl', ar: 'حكاية لؤلؤة' },
    value: { en: 'Persistence, trying again', ar: 'المثابرة والمحاولة من جديد' }, skill: { en: 'Learning from mistakes', ar: 'التعلّم من الأخطاء' },
    desc: { en: 'Deep under the warm Gulf sea, Lu’lu’a the pearl is trapped in a shell at the bottom of the reef. Can you help her reach the light?',
            ar: 'في أعماق بحر الخليج الدافئ، لؤلؤة محبوسة في صدفة في قاع الشعاب. هل تساعدها على الوصول إلى النور؟' },
    teaser: { en: ['Deep under the warm Gulf sea…', 'Lu’lu’a the pearl is trapped in a shell.', 'Can you help her reach the light?'],
              ar: ['في أعماق البحر الدافئ…', 'لؤلؤة محبوسة في صدفة.', 'هل تساعدها على الوصول إلى النور؟'] } },
  { id: 'stork', pos: [-17, 0, -3], name: { en: 'Stork Island', ar: 'جزيرة اللقالق' }, book: { en: 'Stork Island', ar: 'جزيرة اللقالق' },
    value: { en: 'Caring for family', ar: 'رعاية العائلة' }, skill: { en: 'Planning ahead', ar: 'التخطيط المسبق' },
    desc: { en: 'Hunters are coming to Stork Island. Can you keep the whole stork family safe?', ar: 'الصيادون قادمون إلى جزيرة اللقالق. هل تحمي العائلة كلها؟' },
    teaser: { en: ['Stork Island.', 'A boat is coming closer…', 'Can you keep the family safe?'], ar: ['جزيرة اللقالق.', 'قارب يقترب…', 'هل تحمي العائلة؟'] } },
  { id: 'afra', pos: [17, 0, -6], name: { en: "Afra's Valley", ar: 'وادي عفرا' }, book: { en: "Afra's Valley", ar: 'وادي عفرا' },
    value: { en: 'Sustainability', ar: 'الاستدامة' }, skill: { en: 'Cause and effect', ar: 'السبب والنتيجة' },
    desc: { en: "Afra's herd needs water and grass for five seasons. Every choice changes the valley.", ar: 'قطيع عفرا يحتاج إلى الماء والعشب لخمسة مواسم. كل اختيار يغيّر الوادي.' },
    teaser: { en: ["Afra's herd needs water.", 'Five seasons.', 'Will there be enough?'], ar: ['قطيع عفرا يحتاج الماء.', 'خمسة مواسم.', 'هل يكفي الجميع؟'] } },
  HAT_BOOK,
  { id: 'sahl', pos: [1, 0, -21], name: { en: 'Al-Hal Sahl', ar: 'الحل سهل' }, book: { en: 'Al-Hal Sahl', ar: 'الحل سهل' },
    value: { en: 'Teamwork', ar: 'العمل الجماعي' }, skill: { en: 'Problem-solving', ar: 'حل المشكلات' },
    desc: { en: 'Five animals have five problems. Pick the right plan for each one.', ar: 'خمسة حيوانات وخمس مشكلات. اختر الخطة المناسبة لكل واحد.' },
    teaser: { en: ['Five animals.', 'Five problems.', 'Easier together.'], ar: ['خمسة حيوانات.', 'خمس مشكلات.', 'الحل أسهل معاً.'] } },
  { id: 'chick', pos: [2, 0, 21], name: { en: 'Diaries of a Chick', ar: 'يوميات كتكوت' }, book: { en: 'Diaries of a Chick', ar: 'يوميات كتكوت' },
    value: { en: 'Resilience', ar: 'الصمود' }, skill: { en: 'Bouncing back', ar: 'النهوض من جديد' },
    desc: { en: 'A little chick has a big first week. Every day something goes wrong, and every day she gets back up.', ar: 'كتكوتة صغيرة وأسبوع أول كبير. كل يوم يحدث خطأ، وكل يوم تنهض من جديد.' },
    teaser: { en: ['A little chick…', 'Every day something goes wrong…', 'and every day she gets back up.'], ar: ['كتكوتة صغيرة…', 'كل يوم يحدث خطأ…', 'وكل يوم تنهض.'] } },
].map(b => ({ playable: false, published: true, locked: false, cover: null, pages: {}, shopUrl: '', ...b }));
