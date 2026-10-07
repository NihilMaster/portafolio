# Portafolio de Proyectos

Sitio web personal que reúne mis proyectos publicados en GitHub, junto con certificaciones y experiencia profesional.

## Estructura

- `index.html` — Estructura del sitio.
- `styles.css` — Estilos, incluyendo tema claro y oscuro.
- `script.js` — Navegación, filtros, modal de proyectos y carga de certificados.
- `data/svg.js` — Iconos SVG para tecnologías.
- `data/sources.json` — Fuente de datos de certificados.
- `src/banner/` — Imágenes de portada de los proyectos.

## Secciones

- **Proyectos**: tarjetas filtrables por categoría. Cada tarjeta abre un modal con descripción, tecnologías, topics y el README del repositorio.
- **Certificados**: credenciales obtenidas, cargadas desde `data/sources.json`.
- **Experiencia**: sección en construcción.

## Tecnologías

- HTML, CSS y JavaScript sin frameworks.
- GitHub REST API con caché en `localStorage`.
- `marked` para renderizar el README.
- Font Awesome e iconos SVG propios.

## Ejecución local

Puedes ejecutar la aplicación localmente utilizando uno de los siguentes comandos en la carpeta del proyecto y abriendo la URL `http://localhost:8000`.

1. Python

```bash
python -m http.server 8000
```

2. Node

```bash
npx serve .
```
