Responsabilidad:

Código que vive dentro del iframe.
Envía mensajes al Content Script.
Recibe mensajes del Content Script.+

extension/
│
├── manifest.json
├── background.js
├── content.js
│
└── sidebar/
    ├── sidebar.html
    ├── sidebar.css
    └── sidebar.js


# Archivo background.js
* Totalmente stateless.
* Sólo devuelve el tabId actual.

# Archivo content.js
* Obtiene tabId.
* Mantiene estado por tab.
* Crea botón toggle.
* Crea sidebar iframe.
* Maneja comunicación.

# sidebar/sidebar.js

* Código que vive dentro del iframe.
* Envía mensajes al Content Script.
* Recibe mensajes del Content Script.


Qué valida esta base

Con estos 5 archivos puedes probar:

✅ Un sidebar independiente por tab.

✅ Toggle real (abrir/cerrar).

✅ Sin SidePanel API.

✅ Sin restricciones de user gesture.

✅ Service Worker totalmente stateless.

✅ Estado persistido por tab mediante:

sidebar:<tabId>

content.js
    ↔
sidebar iframe

Archivo: shared/eventBus.js