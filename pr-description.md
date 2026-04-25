## Summary

Se implementa el **Motor de Partidos y Clasificación** sobre la base del CRUD existente, junto con hardening de seguridad completo y documentación de entrega. Los nuevos endpoints de escritura están protegidos por JWT; los de consulta son públicos.

## Qué se hizo

### 1. Correcciones al CRUD de Equipos

- `equipoController.destroy`: antes de eliminar verifica si el equipo tiene partidos asociados. Si los tiene, devuelve **409** con mensaje claro en lugar de romper la FK constraint.
- `equipoUpdateSchema`: se removieron los campos de estadísticas (`partidosGanados`, `partidosEmpatados`, `partidosPerdidos`, `puntosFavor`, `puntosEnContra`) para que no sean editables manualmente — son calculados automáticamente al cargar resultados.
- `models/index.js`: se agregó `onDelete: 'RESTRICT'` en las dos asociaciones `Equipo → Partido` para que MySQL rechace el borrado en lugar de fallar silenciosamente.
- `package.json`: se removió `create-vite` (dependencia de frontend que no correspondía al server) y se agregó el script `npm run seed`.

### 2. CRUD de Partido

- Se creó `server/controllers/partidoController.js` con validación Zod.
- Se creó `server/routes/partido.js` registrando las rutas bajo `/api/partidos`.
- **GET** `/api/partidos` y `/api/partidos/:id` — públicos. Incluyen `equipoLocal` y `equipoVisitante` embebidos.
- **POST** `/api/partidos` — protegido. Valida que `idLocal ≠ idVisitante` y que ambos equipos existan antes de crear.
- **PUT** `/api/partidos/:id` — protegido. Rechaza la edición si el partido ya tiene resultado cargado.
- **DELETE** `/api/partidos/:id` — protegido. Rechaza el borrado si el partido ya tiene resultado cargado.

### 3. Carga de resultado con lógica transaccional

- **POST** `/api/partidos/:id/resultado` — protegido.
- Implementado con `sequelize.transaction()` y `SELECT ... FOR UPDATE` para prevenir race conditions bajo concurrencia.
- Al cargar el resultado, actualiza automáticamente en una sola transacción:
  - `puntosLocal` y `puntosVisitante` en el Partido.
  - `partidosGanados / partidosEmpatados / partidosPerdidos` del equipo ganador/perdedor (o ambos en empate).
  - `puntosFavor` y `puntosEnContra` de ambos equipos.
- Rechaza con 400 si el resultado ya estaba cargado.

### 4. Clasificación automática

- Se creó `server/controllers/clasificacionController.js`.
- Se creó `server/routes/clasificacion.js` bajo `/api/clasificacion`.
- **GET** `/api/clasificacion` — público.
- Calcula en tiempo real: `puntos = PG×3 + PE×1`, `PJ`, `diferencia`.
- Ordena por: **Puntos DESC → Diferencia DESC → Tantos a favor DESC**.
- Responde con `posicion`, `nombre`, `puntos`, `PJ`, `PG`, `PE`, `PP`, `tantosFavor`, `tantosEnContra`, `diferencia`.

### 5. Hardening de seguridad

- **Rate limiting**: 20 intentos de login por IP cada 15 minutos (`express-rate-limit`). Exceder devuelve 429.
- **CORS restringido**: whitelist de orígenes vía variable de entorno `CORS_ORIGIN` (default: `localhost:5173` y `localhost:3000`).
- **Schemas `.strict()`**: todos los schemas Zod rechazan campos desconocidos con 400, previniendo mass assignment.
- **Límites de tamaño**: `.max()` en todos los campos string de todos los schemas, evitando errores 500 por overflow en MySQL.
- **Middleware `validateId`**: aplicado en todas las rutas con `:id`, rechaza IDs no enteros o negativos con 400.
- **Nombre único de equipo**: verificación en controller antes de crear → 409 si ya existe.
- **Corrección de sync**: se cambió `sequelize.sync({ alter: true })` a `sequelize.sync()` para evitar la acumulación de índices duplicados en MySQL en cada reinicio.

### 6. Seeds y documentación

- Se creó `server/scripts/seedLiga.js`: idempotente, crea la liga inicial si no existe.
- Se creó `testplan.md`: plan de pruebas de regresión completo y auto-contenido. Cubre todos los módulos: Auth, Middleware JWT, Liga, Equipos, Jugadores, Partidos, Resultado, Clasificación, Transversales y tabla de controles de seguridad implementados.
- Se reescribió `README.md` como documento profesional de entrega con API Reference completa, modelo de datos, guía de instalación y sección de seguridad actualizada.

## Archivos creados

- `server/controllers/partidoController.js`
- `server/controllers/clasificacionController.js`
- `server/routes/partido.js`
- `server/routes/clasificacion.js`
- `server/middleware/validateId.js`
- `server/scripts/seedLiga.js`
- `testplan.md`

## Archivos modificados

- `server/app.js` (CORS, montaje de nuevas rutas)
- `server/routes/auth.js` (rate limiting en login)
- `server/routes/equipo.js`, `jugador.js`, `liga.js`, `partido.js` (validateId)
- `server/controllers/equipoController.js` (destroy 409, updateSchema sin stats, nombre único)
- `server/controllers/jugadorController.js`, `ligaController.js`, `authController.js`, `partidoController.js` (`.strict()` y `.max()`)
- `server/models/index.js` (onDelete RESTRICT)
- `server/package.json` (express-rate-limit, script seed, sin create-vite)
- `README.md`

## Endpoints disponibles

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/partidos` | Sí | Programar partido |
| GET | `/api/partidos` | No | Listar partidos con equipos |
| GET | `/api/partidos/:id` | No | Obtener partido por ID |
| PUT | `/api/partidos/:id` | Sí | Editar partido (sin resultado) |
| DELETE | `/api/partidos/:id` | Sí | Eliminar partido (sin resultado) |
| POST | `/api/partidos/:id/resultado` | Sí | Cargar resultado + auto-calcular stats |
| GET | `/api/clasificacion` | No | Tabla de posiciones ordenada |

## Test plan

### Setup
- [x] `cd server && npm run seed` → admin + liga creados
- [x] `cd server && npm run dev` → servidor en `localhost:3000`
- [x] `POST /api/auth/login` → obtener token JWT

### Partido CRUD
- [x] `POST /api/partidos` con token y body válido → 201
- [x] `POST /api/partidos` con `idLocal == idVisitante` → 400
- [x] `POST /api/partidos` con equipo inexistente → 400
- [x] `POST /api/partidos` sin token → 401
- [x] `POST /api/partidos` con fecha en formato incorrecto → 400
- [x] `PUT /api/partidos/:id` sin resultado → 200
- [x] `PUT /api/partidos/:id` con resultado ya cargado → 400
- [x] `DELETE /api/partidos/:id` sin resultado → 200
- [x] `DELETE /api/partidos/:id` con resultado ya cargado → 400
- [x] `GET /api/partidos/99999` → 404

### Resultado
- [x] `POST /api/partidos/:id/resultado` local gana → 200, stats de ambos equipos actualizadas
- [x] `POST /api/partidos/:id/resultado` visitante gana → 200
- [x] `POST /api/partidos/:id/resultado` empate → 200, ambos PE+1
- [x] `POST /api/partidos/:id/resultado` ya cargado → 400
- [x] `POST /api/partidos/:id/resultado` puntaje negativo → 400
- [x] `POST /api/partidos/:id/resultado` sin token → 401

### Clasificación
- [x] `GET /api/clasificacion` → 200 sin auth, array ordenado por puntos DESC
- [x] Desempate por diferencia verificado
- [x] Campos: `posicion`, `PJ`, `PG`, `PE`, `PP`, `tantosFavor`, `tantosEnContra`, `diferencia`

### Seguridad
- [x] `PUT /api/equipos/:id` con `{"partidosGanados":1}` → 400 (strict)
- [x] Nombre de equipo duplicado → 409
- [x] `DELETE /api/equipos/:id` con partidos → 409
- [x] `GET /api/equipos/abc` → 400 (validateId)
- [x] `POST /api/auth/login` con password de 256+ chars → 400 (max)
- [x] Rate limiting activo en login
