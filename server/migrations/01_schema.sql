create extension if not exists "uuid-ossp";

create table if not exists person (
  id uuid primary key default uuid_generate_v4(),
  external_id text unique,
  first_name text not null default '',
  last_name  text not null default '',
  birthday   text not null default '',
  avatar     text not null default '',
  gender     text check (gender in ('M','F','O','')) not null default ''
);

create table if not exists parent_child (
  parent_id uuid not null references person(id) on delete cascade,
  child_id  uuid not null references person(id) on delete cascade,
  primary key (parent_id, child_id)
);

create table if not exists spouses (
  a uuid not null references person(id) on delete cascade,
  b uuid not null references person(id) on delete cascade,
  check (a <> b),
  primary key (a, b)
);

create index if not exists idx_parent_child_child on parent_child(child_id);
create index if not exists idx_person_external_id on person(external_id);
