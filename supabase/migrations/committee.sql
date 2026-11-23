-- The committee shown at /teams/committee (and the card on /teams). Managed at
-- /admin/committee: add, edit, hide, reorder and delete people, and set the
-- committee year.
--
-- Run once in Supabase → SQL Editor, AFTER team_editors.sql (it needs the
-- is_admin() and log_admin_activity() functions). Safe to re-run: the people
-- below are only added while the table is still empty, so running it again
-- never brings back someone an admin deleted.
--
-- Who may do what:
--   everyone ........ read the visible people and the settings
--   main admins ..... read all, add, edit, hide, reorder, delete, change the year
--
-- group_id: which section of the page the person is in. The sections are
--           defined in src/Components/teams/committee/committeeData.js:
--           office-bearers, team-coordinators, editors, coordinators
-- role, role_en: the role in Tamil and in English
-- photo_url: a Google Drive link ("Anyone with the link") or an uploaded photo
-- photo_public_id: set when the photo was uploaded through the admin, so the
--           file can be deleted from Cloudinary when it is replaced or removed
-- photo_focus: which part of the photo stays in view, 0 = top … 100 = bottom

create table if not exists public.committee_members (
  id uuid primary key default gen_random_uuid(),
  group_id text not null
    constraint committee_members_group check (group_id in ('office-bearers', 'team-coordinators', 'editors', 'coordinators')),
  name text not null constraint committee_members_name_present check (btrim(name) <> ''),
  role text not null default '',
  role_en text not null default '',
  photo_url text not null default '',
  photo_public_id text not null default '',
  photo_focus smallint not null default 24
    constraint committee_members_focus_range check (photo_focus between 0 and 100),
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists committee_members_order on public.committee_members (group_id, sort_order);

alter table public.committee_members enable row level security;

drop policy if exists "committee_members_read" on public.committee_members;
create policy "committee_members_read"
  on public.committee_members for select
  using (is_visible or public.is_admin());

drop policy if exists "committee_members_admin_write" on public.committee_members;
create policy "committee_members_admin_write"
  on public.committee_members for all
  using (public.is_admin())
  with check (public.is_admin());

-- One row: the committee year and the sentence under the page title.
create table if not exists public.committee_settings (
  id smallint primary key default 1 constraint committee_settings_single check (id = 1),
  year text not null default '' constraint committee_settings_year_length check (char_length(year) <= 20),
  intro text not null default '' constraint committee_settings_intro_length check (char_length(intro) <= 400),
  updated_at timestamptz not null default now()
);

alter table public.committee_settings enable row level security;

drop policy if exists "committee_settings_read" on public.committee_settings;
create policy "committee_settings_read"
  on public.committee_settings for select
  using (true);

drop policy if exists "committee_settings_admin_write" on public.committee_settings;
create policy "committee_settings_admin_write"
  on public.committee_settings for all
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.touch_committee()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists committee_members_touch on public.committee_members;
create trigger committee_members_touch
  before update on public.committee_members
  for each row execute function public.touch_committee();

drop trigger if exists committee_settings_touch on public.committee_settings;
create trigger committee_settings_touch
  before update on public.committee_settings
  for each row execute function public.touch_committee();

-- ---- The 2026/27 committee that was built into the site ------------------------------------
-- Added before the activity-log trigger below, so the first run doesn't log
-- 29 "added" entries.
insert into public.committee_settings (id, year, intro)
values (1, '2026/27', '')
on conflict (id) do nothing;

insert into public.committee_members (group_id, name, role, role_en, photo_url, sort_order)
select v.group_id, v.name, v.role, v.role_en, v.photo_url, v.sort_order
from (values
  ('office-bearers', 'Yathursanan', 'தலைவர்', 'President', 'https://drive.google.com/file/d/15Y9cAKUDvPppNJE09kzOimQpyQh6u7Rw/view', 0),
  ('office-bearers', 'Keerthanan', 'உப தலைவர்', 'Vice President', 'https://drive.google.com/file/d/1f_yfdj_mlYSRaM2spG06chfBTvud5jjo/view', 1),
  ('office-bearers', 'Kottesvaran', 'உப தலைவர்', 'Vice President', 'https://drive.google.com/file/d/1_cl2LLqeYUVsfoPpdaSPyzhGDmgZTMRN/view', 2),
  ('office-bearers', 'Sivamynthan', 'செயலாளர்', 'Secretary', 'https://drive.google.com/file/d/1Qpbqkp8Y881QvEWrt3Yl829du3I-9KIN/view', 3),
  ('office-bearers', 'Sajeevan', 'உப செயலாளர்', 'Vice Secretary', 'https://drive.google.com/file/d/1-5HkocEkUS3YpsxMi-nOhAPy1EmEcqIG/view', 4),
  ('office-bearers', 'Anush', 'பொருளாளர்', 'Treasurer', 'https://drive.google.com/file/d/1kfTH8znzPJKftNRY_VZ9XMMjc938oXci/view', 5),
  ('team-coordinators', 'Laavanjan', 'இணையத்தள ஒருங்கிணைப்பாளர்', 'Web Coordinator', 'https://drive.google.com/file/d/1V8_fXOEYBwAJtB-R4E5w6xJvaGMHGYLC/view', 0),
  ('team-coordinators', 'Mathujan', 'தொழில்நுட்ப அணி ஒருங்கிணைப்பாளர்', 'Tech Team Coordinator', 'https://drive.google.com/file/d/1bXynmNajakLaDjza0Vty-f-IAibt-l-C/view', 1),
  ('team-coordinators', 'Lathushikan', 'ஊடக அணி ஒருங்கிணைப்பாளர்', 'Media Team Coordinator', 'https://drive.google.com/file/d/1A2Q0spFlxW0Zw4jitGvzwMG6GjbXs8It/view', 2),
  ('team-coordinators', 'Lisorthman', 'ஊடக அணி ஒருங்கிணைப்பாளர்', 'Media Team Coordinator', 'https://drive.google.com/file/d/13p4Dn9lme0fqTAhXtIIH9C8c49sNzVY-/view', 3),
  ('team-coordinators', 'Thiruvarankan', 'ஊடக அணி ஒருங்கிணைப்பாளர்', 'Media Team Coordinator', 'https://drive.google.com/file/d/11xPz-3jPr7GIymkDSuLfE13Z5FaJIyeA/view', 4),
  ('team-coordinators', 'Melshan', 'அலங்கார ஒருங்கிணைப்பாளர்', 'Decoration Coordinator', 'https://drive.google.com/file/d/1W7HuJCHJhUySJhCiMxw0Q9OSbLfdC_h6/view', 5),
  ('editors', 'Abeeth', 'இதழாசிரியர்', 'Editor', 'https://drive.google.com/file/d/19O3yiV19XawvdikDhgbTyo4hqMJqtmzy/view', 0),
  ('editors', 'Babenaiyaa', 'இதழாசிரியர்', 'Editor', 'https://drive.google.com/file/d/1oKCBgxXI33KC5PZ2Z57qxGj3jWAGuz7d/view', 1),
  ('editors', 'Geethasanchcharan', 'இதழாசிரியர்', 'Editor', 'https://drive.google.com/file/d/14984eKiiQR0W2utsBk8jHw25-lV-eyyW/view', 2),
  ('coordinators', 'Aadithiyan', 'ஒருங்கிணைப்பாளர்', 'Coordinator', 'https://drive.google.com/file/d/1_vSAIwcGSiZNU-ipbwvTEyRq2mJqH3F3/view', 0),
  ('coordinators', 'Aathirai', 'ஒருங்கிணைப்பாளர்', 'Coordinator', 'https://drive.google.com/file/d/1dCqGAJvp9tFAceKwSXmCAsTVYztBU_kd/view', 1),
  ('coordinators', 'Akalishan', 'ஒருங்கிணைப்பாளர்', 'Coordinator', 'https://drive.google.com/file/d/1sjbMKkwAcck-PPbSBCFpDNjj6VtPID5p/view', 2),
  ('coordinators', 'Donacia', 'ஒருங்கிணைப்பாளர்', 'Coordinator', 'https://drive.google.com/file/d/18qevtBPnT7RHbqUw2M_RwHsiD8ByWLeg/view', 3),
  ('coordinators', 'Kimathire', 'ஒருங்கிணைப்பாளர்', 'Coordinator', 'https://drive.google.com/file/d/1x-N5C6ls5w5JUCzik3q1q20PJiR_7_-8/view', 4),
  ('coordinators', 'Kokulakavi', 'ஒருங்கிணைப்பாளர்', 'Coordinator', 'https://drive.google.com/file/d/15v1BN_gIzXPSVQfDKZ5pe3_Ik2q_RJnc/view', 5),
  ('coordinators', 'Mahindhan', 'ஒருங்கிணைப்பாளர்', 'Coordinator', 'https://drive.google.com/file/d/16ljvK_BUlKSH4srsP_uOYJBezibWhXQs/view', 6),
  ('coordinators', 'Manoja', 'ஒருங்கிணைப்பாளர்', 'Coordinator', 'https://drive.google.com/file/d/1mQ7-3XzhpqoIvk3yF4lPhGhkL1pQcoZE/view', 7),
  ('coordinators', 'Najinthan', 'ஒருங்கிணைப்பாளர்', 'Coordinator', 'https://drive.google.com/file/d/1Ucaso7e8sCRDtzjMhppw1wvJ6W_89ViC/view', 8),
  ('coordinators', 'Paviththiran', 'ஒருங்கிணைப்பாளர்', 'Coordinator', 'https://drive.google.com/file/d/1SkYa8gG1F3Ub_LgVjvw-WIRH4UMzl7aT/view', 9),
  ('coordinators', 'Sajinthan', 'ஒருங்கிணைப்பாளர்', 'Coordinator', 'https://drive.google.com/file/d/1wTOEpVK0N2bk--bnQcMTz5n9PzXf5-kA/view', 10),
  ('coordinators', 'Satkunaraj', 'ஒருங்கிணைப்பாளர்', 'Coordinator', 'https://drive.google.com/file/d/1gpSH40ScSEgonTdwTIZbYiaU0UxJfccv/view', 11),
  ('coordinators', 'Sayanika', 'ஒருங்கிணைப்பாளர்', 'Coordinator', 'https://drive.google.com/file/d/1M9jeI2ddEg9kluOuQH3nMvveiFvnICVW/view', 12),
  ('coordinators', 'Vakeesan', 'ஒருங்கிணைப்பாளர்', 'Coordinator', 'https://drive.google.com/file/d/1-_mLXlju92wrw6x3mfP8zYhTM5zoAJ_X/view', 13)
) as v(group_id, name, role, role_en, photo_url, sort_order)
where not exists (select 1 from public.committee_members);

-- ---- Activity log -----------------------------------------------------------------------
-- Reordering isn't logged (same as books, wallpapers and questions).
create or replace function public.log_committee_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_admin_activity('committee_added', null, jsonb_build_object('name', new.name, 'role', new.role_en));
  elsif tg_op = 'DELETE' then
    perform public.log_admin_activity('committee_removed', null, jsonb_build_object('name', old.name, 'role', old.role_en));
  elsif old.is_visible is distinct from new.is_visible then
    perform public.log_admin_activity(
      case when new.is_visible then 'committee_shown' else 'committee_hidden' end,
      null,
      jsonb_build_object('name', new.name, 'role', new.role_en)
    );
  elsif (old.group_id, old.name, old.role, old.role_en, old.photo_url, old.photo_focus)
        is distinct from (new.group_id, new.name, new.role, new.role_en, new.photo_url, new.photo_focus) then
    perform public.log_admin_activity('committee_updated', null, jsonb_build_object('name', new.name, 'role', new.role_en));
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists committee_members_log on public.committee_members;
create trigger committee_members_log
  after insert or delete or update on public.committee_members
  for each row execute function public.log_committee_change();

create or replace function public.log_committee_settings_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if (old.year, old.intro) is distinct from (new.year, new.intro) then
    perform public.log_admin_activity('committee_settings', null, jsonb_build_object('year', new.year));
  end if;
  return new;
end;
$$;

drop trigger if exists committee_settings_log on public.committee_settings;
create trigger committee_settings_log
  after update on public.committee_settings
  for each row execute function public.log_committee_settings_change();
