
# Configuración de Autenticación (Google & Apple) con Supabase

Para que los botones de Google y Apple funcionen realmente, necesitas conectar esta aplicación con un proyecto de **Supabase** (que es gratuito). Sigue estos pasos:

## 1. Crear Proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com) y crea una cuenta "Start your project".
2. Crea un nuevo proyecto y dale el nombre "TechManager".
3. Espera unos segundos a que se cree la base de datos.
4. Ve a **Settings** (icono de engranaje) -> **API**.
5. Copia la **URL** del proyecto y la clave **anon** / **public**.

## 2. Configurar el Código
1. En la carpeta raíz de tu proyecto, crea un archivo llamado `.env` (si no existe).
2. Pega las claves que copiaste así:

```env
VITE_SUPABASE_URL=pega-tu-url-aqui
VITE_SUPABASE_ANON_KEY=pega-tu-clave-anon-aqui
```

## 3. Activar Google Login
1. En el panel de Supabase, ve a **Authentication** -> **Providers**.
2. Busca **Google** y actívalo.
3. Te pedirá `Client ID` y `Client Secret`.
4. Para obtenerlos, debes ir a [Google Cloud Console](https://console.cloud.google.com/):
   - Crea un nuevo proyecto.
   - Configura la pantalla de consentimiento OAuth (External -> User Support Email).
   - Ve a **Credentials** -> **Create Credentials** -> **OAuth Client ID** (Web Application).
   - En **Authorized redirect URIs**, pega la URL que te da Supabase en la página de configuración del proveedor (algo como `https://tuproyecto.supabase.co/auth/v1/callback`).
   - Copia el Client ID y Secret y pégalos en Supabase.
   - ¡Listo!

## 4. Activar Apple Login
*(Apple requiere tener una cuenta de desarrollador pagada anual, $99 USD)*.
1. Si la tienes, el proceso es similar: Ve a Supabase -> Providers -> Apple.
2. Necesitas generar un `Service ID` y una `Secret Key` desde el portal Apple Developer e introducirlos en Supabase.

Una vez hechos estos pasos, ¡reinicia la terminal (`npm run dev`) y los botones funcionarán mágicamente!
