# 📅 Sistema de Reservas de Clases

Aplicación web full-stack para gestionar reservas de clases particulares entre una profesora y sus alumnos. Permite a los alumnos solicitar y pagar clases online, mientras que la profesora administra su agenda, confirma clases y verifica pagos, todo en tiempo real.

---

## ¿De qué trata el proyecto?

El sistema cubre el flujo completo de una clase particular:

1. **El alumno** inicia sesión con su cuenta de Google, elige un horario disponible y reserva una clase.
2. **Sube un comprobante de pago** (foto del ticket) que queda almacenado en la nube.
3. **La profesora (admin)** recibe una notificación en tiempo real, revisa el comprobante, confirma o cancela la clase y, al finalizarla, registra los temas vistos y comentarios para el alumno.
4. **El alumno** puede ver el estado de todas sus clases, recibir notificaciones push en el navegador cuando su clase es confirmada o su pago es aprobado, y actualizar su perfil.

### Funcionalidades principales

| Módulo | Descripción |
|---|---|
| **Autenticación** | Login con Google vía OAuth. El admin puede verificar manualmente nuevas cuentas de alumnos antes de que puedan reservar. |
| **Panel del Alumno** | Reserva de clases (seleccionando fecha y hora disponible), agenda personal, upload de comprobante de pago y edición de perfil. |
| **Panel del Admin** | Agenda mensual, gestión de clases pendientes, listado de alumnos, verificación de cuentas nuevas y cierre de clases con resumen pedagógico. |
| **Tiempo Real** | Notificaciones toast instantáneas para ambos roles vía WebSockets (Supabase Realtime). |

---

## 🛠️ Tecnologías utilizadas

### Frontend

| Tecnología | Versión | ¿Por qué? |
|---|---|---|
| **Next.js** | 16 | Framework React con App Router. Provee enrutamiento basado en carpetas, Server Components y una excelente experiencia de desarrollo. Se eligió sobre Create React App por su estructura de rutas más clara y sus optimizaciones de producción integradas. |
| **React** | 19 | Librería base para construir la UI con componentes reutilizables. |
| **TypeScript** | 5 | Tipado estático que previene errores en tiempo de desarrollo y mejora el autocompletado, fundamental en un proyecto con múltiples capas de datos (perfiles, clases, estados). |
| **Tailwind CSS** | 4 | Framework CSS utility-first que permite diseñar directamente en el JSX sin saltar entre archivos. La versión 4 elimina el archivo de configuración y funciona con PostCSS puro. |
| **Framer Motion** | 12 | Librería de animaciones declarativa para React. Se usa para las transiciones entre vistas (tabs), los modales y los toasts de notificación, dando una sensación de app nativa. |
| **Lucide React** | — | Set de íconos SVG consistentes y livianos, co-diseñados para React. |
| **FullCalendar** | 6 | Componente de calendario interactivo con soporte de grilla de días y tiempo. Se eligió por su madurez, capacidad de integrarse con React y soporte para eventos superpuestos. |
| **date-fns** | 4 | Librería de utilidades de fechas modular y liviana, usada para comparar y formatear las fechas de las clases. |

### Backend & Infraestructura

| Tecnología | ¿Por qué? |
|---|---|
| **Supabase** | BaaS (Backend as a Service) que provee base de datos PostgreSQL, autenticación OAuth, almacenamiento de archivos (para los comprobantes) y canales de Realtime basados en WebSockets. Permite tener un backend completo sin escribir un servidor propio. |
| **Supabase Auth** | Maneja el flujo completo de OAuth con Google (redirect, callback, sesión). El cliente SSR (`@supabase/ssr`) asegura que las cookies de sesión funcionen correctamente en el entorno de Next.js. |
| **Supabase Realtime** | Escucha cambios en la tabla `clases` vía `postgres_changes` para disparar notificaciones instantáneas sin necesidad de polling. |
| **Supabase Storage** | Almacena los comprobantes de pago (imágenes) subidos por los alumnos, con URLs públicas para que el admin las pueda visualizar y descargar. |

---

## 🚀 Cómo correr el proyecto

### Requisitos previos

- Node.js 18+
- Una cuenta y proyecto en [Supabase](https://supabase.com)
- Una aplicación OAuth configurada en Google Cloud Console

### Variables de entorno

Creá un archivo `.env.local` en la raíz con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

### Instalación y desarrollo

```bash
# Instalar dependencias
npm install

# Correr el servidor de desarrollo
npm run dev
```
brí [http://localhost:3000](http://localhost:3000) en tu navegador.

### Build de producción

```bash
npm run build
npm run start
```

---

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx              # Landing con login via Google
│   ├── auth/callback/        # Manejo del redirect OAuth
│   ├── dashboard/            # Redirección post-login según rol
│   ├── admin/dashboard/      # Panel de la profesora (agenda, acciones, alumnos, verificación)
│   └── alumno/dashboard/     # Panel del alumno (reservar, agenda, perfil)
├── components/
│   └── ModalCustom.tsx       # Modal reutilizable de confirmación
└── utils/
    └── supabase/             # Clientes de Supabase (browser y server)
```


## Procedimiento de solicitar una Reserva
<div align="center">
  <img src="./assets/Adobe Express - Reservar una clase.gif" alt="Demostración del proceso" width="100%">
</div>
