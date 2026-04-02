# Website Joyeria

Base inicial del sitio hecha en codigo estatico.

## Estado actual

- `index.html`: home editorial de demo
- `configurador.html`: configurador 3D conectado a GLB externos
- `assets/css/site.css`: estilos de la home
- `assets/css/configurator.css`: estilos del configurador
- `assets/js/site.js`: interacciones ligeras de la home
- `assets/js/configurator.js`: logica 3D y selectores del configurador
- `assets/models/`: GLB organizados por categoria

## Modelos GLB organizados

- `assets/models/bandas/banda-base-01.glb`
- `assets/models/bandas/banda-base-02.glb`
- `assets/models/engastes/engaste-garras-clasico.glb`
- `assets/models/engastes/engaste-leaf.glb`
- `assets/models/piedras/piedra-diamante-base.glb`
- `assets/models/piedras/piedra-variante-01.glb`
- `assets/models/catalog.json`: inventario con nombres sugeridos y archivo original

## Decisiones tomadas

- El configurador ya no depende del HTML gigante con Base64: ahora carga GLB externos desde `assets/models/`.
- La cotizacion se resolvio de forma simple con `mailto:` para no depender de backend en esta etapa.
- La interfaz del configurador ya permite cambiar banda, engaste y piedra, pero algunas variantes nuevas pueden requerir microajustes visuales.

## Siguientes mejoras recomendadas

1. Sustituir `ventas@example.com` por el correo real del negocio.
2. Verificar visualmente metales, sombra y alineacion del anillo en desktop y mobile.
3. Afinar las transformaciones de los GLB nuevos y confirmar que cada combinacion encaje bien.
4. Cuando ya exista contenido final de marca, completar home con fotos reales, colecciones y textos definitivos.
