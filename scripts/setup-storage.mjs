/**
 * Setup inicial de Supabase Storage.
 * Crea el bucket `media` y sube las imágenes de lesson-cards.
 *
 * Prerequisito: añadir a apps/web/.env.local:
 *   SUPABASE_SERVICE_ROLE_KEY=<tu service role key>
 *   (Supabase Dashboard → Project Settings → API → service_role)
 *
 * Uso:
 *   node scripts/setup-storage.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Lee .env.local manualmente (sin depender de dotenv)
const envPath = new URL('../apps/web/.env.local', import.meta.url)
const envContent = readFileSync(fileURLToPath(envPath), 'utf8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
    .map(([k, ...v]) => [k, v.join('=')])
)

const SUPABASE_URL      = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_ROLE_KEY  = env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Falta SUPABASE_SERVICE_ROLE_KEY en apps/web/.env.local')
  console.error('   Encuéntrala en: Supabase Dashboard → Project Settings → API → service_role')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const BUCKET = 'lesson-cards'
const __dir  = dirname(fileURLToPath(import.meta.url))

// Carpetas a subir: { localPath, storageFolder }
const UPLOADS = [
  {
    localPath:     join(__dir, '../apps/web/public/lesson-cards'),
    storageFolder: '',
  },
]

async function main() {
  // 1. Crear bucket si no existe
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some(b => b.name === BUCKET)

  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) { console.error('❌  Error creando bucket:', error.message); process.exit(1) }
    console.log(`✅  Bucket "${BUCKET}" creado`)
  } else {
    console.log(`ℹ️   Bucket "${BUCKET}" ya existe`)
  }

  // 2. Subir archivos
  for (const { localPath, storageFolder } of UPLOADS) {
    const files = readdirSync(localPath).filter(f => ['.png','.jpg','.webp'].includes(extname(f)))

    for (const file of files) {
      const filePath    = join(localPath, file)
      const storagePath = storageFolder ? `${storageFolder}/${file}` : file
      const buffer      = readFileSync(filePath)
      const mimeType    = file.endsWith('.png') ? 'image/png'
                        : file.endsWith('.webp') ? 'image/webp'
                        : 'image/jpeg'

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: mimeType, upsert: true })

      if (error) {
        console.error(`❌  ${storagePath}: ${error.message}`)
      } else {
        console.log(`✅  ${storagePath}`)
      }
    }
  }

  // 3. Mostrar SQL para actualizar cover_url
  console.log('\n── SQL para actualizar cover_url en lessons ──────────────────')
  const base = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}`
  console.log(`
update lessons set cover_url = '${base}/granja.png'   where slug = 'animales-granja';
update lessons set cover_url = '${base}/mascotas.png' where slug = 'mascotas';
update lessons set cover_url = '${base}/mar.png'      where slug = 'animales-mar';
update lessons set cover_url = '${base}/insectos.png' where slug = '<slug-de-insectos>';
  `.trim())
  console.log('─────────────────────────────────────────────────────────────')
  console.log('Pega ese SQL en Supabase Dashboard → SQL Editor y ejecútalo.')
}

main().catch(e => { console.error(e); process.exit(1) })
