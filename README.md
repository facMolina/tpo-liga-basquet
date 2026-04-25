# Sistema de Gestión de Liga de Básquet

Aplicación web para la gestión integral de una liga de básquet juvenil. Permite administrar equipos, jugadores y partidos, cargar resultados con actualización automática de estadísticas, y visualizar la tabla de clasificación en tiempo real.

---

## Inicio rápido

Pre-requisitos: Node 16+, MySQL 8+, npm.

```bash
# 1. Instalar dependencias (desde la raíz del proyecto)
(cd server && npm install)
(cd client && npm install)

# 2. Crear la base de datos
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS liga_basquet;"

# 3. Crear server/.env (ver sección "Configuración del entorno" abajo)

# 4. Levantar backend (puerto 3000) y sembrar admin + datos demo
cd server && npm run dev          # en una terminal
cd server && npm run seed         # en otra terminal, una sola vez

# 5. Levantar frontend (puerto 5173)
cd client && npm run dev
```

- API: http://localhost:3000/api/health
- Frontend: http://localhost:5173
- Login admin: `admin` / `adminpassword`

Detalle completo de instalación, variables de entorno y troubleshooting en [Instalación](#instalación) y [Configuración del entorno](#configuración-del-entorno).

---

## Tabla de Contenidos

- [Arquitectura técnica](#arquitectura-técnica)
- [Modelo de datos](#modelo-de-datos)
- [API Reference](#api-reference)
- [Seguridad](#seguridad)
- [Instalación](#instalación)
- [Configuración del entorno](#configuración-del-entorno)
- [Cómo probar con Postman](#cómo-probar-con-postman)
- [Comportamiento ante errores](#comportamiento-ante-errores)
- [Plan de Pruebas](#plan-de-pruebas)

---

## Arquitectura técnica

### Stack

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | 16+ |
| Framework web | Express | 5.2+ |
| ORM | Sequelize | 6.37+ |
| Base de datos | MySQL | 8.0+ |
| Autenticación | JWT (jsonwebtoken) | 9.0+ |
| Cifrado | bcryptjs | 3.0+ |
| Validación | Zod | 3.23+ |
| Frontend | React + Vite + Tailwind CSS | 18 / 5 / 4 |

### Estructura del proyecto

```
tpo-liga-basquet/
├── client/                    # Frontend React + Vite
│   └── src/
├── server/                    # Backend Express (MVC)
│   ├── config/database.js     # Conexión Sequelize
│   ├── models/                # Modelos Sequelize + relaciones
│   ├── controllers/           # Lógica de negocio + validación Zod
│   ├── routes/                # Definición de rutas
│   ├── middleware/auth.js     # Middleware JWT
│   └── scripts/               # Seeds de datos iniciales
└── testplan.md                # Plan de pruebas de regresión
```

El backend sigue una arquitectura MVC estricta: `models/` define las entidades y relaciones, `controllers/` contiene la lógica de negocio y validación con Zod, `routes/` expone los endpoints. La autenticación se aplica como middleware en las rutas que lo requieren.

---

## Modelo de datos

### Tablas

#### Liga
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| idLiga | INTEGER | PK, auto-incremental |
| nombre | STRING | NOT NULL |
| temporada | STRING | NOT NULL |
| descripcion | TEXT | Permite NULL |

#### Usuario
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| idUsuario | INTEGER | PK, auto-incremental |
| usuario | STRING | NOT NULL, UNIQUE |
| password_hash | STRING | NOT NULL |

#### Equipo
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| idEquipo | INTEGER | PK, auto-incremental |
| nombre | STRING | NOT NULL |
| entrenador | STRING | NOT NULL |
| partidosGanados | INTEGER | Default 0 |
| partidosEmpatados | INTEGER | Default 0 |
| partidosPerdidos | INTEGER | Default 0 |
| puntosFavor | INTEGER | Default 0 |
| puntosEnContra | INTEGER | Default 0 |
| partidosJugados | INTEGER | Default 0 |
| puntos | INTEGER | Default 0 |
| diferencia | INTEGER | Default 0 |

#### Jugador
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| idJugador | INTEGER | PK, auto-incremental |
| nombre | STRING | NOT NULL |
| apellido | STRING | NOT NULL |
| categoria | STRING | NOT NULL |
| idEquipo | INTEGER | FK → Equipo, Permite NULL, ON DELETE SET NULL |

#### Partido
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| idPartido | INTEGER | PK, auto-incremental |
| fecha | DATEONLY | NOT NULL |
| hora | TIME | NOT NULL |
| lugar | STRING | NOT NULL |
| puntosLocal | INTEGER | Permite NULL (null = pendiente) |
| puntosVisitante | INTEGER | Permite NULL (null = pendiente) |
| idLocal | INTEGER | FK → Equipo, NOT NULL, ON DELETE RESTRICT |
| idVisitante | INTEGER | FK → Equipo, NOT NULL, ON DELETE RESTRICT |

### Relaciones

- **Equipo 1:N Jugador** — Si se elimina el equipo, `idEquipo` del jugador se setea en NULL.
- **Equipo 1:N Partido (Local)** — FK `idLocal`, alias `partidosLocal`. RESTRICT: no se puede eliminar un equipo con partidos asociados.
- **Equipo 1:N Partido (Visitante)** — FK `idVisitante`, alias `partidosVisitante`. RESTRICT.

### Reglas de puntuación

| Resultado | Puntos |
|-----------|--------|
| Partido ganado | 3 |
| Partido empatado | 1 |
| Partido perdido | 0 |

**Desempate en la clasificación:** 1) Mayor diferencia de tantos (PF − PC). 2) Mayor cantidad de tantos a favor.

---

## API Reference

### Autenticación

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Login. Devuelve token JWT (12h) |
| GET | `/api/auth/me` | Sí | Verifica token y devuelve datos del usuario |

### Liga

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/ligas` | No | Listar todas las ligas |
| GET | `/api/ligas/:id` | No | Obtener liga por ID |
| POST | `/api/ligas` | Sí | Crear liga |
| PUT | `/api/ligas/:id` | Sí | Actualizar liga |
| DELETE | `/api/ligas/:id` | Sí | Eliminar liga |

### Equipos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/equipos` | No | Listar todos los equipos |
| GET | `/api/equipos/:id` | No | Vista detallada: equipo con jugadores y partidos |
| POST | `/api/equipos` | Sí | Crear equipo |
| PUT | `/api/equipos/:id` | Sí | Actualizar nombre/entrenador |
| DELETE | `/api/equipos/:id` | Sí | Eliminar equipo (falla si tiene partidos) |

### Jugadores

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/jugadores` | No | Listar todos los jugadores |
| GET | `/api/jugadores/:id` | No | Obtener jugador por ID |
| POST | `/api/jugadores` | Sí | Crear jugador |
| PUT | `/api/jugadores/:id` | Sí | Actualizar jugador |
| DELETE | `/api/jugadores/:id` | Sí | Eliminar jugador |

### Partidos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/partidos` | No | Listar todos los partidos con equipos |
| GET | `/api/partidos/:id` | No | Obtener partido por ID |
| POST | `/api/partidos` | Sí | Programar partido (fecha, hora, lugar, equipos) |
| PUT | `/api/partidos/:id` | Sí | Editar partido (solo si no tiene resultado) |
| DELETE | `/api/partidos/:id` | Sí | Eliminar partido (solo si no tiene resultado) |
| POST | `/api/partidos/:id/resultado` | Sí | Cargar resultado y actualizar estadísticas automáticamente |

### Clasificación

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/clasificacion` | No | Tabla de posiciones ordenada con todos los campos requeridos |

**Campos de respuesta de `/api/clasificacion`:**
```json
[
  {
    "posicion": 1,
    "idEquipo": 2,
    "nombre": "Los Tigres",
    "puntos": 9,
    "PJ": 3,
    "PG": 3,
    "PE": 0,
    "PP": 0,
    "tantosFavor": 250,
    "tantosEnContra": 210,
    "diferencia": 40
  }
]
```

---

## Seguridad

- **Autenticación JWT**: Las rutas administrativas requieren el header `Authorization: Bearer <token>`. El token expira en 12 horas.
- **Cifrado de contraseñas**: bcryptjs con salt rounds = 10.
- **Rate limiting**: Login limitado a 20 intentos por IP cada 15 minutos. Exceder el límite devuelve 429.
- **CORS restringido**: Solo acepta requests de orígenes en `CORS_ORIGIN` (por defecto `localhost:5173` y `localhost:3000`).
- **Validación de entradas**: Todos los endpoints usan schemas Zod con `.strict()` — rechaza campos desconocidos y aplica límites de tamaño en todos los strings.
- **Validación de IDs**: Middleware `validateId` en todas las rutas con `:id` — rechaza IDs no enteros o negativos con 400.
- **Nombres únicos**: No se puede crear un equipo con un nombre ya existente (409).
- **Integridad referencial**: FK con `ON DELETE RESTRICT` en partidos impide eliminar equipos con historial de partidos (409).
- **Transacciones**: La carga de resultados usa `sequelize.transaction()` con `SELECT ... FOR UPDATE` para garantizar consistencia bajo concurrencia.

---

## Instalación

### Requisitos previos

- Node.js v16+
- MySQL v8.0+
- npm

### Pasos

```bash
# 1. Posicionarse en la raíz del proyecto (donde están las carpetas client/ y server/)

# 2. Instalar dependencias
cd client && npm install && cd ..
cd server && npm install && cd ..

# 3. Crear la base de datos en MySQL
mysql -u root -p
> CREATE DATABASE IF NOT EXISTS liga_basquet;
> EXIT;

# 4. Configurar variables de entorno (ver sección siguiente)

# 5. Levantar el backend (sincroniza tablas automáticamente)
cd server && npm run dev

# 6. Cargar datos iniciales (una sola vez)
node scripts/seedAdmin.js
node scripts/seedLiga.js
# O equivalente:
npm run seed

# 7. Levantar el frontend (otra terminal)
cd client && npm run dev
```

- **Backend:** `http://localhost:3000`
- **Frontend:** `http://localhost:5173`

---

## Configuración del entorno

Crear el archivo `server/.env`:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=liga_basquet
DB_PORT=3306
JWT_SECRET=tu_secreto_jwt_super_seguro
ADMIN_USER=admin
ADMIN_PASSWORD=adminpassword
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

**Credenciales de prueba:**
- Usuario: `admin`
- Contraseña: `adminpassword`

---

## Cómo probar con Postman

Postman es un cliente HTTP para probar APIs. La colección y el environment están versionados en `postman/`.

### Configuración inicial

1. Instalar **Postman** (desktop o extensión web).
2. **Import** → seleccionar `postman/liga-basquet.postman_collection.json` y `postman/liga-basquet.postman_environment.json`.
3. En el dropdown de environments (arriba a la derecha) → seleccionar `liga-basquet (local)`.
4. La variable `token` se setea automáticamente al correr el request `[OK] POST /auth/login — admin (extrae token)` del folder `1. Auth`.

Para correr toda la colección end-to-end: click derecho sobre la colección → **Run collection**. Detalles en [`postman/README.md`](./postman/README.md).

### Flujo básico de prueba

**Paso 1 — Verificar que el servidor responde:**
```
GET http://localhost:3000/api/health
→ 200 {"status":"OK"}
```

**Paso 2 — Login y guardar token:**
```
POST http://localhost:3000/api/auth/login
Headers: Content-Type: application/json
Body: {"usuario":"admin","password":"adminpassword"}
→ Copiar el valor de "token" y pegarlo en la variable {{token}} del entorno
```

**Paso 3 — Crear un equipo:**
```
POST http://localhost:3000/api/equipos
Headers: Authorization: Bearer {{token}}
Body: {"nombre":"Los Tigres","entrenador":"Juan Perez"}
→ 201 con el equipo creado
```

**Paso 4 — Programar un partido:**
```
POST http://localhost:3000/api/partidos
Headers: Authorization: Bearer {{token}}
Body: {"fecha":"2026-05-15","hora":"19:00","lugar":"Estadio Municipal","idLocal":1,"idVisitante":2}
→ 201 con el partido y equipos embebidos
```

**Paso 5 — Cargar resultado:**
```
POST http://localhost:3000/api/partidos/1/resultado
Headers: Authorization: Bearer {{token}}
Body: {"puntosLocal":85,"puntosVisitante":72}
→ 200 con partido actualizado y estadísticas de ambos equipos
```

**Paso 6 — Ver clasificación:**
```
GET http://localhost:3000/api/clasificacion
→ 200 array ordenado por posición
```

---

## Comportamiento ante errores

| Situación | Código | Respuesta |
|-----------|--------|-----------|
| Ruta protegida sin token | 401 | `{"error":"Autenticación requerida"}` |
| Header mal formado (no Bearer) | 401 | `{"error":"Formato de autorización inválido. Use Bearer <token>"}` |
| Token inválido o expirado | 403 | `{"error":"Token inválido o expirado"}` |
| Demasiados intentos de login | 429 | `{"error":"Demasiados intentos de login. Intentá de nuevo en 15 minutos."}` |
| ID no es un entero positivo en la URL | 400 | `{"error":"El ID debe ser un entero positivo"}` |
| Recurso no encontrado | 404 | `{"error":"... no encontrado"}` |
| Body inválido, campos faltantes o campos extra | 400 | `{"errors":[...]}` |
| idEquipo/idLocal/idVisitante inexistente | 400 | `{"error":"El equipo ... no existe"}` |
| Nombre de equipo duplicado | 409 | `{"error":"Ya existe un equipo con ese nombre"}` |
| Equipo con partidos asociados (DELETE) | 409 | `{"error":"No se puede eliminar el equipo: tiene N partido(s) asociado(s)"}` |
| Partido con resultado ya cargado (PUT/DELETE) | 400 | `{"error":"No se puede modificar/eliminar un partido con resultado cargado"}` |
| Re-carga de resultado (POST resultado con resultado previo) | 200 | Stats anteriores revertidas y nuevas aplicadas atómicamente |
| Local = Visitante en partido | 400 | `{"error":"Un equipo no puede jugar contra sí mismo"}` |

---

## Plan de Pruebas

El plan de pruebas completo (casos detallados, inputs/outputs, escenarios de seguridad y desempate) se encuentra en [`testplan.md`](./testplan.md).

---

## Equipo

- **Facundo** — Full Stack Developer
- **Mateo** — Full Stack Developer

---

## Licencia

Proyecto de código cerrado para uso académico (TPO).
