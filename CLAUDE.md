# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Arquitectura

Monorepo con dos proyectos independientes:

- **`client/`** — React 18 + Vite + Tailwind CSS. Punto de entrada: `src/main.jsx`. El frontend aun esta en etapa inicial (`App.jsx` es un placeholder).
- **`server/`** — Node.js + Express 5 + Sequelize 6 + MySQL. Arquitectura MVC estricta: `models/` → `controllers/` → `routes/` → `app.js`.

### Backend: flujo de una request
1. `app.js` monta las rutas bajo `/api/`
2. Rutas protegidas pasan por `middleware/auth.js` (`authenticateJWT`)
3. El controller valida con Zod, llama al modelo Sequelize, responde JSON
4. `models/index.js` define todas las relaciones entre modelos

### Modelos y relaciones clave
- `Equipo` 1:N `Jugador` — `ON DELETE SET NULL` (eliminar equipo no borra jugadores)
- `Equipo` 1:N `Partido` — dos FKs: `idLocal` (alias `partidosLocal`) e `idVisitante` (alias `partidosVisitante`)
- Al usar `include` en queries de Partido, siempre especificar el alias correcto

### Auth
- `POST /api/auth/login` → devuelve JWT firmado con `JWT_SECRET`
- Header esperado: `Authorization: Bearer <token>`
- `authenticateJWT` rechaza con 401 si falta header, 401 si mal formato, 403 si token inválido

---

## Comandos

### Backend
```bash
cd server
npm run dev      # nodemon, recarga automática
npm start        # producción
node scripts/seedAdmin.js  # crear usuario admin (idempotente)
```

### Frontend
```bash
cd client
npm run dev      # Vite dev server (localhost:5173)
npm run build
```

### Verificar que el backend responde
```bash
curl http://localhost:3000/api/health
```

---

## Variables de entorno (`server/.env`)

```
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
```

La DB se sincroniza automáticamente con `sequelize.sync({ alter: true })` al levantar el servidor. Crear la DB antes: `CREATE DATABASE IF NOT EXISTS liga_basquet;`

---

# Reglas para Claude Code — Ahorra Tokens

## 1. No programar sin contexto
- ANTES de escribir codigo: lee los archivos relevantes, revisa git log, entiende la arquitectura.
- Si no tienes contexto suficiente, pregunta. No asumas.

## 2. Respuestas cortas
- Responde en 1-3 oraciones. Sin preambulos, sin resumen final.
- No repitas lo que el usuario dijo. No expliques lo obvio.
- Codigo habla por si mismo: no narres cada linea que escribes.

## 3. No reescribir archivos completos
- Usa Edit (reemplazo parcial), NUNCA Write para archivos existentes salvo que el cambio sea >80% del archivo.
- Cambia solo lo necesario. No "limpies" codigo alrededor del cambio.

## 4. No releer archivos ya leidos
- Si ya leiste un archivo en esta conversacion, no lo vuelvas a leer salvo que haya cambiado.
- Toma notas mentales de lo importante en tu primera lectura.

## 5. Validar antes de declarar hecho
- Despues de un cambio: compila, corre tests, o verifica que funciona.
- Nunca digas "listo" sin evidencia de que funciona.

## 6. Cero charla aduladora
- No digas "Excelente pregunta", "Gran idea", "Perfecto", etc.
- No halagues al usuario. Ve directo al trabajo.

## 7. Soluciones simples
- Implementa lo minimo que resuelve el problema. Nada mas.
- No agregues abstracciones, helpers, tipos, validaciones, ni features que no se pidieron.
- 3 lineas repetidas > 1 abstraccion prematura.

## 8. No pelear con el usuario
- Si el usuario dice "hazlo asi", hazlo asi. No debatas salvo riesgo real de seguridad o perdida de datos.
- Si discrepas, menciona tu concern en 1 oracion y procede con lo que pidio.

## 9. Leer solo lo necesario
- No leas archivos completos si solo necesitas una seccion. Usa offset y limit.
- Si sabes la ruta exacta, usa Read directo. No hagas Glob + Grep + Read cuando Read basta.

## 10. No narrar el plan antes de ejecutar
- No digas "Voy a leer el archivo, luego modificar la funcion, luego compilar...". Solo hazlo.
- El usuario ve tus tool calls. No necesita un preview en texto.

## 11. Paralelizar tool calls
- Si necesitas leer 3 archivos independientes, lee los 3 en un solo mensaje, no uno por uno.
- Menos roundtrips = menos tokens de contexto acumulado.

## 12. No duplicar codigo en la respuesta
- Si ya editaste un archivo, no copies el resultado en tu respuesta. El usuario lo ve en el diff.
- Si creaste un archivo, no lo muestres entero en texto tambien.

## 13. No usar Agent cuando Grep/Read basta
- Agent duplica todo el contexto en un subproceso. Solo usalo para busquedas amplias o tareas complejas.
- Para buscar una funcion o archivo especifico, usa Grep o Glob directo.
