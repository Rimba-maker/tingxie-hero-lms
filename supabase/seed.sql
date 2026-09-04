-- TingXie HERO — seed data
-- Run after schema.sql. Matches PRD_TingXieHero.md §6 Screen 2 table.

insert into lessons (week_number, title, moe_level, status, vocabulary) values
(4, '第十课 – 我的校园', 'P2', 'pending',
  '[{"character":"校园","pinyin":"xiào yuán"},{"character":"礼堂","pinyin":"lǐ táng"},{"character":"老师","pinyin":"lǎo shī"}]'),
(3, '第九课 – 我爱我的家', 'P2', 'completed',
  '[{"character":"爸爸","pinyin":"bà ba"},{"character":"妈妈","pinyin":"mā ma"},{"character":"温暖","pinyin":"wēn nuǎn"}]'),
(2, '第八课 – 快乐的周末', 'P2', 'needs_revision',
  '[{"character":"玩耍","pinyin":"wán shuǎ"},{"character":"公园","pinyin":"gōng yuán"}]');
