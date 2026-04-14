import fs from 'node:fs';
import postgres from 'postgres';

function readDatabaseUrl() {
  const env = fs.readFileSync('.env', 'utf8');
  const line = env.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL='));
  if (!line) throw new Error('DATABASE_URL not found in .env');
  return line.slice('DATABASE_URL='.length).replace(/^"|"$/g, '');
}

const sql = postgres(readDatabaseUrl(), { ssl: 'require', max: 1 });

try {
  const columns = await sql`
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('home_content','about_content','services_content','gallery_content','contact_content')
    order by table_name, ordinal_position
  `;

  for (const row of columns) {
    console.log(`${row.table_name}.${row.column_name}`);
  }
} finally {
  await sql.end({ timeout: 5 });
}
