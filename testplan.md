# Plan de Pruebas — API Liga de Básquet

Base URL: `http://localhost:3000/api`

## Pre-condiciones

1. MySQL corriendo con DB `liga_basquet` creada
2. `cd server && npm run seed` ejecutado (crea admin + liga)
3. `cd server && npm run dev` — servidor corriendo en `localhost:3000`
4. Postman instalado (extensión VS Code)
5. Token JWT válido guardado como variable de entorno `{{token}}` en Postman

**Obtener token:**
```
POST http://localhost:3000/api/auth/login
Body: {"usuario":"admin","password":"adminpassword"}
→ copiar valor de "token" y setear como variable {{token}} en el entorno de Postman
```

---

## 1. Health Check

| ID | Método | URL | Esperado |
|----|--------|-----|----------|
| H1 | GET | `/api/health` | 200 `{"status":"OK","message":"Backend funcionando correctamente"}` |

---

## 2. Autenticación — POST /api/auth/login

### Casos felices
| ID | Body | Esperado |
|----|------|----------|
| A1 | `{"usuario":"admin","password":"adminpassword"}` | 200 + token JWT |

### Validación de esquema (Zod)
| ID | Body | Esperado |
|----|------|----------|
| A2 | `{}` | 400 — ambos campos requeridos |
| A3 | `{"usuario":"","password":"adminpassword"}` | 400 — usuario min(1) |
| A4 | `{"usuario":"admin","password":""}` | 400 — password min(1) |
| A5 | `{"usuario":"admin"}` | 400 — falta password |
| A6 | `{"password":"adminpassword"}` | 400 — falta usuario |

### Credenciales inválidas
| ID | Body | Esperado |
|----|------|----------|
| A7 | `{"usuario":"noexiste","password":"x"}` | 401 — misma respuesta que contraseña incorrecta (no revelar si usuario existe) |
| A8 | `{"usuario":"admin","password":"mal"}` | 401 |

### Ataques
| ID | Descripción | Esperado |
|----|-------------|----------|
| A9 | Body con campo extra `"rol":"superadmin"` | 400 — `loginSchema.strict()` rechaza campos no permitidos |
| A10 | `{"usuario":{"$ne":""},"password":{"$ne":""}}` (NoSQL injection) | 400 — Zod rechaza no-string |
| A11 | Password con 10.000 caracteres | 400 — `password.max(1000)` en Zod |
| A12 | 50 requests en < 1 segundo (brute force) | 429 — rate limiting activo (20 intentos / 15 min) |
| A13 | Content-Type omitido, body como form-urlencoded | 400 o 401 — sin JSON parser no llega data |

---

## 3. Middleware JWT — rutas protegidas

Usar `POST /api/equipos` como ruta de prueba.

| ID | Header Authorization | Esperado |
|----|----------------------|----------|
| M1 | Ausente | 401 `{"error":"Autenticación requerida"}` |
| M2 | `Bearer ` (token vacío) | 403 o 401 |
| M3 | `Token abc123` (esquema incorrecto) | 401 `{"error":"Formato de autorización inválido. Use Bearer <token>"}` |
| M4 | `Bearer abc123` (JWT inválido) | 403 `{"error":"Token inválido o expirado"}` |
| M5 | `Bearer {{token}}` válido | Pasa al controller |
| M6 | `Bearer <token expirado>` | 403 |
| M7 | `Bearer <token firmado con otro secret>` | 403 |
| M8 | `bearer {{token}}` (minúscula) | 401 — `parts[0] !== 'Bearer'` |
| M9 | `Bearer token1 token2` (3 partes) | 401 — `parts.length !== 2` |
| M10 | JWT con payload adulterado (cambiar `idUsuario` en base64 sin re-firmar) | 403 — firma inválida |

---

## 4. Liga — /api/ligas

### GET /api/ligas
| ID | Descripción | Esperado |
|----|-------------|----------|
| L1 | Sin auth | 200 — array |

### GET /api/ligas/:id
| ID | :id | Esperado |
|----|-----|----------|
| L2 | ID existente | 200 + objeto liga |
| L3 | ID inexistente (ej. 99999) | 404 |
| L4 | `abc` (no numérico) | 400 — `validateId` rechaza no-dígitos |
| L5 | `0` | 400 — `validateId` rechaza id <= 0 |
| L6 | `-1` | 400 — `validateId` rechaza id <= 0 |
| L7 | `1.5` | 400 — `validateId` rechaza por regex `/^\d+$/` |
| L8 | `1; DROP TABLE ligas--` (SQL injection en path) | 400 — `validateId` rechaza caracteres no numéricos |

### PUT /api/ligas/:id (requiere auth)
| ID | Body | Esperado |
|----|------|----------|
| L9 | `{"nombre":"Liga X","temporada":"2025"}` | 200 |
| L10 | `{}` | 400 — nombre y temporada requeridos |
| L11 | `{"nombre":"","temporada":"2025"}` | 400 — nombre min(1) |
| L12 | `{"nombre":"Liga X","temporada":"2025","descripcion":null}` | 200 — descripcion nullable |
| L13 | `{"nombre":"Liga X","temporada":"2025","descripcion":"texto"}` | 200 |
| L14 | PUT /api/ligas/99999 con body válido | 404 |
| L15 | Body con campo extra `"idLiga":999` | Ignorado por Zod — no hay mass assignment |

---

## 5. Equipos — /api/equipos

### GET /api/equipos
| ID | Descripción | Esperado |
|----|-------------|----------|
| E1 | Sin auth | 200 — array |

### GET /api/equipos/:id
| ID | :id | Esperado |
|----|-----|----------|
| E2 | ID existente | 200 + equipo con jugadores y partidos (local y visitante) |
| E3 | ID inexistente | 404 |
| E4 | `abc` | 404 o 500 |
| E5 | `0`, `-1` | 404 |

### POST /api/equipos (requiere auth)
| ID | Body | Esperado |
|----|------|----------|
| E6 | `{"nombre":"Boca","entrenador":"Juan"}` | 201 + equipo creado |
| E7 | `{}` | 400 |
| E8 | `{"nombre":"","entrenador":"Juan"}` | 400 |
| E9 | `{"nombre":"Boca","entrenador":""}` | 400 |
| E10 | `{"nombre":"Boca"}` | 400 — falta entrenador |
| E11 | `{"nombre":"A","entrenador":"B","partidosGanados":999}` | 400 — `createSchema.strict()` rechaza campos no permitidos |
| E12 | Nombre con 255+ caracteres | 400 — `nombre.max(255)` en Zod |
| E13 | `{"nombre":"<script>alert(1)</script>","entrenador":"x"}` | 201 — almacena literal; XSS es responsabilidad del cliente |
| E14 | Nombre duplicado (mismo nombre que equipo existente) | 409 — controller valida nombre único |

### PUT /api/equipos/:id (requiere auth)
| ID | Body | Esperado |
|----|------|----------|
| E15 | `{"nombre":"Nuevo"}` | 200 — actualización parcial |
| E16 | `{}` | 400 — update rechaza body vacío |
| E17 | `{"nombre":""}` | 400 — min(1) aunque opcional |
| E18 | `{"partidosGanados":1}` | 400 — schema `.strict()` rechaza campos desconocidos |
| E19 | PUT /api/equipos/99999 | 404 |
| E20 | `{"idEquipo":999}` en body | 400 — `strict()` rechaza campos no permitidos |

### DELETE /api/equipos/:id (requiere auth)
| ID | Descripción | Esperado |
|----|-------------|----------|
| E21 | ID existente sin partidos | 200 + jugadores del equipo quedan con idEquipo=null |
| E22 | ID inexistente | 404 |
| E23 | Equipo con jugadores asignados (sin partidos) | 200 — ON DELETE SET NULL, jugadores persisten |
| E24 | Equipo con partidos registrados | 409 `{"error":"No se puede eliminar el equipo: tiene N partido(s) asociado(s). Eliminá los partidos primero."}` |

---

## 6. Jugadores — /api/jugadores

### GET /api/jugadores
| ID | Descripción | Esperado |
|----|-------------|----------|
| J1 | Sin auth | 200 — array con equipo embebido |

### GET /api/jugadores/:id
| ID | :id | Esperado |
|----|-----|----------|
| J2 | ID existente | 200 + equipo embebido |
| J3 | ID inexistente | 404 |
| J4 | `abc`, `0`, `-1` | 400 — `validateId` rechaza no-dígitos e ids <= 0 |

### POST /api/jugadores (requiere auth)
| ID | Body | Esperado |
|----|------|----------|
| J5 | `{"nombre":"Juan","apellido":"Perez","categoria":"U20"}` | 201 — idEquipo null |
| J6 | `{"nombre":"Juan","apellido":"Perez","categoria":"U20","idEquipo":1}` (equipo existe) | 201 |
| J7 | `{"nombre":"Juan","apellido":"Perez","categoria":"U20","idEquipo":99999}` | 400 "equipo no existe" |
| J8 | `{"nombre":"Juan","apellido":"Perez","categoria":"U20","idEquipo":null}` | 201 — null explícito permitido |
| J9 | `{}` | 400 |
| J10 | `{"nombre":"","apellido":"Perez","categoria":"U20"}` | 400 |
| J11 | `{"nombre":"Juan","apellido":"Perez","categoria":"U20","idEquipo":"abc"}` | 400 — idEquipo debe ser int |
| J12 | `{"nombre":"Juan","apellido":"Perez","categoria":"U20","idEquipo":1.5}` | 400 — debe ser int |

### PUT /api/jugadores/:id (requiere auth)
| ID | Body | Esperado |
|----|------|----------|
| J13 | `{"idEquipo":1}` (equipo existe) | 200 — reasignación |
| J14 | `{"idEquipo":99999}` | 400 "equipo no existe" |
| J15 | `{"idEquipo":null}` | 200 — desasignar equipo |
| J16 | `{}` | 400 — update rechaza body vacío |
| J17 | `{"nombre":""}` | 400 — min(1) aunque opcional |
| J18 | PUT /api/jugadores/99999 | 404 |

### DELETE /api/jugadores/:id (requiere auth)
| ID | Descripción | Esperado |
|----|-------------|----------|
| J19 | ID existente | 200 |
| J20 | ID inexistente | 404 |

---

## 7. Partidos — /api/partidos

### GET /api/partidos
| ID | Descripción | Esperado |
|----|-------------|----------|
| P1 | Sin auth | 200 — array con equipoLocal y equipoVisitante embebidos |

### GET /api/partidos/:id
| ID | :id | Esperado |
|----|-----|----------|
| P2 | ID existente | 200 + partido con equipoLocal y equipoVisitante |
| P3 | ID inexistente (ej. 99999) | 404 |
| P4 | `abc` | 404 o 500 |
| P5 | `0`, `-1` | 404 |

### POST /api/partidos (requiere auth)
| ID | Body | Esperado |
|----|------|----------|
| P6 | `{"fecha":"2026-05-01","hora":"18:00","lugar":"Estadio X","idLocal":1,"idVisitante":2}` | 201 + partido con equipos |
| P7 | `idLocal == idVisitante` | 400 "no puede jugar contra sí mismo" |
| P8 | `idLocal` inexistente | 400 "equipo local no existe" |
| P9 | `idVisitante` inexistente | 400 "equipo visitante no existe" |
| P10 | `{}` (campos faltantes) | 400 Zod |
| P11 | `{"fecha":"01/05/2026",...}` (formato incorrecto) | 400 Zod — regex YYYY-MM-DD |
| P12 | `{"hora":"6pm",...}` (formato incorrecto) | 400 Zod — regex HH:MM |
| P13 | Sin auth | 401 |

### PUT /api/partidos/:id (requiere auth)
| ID | Condición | Body | Esperado |
|----|-----------|------|----------|
| P14 | Partido sin resultado | `{"lugar":"Nuevo Estadio"}` | 200 |
| P15 | Partido con resultado cargado | cualquier campo | 400 "con resultado cargado" |
| P16 | ID inexistente | cualquier body | 404 |
| P17 | Cambiar idLocal a equipo inexistente | `{"idLocal":99999}` | 400 |
| P18 | Cambiar idLocal == idVisitante actual | `{"idLocal": <mismo id que visitante>}` | 400 |

### DELETE /api/partidos/:id (requiere auth)
| ID | Descripción | Esperado |
|----|-------------|----------|
| P19 | Partido sin resultado | 200 |
| P20 | Partido con resultado cargado | 400 "con resultado cargado" |
| P21 | ID inexistente | 404 |

---

## 8. Carga de Resultado — POST /api/partidos/:id/resultado

| ID | Condición | Body | Esperado |
|----|-----------|------|----------|
| R1 | Local gana | `{"puntosLocal":85,"puntosVisitante":70}` | 200 — local: PG+1, PF+85, PC+70 / visitante: PP+1, PF+70, PC+85 |
| R2 | Visitante gana | `{"puntosLocal":60,"puntosVisitante":75}` | 200 — local: PP+1, PF+60, PC+75 / visitante: PG+1, PF+75, PC+60 |
| R3 | Empate | `{"puntosLocal":80,"puntosVisitante":80}` | 200 — ambos: PE+1, PF+80, PC+80 |
| R4 | Resultado ya cargado — re-carga con nuevo resultado | `{"puntosLocal":90,"puntosVisitante":60}` | 200 — stats anteriores revertidas, nuevas stats aplicadas; PJ no incrementa |
| R5 | Partido inexistente | cualquier body | 404 |
| R6 | Sin auth | cualquier body | 401 |
| R7 | Puntaje negativo | `{"puntosLocal":-1,"puntosVisitante":70}` | 400 Zod |
| R8 | Puntaje no entero | `{"puntosLocal":1.5,"puntosVisitante":70}` | 400 Zod |

**Verificación de stats (R1):** Después del request, `GET /api/equipos/:idLocal` y verificar `partidosGanados`, `puntosFavor`, `puntosEnContra` incrementados correctamente. Hacer lo mismo para el equipo visitante.

---

## 9. Clasificación — GET /api/clasificacion

| ID | Descripción | Esperado |
|----|-------------|----------|
| C1 | Sin auth | 200 (endpoint público) |
| C2 | Con equipos sin partidos | 200 — todos con puntos=0, PJ=0, diferencia=0 |
| C3 | Campos de respuesta | `posicion`, `idEquipo`, `nombre`, `puntos`, `PJ`, `PG`, `PE`, `PP`, `tantosFavor`, `tantosEnContra`, `diferencia` |
| C4 | Orden por puntos | Equipo con más puntos en posición 1 |
| C5 | Desempate: mismos puntos → mayor diferencia primero | A: 3pts +10dif, B: 3pts +5dif → A primero |
| C6 | Desempate secundario: mismo puntos y diferencia → mayor tantosFavor primero | A: 3pts +5dif 85PF, B: 3pts +5dif 80PF → A primero |
| C7 | Sin equipos en DB | 200 `[]` |
| C8 | Fórmula: ganado=3pts, empatado=1pt, perdido=0pts | PG*3 + PE*1 |

**Escenario de verificación de desempate (C5):**
1. Crear equipos A, B, C
2. Cargar: A gana a B 90-80 (A: 3pts, dif+10), B gana a C 85-75 (B: 3pts, dif+10), A gana a C 80-70 (A: 6pts total)
3. A (6pts) > B (3pts, dif+10) > C (0pts) — posiciones correctas
4. Crear equipo D y cargar resultados para que empate en puntos con B pero con menor diferencia → B debe quedar antes que D

---

## 10. Casos Transversales y Seguridad

| ID | Descripción | Esperado |
|----|-------------|----------|
| X1 | `GET /api/rutainexistente` | 404 Express |
| X2 | `POST /api/ligas` sin auth | 401 — ruta definida, protegida por JWT |
| X3 | `DELETE /api/ligas/abc` | 400 — `validateId` rechaza no-dígitos |
| X4 | Content-Type `text/plain` con JSON en body en ruta POST | 400 — `express.json()` no parsea, Zod falla |
| X5 | Body con `__proto__`: `{"__proto__":{"admin":true}}` (prototype pollution) | 400 Zod — no altera Object.prototype |
| X6 | ID con valor máximo de entero: `2147483647` | 404 sin error |
| X7 | ID con valor mayor al máximo: `2147483648` | Puede ser 500 (INT overflow MySQL) |
| X8 | Request sin Content-Type en POST | 400 — sin body parseado |
| X9 | Array en body: `[{"nombre":"x"}]` | 400 — Zod espera objeto |
| X10 | `null` como body completo | 400 |
| X11 | Token JWT con `alg: "none"` (none attack) | 403 — jsonwebtoken >= 9 rechaza |
| X12 | Header `Authorization: Bearer` sin token (string vacío) | 401 — jwt.verify falla |

---

## 11. Controles de seguridad implementados

| Control | Implementación |
|---------|---------------|
| Rate limiting en login | 20 intentos por IP cada 15 minutos → 429 con mensaje claro |
| Nombre de equipo único | Verificación en controller antes de crear → 409 si ya existe |
| Validación de IDs en params | Middleware `validateId` en todas las rutas con `:id` → 400 si no es entero positivo |
| Límite de tamaño en strings | `.max()` en todos los schemas Zod (nombre: 255, password: 1000, etc.) |
| CORS restringido | Whitelist de orígenes via `CORS_ORIGIN` env var (default: localhost:5173 y 3000) |
| Schemas estrictos | `.strict()` en todos los schemas Zod → 400 si hay campos desconocidos |
| Integridad referencial | `ON DELETE RESTRICT` en Partido FK → 409 si se intenta eliminar equipo con partidos |
| Transacciones | `SELECT ... FOR UPDATE` en carga de resultados → sin race conditions |
