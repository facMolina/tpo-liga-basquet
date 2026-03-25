# 🏀 TPO - Sistema de Gestión Liga de Básquet

Sistema integral para la gestión de equipos, jugadores y estadísticas de una liga de básquet, construido con una arquitectura moderna de Monorepo.

---

## 📋 Tabla de Contenidos

- [Características](#características)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Scripts de Ejecución](#scripts-de-ejecución)
- [Estructura de Carpetas](#estructura-de-carpetas)
- [Configuración del Backend](#configuración-del-backend)
- [Próximos Pasos](#próximos-pasos)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)

---

## ✨ Características

✅ **Frontend Moderno**: Interfaz responsive construida con React y Vite  
✅ **Backend Robusto**: API REST con Express y Sequelize  
✅ **Seguridad**: Autenticación con JWT y cifrado con Bcrypt  
✅ **Validaciones**: Esquemas validados con Zod  
✅ **Estilos**: Diseño elegante con Tailwind CSS  
✅ **Base de Datos**: MySQL con ORM Sequelize  

---

## 🔧 Requisitos Previos

Antes de comenzar, asegúrate de tener instalados:

- **Node.js** (v16 o superior) → [Descargar](https://nodejs.org/)
- **npm** (incluido con Node.js)
- **MySQL** (v5.7 o superior) → [Descargar](https://www.mysql.com/downloads/)

Verifica las versiones instaladas:

```bash
node --version
npm --version
mysql --version
```

---

## 📦 Instalación

### 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/tpo-liga-basquet.git
cd tpo-liga-basquet
```

### 2️⃣ Instalar Dependencias del Frontend

```bash
cd client
npm install
cd ..
```

### 3️⃣ Instalar Dependencias del Backend

```bash
cd server
npm install
cd ..
```

### 4️⃣ Configurar Variables de Entorno

En la carpeta `/server`, crea un archivo `.env`:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=liga_basquet
JWT_SECRET=tu_secreto_jwt_super_seguro
```

### 5️⃣ Inicializar la Base de Datos

```bash
cd server
npm run db:setup  # Crea las tablas (configura esto en package.json)
cd ..
```

---

## 🚀 Scripts de Ejecución

### Frontend (localhost:5173)

```bash
cd client
npm run dev      # Inicia servidor de desarrollo con hot reload
npm run build    # Compila para producción
npm run preview  # Visualiza la build de producción
```

### Backend (localhost:3000)

Primero, agrega estos scripts a `/server/package.json`:

```json
"scripts": {
  "dev": "nodemon index.js",
  "start": "node index.js",
  "db:setup": "node scripts/setup.js"
}
```

Luego ejecuta:

```bash
cd server
npm run dev      # Inicia servidor con nodemon (recarga automática)
npm start        # Inicia servidor en producción
```

### Ejecutar Ambos Simultáneamente (Optativo)

Abre una terminal para cada proyecto:

**Terminal 1 - Frontend:**
```bash
cd client && npm run dev
```

**Terminal 2 - Backend:**
```bash
cd server && npm run dev
```

---

## 📁 Estructura de Carpetas

```
tpo-liga-basquet/
├── client/                    # 🎨 Frontend React + Vite
│   ├── src/
│   │   ├── main.jsx          # Punto de entrada React
│   │   ├── App.jsx           # Componente principal
│   │   ├── index.css         # Estilos globales + Tailwind
│   │   └── components/       # Componentes reutilizables
│   ├── index.html            # HTML base
│   ├── vite.config.js        # Configuración Vite
│   ├── tailwind.config.js    # Configuración Tailwind CSS
│   ├── postcss.config.js     # Configuración PostCSS
│   └── package.json          # Dependencias frontend
│
├── server/                    # 🖥️ Backend Express + Node.js
│   ├── config/
│   │   └── database.js       # Configuración MySQL
│   ├── models/               # Modelos Sequelize
│   │   ├── Equipo.js
│   │   └── Jugador.js
│   ├── routes/               # Rutas API
│   │   ├── equipos.js
│   │   └── jugadores.js
│   ├── middleware/           # Middlewares (autenticación, etc)
│   │   └── auth.js
│   ├── controllers/          # Lógica de negocio
│   ├── index.js              # Punto de entrada servidor
│   └── package.json          # Dependencias backend
│
├── .gitignore                # Archivos a ignorar en Git
└── README.md                 # Este archivo 📄
```

---

## ⚙️ Configuración del Backend

### Crear Archivo de Entrada `/server/index.js`

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend funcionando ✅' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
```

### Crear Archivo `.env.example`

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=liga_basquet
JWT_SECRET=tu_secreto_jwt_aqui
```

---

## 🔜 Próximos Pasos

Una vez que tengas el entorno funcionando:

1. **🗄️ Configurar la Base de Datos**
   - Crear modelos Sequelize para `Equipo` y `Jugador`
   - Ejecutar migraciones automáticas

2. **🛣️ Crear Rutas API**
   - GET/POST/PUT/DELETE para equipos
   - GET/POST/PUT/DELETE para jugadores
   - Autenticación JWT

3. **🎨 Desarrollar Componentes Frontend**
   - Página de Login
   - Dashboard de Equipos
   - Lista de Jugadores
   - Formularios de CRUD

4. **🔐 Implementar Seguridad**
   - Validaciones con Zod
   - Autenticación con JWT
   - Cifrado de contraseñas con Bcrypt

5. **🚀 Deploy**
   - Vercel para el frontend
   - Railway/Heroku para el backend
   - Base de datos en la nube (Clever Cloud, PlanetScale)

---

## 🛠️ Tecnologías Utilizadas

### Frontend
| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| React | 18.2+ | Librería UI |
| Vite | 5.4+ | Bundler rápido |
| Tailwind CSS | 4.2+ | Estilos CSS |
| Lucide-React | 0.294+ | Iconos |
| React Router | 6.18+ | Navegación |

### Backend
| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| Node.js | 16+ | Runtime JavaScript |
| Express | 5.2+ | Framework web |
| Sequelize | 6.37+ | ORM MySQL |
| MySQL2 | 3.20+ | Driver MySQL |
| JWT | 9.0+ | Autenticación |
| Bcrypt | 3.0+ | Cifrado |
| Zod | 4.3+ | Validaciones |
| Dotenv | 17.3+ | Variables de entorno |

---

## 📚 Recursos Útiles

- [Documentación React](https://es.react.dev/)
- [Documentación Vite](https://vitejs.dev/)
- [Documentación Tailwind CSS](https://tailwindcss.com/)
- [Documentación Express](https://expressjs.com/)
- [Documentación Sequelize](https://sequelize.org/)
- [JWT Basics](https://jwt.io/)

---

## 👥 Equipo

- **Facundo** - Full Stack Developer
- **Mateo** - Full Stack Developer

---

## 📝 Licencia

Este proyecto es de código cerrado para uso académico (TPO).

---

## 💬 Soporte

Si encuentras problemas, abre un issue en el repositorio o contacta al equipo de desarrollo.

---

**Última actualización**: Marzo 2026 📅
