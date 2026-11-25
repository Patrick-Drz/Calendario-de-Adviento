# Calendario de Adviento (constelación)

24 estrellas que se encienden solas cada día, del 1 al 24 de diciembre (hora de Lima). Los mensajes viven en Firebase y las reglas impiden leer un mensaje antes de su día, aunque alguien cambie la hora del celular.

Sin configurar nada ya funciona en modo demo. Agrega `?probar` al enlace para ver todas las estrellas.

## Publicar en GitHub Pages
1. Crea un repositorio y sube todos estos archivos.
2. Settings → Pages → Deploy from a branch → `main` / `(root)`.
3. Tu enlace será `https://TU-USUARIO.github.io/NOMBRE-REPO/`.

## Conectar la nube (Firebase, plan gratuito)
1. En https://console.firebase.google.com crea un proyecto.
2. Build → Firestore Database → Create database (modo producción).
3. Build → Authentication → Sign-in method → activa **Google**. En Settings → Authorized domains agrega `TU-USUARIO.github.io`.
4. Project settings → Your apps → Web (`</>`) → copia el objeto de configuración en `firebase-config.js`. También cambia `NOMBRE`, `INTRO` y `ADMIN_EMAIL`.
5. Firestore → Rules → pega `firestore.rules`, cambia el correo y el año, y pulsa Publish.
6. Abre tu página, toca ✎ abajo, entra con tu cuenta de Google y toca cada estrella para escribir su mensaje. Las fotos van en la carpeta `img/` (ejemplo: `img/dia5.jpg`).

La `apiKey` de Firebase es pública por diseño. La seguridad está en `firestore.rules`.

## Contenido
- `contenido.js` trae las 24 estrellas ya escritas (mensajes, 4 preguntas, 3 vales y 3 fotos). Se muestran tal cual hasta que las cambies desde el modo creador.
- Fotos: súbelas a `img/` con estos nombres para que aparezcan: `dia05.jpg`, `dia12.jpg`, `dia24.jpg` (ya incluidas). En el modo creador puedes poner fotos en cualquier otra estrella.
- Canciones: pega un enlace de YouTube o Spotify, o sube un `.mp3` a `audio/` y escribe `audio/archivo.mp3`.
- Sus respuestas a las preguntas y la fecha en que abrió cada estrella las ves tú, en el modo creador, dentro de cada estrella.
- Después de cambiar `firestore.rules`, vuelve a pegarlas en Firebase y pulsa Publish.
