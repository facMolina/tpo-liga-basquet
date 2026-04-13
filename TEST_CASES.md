# Casos de Prueba — API Liga Basquet

Base URL: `http://localhost:3000/api`

---

## AUTH — POST /api/auth/login

### Casos felices
| # | Body | Esperado |
|---|------|----------|
| A1 | `{"usuario":"admin","password":"adminpassword"}` | 200 + token JWT |

### Validación de esquema (Zod)
| # | Body | Esperado |
|---|------|----------|
| A2 | `{}` | 400 — ambos campos requeridos |
| A3 | `{"usuario":"","password":"adminpassword"}` | 400 — usuario min(1) |
| A4 | `{"usuario":"admin","password":""}` | 400 — password min(1) |
| A5 | `{"usuario":"admin"}` | 400 — falta password |
| A6 | `{"password":"adminpassword"}` | 400 — falta usuario |

### Credenciales inválidas
| # | Body | Esperado |
|---|------|----------|
| A7 | `{"usuario":"noexiste","password":"x"}` | 401 — misma respuesta que contraseña mal (no revelar si usuario existe) |
| A8 | `{"usuario":"admin","password":"mal"}` | 401 |

### Ataques
| # | Descripción | Esperado |
|---|-------------|----------|
| A9 | Body con campo extra `"rol":"superadmin"` | 200 o 400; campo extra ignorado — Zod no debe permitir elevación |
| A10 | `{"usuario":{"$ne":""},"password":{"$ne":""}}` (NoSQL injection intento) | 400 — Zod rechaza no-string |
| A11 | Password con 10.000 caracteres | No debe colgar el server (bcrypt timing attack mitigation) |
| A12 | 50 requests en < 1 segundo (brute force) | No hay rate limiting → **vulnerabilidad documentada** |
| A13 | Content-Type omitido, body como form-urlencoded | 400 o 401 — sin JSON parser no llega data |

---

## MIDDLEWARE — authenticateJWT

### Casos sobre cualquier ruta protegida (ej. POST /api/equipos)
| # | Header Authorization | Esperado |
|---|----------------------|----------|
| M1 | Ausente | 401 "Autenticación requerida" |
| M2 | `Bearer ` (token vacío) | 403 o 401 |
| M3 | `Token abc123` (esquema incorrecto) | 401 "Formato inválido" |
| M4 | `Bearer abc123` (JWT inválido) | 403 "Token inválido o expirado" |
| M5 | `Bearer <token válido>` | pasa al controller |
| M6 | `Bearer <token expirado>` (esperar 12h o firmar con `expiresIn:'-1s'`) | 403 |
| M7 | `Bearer <token firmado con otro secret>` | 403 |
| M8 | `bearer <token válido>` (minúscula) | 401 — `parts[0] !== 'Bearer'` |
| M9 | `Bearer token1 token2` (3 partes) | 401 — `parts.length !== 2` |
| M10 | JWT con payload adulterado (cambiar `idUsuario` en base64 sin re-firmar) | 403 — firma inválida |

---

## LIGAS — GET /api/ligas / GET /api/ligas/:id / PUT /api/ligas/:id

### GET /api/ligas
| # | Descripción | Esperado |
|---|-------------|----------|
| L1 | Request normal sin auth | 200 — array (puede ser vacío) |

### GET /api/ligas/:id
| # | :id | Esperado |
|---|-----|----------|
| L2 | ID existente | 200 + objeto liga |
| L3 | ID inexistente (ej. 99999) | 404 |
| L4 | `abc` (no numérico) | 404 o 500 — Sequelize recibe NaN |
| L5 | `0` | 404 |
| L6 | `-1` | 404 |
| L7 | `1.5` | **sin validación de entero** — puede crashear o devolver 404 |
| L8 | `1; DROP TABLE ligas--` (SQL injection en path) | Sequelize usa prepared statements → 404 o 500, no injection |

### PUT /api/ligas/:id (requiere auth)
| # | Body | Esperado |
|---|------|----------|
| L9 | `{"nombre":"Liga X","temporada":"2025"}` | 200 |
| L10 | `{}` | 400 — nombre y temporada requeridos |
| L11 | `{"nombre":"","temporada":"2025"}` | 400 — nombre min(1) |
| L12 | `{"nombre":"Liga X","temporada":"2025","descripcion":null}` | 200 — descripcion nullable |
| L13 | `{"nombre":"Liga X","temporada":"2025","descripcion":"texto"}` | 200 |
| L14 | PUT /api/ligas/99999 con body válido | 404 |
| L15 | Body con campo extra `"idLiga":999` | Ignorado por Zod → no hay mass assignment |

---

## EQUIPOS — CRUD /api/equipos

### GET /api/equipos
| # | Descripción | Esperado |
|---|-------------|----------|
| E1 | Sin auth | 200 — array |

### GET /api/equipos/:id
| # | :id | Esperado |
|---|-----|----------|
| E2 | ID existente | 200 + equipo con jugadores y partidos |
| E3 | ID inexistente | 404 |
| E4 | `abc` | 404 o 500 |
| E5 | `0`, `-1` | 404 |

### POST /api/equipos (requiere auth)
| # | Body | Esperado |
|---|------|----------|
| E6 | `{"nombre":"Boca","entrenador":"Juan"}` | 201 + equipo creado |
| E7 | `{}` | 400 |
| E8 | `{"nombre":"","entrenador":"Juan"}` | 400 |
| E9 | `{"nombre":"Boca","entrenador":""}` | 400 |
| E10 | `{"nombre":"Boca"}` | 400 — falta entrenador |
| E11 | `{"nombre":"A","entrenador":"B","partidosGanados":999}` | **Bug potencial**: campo ignorado por createSchema (solo nombre+entrenador), pero stats quedan en 0 — verificar que no se pase a Equipo.create |
| E12 | Nombre con 255 caracteres | 201 — sin límite en Zod (STRING en Sequelize trunca o lanza error DB) |
| E13 | Nombre con 256+ caracteres | Depende de config MySQL — puede ser 500 sin manejo explícito |
| E14 | `{"nombre":"<script>alert(1)</script>","entrenador":"x"}` | 201 — almacena literal; XSS es responsabilidad del cliente |
| E15 | Crear equipo duplicado (mismo nombre) | 201 — no hay unique constraint → **duplicados permitidos** |

### PUT /api/equipos/:id (requiere auth)
| # | Body | Esperado |
|---|------|----------|
| E16 | `{"nombre":"Nuevo"}` | 200 — actualización parcial |
| E17 | `{"partidosGanados":-1}` | 400 — min(0) en Zod |
| E18 | `{"partidosGanados":1.5}` | 400 — debe ser int |
| E19 | `{"partidosGanados":"abc"}` | 400 — debe ser number |
| E20 | `{}` | 200 — updateSchema todo opcional, no cambia nada |
| E21 | `{"nombre":""}` | 400 — min(1) aunque sea optional |
| E22 | PUT /api/equipos/99999 | 404 |
| E23 | `{"idEquipo":999}` en body | Campo extra ignorado — no hay mass assignment |

### DELETE /api/equipos/:id (requiere auth)
| # | Descripción | Esperado |
|---|-------------|----------|
| E24 | ID existente | 200 + jugadores del equipo quedan con idEquipo=null |
| E25 | ID inexistente | 404 |
| E26 | Equipo con jugadores asignados | 200 — ON DELETE SET NULL, jugadores persisten |
| E27 | Equipo con partidos registrados | **409** `{"error":"No se puede eliminar el equipo: tiene N partido(s) asociado(s). Eliminá los partidos primero."}` |

---

## JUGADORES — CRUD /api/jugadores

### GET /api/jugadores
| # | Descripción | Esperado |
|---|-------------|----------|
| J1 | Sin auth | 200 — array con equipo embebido |

### GET /api/jugadores/:id
| # | :id | Esperado |
|---|-----|----------|
| J2 | ID existente | 200 + equipo embebido |
| J3 | ID inexistente | 404 |
| J4 | `abc`, `0`, `-1` | 404 |

### POST /api/jugadores (requiere auth)
| # | Body | Esperado |
|---|------|----------|
| J5 | `{"nombre":"Juan","apellido":"Perez","categoria":"U20"}` | 201 — sin equipo (idEquipo null) |
| J6 | `{"nombre":"Juan","apellido":"Perez","categoria":"U20","idEquipo":1}` (equipo existe) | 201 |
| J7 | `{"nombre":"Juan","apellido":"Perez","categoria":"U20","idEquipo":99999}` | 400 "equipo no existe" |
| J8 | `{"nombre":"Juan","apellido":"Perez","categoria":"U20","idEquipo":null}` | 201 — null explícito permitido |
| J9 | `{}` | 400 |
| J10 | `{"nombre":"","apellido":"Perez","categoria":"U20"}` | 400 |
| J11 | `{"nombre":"Juan","apellido":"Perez","categoria":"U20","idEquipo":"abc"}` | 400 — idEquipo debe ser int |
| J12 | `{"nombre":"Juan","apellido":"Perez","categoria":"U20","idEquipo":1.5}` | 400 — debe ser int |
| J13 | `{"nombre":"Juan","apellido":"Perez","categoria":"U20","idEquipo":0}` | **Bug potencial**: Sequelize buscará id=0, equipo no existe → 400; pero 0 no es ID válido |

### PUT /api/jugadores/:id (requiere auth)
| # | Body | Esperado |
|---|------|----------|
| J14 | `{"idEquipo":1}` (equipo existe) | 200 — reasignación de equipo |
| J15 | `{"idEquipo":99999}` | 400 "equipo no existe" |
| J16 | `{"idEquipo":null}` | 200 — desasignar equipo |
| J17 | `{}` | 200 — sin cambios |
| J18 | `{"nombre":""}` | 400 — min(1) aunque optional |
| J19 | PUT /api/jugadores/99999 | 404 |

### DELETE /api/jugadores/:id (requiere auth)
| # | Descripción | Esperado |
|---|-------------|----------|
| J20 | ID existente | 200 |
| J21 | ID inexistente | 404 |

---

## PARTIDOS — CRUD /api/partidos

### GET /api/partidos
| # | Descripción | Esperado |
|---|-------------|----------|
| P1 | Sin auth | 200 — array con equipoLocal y equipoVisitante embebidos |

### GET /api/partidos/:id
| # | :id | Esperado |
|---|-----|----------|
| P2 | ID existente | 200 + partido con equipoLocal y equipoVisitante |
| P3 | ID inexistente (ej. 99999) | 404 |
| P4 | `abc` (no numérico) | 404 o 500 |
| P5 | `0`, `-1` | 404 |

### POST /api/partidos (requiere auth)
| # | Body | Esperado |
|---|------|----------|
| P6 | `{"fecha":"2026-05-01","hora":"18:00","lugar":"Estadio X","idLocal":1,"idVisitante":2}` | 201 + partido con equipos |
| P7 | `idLocal == idVisitante` | 400 "no puede jugar contra sí mismo" |
| P8 | `idLocal` inexistente | 400 "equipo local no existe" |
| P9 | `idVisitante` inexistente | 400 "equipo visitante no existe" |
| P10 | `{}` (campos faltantes) | 400 Zod |
| P11 | `{"fecha":"01/05/2026",...}` (formato incorrecto) | 400 Zod — regex YYYY-MM-DD |
| P12 | `{"hora":"6pm",...}` (formato incorrecto) | 400 Zod — regex HH:MM |
| P13 | Sin auth | 401 |

### PUT /api/partidos/:id (requiere auth)
| # | Condición | Body | Esperado |
|---|-----------|------|----------|
| P14 | Partido sin resultado | `{"lugar":"Nuevo Estadio"}` | 200 |
| P15 | Partido con resultado cargado | cualquier campo | 400 "con resultado cargado" |
| P16 | ID inexistente | cualquier body | 404 |
| P17 | Cambiar idLocal a equipo inexistente | `{"idLocal":99999}` | 400 |
| P18 | Cambiar idLocal == idVisitante actual | `{"idLocal": <mismo id que visitante>}` | 400 |

### DELETE /api/partidos/:id (requiere auth)
| # | Descripción | Esperado |
|---|-------------|----------|
| P19 | Partido sin resultado | 200 |
| P20 | Partido con resultado cargado | 400 "con resultado cargado" |
| P21 | ID inexistente | 404 |

---

## RESULTADO — POST /api/partidos/:id/resultado

| # | Condición | Body | Esperado |
|---|-----------|------|----------|
| R1 | Local gana | `{"puntosLocal":85,"puntosVisitante":70}` | 200 — local: PG+1, PF+85, PC+70 / visitante: PP+1, PF+70, PC+85 |
| R2 | Visitante gana | `{"puntosLocal":60,"puntosVisitante":75}` | 200 — local: PP+1, PF+60, PC+75 / visitante: PG+1, PF+75, PC+60 |
| R3 | Empate | `{"puntosLocal":80,"puntosVisitante":80}` | 200 — ambos equipos: PE+1, PF+80, PC+80 |
| R4 | Resultado ya cargado | cualquier body | 400 "El resultado de este partido ya fue cargado" |
| R5 | Partido inexistente | cualquier body | 404 |
| R6 | Sin auth | cualquier body | 401 |
| R7 | Puntaje negativo | `{"puntosLocal":-1,"puntosVisitante":70}` | 400 Zod |
| R8 | Puntaje no entero | `{"puntosLocal":1.5,"puntosVisitante":70}` | 400 Zod |
| R9 | Verificar transacción: si falla a mitad, stats no deben quedar a medias | — | Atomicidad garantizada |

---

## CLASIFICACIÓN — GET /api/clasificacion

| # | Descripción | Esperado |
|---|-------------|----------|
| C1 | Sin auth | 200 (endpoint público) |
| C2 | Con equipos sin partidos | 200 — todos con 0 puntos, 0 PJ, diferencia 0 |
| C3 | Campos de respuesta | `posicion`, `idEquipo`, `nombre`, `puntos`, `PJ`, `PG`, `PE`, `PP`, `tantosFavor`, `tantosEnContra`, `diferencia` |
| C4 | Orden por puntos | Equipo con más puntos primero |
| C5 | Desempate: mismos puntos → mayor diferencia primero | ej. A: 3pts +10dif, B: 3pts +5dif → A primero |
| C6 | Desempate secundario: mismos puntos y diferencia → mayor tantosFavor primero | ej. A: 3pts +5dif 85PF, B: 3pts +5dif 80PF → A primero |
| C7 | Sin equipos | 200 `[]` |
| C8 | Fórmula correcta | PG*3 + PE*1; ganado:3pts, empatado:1pt, perdido:0pts |

---

## CASOS TRANSVERSALES / SEGURIDAD

| # | Descripción | Esperado |
|---|-------------|----------|
| X1 | `GET /api/rutainexistente` | 404 de Express (sin handler definido) |
| X2 | `POST /api/ligas` (ruta que no existe) | 404 |
| X3 | `DELETE /api/ligas/:id` (no definido) | 404 |
| X4 | Content-Type `text/plain` con JSON en body en ruta POST | 400 — `express.json()` no parsea, body undefined → Zod falla |
| X5 | Body con `__proto__` o `constructor` (prototype pollution) | `{"__proto__":{"admin":true}}` — Zod debería ignorarlo; verificar que no altere Object.prototype |
| X6 | ID con valor máximo de entero: `2147483647` | 404 sin error |
| X7 | ID con valor mayor al máximo: `2147483648` | Puede ser 500 (INT overflow en MySQL) |
| X8 | Request sin Content-Type en POST | 400 — sin body parseado |
| X9 | Array en body en lugar de objeto: `[{"nombre":"x"}]` | 400 — Zod espera objeto |
| X10 | `null` como body completo | 400 |
| X11 | Token JWT con `alg: "none"` (none attack) | jsonwebtoken >= 9 rechaza esto → 403 |
| X12 | Acceder a PUT /api/equipos/:id sin token pero con `Authorization: Bearer` (sin token) | 401 — parts[1] es undefined, jwt.verify falla |

---

## VULNERABILIDADES IDENTIFICADAS (sin fix aún)

| # | Descripción | Riesgo |
|---|-------------|--------|
| V1 | Sin rate limiting en `/api/auth/login` | Brute force de contraseñas |
| V2 | Nombres de equipo/jugador sin unique constraint | Duplicados silenciosos |
| V3 | IDs no validados como enteros en params (`:id`) | Input inesperado puede llegar a Sequelize |
| V4 | Sin límite de tamaño en campos STRING (nombre, entrenador, etc.) | Payloads grandes → error de DB sin 400 claro |
| V5 | ~~Eliminar equipo con partidos rompe FK~~ | **CORREGIDO**: devuelve 409 con mensaje claro |
| V6 | CORS abierto (`cors()` sin origin whitelist) | Cualquier dominio puede consumir la API |
