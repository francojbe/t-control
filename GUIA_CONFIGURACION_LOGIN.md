# Guía de Configuración: Inicio de Sesión y Seguridad

## 🌍 URL Configuration (CRUCIAL para todo)

Para que Google, Apple y las Huellas (Passkeys) funcionen, Supabase necesita saber tu URL exacta.

1. Ve a **Authentication** -> **URL Configuration**.
2. **Site URL**:
   - Para desarrollo local, pon: `http://localhost:5173`
   - (Asegúrate que no tenga barra al final o espacios).
3. **Redirect URLs**:
   - Añade: `http://localhost:5173`
   - Añade: `http://localhost:5173/`
   - Si usas tu celular, añade tu IP: `http://192.168.1.XX:5173` (aunque las huellas NO funcionarán por IP, solo Google/login normal).

---

## � Sobre la HUELLA / FACEID (WebAuthn)

Al parecer, tu panel de Supabase **no muestra la opción explícita "WebAuthn"** en el menú principal. Esto es común en algunas versiones del panel.

**Qué hacer:**
1. Ve a **Authentication** -> **Providers** -> **Phone** y revisa si hay alguna opción dentro que diga "Marketing" o "WebAuthn". Si no, déjalo estar.
2. Si no aparece en ningún lado, **se asume que está activado por defecto** o que depende únicamente de que el código lo solicite.
3. Intenta registrar la huella desde la app (botón "Activar Huella").
   - Si te sale error `WebAuthn is not enabled`, entonces contactaremos a soporte o buscaremos la opción "Preview Features".
   - Si te sale error `RP ID`, es porque tu **Site URL** (Paso 1) está mal puesta.

**Nota Importante**: Las huellas digitales **SOLO** funcionan en:
- `http://localhost:...` (Tu PC).
- `https://...` (Sitios con candadito/producción).
- **NO** funcionan entrando por IP (`http://192.168...`).

---

## 🟢 Configurar Google Login

1. Ve a **Providers** -> **Google**.
2. Copia la **Redirect URL** que te muestra arriba (ej: `https://...supabase.co/auth/v1/callback`).
3. Ve a [Google Cloud Console](https://console.cloud.google.com/).
4. Crea Credenciales OAuth con esa URL.
5. Copia Client ID y Secret a Supabase.

---

## 🍎 Configurar Apple Login

(Solo si tienes cuenta Developer pagada).
1. Configura en **Providers** -> **Apple** con tus llaves `.p8` de Apple.
