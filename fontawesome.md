# Font Awesome

The build takes the stylesheet and WOFF2 files from the pinned `@fortawesome/fontawesome-free` package and inlines the fonts into `public/fontawesome.css`. Chrome injects that stylesheet for Mermaid.js, and adds it to SVG exports that contain Font Awesome font glyphs.

For Pele, the build also generates a catalog of Font Awesome SVGs and aliases. The extension resolves only the icons a diagram references and embeds those paths directly, so the exported SVG carries the icons with it.
