# Colección Postman — API Liga de Básquet

Colección end-to-end para verificar que la app esté levantada, hacer login, probar el CRUD de los 6 recursos y validar reglas de negocio (auth, validaciones Zod, conflictos, partidos con resultado, etc).

**Cobertura**: 8 folders, 80 requests, 124 assertions automáticas.

---

## Archivos

- `liga-basquet.postman_collection.json` — colección Postman v2.1 (sidecar exportado, este es el que importás en Postman / consume Newman)
- `liga-basquet.postman_environment.json` — environment local (`baseUrl`, credenciales admin)
- `_generate.js` — script Node que regenera ambos sidecars a partir de plantillas internas
- `collections/Liga Básquet — API completa/` — spec-as-code (YAMLs por request) que usa Postman desktop. No se importan a Newman directamente; el sidecar v2.1 es la fuente para CLI.

El workspace de Postman está declarado en `.postman/resources.yaml`.

---

## Pre-requisitos

1. MySQL corriendo y DB `liga_basquet` creada (`CREATE DATABASE IF NOT EXISTS liga_basquet;`)
2. Backend corriendo: `cd server && npm run dev` (puerto 3000)
3. Admin sembrado: `cd server && npm run seed`

> Si el schema de la DB está desactualizado (columnas faltantes), drop y recreá: `DROP DATABASE liga_basquet; CREATE DATABASE liga_basquet;`. Sequelize `sync()` recrea las tablas al arrancar el server.

---

## Cómo importar

### En Postman (UI)
1. **Import** → seleccionar `liga-basquet.postman_collection.json` y `liga-basquet.postman_environment.json`.
2. En el dropdown de environments (arriba a la derecha) → seleccionar `liga-basquet (local)`.
3. Click derecho sobre la colección → **Run collection** → **Run Liga Básquet — API completa**. Todos los requests deben pasar (verde).

### Por CLI con Newman
```bash
cd postman
npx --yes newman@6 run liga-basquet.postman_collection.json -e liga-basquet.postman_environment.json
```
Exit code `0` = todos los assertions OK.

---

## Estructura de la colección

| Folder | Cubre |
|--------|-------|
| 0. Smoke Test | `GET /health` |
| 1. Auth | login OK + 7 fallos (body inválido, credenciales mal, sin token, header malformado, token inválido) |
| 2. Ligas (CRUD) | POST/GET/PUT/DELETE + fallos 400/401/404 |
| 3. Equipos (CRUD) | crea 3 equipos (local/visitante/tercero) + fallos: 401, body vacío, sin entrenador, mass assignment, nombre duplicado (409), update vacío, 404 |
| 4. Jugadores (CRUD) | con/sin idEquipo, reasignar, desasignar + fallos: idEquipo inexistente, no entero, 404 |
| 5. Partidos | crea 2 partidos + fallos: local==visitante, equipos inexistentes, fecha/hora mal formateadas, equipo con partidos no se borra (409 RESTRICT) |
| 6. Resultado | primera carga, re-carga (revierte stats), empate + fallos: puntaje negativo/no entero, partido con resultado no se modifica/borra |
| 7. Clasificación | público, valida campos esperados y orden por puntos |

Convención de nombres:
- `[OK] METHOD path` — caso feliz, espera 2xx
- `[FAIL 4xx] METHOD path` — caso que debe fallar, espera el status code de error indicado

---

## IDs dinámicos (variables de colección)

La colección NO asume IDs fijos del seed. Cada POST extrae el ID del response (`pm.collectionVariables.set(...)`) y lo reusa en los requests siguientes:

| Variable | Origen |
|----------|--------|
| `token` | login |
| `idLiga` | POST /ligas |
| `idEquipoLocal`, `idEquipoVisitante`, `idEquipoTercero` | POST /equipos |
| `idJugador` | POST /jugadores |
| `idPartido`, `idPartido2` | POST /partidos |

Los nombres de los equipos incluyen `{{$timestamp}}` (variable dinámica de Postman) para evitar 409 de duplicado al re-correr la colección.

---

## Re-ejecución

La colección deja datos en la DB (ligas, equipos, jugadores, 1 partido con resultado). Para correrla de cero sin acumulación:

```bash
mysql -u root -e "DROP DATABASE liga_basquet; CREATE DATABASE liga_basquet;"
cd server && npm run seed   # vuelve a crear admin + liga
```

Sin esto, las re-ejecuciones igual deberían pasar gracias a `{{$timestamp}}` en nombres de equipo, pero la DB se llena con datos de prueba.

---

## Si algún test falla

| Síntoma | Diagnóstico |
|---------|-------------|
| `[OK] ...` con 4xx/5xx | Bug en el backend o el test asume una shape de response que cambió. Comparar con el response real (`curl ...` directo). |
| `[FAIL 4xx] ...` con 200 | Regresión: el backend dejó de validar algo que antes validaba. |
| 401 generalizado | El token expiró (12h) o el extract del login falló. Re-correr desde el folder `1. Auth`. |
| 500 con "Unknown column" en logs | DB con schema viejo. Drop y recrear (ver sección anterior). |
