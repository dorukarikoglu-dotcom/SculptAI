-- SculptAI Veritabanı Kurulumu
-- Bu kodu Supabase > SQL Editor'a yapıştırıp "Run" tıkla

-- 1. Doktorlar tablosu
create table doctors (
  id text primary key,           -- örn: "dr-ahmet"
  name text not null,            -- örn: "Dr. Ahmet Yılmaz"
  username text unique not null, -- giriş kullanıcı adı
  password_hash text not null,   -- şifre (düz metin, sonra hash'lenebilir)
  created_at timestamptz default now()
);

-- 2. Hasta kayıtları tablosu
create table patients (
  id text primary key,
  doctor_id text references doctors(id),
  date text not null,
  risk_score integer,
  segment text,
  segment_en text,
  color text,
  icon text,
  badge text,
  action text,
  mot_risk integer,
  exp_risk integer,
  comp_score integer,
  ai_text text default '',
  ai_loading boolean default true,
  answers jsonb,
  created_at timestamptz default now()
);

-- 3. Güvenlik: Herkes okuyabilsin/yazabilsin (basit versiyon)
alter table doctors enable row level security;
alter table patients enable row level security;

create policy "doctors_public" on doctors for select using (true);
create policy "patients_insert" on patients for insert with check (true);
create policy "patients_select" on patients for select using (true);
create policy "patients_delete" on patients for delete using (true);
create policy "patients_update" on patients for update using (true);

-- 4. Örnek doktorlar (sonra değiştirebilirsin)
insert into doctors (id, name, username, password_hash) values
  ('dr-ahmet', 'Dr. Ahmet Yılmaz', 'ahmet', 'sculpt2024'),
  ('dr-ayse',  'Dr. Ayşe Kaya',    'ayse',  'sculpt2024'),
  ('dr-mehmet','Dr. Mehmet Demir', 'mehmet','sculpt2024');

-- Tamamdır! Çalıştırdıktan sonra Claude'a "hazır" de.
