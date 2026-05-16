# Paginación Server-Side en el Admin de Strides

## Resumen introductorio

### ¿Qué es esto?

Este documento explica el sistema de paginación que vive en el panel de administración de Strides. En lugar de traer todos los usuarios/códigos/feedback de la base de datos de un solo golpe (que con miles de registros colapsaría el servidor), pedimos solo los que necesitamos mostrar en pantalla en ese momento.

### Beneficios

| Beneficio | Por qué importa |
|---|---|
| **Velocidad** | Con 10,000 usuarios, traer todos tarda segundos. Traer 25 es instantáneo. |
| **Estado en la URL** | Si estás en la página 4 buscando "María" y recargas el navegador, sigues exactamente en la página 4 buscando "María". |
| **URL compartible** | Puedes copiar la URL y mandársela a otro admin — verá exactamente lo mismo. |
| **Botón "atrás" funciona** | El navegador guarda el historial de páginas porque cada cambio cambia la URL. |
| **Sin Redux ni estado global** | Next.js lo resuelve de forma nativa. Cero boilerplate. |
| **SEO-friendly** | Los bots pueden indexar páginas específicas si algún día fuera necesario. |

### Contras

| Contra | Por qué existe |
|---|---|
| **Cada cambio de página = nueva petición al servidor** | A diferencia de cargar todo en RAM y navegar localmente, cada página nueva hace un round-trip. En un admin interno esto no es problema. |
| **Ordenar por columnas requiere trabajo extra** | Si quisieras clicar en "Usuarios" para ordenar por nombre, tendrías que añadir un param `?sort=name` y modificar el RPC. No viene gratis. |
| **Filtros complejos se complican** | Filtros multi-campo (rango de fechas + estado + tipo) requieren más params en la URL y más lógica en el servidor. |

---

## La idea central (antes de ver código)

Imagina que tienes una biblioteca con 10,000 libros. Cuando alguien entra y pregunta por libros de ciencia ficción de los años 90, tienes dos opciones:

- **Opción A (mala)**: Traer todos los 10,000 libros a la sala, extenderlos en el suelo, y que el visitante busque él solo los que cumplan la condición.
- **Opción B (la que usamos)**: Ir al almacén tú mismo, buscar solo los que cumplen la condición, y traer solo los primeros 25. Si quiere más, vas por los siguientes 25.

La Opción B es lo que hacemos. El "almacén" es Supabase (base de datos), y el "bibliotecario" es el servidor de Next.js.

---

## Arquitectura general: cómo fluye una petición

```
Usuario hace clic en "Página 3" con búsqueda "María"
           │
           ▼
URL cambia: /admin/users?q=María&page=3
           │
           ▼
Next.js detecta el cambio de URL y re-ejecuta el Server Component
           │
           ▼
El Server Component lee: q="María", page=3
           │
           ▼
Calcula: offset = (3-1) × 25 = 50
           │
           ▼
Llama a Supabase: "Dame 25 usuarios cuyo email o nombre contenga 'María', saltando los primeros 50"
           │
           ▼
Supabase ejecuta el SQL y devuelve exactamente esos 25 registros + el total
           │
           ▼
El componente renderiza la tabla con esos 25 registros
           │
           ▼
El componente AdminPagination muestra: "← 1 2 [3] 4 5 → (de 340 resultados)"
```

Eso es todo. No hay estado en React (`useState`), no hay Redux, no hay efectos secundarios (`useEffect`). Solo URL → servidor → HTML.

---

## Parte 1: La URL como fuente de verdad

### ¿Qué significa "URL como estado"?

En la mayoría de apps antiguas, el estado vive en JavaScript:

```js
// Enfoque antiguo (❌ se pierde al recargar)
const [currentPage, setCurrentPage] = useState(1)
const [search, setSearch] = useState('')
```

Si recargas la página, `currentPage` vuelve a `1` y `search` vuelve a `''`. El usuario pierde su contexto.

En nuestro enfoque, el estado vive en la URL:

```
/admin/users?q=María&page=3
```

Cuando recargas esta URL, Next.js lee los params y reconstruye exactamente el mismo estado. La URL **es** el estado.

### ¿Cómo lee Next.js los params?

En Next.js 14, los Server Components reciben un prop llamado `searchParams` con todos los query params de la URL:

```tsx
// apps/web/src/app/admin/users/page.tsx

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string }
}) {
  // Si la URL es /admin/users?q=María&page=3, entonces:
  // searchParams.q    === "María"
  // searchParams.page === "3"

  const q    = searchParams.q?.trim() ?? ''      // "María" o "" si no hay q
  const page = Math.max(1, parseInt(searchParams.page ?? '1') || 1)
  //           ↑ siempre al menos 1, por si alguien pone ?page=abc
```

**Ejemplo mental**: Si entras a `/admin/users` (sin params):
- `searchParams.q` → `undefined` → `q = ''`
- `searchParams.page` → `undefined` → `page = 1`

Si entras a `/admin/users?q=María&page=3`:
- `searchParams.q` → `"María"` → `q = "María"`
- `searchParams.page` → `"3"` → `page = 3`

---

## Parte 2: El cálculo del offset

### ¿Qué es un offset?

Offset significa "saltarse N registros desde el principio". Es cómo le decimos a la base de datos dónde empezar.

Ejemplo con libros:
- Página 1: empieza desde el libro 0, dame 25 → libros 1-25
- Página 2: empieza desde el libro 25, dame 25 → libros 26-50
- Página 3: empieza desde el libro 50, dame 25 → libros 51-75

La fórmula es siempre la misma:

```
offset = (número_de_página - 1) × tamaño_de_página
```

En código:

```ts
const PAGE_SIZE = 25
const offset = (page - 1) * PAGE_SIZE

// Página 1: (1-1) × 25 = 0   → empieza desde el principio
// Página 2: (2-1) × 25 = 25  → salta 25
// Página 3: (3-1) × 25 = 50  → salta 50
// Página 10: (10-1) × 25 = 225 → salta 225
```

---

## Parte 3: Las funciones SQL (RPCs de Supabase)

### ¿Por qué no hacer la query directamente?

Podríamos escribir algo así en el servidor:

```ts
// ❌ Esto NO hacemos para users porque necesitamos datos de auth.users
// que es una tabla privada de Supabase
const { data } = await supabase
  .from('profiles')
  .select('*')
  .range(0, 24)
```

El problema es que la tabla `auth.users` (donde están los emails y fechas de registro) es privada — no se puede consultar directamente desde el cliente o desde queries normales. Solo se puede acceder a ella desde funciones SQL marcadas con `SECURITY DEFINER`.

Por eso creamos una función SQL en Supabase (llamada RPC — Remote Procedure Call):

### La función principal: `get_admin_users_overview`

```sql
-- supabase/migrations/20260516000000_paginate_admin_rpcs.sql

CREATE OR REPLACE FUNCTION public.get_admin_users_overview(
  p_search TEXT DEFAULT NULL,   -- término de búsqueda (o NULL si no hay)
  p_limit  INT  DEFAULT 25,     -- cuántos traer
  p_offset INT  DEFAULT 0       -- cuántos saltarse
)
RETURNS TABLE (
  id               UUID,
  email            TEXT,
  display_name     TEXT,
  joined_at        TIMESTAMPTZ,
  -- ... más columnas ...
  children_count   BIGINT,
  total_completions BIGINT
)
LANGUAGE sql
SECURITY DEFINER        -- ← esto le permite acceder a auth.users
SET search_path = public
AS $$
  SELECT
    u.id,
    u.email::TEXT,
    p.display_name::TEXT,
    p.created_at AS joined_at,
    -- ...
    COUNT(DISTINCT c.id)   AS children_count,
    COUNT(DISTINCT clc.id) AS total_completions
  FROM auth.users u                              -- ← tabla privada, accesible por SECURITY DEFINER
  JOIN profiles p       ON p.id = u.id
  LEFT JOIN subscriptions s ON s.user_id = u.id
  LEFT JOIN children c      ON c.parent_id = u.id
  LEFT JOIN child_lesson_completions clc ON clc.child_id = c.id
  WHERE p.role != 'admin'
    AND (
      p_search IS NULL                                    -- si no hay búsqueda, traer todos
      OR u.email        ILIKE '%' || p_search || '%'     -- email contiene el texto
      OR p.display_name ILIKE '%' || p_search || '%'     -- o el nombre contiene el texto
    )
  GROUP BY u.id, u.email, p.display_name, p.created_at, -- ...
  ORDER BY p.created_at DESC                             -- más nuevos primero
  LIMIT  p_limit                                         -- ← paginación: cuántos traer
  OFFSET p_offset;                                       -- ← paginación: desde dónde
$$;
```

**Ejemplo mental**: Si llamas a esta función con `p_search='María', p_limit=25, p_offset=50`:
1. Busca en `auth.users` + `profiles` a todos los que no son admins y cuyo email o nombre contiene "María"
2. Ordénalos del más nuevo al más antiguo
3. Sáltate los primeros 50
4. Devuelve los siguientes 25

### La función de conteo: `get_admin_users_count`

Para mostrar "340 usuarios encontrados" y calcular cuántas páginas hay en total, necesitamos saber el total **sin** aplicar limit/offset:

```sql
CREATE OR REPLACE FUNCTION public.get_admin_users_count(
  p_search TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM auth.users u
  JOIN profiles p ON p.id = u.id
  WHERE p.role != 'admin'
    AND (
      p_search IS NULL
      OR u.email        ILIKE '%' || p_search || '%'
      OR p.display_name ILIKE '%' || p_search || '%'
    );
$$;
```

Esta función devuelve un solo número: cuántos usuarios cumplen la condición. Eso nos permite calcular cuántas páginas hay en total:

```ts
const totalPages = Math.ceil(total / PAGE_SIZE)
// Si hay 340 usuarios y PAGE_SIZE=25: Math.ceil(340/25) = Math.ceil(13.6) = 14 páginas
```

### Llamando a las RPCs desde TypeScript

```ts
// apps/web/src/app/admin/users/page.tsx

const [
  { data: users },     // los 25 usuarios de esta página
  { data: totalRaw },  // el total (ej: 340)
] = await Promise.all([
  // Promise.all ejecuta AMBAS queries en paralelo (no una después de la otra)
  admin.rpc('get_admin_users_overview', {
    p_search: search ?? undefined,  // "María" o undefined
    p_limit:  PAGE_SIZE,            // 25
    p_offset: offset,               // 50 (si estamos en página 3)
  }),
  admin.rpc('get_admin_users_count', {
    p_search: search ?? undefined,
  }),
])

const total = (totalRaw as number) ?? 0  // 340
```

`Promise.all` es clave: en lugar de esperar que la primera query termine para empezar la segunda, las ejecuta al mismo tiempo. Si cada query tarda 100ms, con `Promise.all` tardamos ~100ms en total, no 200ms.

---

## Parte 4: Paginación en tablas sin RPC (Códigos y Feedback)

Para los códigos de acceso y el feedback, las tablas son públicas (no necesitan `SECURITY DEFINER`), así que usamos el cliente de Supabase directamente con `.range()`:

### Cómo funciona `.range()` en Supabase

```ts
// packages/db/src/queries/access_codes.ts

export function getAllAccessCodes(
  db: DB,
  opts: { search?: string; limit?: number; offset?: number } = {}
) {
  const { search, limit = 25, offset = 0 } = opts

  let query = db
    .from('access_codes')
    .select('id, code, label, access_type, max_uses, used_count, valid_until, is_active, created_at', {
      count: 'exact'   // ← pide el total además de los datos
    })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
    //     ↑           ↑
    //     desde       hasta (inclusive)
    // range(0, 24)  → filas 0 a 24 = 25 registros
    // range(25, 49) → filas 25 a 49 = 25 registros
    // range(50, 74) → filas 50 a 74 = 25 registros

  if (search) {
    query = query.or(`code.ilike.%${search}%,label.ilike.%${search}%`)
    //             ↑ OR: busca en "code" O en "label"
  }

  return query  // devuelve { data, count, error }
}
```

La respuesta tiene forma:
```ts
{
  data:  [/* los 25 registros */],
  count: 340,   // el total (gracias a count: 'exact')
  error: null
}
```

### ¿Por qué `.range(offset, offset + limit - 1)` y no `.range(offset, offset + limit)`?

Porque `.range()` en Supabase es **inclusivo en ambos extremos**. Si quieres 25 registros empezando en 0:
- Registro 0, 1, 2, ..., 24 → eso es 25 registros
- El último índice es `0 + 25 - 1 = 24`

Si pusieras `.range(0, 25)` traerías 26 registros (de 0 a 25 inclusive).

---

## Parte 5: El componente AdminSearch

El buscador necesita actualizar la URL cuando el usuario escribe, sin recargar la página completa.

```tsx
// apps/web/src/components/admin/AdminSearch.tsx (simplificado conceptualmente)
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'

export function AdminSearch({
  initialValue,
  placeholder,
  extraParams = {},  // ej: { tab: 'vocab' } para preservar el tab activo
}: {
  initialValue: string
  placeholder?: string
  extraParams?: Record<string, string>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Cuando el usuario escribe, actualizamos la URL
  const handleChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set('q', value)    // añade ?q=valor
    } else {
      params.delete('q')        // elimina ?q si el campo está vacío
    }
    params.delete('page')       // siempre vuelve a página 1 al buscar
    params.delete('page')

    // Preserva params extra (ej: tab activo)
    for (const [key, val] of Object.entries(extraParams)) {
      params.set(key, val)
    }

    router.replace(`?${params.toString()}`)
    // router.replace (no push) para no llenar el historial de búsquedas
  }, [router, searchParams, extraParams])

  // Usamos un debounce de 350ms para no hacer una petición por cada tecla
  // ...
}
```

### ¿Por qué `router.replace` y no `router.push`?

- `router.push`: añade una entrada al historial. Si buscas "M", "Ma", "Mar", "María" → son 4 entradas. Darle 4 veces atrás para salir de la búsqueda es malo.
- `router.replace`: reemplaza la entrada actual del historial. Solo hay una entrada por "estado de búsqueda activo".

### ¿Por qué debounce de 350ms?

Si el usuario escribe "María" (5 caracteres), sin debounce haríamos 5 peticiones al servidor: una por "M", otra por "Ma", otra por "Mar", etc. Con debounce de 350ms, esperamos a que el usuario pare de escribir antes de disparar la petición.

```
Usuario escribe: M → Ma → Mar → María
                 ↕    ↕    ↕     ↕
Sin debounce:   req  req  req   req  (4 peticiones al servidor)
Con debounce:               ⏳350ms → req  (1 sola petición)
```

---

## Parte 6: El componente AdminPagination

Este componente recibe números y genera los botones de navegación. Es puramente visual — no hace ninguna petición al servidor por sí mismo.

```tsx
// apps/web/src/components/admin/AdminPagination.tsx

interface Props {
  total:       number   // total de registros (ej: 340)
  pageSize:    number   // registros por página (ej: 25)
  currentPage: number   // página actual (ej: 3)
  extraParams?: Record<string, string>  // params extra a preservar en los links
}
```

### La lógica de páginas con puntos suspensivos

Si hay 20 páginas y estás en la página 10, no quieres ver:
```
← 1 2 3 4 5 6 7 8 9 [10] 11 12 13 14 15 16 17 18 19 20 →
```
Quieres ver algo compacto:
```
← 1 ... 8 9 [10] 11 12 ... 20 →
```

Esto lo hace la función `getPageRange`:

```ts
function getPageRange(current: number, total: number): (number | '...')[] {
  // Si hay 7 páginas o menos, muéstralas todas sin puntos
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const delta = 2  // mostrar 2 páginas a cada lado de la actual
  const left  = current - delta  // ej: si current=10, left=8
  const right = current + delta  // ej: si current=10, right=12

  const pages: (number | '...')[] = []
  let prev: number | null = null

  for (let i = 1; i <= total; i++) {
    // Incluir esta página si:
    // - es la primera (i === 1)
    // - es la última (i === total)
    // - está cerca de la actual (left <= i <= right)
    if (i === 1 || i === total || (i >= left && i <= right)) {
      // Si hay un salto desde la página anterior, añadir "..."
      if (prev !== null && i - prev > 1) {
        pages.push('...')
      }
      pages.push(i)
      prev = i
    }
  }

  return pages
}
```

**Ejemplo paso a paso** con `current=10, total=20`:
```
i=1:  incluir (es la primera) → pages=[1], prev=1
i=2:  no incluir (no está entre 8-12, no es primera/última)
...
i=7:  no incluir
i=8:  incluir (8 >= left=8) → hay salto (8-1=7 > 1) → pages=[1, '...', 8], prev=8
i=9:  incluir (9 >= left=8) → no hay salto (9-8=1) → pages=[1, '...', 8, 9]
i=10: incluir (current=10) → pages=[1, '...', 8, 9, 10]
i=11: incluir (11 <= right=12) → pages=[1, '...', 8, 9, 10, 11]
i=12: incluir (12 <= right=12) → pages=[1, '...', 8, 9, 10, 11, 12]
i=13: no incluir
...
i=19: no incluir
i=20: incluir (es la última) → hay salto (20-12=8 > 1) → pages=[1, '...', 8, 9, 10, 11, 12, '...', 20]

Resultado: [1, '...', 8, 9, 10, 11, 12, '...', 20]
```

### Cómo genera los links

Cada número de página es un `<Link>` de Next.js que genera una URL con el param `page` actualizado:

```tsx
function buildUrl(p: number, extraParams: Record<string, string>, searchValue?: string): string {
  const params = new URLSearchParams()
  if (searchValue) params.set('q', searchValue)
  // preservar cualquier param extra (ej: tab activo)
  for (const [k, v] of Object.entries(extraParams)) params.set(k, v)
  if (p > 1) params.set('page', String(p))
  // Nota: no ponemos page=1 en la URL, /users?q=María es más limpio que /users?q=María&page=1
  const qs = params.toString()
  return qs ? `?${qs}` : '?'
}
```

Ejemplo: si estás en la página 3 buscando "María" y clicas en la página 5:
```
Link generado: ?q=María&page=5
```
Next.js navega a esa URL → el Server Component se re-ejecuta con `searchParams.page = '5'` → calcula `offset = 100` → trae los registros 101-125 que contengan "María".

---

## Parte 7: La búsqueda en dos pasos (Feedback)

Para el feedback hay un caso especial: queremos buscar por el email o nombre del usuario que envió el feedback, pero esa información está en la tabla `profiles`, no en la tabla `feedback`.

PostgREST (la API de Supabase) no permite filtrar directamente por columnas de tablas unidas. Es decir, esto **no funciona**:

```ts
// ❌ Esto NO funciona en PostgREST
query.ilike('profiles.email', '%María%')
```

La solución es hacer la búsqueda en dos pasos:

```ts
// apps/web/src/app/admin/feedback/page.tsx

// Paso 1: Buscar qué usuarios coinciden con el término
let userIds: string[] | null = null
if (q) {
  const { data: profiles } = await admin
    .from('profiles')
    .select('id')
    .or(`email.ilike.%${q}%,display_name.ilike.%${q}%`)
  //  ↑ OR: email contiene q, O nombre contiene q

  userIds = (profiles ?? []).map(p => p.id)
  // Resultado: ['uuid-1', 'uuid-2', 'uuid-3']
}

// Paso 2: Buscar feedback cuyo mensaje contenga q, O cuyo autor esté en la lista
if (q) {
  if (userIds && userIds.length > 0) {
    query = query.or(
      `message.ilike.%${q}%,user_id.in.(${userIds.join(',')})`
      //                    ↑ sintaxis de PostgREST para IN
    )
  } else {
    // Si no encontramos usuarios con ese nombre/email,
    // solo buscamos en el mensaje
    query = query.ilike('message', `%${q}%`)
  }
}
```

**Ejemplo mental**: Si buscas "María":
1. Supabase busca en `profiles`: encuentra los usuarios con email/nombre "María" → IDs: `['abc', 'def']`
2. Supabase busca en `feedback`: registros cuyo `message` contiene "María" **O** cuyo `user_id` está en `['abc', 'def']`
3. Resultado: verás feedback de María Y feedback de cualquier usuario que haya mencionado "María" en su mensaje.

---

## Parte 8: Los tipos generados de Supabase

Supabase puede generar tipos TypeScript automáticamente desde el schema de la base de datos. Cuando creamos nuevas RPCs, necesitamos añadir sus tipos manualmente (o regenerar los tipos) en `packages/db/src/types.generated.ts`:

```ts
// packages/db/src/types.generated.ts (extracto)

export type Database = {
  public: {
    Functions: {
      get_admin_users_overview: {
        Args: {
          p_search?: string   // opcional (puede no pasarse)
          p_limit?:  number
          p_offset?: number
        }
        Returns: {
          id:               string
          email:            string
          display_name:     string | null
          joined_at:        string
          // ...
        }[]
      }
      get_admin_users_count: {
        Args: {
          p_search?: string
        }
        Returns: number  // un solo número
      }
    }
  }
}
```

Sin estos tipos, TypeScript no sabría que `admin.rpc('get_admin_users_overview', { p_limit: 25 })` es válido, ni qué forma tienen los datos que devuelve.

---

## Parte 9: Flujo completo de punta a punta

Vamos a trazar el viaje completo de un clic en "Página 3" con búsqueda "María":

```
1. USUARIO
   El admin está en /admin/users?q=María&page=2
   Clica en el botón "3" de AdminPagination

2. NAVEGADOR
   AdminPagination generó un <Link href="?q=María&page=3">
   Next.js intercepta la navegación (no recarga el navegador)
   La URL cambia a /admin/users?q=María&page=3

3. NEXT.JS (SERVIDOR)
   Detecta que la URL cambió
   Re-ejecuta el Server Component AdminUsersPage
   Lee: searchParams = { q: "María", page: "3" }

4. SERVER COMPONENT
   const q      = "María"
   const page   = 3
   const offset = (3-1) × 25 = 50

5. SUPABASE (BASE DE DATOS)
   Recibe dos queries en paralelo (Promise.all):

   Query 1 - get_admin_users_overview:
   → Busca usuarios donde email ILIKE '%María%' OR display_name ILIKE '%María%'
   → Ordena por created_at DESC
   → OFFSET 50 (salta los primeros 50)
   → LIMIT 25 (devuelve máximo 25)
   → Resultado: [{ id: '...', email: 'maria@...', ... }, ...]

   Query 2 - get_admin_users_count:
   → Cuenta usuarios donde email ILIKE '%María%' OR display_name ILIKE '%María%'
   → Resultado: 87 (hay 87 usuarios que coinciden con "María")

6. SERVER COMPONENT (continúa)
   users = [/* 25 registros */]
   total = 87

   Calcula: totalPages = Math.ceil(87/25) = 4 páginas

7. RENDERIZADO
   Pasa los datos al componente UsersTableClient:
   <UsersTableClient
     users={users}          // los 25 registros
     total={87}             // para AdminPagination
     currentPage={3}        // para resaltar el botón "3"
     searchValue="María"    // para el AdminSearch y los links
     pageSize={25}
   />

8. CLIENTE (NAVEGADOR)
   Next.js actualiza solo el HTML que cambió (sin recargar la página)
   El usuario ve:
   - Los 25 usuarios de la página 3 que coinciden con "María"
   - AdminSearch muestra "María" en el campo de texto
   - AdminPagination muestra: "← 1 2 [3] 4 → | Mostrando 51-75 de 87"
```

---

## Resumen visual de los archivos

```
apps/web/src/app/admin/
│
├── users/
│   ├── page.tsx              ← Server Component: lee URL, llama a Supabase, pasa datos
│   └── UsersTableClient.tsx  ← Client Component: tabla HTML + AdminSearch + AdminPagination
│
├── codes/
│   ├── page.tsx              ← Server Component: lee URL, llama a getAllAccessCodes
│   └── CodesTableClient.tsx  ← Client Component: tabla HTML + AdminSearch + AdminPagination
│
└── feedback/
    ├── page.tsx              ← Server Component: búsqueda en 2 pasos + paginación
    └── FeedbackTableClient.tsx ← Client Component: tabla HTML + AdminSearch + AdminPagination

apps/web/src/components/admin/
├── AdminSearch.tsx           ← Input con debounce que actualiza la URL
└── AdminPagination.tsx       ← Botones de página que generan Links a la URL

packages/db/src/queries/
└── access_codes.ts           ← getAllAccessCodes con soporte de limit/offset/search

supabase/migrations/
└── 20260516000000_paginate_admin_rpcs.sql  ← get_admin_users_overview + get_admin_users_count
```

---

## Reglas para extender este sistema

Si necesitas añadir paginación a una nueva tabla en el admin, el checklist es:

**Si la tabla es pública (sin `auth.users`):**
1. Añade `limit`, `offset`, `search` a la query en `packages/db/src/queries/`
2. Usa `.range(offset, offset + limit - 1)` y `{ count: 'exact' }`
3. El Server Component lee `searchParams.q` y `searchParams.page`, calcula `offset`
4. Pasa `total`, `currentPage`, `searchValue`, `pageSize` al Client Component
5. El Client Component renderiza `<AdminSearch>` y `<AdminPagination>`

**Si la tabla necesita acceder a `auth.users`:**
1. Crea una función SQL con `SECURITY DEFINER` que acepte `p_search`, `p_limit`, `p_offset`
2. Crea una función de conteo companion con `p_search`
3. Añade los tipos en `packages/db/src/types.generated.ts`
4. Sigue los mismos pasos 3-5 de arriba

**Nunca:**
- Traer todos los registros y filtrar/paginar en JavaScript del servidor
- Guardar la página actual en `useState` (se pierde al recargar)
- Hacer polling o `useEffect` para refetch cuando cambia la página
