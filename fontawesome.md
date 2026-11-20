# Font Awesome

The build takes the stylesheet and WOFF2 files from the pinned `@fortawesome/fontawesome-free` package and inlines the fonts into `public/fontawesome.css`. Chrome injects that stylesheet when the extension renders a diagram. SVGs exported with Font Awesome icons include the bundled fonts and can be opened offline.
