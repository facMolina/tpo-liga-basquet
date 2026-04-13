# Plan de Pruebas — API Liga de Básquet

## Pre-condiciones

1. MySQL corriendo con DB `liga_basquet` creada
2. `cd server && npm run seed` ejecutado (crea admin + liga)
3. `cd server && npm run dev` — servidor corriendo en `localhost:3000`
4. Thunder Client instalado (extensión VS Code)
5. Token JWT válido guardado como variable de entorno `{{token}}` en Thunder Client

**Obtener token:**
```
POST http://localhost:3000/api/auth/login
Body: {"usuario":"admin","password":"adminpassword"}
→ copiar valor de "token" y setear como variable de entorno en Thunder Client
```

**Referencia de casos detallados:** Ver [TEST_CASES.md](./TEST_CASES.md) para inputs/outputs exactos de cada caso.

---

## 1. Health Check

| ID | Método | URL | Esperado |
|----|--------|-----|----------|
| H1 | GET | `/api/health` | 200 `{"status":"OK","message":"Backend funcionando correctamente"}` |

---

## 2. Autenticación — POST /api/auth/login

Ver TEST_CASES.md casos A1–A13.

| ID | Descripción | Referencia |
|----|-------------|------------|
| T-A1 | Login exitoso → JWT | A1 |
| T-A2 | Campos vacíos o faltantes → 400 Zod | A2–A6 |
| T-A3 | Credenciales inválidas → 401 | A7–A8 |
| T-A4 | Ataques (injection, payload masivo) | A9–A13 |

---

## 3. Middleware JWT — rutas protegidas

Ver TEST_CASES.md casos M1–M10. Usar `POST /api/equipos` como ruta de prueba.

| ID | Header | Esperado |
|----|--------|----------|
| T-M1 | Sin header | 401 "Autenticación requerida" |
| T-M2 | `Bearer ` (token vacío) | 401 o 403 |
| T-M3 | `Token abc123` | 401 "Formato inválido" |
| T-M4 | `Bearer tokeninvalido` | 403 "Token inválido o expirado" |
| T-M5 | `Bearer {{token}}` válido | Pasa al controller |
| T-M6 | `bearer {{token}}` (minúscula) | 401 |

---

## 4. Liga — GET /api/ligas / PUT /api/ligas/:id

Ver TEST_CASES.md casos L1–L15.

| ID | Descripción | Referencia |
|----|-------------|------------|
| T-L1 | GET /api/ligas → 200 array | L1 |
| T-L2 | GET /api/ligas/1 → 200 + objeto liga | L2 |
| T-L3 | GET /api/ligas/99999 → 404 | L3 |
| T-L4 | PUT válido → 200 | L9, L12–L13 |
| T-L5 | PUT campos inválidos → 400 | L10–L11 |

---

## 5. Equipos — CRUD /api/equipos

Ver TEST_CASES.md casos E1–E27.

| ID | Descripción | Referencia |
|----|-------------|------------|
| T-E1 | GET all → 200 array | E1 |
| T-E2 | GET /:id existente → 200 + jugadores + partidos | E2 |
| T-E3 | GET /:id inexistente → 404 | E3 |
| T-E4 | POST válido → 201 | E6 |
| T-E5 | POST sin campos → 400 | E7–E10 |
| T-E6 | PUT nombre/entrenador → 200 | E16 |
| T-E7 | PUT con stats en body → 400 (schema rechaza) | E17–E19 |
| T-E8 | DELETE sin partidos → 200, jugadores con idEquipo=null | E24, E26 |
| T-E9 | DELETE con partidos → **409** "tiene N partido(s) asociado(s)" | E27 |

---

## 6. Jugadores — CRUD /api/jugadores

Ver TEST_CASES.md casos J1–J21.

| ID | Descripción | Referencia |
|----|-------------|------------|
| T-J1 | GET all → 200 con equipo embebido | J1 |
| T-J2 | GET /:id existente → 200 | J2 |
| T-J3 | GET /:id inexistente → 404 | J3 |
| T-J4 | POST con equipo válido → 201 | J6 |
| T-J5 | POST con idEquipo inexistente → 400 | J7 |
| T-J6 | PUT reasignar equipo → 200 | J14 |
| T-J7 | PUT idEquipo null → 200 (desasigna) | J16 |
| T-J8 | DELETE → 200 | J20 |

---

## 7. Partidos — CRUD /api/partidos

| ID | Método | URL | Body / Condición | Esperado |
|----|--------|-----|-----------------|----------|
| T-P1 | GET | `/api/partidos` | — | 200 array con equipoLocal y equipoVisitante |
| T-P2 | GET | `/api/partidos/:id` | id existente | 200 + equipos embebidos |
| T-P3 | GET | `/api/partidos/:id` | id inexistente | 404 |
| T-P4 | POST | `/api/partidos` | `{"fecha":"2026-05-01","hora":"18:00","lugar":"Estadio X","idLocal":1,"idVisitante":2}` | 201 |
| T-P5 | POST | `/api/partidos` | `idLocal == idVisitante` | 400 "no puede jugar contra sí mismo" |
| T-P6 | POST | `/api/partidos` | `idLocal` inexistente | 400 "equipo local no existe" |
| T-P7 | POST | `/api/partidos` | `idVisitante` inexistente | 400 "equipo visitante no existe" |
| T-P8 | POST | `/api/partidos` | sin auth | 401 |
| T-P9 | POST | `/api/partidos` | campos faltantes | 400 Zod errors |
| T-P10 | POST | `/api/partidos` | `fecha` en formato incorrecto `"01/05/2026"` | 400 Zod |
| T-P11 | PUT | `/api/partidos/:id` | `{"lugar":"Nuevo Estadio"}` (sin resultado) | 200 |
| T-P12 | PUT | `/api/partidos/:id` | partido con resultado ya cargado | 400 "con resultado cargado" |
| T-P13 | PUT | `/api/partidos/:id` | id inexistente | 404 |
| T-P14 | DELETE | `/api/partidos/:id` | partido sin resultado | 200 |
| T-P15 | DELETE | `/api/partidos/:id` | partido con resultado cargado | 400 |
| T-P16 | DELETE | `/api/partidos/:id` | id inexistente | 404 |

---

## 8. Carga de Resultado — POST /api/partidos/:id/resultado

| ID | Condición | Body | Esperado |
|----|-----------|------|----------|
| T-R1 | Local gana | `{"puntosLocal":85,"puntosVisitante":70}` | 200 + local: PG+1, PF+85, PC+70 / visitante: PP+1, PF+70, PC+85 |
| T-R2 | Visitante gana | `{"puntosLocal":60,"puntosVisitante":75}` | 200 + local: PP+1 / visitante: PG+1 |
| T-R3 | Empate | `{"puntosLocal":80,"puntosVisitante":80}` | 200 + ambos equipos: PE+1 |
| T-R4 | Ya tiene resultado | cualquier body | 400 "resultado ya fue cargado" |
| T-R5 | Partido inexistente | cualquier body | 404 |
| T-R6 | Sin auth | cualquier body | 401 |
| T-R7 | Puntaje negativo | `{"puntosLocal":-1,"puntosVisitante":70}` | 400 Zod |

**Verificación de stats (T-R1):** Después del request, hacer `GET /api/equipos/:id` del equipo local y verificar que `partidosGanados`, `puntosFavor`, `puntosEnContra` se incrementaron correctamente.

---

## 9. Clasificación — GET /api/clasificacion

| ID | Descripción | Esperado |
|----|-------------|----------|
| T-C1 | Sin auth | 200 (endpoint público) |
| T-C2 | Respuesta shape | Cada entry tiene: `posicion`, `nombre`, `puntos`, `PJ`, `PG`, `PE`, `PP`, `tantosFavor`, `tantosEnContra`, `diferencia` |
| T-C3 | Ordenamiento por puntos | Equipo con más puntos primero |
| T-C4 | Desempate por diferencia | Equipos con mismos puntos → mayor `diferencia` primero |
| T-C5 | Desempate por tantos a favor | Mismo puntos y diferencia → mayor `tantosFavor` primero |
| T-C6 | Sin equipos | 200 array vacío `[]` |

**Escenario de verificación de desempate:**
1. Crear 3 equipos: A, B, C
2. Cargar resultados: A gana a B (3pts, +10 diferencia), A gana a C (3pts, +5 diferencia), B gana a C
3. Verificar: posición 1=A (6pts), posición 2=B (3pts), posición 3=C (0pts)
4. Modificar para que A y B empaten en puntos → verificar que el de mayor diferencia queda primero

---

## 10. Casos Transversales y Seguridad

Ver TEST_CASES.md casos X1–X12, V1–V6.

| ID | Descripción | Esperado |
|----|-------------|----------|
| T-X1 | GET /api/rutainexistente | 404 Express |
| T-X2 | POST /api/ligas (no definido) | 404 |
| T-X3 | Body `null` en POST | 400 Zod |
| T-X4 | Array en body: `[{"nombre":"x"}]` | 400 Zod |
| T-X5 | JWT con `alg: "none"` | 403 (jsonwebtoken >= 9 rechaza) |
