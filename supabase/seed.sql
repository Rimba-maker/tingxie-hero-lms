-- TingXie HERO — seed data
-- Run after schema.sql. Matches PRD_TingXieHero.md §6 Screen 2 table.

insert into lessons (week_number, title, moe_level, status, vocabulary, test_scheduled_at) values
(4, '第十课 – 我们的校园', 'P2', 'pending',
  '[{"character":"校园","pinyin":"xiào yuán"},{"character":"礼堂","pinyin":"lǐ táng"},{"character":"老师","pinyin":"lǎo shī"}]',
  '2026-10-14T07:00:00Z'), -- 3:00 PM in Asia/Singapore (UTC+8)
(3, '第九课 – 我爱我的家', 'P2', 'completed',
  '[{"character":"爸爸","pinyin":"bà ba"},{"character":"妈妈","pinyin":"mā ma"},{"character":"温暖","pinyin":"wēn nuǎn"}]',
  null),
(2, '第八课 – 快乐的周末', 'P2', 'needs_revision',
  '[{"character":"玩耍","pinyin":"wán shuǎ"},{"character":"公园","pinyin":"gōng yuán"}]',
  null);

-- Single hardcoded student (see schema.sql). "Used" credits are derived from
-- this student's real submissions count, not stored here.
insert into students (id, name, moe_level, credits_total, credits_expire_at) values
('lucas-p2', 'Lucas', 'P2', 20, '2026-11-30T00:00:00Z')
on conflict (id) do nothing;
