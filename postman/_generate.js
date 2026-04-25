// Sidecar export v2.1 JSON para Newman / CI.
// El formato spec-as-code de Postman (collections/, environments/) ya queda manejado por Postman desktop.
// Este script regenera los JSON de export v2.1 a la par.

const fs = require('fs');
const path = require('path');

const url = (segments) => ({
  raw: '{{baseUrl}}/' + segments.join('/'),
  host: ['{{baseUrl}}'],
  path: segments,
});

const jsonHeader = { key: 'Content-Type', value: 'application/json' };
const authHeader = { key: 'Authorization', value: 'Bearer {{token}}' };
const badAuthHeader = (val) => ({ key: 'Authorization', value: val });

const body = (obj) => ({ mode: 'raw', raw: JSON.stringify(obj) });
const rawBody = (str) => ({ mode: 'raw', raw: str });

const test = (lines) => ({
  listen: 'test',
  script: { type: 'text/javascript', exec: lines },
});

const req = ({ name, method, path: segments, headers = [], body: b, tests = [] }) => ({
  name,
  request: {
    method,
    header: headers,
    url: url(segments),
    ...(b ? { body: b } : {}),
  },
  event: tests.length ? [test(tests)] : [],
});

const expectStatus = (code) => `pm.test('status ${code}', () => pm.response.to.have.status(${code}));`;
const expectArrayResponse = `pm.test('response es array', () => pm.expect(pm.response.json()).to.be.an('array'));`;

const folderSmoke = {
  name: '0. Smoke Test',
  item: [
    req({
      name: '[OK] GET /health — backend levantado',
      method: 'GET',
      path: ['health'],
      tests: [
        expectStatus(200),
        `const json = pm.response.json();`,
        `pm.test('status === OK', () => pm.expect(json.status).to.eql('OK'));`,
      ],
    }),
  ],
};

const folderAuth = {
  name: '1. Auth',
  item: [
    req({
      name: '[OK] POST /auth/login — admin (extrae token)',
      method: 'POST',
      path: ['auth', 'login'],
      headers: [jsonHeader],
      body: body({ usuario: '{{adminUser}}', password: '{{adminPassword}}' }),
      tests: [
        expectStatus(200),
        `const json = pm.response.json();`,
        `pm.test('response trae token', () => pm.expect(json.token).to.be.a('string'));`,
        `pm.collectionVariables.set('token', json.token);`,
      ],
    }),
    req({
      name: '[OK] GET /auth/me — token válido',
      method: 'GET',
      path: ['auth', 'me'],
      headers: [authHeader],
      tests: [
        expectStatus(200),
        `const json = pm.response.json();`,
        `pm.test('response trae usuario', () => pm.expect(json.usuario).to.be.an('object'));`,
        `pm.test('usuario.usuario es string', () => pm.expect(json.usuario.usuario).to.be.a('string'));`,
      ],
    }),
    req({ name: '[FAIL 400] POST /auth/login — body vacío', method: 'POST', path: ['auth', 'login'], headers: [jsonHeader], body: body({}), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] POST /auth/login — usuario vacío', method: 'POST', path: ['auth', 'login'], headers: [jsonHeader], body: body({ usuario: '', password: 'adminpassword' }), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] POST /auth/login — sin password', method: 'POST', path: ['auth', 'login'], headers: [jsonHeader], body: body({ usuario: 'admin' }), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 401] POST /auth/login — credenciales inválidas', method: 'POST', path: ['auth', 'login'], headers: [jsonHeader], body: body({ usuario: 'admin', password: 'mal' }), tests: [expectStatus(401)] }),
    req({ name: '[FAIL 401] GET /auth/me — sin header Authorization', method: 'GET', path: ['auth', 'me'], tests: [expectStatus(401)] }),
    req({ name: '[FAIL 401] GET /auth/me — header malformado (Token abc)', method: 'GET', path: ['auth', 'me'], headers: [badAuthHeader('Token abc123')], tests: [expectStatus(401)] }),
    req({ name: '[FAIL 403] GET /auth/me — token inválido', method: 'GET', path: ['auth', 'me'], headers: [badAuthHeader('Bearer abc.invalid.token')], tests: [expectStatus(403)] }),
  ],
};

const folderLigas = {
  name: '2. Ligas (CRUD)',
  item: [
    req({
      name: '[OK] POST /ligas — crear (guarda idLiga)',
      method: 'POST',
      path: ['ligas'],
      headers: [jsonHeader, authHeader],
      body: body({ nombre: 'Liga Test Postman', temporada: '2026', descripcion: 'Generada por la colección' }),
      tests: [
        expectStatus(201),
        `const json = pm.response.json();`,
        `pm.test('trae idLiga', () => pm.expect(json.idLiga).to.be.a('number'));`,
        `pm.collectionVariables.set('idLiga', json.idLiga);`,
      ],
    }),
    req({ name: '[OK] GET /ligas — listar', method: 'GET', path: ['ligas'], tests: [expectStatus(200), expectArrayResponse] }),
    req({
      name: '[OK] GET /ligas/:id — leer',
      method: 'GET',
      path: ['ligas', '{{idLiga}}'],
      tests: [
        expectStatus(200),
        `const json = pm.response.json();`,
        `pm.test('idLiga coincide', () => pm.expect(json.idLiga).to.eql(Number(pm.collectionVariables.get('idLiga'))));`,
      ],
    }),
    req({
      name: '[OK] PUT /ligas/:id — actualizar',
      method: 'PUT',
      path: ['ligas', '{{idLiga}}'],
      headers: [jsonHeader, authHeader],
      body: body({ nombre: 'Liga Test Postman v2', temporada: '2026', descripcion: 'Actualizada' }),
      tests: [
        expectStatus(200),
        `const json = pm.response.json();`,
        `pm.test('nombre actualizado', () => pm.expect(json.nombre).to.eql('Liga Test Postman v2'));`,
      ],
    }),
    req({ name: '[FAIL 401] POST /ligas — sin token', method: 'POST', path: ['ligas'], headers: [jsonHeader], body: body({ nombre: 'X', temporada: '2026' }), tests: [expectStatus(401)] }),
    req({ name: '[FAIL 400] POST /ligas — body vacío', method: 'POST', path: ['ligas'], headers: [jsonHeader, authHeader], body: body({}), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] GET /ligas/abc — id no numérico', method: 'GET', path: ['ligas', 'abc'], tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] GET /ligas/0 — id cero', method: 'GET', path: ['ligas', '0'], tests: [expectStatus(400)] }),
    req({ name: '[FAIL 404] GET /ligas/99999 — no existe', method: 'GET', path: ['ligas', '99999'], tests: [expectStatus(404)] }),
    req({ name: '[FAIL 404] PUT /ligas/99999 — no existe', method: 'PUT', path: ['ligas', '99999'], headers: [jsonHeader, authHeader], body: body({ nombre: 'X', temporada: '2026' }), tests: [expectStatus(404)] }),
    req({ name: '[OK] DELETE /ligas/:id — borrar (cleanup)', method: 'DELETE', path: ['ligas', '{{idLiga}}'], headers: [authHeader], tests: [expectStatus(200)] }),
  ],
};

const folderEquipos = {
  name: '3. Equipos (CRUD)',
  item: [
    req({
      name: '[OK] POST /equipos — crear Local (guarda idEquipoLocal)',
      method: 'POST',
      path: ['equipos'],
      headers: [jsonHeader, authHeader],
      body: rawBody(`{"nombre":"PM Local {{$timestamp}}","entrenador":"Coach Local"}`),
      tests: [
        expectStatus(201),
        `const json = pm.response.json();`,
        `pm.test('trae idEquipo', () => pm.expect(json.idEquipo).to.be.a('number'));`,
        `pm.collectionVariables.set('idEquipoLocal', json.idEquipo);`,
        `pm.collectionVariables.set('nombreEquipoLocal', json.nombre);`,
      ],
    }),
    req({
      name: '[OK] POST /equipos — crear Visitante (guarda idEquipoVisitante)',
      method: 'POST',
      path: ['equipos'],
      headers: [jsonHeader, authHeader],
      body: rawBody(`{"nombre":"PM Visitante {{$timestamp}}","entrenador":"Coach Visitante"}`),
      tests: [
        expectStatus(201),
        `const json = pm.response.json();`,
        `pm.collectionVariables.set('idEquipoVisitante', json.idEquipo);`,
        `pm.collectionVariables.set('nombreEquipoVisitante', json.nombre);`,
      ],
    }),
    req({
      name: '[OK] POST /equipos — crear Tercero (guarda idEquipoTercero)',
      method: 'POST',
      path: ['equipos'],
      headers: [jsonHeader, authHeader],
      body: rawBody(`{"nombre":"PM Tercero {{$timestamp}}","entrenador":"Coach Tercero"}`),
      tests: [
        expectStatus(201),
        `const json = pm.response.json();`,
        `pm.collectionVariables.set('idEquipoTercero', json.idEquipo);`,
      ],
    }),
    req({ name: '[OK] GET /equipos — listar', method: 'GET', path: ['equipos'], tests: [expectStatus(200), expectArrayResponse] }),
    req({
      name: '[OK] GET /equipos/:id — vista detallada con jugadores y partidos',
      method: 'GET',
      path: ['equipos', '{{idEquipoLocal}}'],
      tests: [
        expectStatus(200),
        `const json = pm.response.json();`,
        `pm.test('Jugadors es array', () => pm.expect(json.Jugadors).to.be.an('array'));`,
        `pm.test('partidosLocal es array', () => pm.expect(json.partidosLocal).to.be.an('array'));`,
        `pm.test('partidosVisitante es array', () => pm.expect(json.partidosVisitante).to.be.an('array'));`,
      ],
    }),
    req({
      name: '[OK] PUT /equipos/:id — actualizar entrenador',
      method: 'PUT',
      path: ['equipos', '{{idEquipoLocal}}'],
      headers: [jsonHeader, authHeader],
      body: body({ entrenador: 'Coach Local v2' }),
      tests: [
        expectStatus(200),
        `pm.test('entrenador actualizado', () => pm.expect(pm.response.json().entrenador).to.eql('Coach Local v2'));`,
      ],
    }),
    req({ name: '[FAIL 401] POST /equipos — sin token', method: 'POST', path: ['equipos'], headers: [jsonHeader], body: body({ nombre: 'X', entrenador: 'Y' }), tests: [expectStatus(401)] }),
    req({ name: '[FAIL 400] POST /equipos — body vacío', method: 'POST', path: ['equipos'], headers: [jsonHeader, authHeader], body: body({}), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] POST /equipos — sin entrenador', method: 'POST', path: ['equipos'], headers: [jsonHeader, authHeader], body: body({ nombre: 'Sin Coach' }), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] POST /equipos — campo extra (mass assignment)', method: 'POST', path: ['equipos'], headers: [jsonHeader, authHeader], body: body({ nombre: 'Hack', entrenador: 'Y', partidosGanados: 999 }), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 409] POST /equipos — nombre duplicado', method: 'POST', path: ['equipos'], headers: [jsonHeader, authHeader], body: rawBody(`{"nombre":"{{nombreEquipoLocal}}","entrenador":"Otro"}`), tests: [expectStatus(409)] }),
    req({ name: '[FAIL 400] PUT /equipos/:id — body vacío', method: 'PUT', path: ['equipos', '{{idEquipoLocal}}'], headers: [jsonHeader, authHeader], body: body({}), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 409] PUT /equipos/:id — nombre duplicado del visitante', method: 'PUT', path: ['equipos', '{{idEquipoLocal}}'], headers: [jsonHeader, authHeader], body: rawBody(`{"nombre":"{{nombreEquipoVisitante}}"}`), tests: [expectStatus(409)] }),
    req({ name: '[FAIL 400] PUT /equipos/:id — campo extra (mass assignment)', method: 'PUT', path: ['equipos', '{{idEquipoLocal}}'], headers: [jsonHeader, authHeader], body: body({ partidosGanados: 999 }), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 404] PUT /equipos/99999 — no existe', method: 'PUT', path: ['equipos', '99999'], headers: [jsonHeader, authHeader], body: body({ entrenador: 'X' }), tests: [expectStatus(404)] }),
    req({ name: '[FAIL 400] GET /equipos/abc — id no numérico', method: 'GET', path: ['equipos', 'abc'], tests: [expectStatus(400)] }),
    req({ name: '[FAIL 404] DELETE /equipos/99999 — no existe', method: 'DELETE', path: ['equipos', '99999'], headers: [authHeader], tests: [expectStatus(404)] }),
  ],
};

const folderJugadores = {
  name: '4. Jugadores (CRUD)',
  item: [
    req({
      name: '[OK] POST /jugadores — con idEquipo (guarda idJugador)',
      method: 'POST',
      path: ['jugadores'],
      headers: [jsonHeader, authHeader],
      body: rawBody(`{"nombre":"Juan","apellido":"Test","categoria":"U20","idEquipo":{{idEquipoLocal}}}`),
      tests: [
        expectStatus(201),
        `const json = pm.response.json();`,
        `pm.test('trae idJugador', () => pm.expect(json.idJugador).to.be.a('number'));`,
        `pm.collectionVariables.set('idJugador', json.idJugador);`,
      ],
    }),
    req({ name: '[OK] POST /jugadores — sin idEquipo (free agent)', method: 'POST', path: ['jugadores'], headers: [jsonHeader, authHeader], body: body({ nombre: 'Pedro', apellido: 'Libre', categoria: 'U18' }), tests: [expectStatus(201)] }),
    req({ name: '[OK] GET /jugadores — listar', method: 'GET', path: ['jugadores'], tests: [expectStatus(200), expectArrayResponse] }),
    req({
      name: '[OK] GET /jugadores/:id — incluye equipo embebido',
      method: 'GET',
      path: ['jugadores', '{{idJugador}}'],
      tests: [
        expectStatus(200),
        `const json = pm.response.json();`,
        `pm.test('incluye Equipo (alias Sequelize)', () => pm.expect(json).to.have.property('Equipo'));`,
      ],
    }),
    req({ name: '[OK] PUT /jugadores/:id — reasignar al visitante', method: 'PUT', path: ['jugadores', '{{idJugador}}'], headers: [jsonHeader, authHeader], body: rawBody(`{"idEquipo":{{idEquipoVisitante}}}`), tests: [expectStatus(200)] }),
    req({ name: '[OK] PUT /jugadores/:id — desasignar (idEquipo: null)', method: 'PUT', path: ['jugadores', '{{idJugador}}'], headers: [jsonHeader, authHeader], body: rawBody(`{"idEquipo":null}`), tests: [expectStatus(200)] }),
    req({ name: '[FAIL 401] POST /jugadores — sin token', method: 'POST', path: ['jugadores'], headers: [jsonHeader], body: body({ nombre: 'X', apellido: 'Y', categoria: 'U20' }), tests: [expectStatus(401)] }),
    req({ name: '[FAIL 400] POST /jugadores — body vacío', method: 'POST', path: ['jugadores'], headers: [jsonHeader, authHeader], body: body({}), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] POST /jugadores — idEquipo inexistente', method: 'POST', path: ['jugadores'], headers: [jsonHeader, authHeader], body: body({ nombre: 'X', apellido: 'Y', categoria: 'U20', idEquipo: 99999 }), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] POST /jugadores — idEquipo no entero', method: 'POST', path: ['jugadores'], headers: [jsonHeader, authHeader], body: rawBody(`{"nombre":"X","apellido":"Y","categoria":"U20","idEquipo":"abc"}`), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] PUT /jugadores/:id — body vacío', method: 'PUT', path: ['jugadores', '{{idJugador}}'], headers: [jsonHeader, authHeader], body: body({}), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] PUT /jugadores/:id — idEquipo inexistente', method: 'PUT', path: ['jugadores', '{{idJugador}}'], headers: [jsonHeader, authHeader], body: body({ idEquipo: 99999 }), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 404] PUT /jugadores/99999 — no existe', method: 'PUT', path: ['jugadores', '99999'], headers: [jsonHeader, authHeader], body: body({ nombre: 'X' }), tests: [expectStatus(404)] }),
    req({ name: '[FAIL 400] GET /jugadores/0 — id cero', method: 'GET', path: ['jugadores', '0'], tests: [expectStatus(400)] }),
    req({ name: '[FAIL 404] DELETE /jugadores/99999 — no existe', method: 'DELETE', path: ['jugadores', '99999'], headers: [authHeader], tests: [expectStatus(404)] }),
  ],
};

const folderPartidos = {
  name: '5. Partidos (CRUD + reglas de negocio)',
  item: [
    req({
      name: '[OK] POST /partidos — local vs visitante (guarda idPartido)',
      method: 'POST',
      path: ['partidos'],
      headers: [jsonHeader, authHeader],
      body: rawBody(`{"fecha":"2026-05-15","hora":"19:00","lugar":"Estadio Postman","idLocal":{{idEquipoLocal}},"idVisitante":{{idEquipoVisitante}}}`),
      tests: [
        expectStatus(201),
        `const json = pm.response.json();`,
        `pm.test('trae idPartido', () => pm.expect(json.idPartido).to.be.a('number'));`,
        `pm.collectionVariables.set('idPartido', json.idPartido);`,
      ],
    }),
    req({
      name: '[OK] POST /partidos — local vs tercero (guarda idPartido2)',
      method: 'POST',
      path: ['partidos'],
      headers: [jsonHeader, authHeader],
      body: rawBody(`{"fecha":"2026-05-22","hora":"20:30","lugar":"Estadio Postman 2","idLocal":{{idEquipoLocal}},"idVisitante":{{idEquipoTercero}}}`),
      tests: [
        expectStatus(201),
        `pm.collectionVariables.set('idPartido2', pm.response.json().idPartido);`,
      ],
    }),
    req({
      name: '[OK] GET /partidos — listar con equipos embebidos',
      method: 'GET',
      path: ['partidos'],
      tests: [
        expectStatus(200),
        expectArrayResponse,
        `const arr = pm.response.json();`,
        `if (arr.length > 0) { pm.test('trae equipoLocal embebido', () => pm.expect(arr[0]).to.have.property('equipoLocal')); }`,
      ],
    }),
    req({
      name: '[OK] GET /partidos/:id',
      method: 'GET',
      path: ['partidos', '{{idPartido}}'],
      tests: [
        expectStatus(200),
        `const json = pm.response.json();`,
        `pm.test('equipoLocal presente', () => pm.expect(json.equipoLocal).to.be.an('object'));`,
        `pm.test('equipoVisitante presente', () => pm.expect(json.equipoVisitante).to.be.an('object'));`,
      ],
    }),
    req({
      name: '[OK] PUT /partidos/:id — cambiar lugar (sin resultado todavía)',
      method: 'PUT',
      path: ['partidos', '{{idPartido}}'],
      headers: [jsonHeader, authHeader],
      body: body({ lugar: 'Estadio Postman (modificado)' }),
      tests: [
        expectStatus(200),
        `pm.test('lugar actualizado', () => pm.expect(pm.response.json().lugar).to.eql('Estadio Postman (modificado)'));`,
      ],
    }),
    req({ name: '[FAIL 401] POST /partidos — sin token', method: 'POST', path: ['partidos'], headers: [jsonHeader], body: rawBody(`{"fecha":"2026-05-15","hora":"19:00","lugar":"X","idLocal":{{idEquipoLocal}},"idVisitante":{{idEquipoVisitante}}}`), tests: [expectStatus(401)] }),
    req({ name: '[FAIL 400] POST /partidos — body vacío', method: 'POST', path: ['partidos'], headers: [jsonHeader, authHeader], body: body({}), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] POST /partidos — local == visitante', method: 'POST', path: ['partidos'], headers: [jsonHeader, authHeader], body: rawBody(`{"fecha":"2026-05-15","hora":"19:00","lugar":"X","idLocal":{{idEquipoLocal}},"idVisitante":{{idEquipoLocal}}}`), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] POST /partidos — idLocal inexistente', method: 'POST', path: ['partidos'], headers: [jsonHeader, authHeader], body: rawBody(`{"fecha":"2026-05-15","hora":"19:00","lugar":"X","idLocal":99999,"idVisitante":{{idEquipoVisitante}}}`), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] POST /partidos — idVisitante inexistente', method: 'POST', path: ['partidos'], headers: [jsonHeader, authHeader], body: rawBody(`{"fecha":"2026-05-15","hora":"19:00","lugar":"X","idLocal":{{idEquipoLocal}},"idVisitante":99999}`), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] POST /partidos — fecha mal formateada', method: 'POST', path: ['partidos'], headers: [jsonHeader, authHeader], body: rawBody(`{"fecha":"15/05/2026","hora":"19:00","lugar":"X","idLocal":{{idEquipoLocal}},"idVisitante":{{idEquipoVisitante}}}`), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] POST /partidos — hora mal formateada', method: 'POST', path: ['partidos'], headers: [jsonHeader, authHeader], body: rawBody(`{"fecha":"2026-05-15","hora":"7pm","lugar":"X","idLocal":{{idEquipoLocal}},"idVisitante":{{idEquipoVisitante}}}`), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] PUT /partidos/:id — body vacío', method: 'PUT', path: ['partidos', '{{idPartido}}'], headers: [jsonHeader, authHeader], body: body({}), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] PUT /partidos/:id — local == visitante actual', method: 'PUT', path: ['partidos', '{{idPartido}}'], headers: [jsonHeader, authHeader], body: rawBody(`{"idLocal":{{idEquipoVisitante}}}`), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 404] PUT /partidos/99999 — no existe', method: 'PUT', path: ['partidos', '99999'], headers: [jsonHeader, authHeader], body: body({ lugar: 'X' }), tests: [expectStatus(404)] }),
    req({ name: '[FAIL 404] DELETE /partidos/99999 — no existe', method: 'DELETE', path: ['partidos', '99999'], headers: [authHeader], tests: [expectStatus(404)] }),
    req({ name: '[FAIL 409] DELETE /equipos/:id — equipo con partidos asociados (RESTRICT)', method: 'DELETE', path: ['equipos', '{{idEquipoLocal}}'], headers: [authHeader], tests: [expectStatus(409)] }),
  ],
};

const folderResultado = {
  name: '6. Carga de resultado',
  item: [
    req({
      name: '[OK] POST /partidos/:id/resultado — primera carga (local gana 85-70)',
      method: 'POST',
      path: ['partidos', '{{idPartido}}', 'resultado'],
      headers: [jsonHeader, authHeader],
      body: body({ puntosLocal: 85, puntosVisitante: 70 }),
      tests: [
        expectStatus(200),
        `const json = pm.response.json();`,
        `pm.test('puntosLocal actualizado', () => pm.expect(json.puntosLocal).to.eql(85));`,
        `pm.test('equipoLocal.partidosGanados >= 1', () => pm.expect(json.equipoLocal.partidosGanados).to.be.at.least(1));`,
        `pm.test('equipoVisitante.partidosPerdidos >= 1', () => pm.expect(json.equipoVisitante.partidosPerdidos).to.be.at.least(1));`,
      ],
    }),
    req({
      name: '[OK] POST /partidos/:id/resultado — re-carga (60-75, revierte y reaplica)',
      method: 'POST',
      path: ['partidos', '{{idPartido}}', 'resultado'],
      headers: [jsonHeader, authHeader],
      body: body({ puntosLocal: 60, puntosVisitante: 75 }),
      tests: [
        expectStatus(200),
        `const json = pm.response.json();`,
        `pm.test('puntosLocal actualizado a 60', () => pm.expect(json.puntosLocal).to.eql(60));`,
        `pm.test('equipoLocal.partidosJugados === 1 (no se duplicó por re-carga)', () => pm.expect(json.equipoLocal.partidosJugados).to.eql(1));`,
        `pm.test('equipoVisitante.partidosGanados >= 1 (ahora gana visitante)', () => pm.expect(json.equipoVisitante.partidosGanados).to.be.at.least(1));`,
      ],
    }),
    req({
      name: '[OK] POST /partidos/:id/resultado — empate en partido 2 (80-80)',
      method: 'POST',
      path: ['partidos', '{{idPartido2}}', 'resultado'],
      headers: [jsonHeader, authHeader],
      body: body({ puntosLocal: 80, puntosVisitante: 80 }),
      tests: [
        expectStatus(200),
        `const json = pm.response.json();`,
        `pm.test('equipoLocal.partidosEmpatados >= 1', () => pm.expect(json.equipoLocal.partidosEmpatados).to.be.at.least(1));`,
        `pm.test('equipoVisitante.partidosEmpatados >= 1', () => pm.expect(json.equipoVisitante.partidosEmpatados).to.be.at.least(1));`,
      ],
    }),
    req({ name: '[FAIL 401] POST /partidos/:id/resultado — sin token', method: 'POST', path: ['partidos', '{{idPartido}}', 'resultado'], headers: [jsonHeader], body: body({ puntosLocal: 50, puntosVisitante: 40 }), tests: [expectStatus(401)] }),
    req({ name: '[FAIL 404] POST /partidos/99999/resultado — partido inexistente', method: 'POST', path: ['partidos', '99999', 'resultado'], headers: [jsonHeader, authHeader], body: body({ puntosLocal: 50, puntosVisitante: 40 }), tests: [expectStatus(404)] }),
    req({ name: '[FAIL 400] POST /partidos/:id/resultado — puntosLocal negativo', method: 'POST', path: ['partidos', '{{idPartido}}', 'resultado'], headers: [jsonHeader, authHeader], body: body({ puntosLocal: -1, puntosVisitante: 40 }), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] POST /partidos/:id/resultado — puntosLocal no entero', method: 'POST', path: ['partidos', '{{idPartido}}', 'resultado'], headers: [jsonHeader, authHeader], body: body({ puntosLocal: 1.5, puntosVisitante: 40 }), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] PUT /partidos/:id — partido con resultado cargado', method: 'PUT', path: ['partidos', '{{idPartido}}'], headers: [jsonHeader, authHeader], body: body({ lugar: 'No debería poder cambiar' }), tests: [expectStatus(400)] }),
    req({ name: '[FAIL 400] DELETE /partidos/:id — partido con resultado cargado', method: 'DELETE', path: ['partidos', '{{idPartido}}'], headers: [authHeader], tests: [expectStatus(400)] }),
  ],
};

const folderClasificacion = {
  name: '7. Clasificación',
  item: [
    req({
      name: '[OK] GET /clasificacion — público, ordenado',
      method: 'GET',
      path: ['clasificacion'],
      tests: [
        expectStatus(200),
        expectArrayResponse,
        `const arr = pm.response.json();`,
        `if (arr.length > 0) {`,
        `  const item = arr[0];`,
        `  const campos = ['posicion','idEquipo','nombre','puntos','PJ','PG','PE','PP','tantosFavor','tantosEnContra','diferencia'];`,
        `  campos.forEach(c => pm.test('campo ' + c + ' presente', () => pm.expect(item).to.have.property(c)));`,
        `}`,
        `pm.test('orden por puntos DESC', () => {`,
        `  for (let i = 1; i < arr.length; i++) {`,
        `    pm.expect(arr[i-1].puntos).to.be.at.least(arr[i].puntos);`,
        `  }`,
        `});`,
      ],
    }),
  ],
};

const collection = {
  info: {
    _postman_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Liga Básquet — API completa',
    description: 'Colección de prueba end-to-end para la API de Liga de Básquet. Cubre health, auth, ligas, equipos, jugadores, partidos, resultado y clasificación.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [folderSmoke, folderAuth, folderLigas, folderEquipos, folderJugadores, folderPartidos, folderResultado, folderClasificacion],
  variable: [
    { key: 'token', value: '' },
    { key: 'idLiga', value: '' },
    { key: 'idEquipoLocal', value: '' },
    { key: 'idEquipoVisitante', value: '' },
    { key: 'idEquipoTercero', value: '' },
    { key: 'nombreEquipoLocal', value: '' },
    { key: 'nombreEquipoVisitante', value: '' },
    { key: 'idJugador', value: '' },
    { key: 'idPartido', value: '' },
    { key: 'idPartido2', value: '' },
  ],
};

const env = {
  id: 'f9c8e7d6-1234-5678-9abc-def012345678',
  name: 'liga-basquet (local)',
  values: [
    { key: 'baseUrl', value: 'http://localhost:3000/api', type: 'default', enabled: true },
    { key: 'adminUser', value: 'admin', type: 'default', enabled: true },
    { key: 'adminPassword', value: 'adminpassword', type: 'secret', enabled: true },
  ],
  _postman_variable_scope: 'environment',
};

fs.writeFileSync(path.join(__dirname, 'liga-basquet.postman_collection.json'), JSON.stringify(collection, null, 2));
fs.writeFileSync(path.join(__dirname, 'liga-basquet.postman_environment.json'), JSON.stringify(env, null, 2));
console.log('Generated v2.1 export sidecars');
console.log('Total folders:', collection.item.length);
console.log('Total requests:', collection.item.reduce((acc, f) => acc + f.item.length, 0));
