# TPO - Sistema de Gestion Liga de Basquet

Sistema integral para la gestion de equipos, jugadores y estadisticas de una liga de basquet, construido con una arquitectura moderna de Monorepo.

---

## Tabla de Contenidos

- [Caracteristicas](#caracteristicas)
- [Requisitos Previos](#requisitos-previos)
- [Instalacion](#instalacion)
- [Configuracion de MySQL Local](#configuracion-de-mysql-local)
- [Scripts de Ejecucion](#scripts-de-ejecucion)
- [Estructura de Carpetas](#estructura-de-carpetas)
- [Modelo de Base de Datos](#modelo-de-base-de-datos)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)

---

## Caracteristicas

- **Frontend Moderno**: Interfaz responsive construida con React y Vite
- **Backend Robusto**: API REST con Express y Sequelize (arquitectura MVC)
- **Base de Datos**: MySQL con ORM Sequelize y sincronizacion automatica de tablas
- **Seguridad**: Autenticacion con JWT y cifrado con Bcrypt
- **Validaciones**: Esquemas validados con Zod
- **Estilos**: Diseño con Tailwind CSS

---

## Requisitos Previos

Antes de comenzar, asegurate de tener instalados:

- **Node.js** (v16 o superior) → [Descargar](https://nodejs.org/)
- **npm** (incluido con Node.js)
- **MySQL** (v8.0 o superior)
- **Homebrew** (solo macOS, para instalar MySQL facilmente)

Verifica las versiones instaladas:

```bash
node --version
npm --version
mysql --version
```

---

## Instalacion

### 1. Clonar el Repositorio

```bash
git clone https://github.com/facMolina/tpo-liga-basquet.git
cd tpo-liga-basquet
```

### 2. Instalar Dependencias del Frontend

```bash
cd client
npm install
cd ..
```

### 3. Instalar Dependencias del Backend

```bash
cd server
npm install
cd ..
```

### 4. Configurar Variables de Entorno

En la carpeta `/server`, crea un archivo `.env`:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=liga_basquet
DB_PORT=3306
JWT_SECRET=tu_secreto_jwt_super_seguro
```

> **Nota:** Si configuraste una contraseña para el usuario root de MySQL, completala en `DB_PASSWORD`.

---

## Configuracion de MySQL Local

Seguir estos pasos para instalar y configurar MySQL en tu maquina local.

### macOS (con Homebrew)

#### 1. Instalar MySQL

```bash
brew install mysql
```

#### 2. Iniciar el servicio de MySQL

```bash
brew services start mysql
```

Para verificar que esta corriendo:

```bash
brew services list
```

Deberias ver `mysql` con estado `started`.

#### 3. Conectarse a MySQL

MySQL se instala sin contraseña para el usuario `root`. Para conectarte:

```bash
mysql -u root
```

#### 4. Crear la base de datos

Dentro de la consola de MySQL, ejecuta:

```sql
CREATE DATABASE IF NOT EXISTS liga_basquet;
```

Para verificar que se creo:

```sql
SHOW DATABASES;
```

Luego sali con:

```sql
EXIT;
```

#### 5. (Opcional) Asegurar la instalacion

Si queres configurar una contraseña para root y mejorar la seguridad:

```bash
mysql_secure_installation
```

> **Importante:** Si configuras una contraseña, actualizala en el archivo `.env` (`DB_PASSWORD=tu_contraseña`).

### Windows

#### 1. Descargar MySQL

Descargar el instalador desde [mysql.com/downloads](https://dev.mysql.com/downloads/mysql/).

#### 2. Instalar

Ejecutar el instalador y seguir el asistente. Seleccionar "MySQL Server" como minimo. Configurar la contraseña de root durante la instalacion.

#### 3. Verificar la instalacion

Abrir una terminal (cmd o PowerShell):

```bash
mysql -u root -p
```

Ingresar la contraseña configurada durante la instalacion.

#### 4. Crear la base de datos

```sql
CREATE DATABASE IF NOT EXISTS liga_basquet;
EXIT;
```

#### 5. Actualizar el `.env`

Completar `DB_PASSWORD` con la contraseña que configuraste.

### Linux (Ubuntu/Debian)

#### 1. Instalar MySQL

```bash
sudo apt update
sudo apt install mysql-server
```

#### 2. Iniciar el servicio

```bash
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### 3. Configurar y crear la base de datos

```bash
sudo mysql -u root
```

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'tu_contraseña';
FLUSH PRIVILEGES;
CREATE DATABASE IF NOT EXISTS liga_basquet;
EXIT;
```

Actualizar `DB_PASSWORD` en el archivo `.env`.

### Sincronizacion de tablas

Una vez que MySQL esta corriendo y la base de datos `liga_basquet` fue creada, las tablas se generan automaticamente al levantar el servidor:

```bash
cd server
npm run dev
```

Sequelize ejecuta `sync({ alter: true })` y crea las 5 tablas: `ligas`, `usuarios`, `equipos`, `jugadores` y `partidos`.

---

## Scripts de Ejecucion

### Frontend (localhost:5173)

```bash
cd client
npm run dev      # Inicia servidor de desarrollo con hot reload
npm run build    # Compila para produccion
npm run preview  # Visualiza la build de produccion
```

### Backend (localhost:3000)

```bash
cd server
npm run dev      # Inicia servidor con nodemon (recarga automatica)
npm start        # Inicia servidor en produccion
```

### Ejecutar Ambos Simultaneamente

Abrir una terminal para cada proyecto:

**Terminal 1 - Frontend:**
```bash
cd client && npm run dev
```

**Terminal 2 - Backend:**
```bash
cd server && npm run dev
```

---

## Estructura de Carpetas

```
tpo-liga-basquet/
├── client/                    # Frontend React + Vite
│   ├── src/
│   │   ├── main.jsx          # Punto de entrada React
│   │   ├── App.jsx           # Componente principal
│   │   ├── index.css         # Estilos globales + Tailwind
│   │   └── components/       # Componentes reutilizables
│   ├── index.html            # HTML base
│   ├── vite.config.js        # Configuracion Vite
│   ├── tailwind.config.js    # Configuracion Tailwind CSS
│   ├── postcss.config.js     # Configuracion PostCSS
│   └── package.json          # Dependencias frontend
│
├── server/                    # Backend Express + Node.js (MVC)
│   ├── config/
│   │   └── database.js       # Conexion Sequelize a MySQL
│   ├── models/               # Modelos Sequelize
│   │   ├── index.js          # Relaciones y exports
│   │   ├── Liga.js
│   │   ├── Usuario.js
│   │   ├── Equipo.js
│   │   ├── Jugador.js
│   │   └── Partido.js
│   ├── controllers/          # Logica de negocio (proxima feature)
│   ├── routes/               # Rutas API (proxima feature)
│   ├── middleware/            # Middlewares - auth, validaciones (proxima feature)
│   ├── app.js                # Punto de entrada del servidor
│   ├── .env                  # Variables de entorno (no versionado)
│   └── package.json          # Dependencias backend
│
├── .gitignore                # Archivos ignorados en Git
└── README.md                 # Este archivo
```

---

## Modelo de Base de Datos

### Tablas

#### Liga
| Campo       | Tipo    | Restricciones          |
|-------------|---------|------------------------|
| idLiga      | INTEGER | PK, Auto-incremental   |
| nombre      | STRING  | NOT NULL               |
| temporada   | STRING  | NOT NULL               |
| descripcion | TEXT    | Permite NULL           |

#### Usuario
| Campo         | Tipo    | Restricciones          |
|---------------|---------|------------------------|
| idUsuario     | INTEGER | PK, Auto-incremental   |
| usuario       | STRING  | NOT NULL, UNIQUE       |
| password_hash | STRING  | NOT NULL               |

#### Equipo
| Campo             | Tipo    | Restricciones          |
|-------------------|---------|------------------------|
| idEquipo          | INTEGER | PK, Auto-incremental   |
| nombre            | STRING  | NOT NULL               |
| entrenador        | STRING  | NOT NULL               |
| partidosGanados   | INTEGER | Default 0              |
| partidosEmpatados | INTEGER | Default 0              |
| partidosPerdidos  | INTEGER | Default 0              |
| puntosFavor       | INTEGER | Default 0              |
| puntosEnContra    | INTEGER | Default 0              |

#### Jugador
| Campo     | Tipo    | Restricciones                          |
|-----------|---------|----------------------------------------|
| idJugador | INTEGER | PK, Auto-incremental                   |
| nombre    | STRING  | NOT NULL                               |
| apellido  | STRING  | NOT NULL                               |
| categoria | STRING  | NOT NULL                               |
| idEquipo  | INTEGER | FK a Equipo, Permite NULL, ON DELETE SET NULL |

#### Partido
| Campo           | Tipo     | Restricciones        |
|-----------------|----------|----------------------|
| idPartido       | INTEGER  | PK, Auto-incremental |
| fecha           | DATEONLY | NOT NULL             |
| hora            | TIME     | NOT NULL             |
| lugar           | STRING   | NOT NULL             |
| puntosLocal     | INTEGER  | Permite NULL         |
| puntosVisitante | INTEGER  | Permite NULL         |
| idLocal         | INTEGER  | FK a Equipo          |
| idVisitante     | INTEGER  | FK a Equipo          |

### Relaciones

- **Equipo** 1:N **Jugador** — Un equipo tiene muchos jugadores. Si se elimina el equipo, `idEquipo` del jugador se setea en NULL.
- **Equipo** 1:N **Partido (Local)** — Un equipo tiene muchos partidos como local (`idLocal`).
- **Equipo** 1:N **Partido (Visitante)** — Un equipo tiene muchos partidos como visitante (`idVisitante`).

---

## Tecnologias Utilizadas

### Frontend
| Tecnologia    | Version | Proposito       |
|---------------|---------|-----------------|
| React         | 18.2+   | Libreria UI     |
| Vite          | 5.4+    | Bundler rapido  |
| Tailwind CSS  | 4.2+    | Estilos CSS     |
| Lucide-React  | 0.294+  | Iconos          |
| React Router  | 6.18+   | Navegacion      |

### Backend
| Tecnologia  | Version | Proposito            |
|-------------|---------|----------------------|
| Node.js     | 16+     | Runtime JavaScript   |
| Express     | 5.2+    | Framework web        |
| Sequelize   | 6.37+   | ORM MySQL            |
| MySQL2      | 3.20+   | Driver MySQL         |
| JWT         | 9.0+    | Autenticacion        |
| Bcrypt      | 3.0+    | Cifrado              |
| Zod         | 3.23+   | Validaciones         |
| Dotenv      | 17.3+   | Variables de entorno |

---

## Equipo

- **Facundo** - Full Stack Developer
- **Mateo** - Full Stack Developer

---

## Licencia

Este proyecto es de codigo cerrado para uso academico (TPO).
