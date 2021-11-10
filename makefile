update-vendor:
	curl --request GET -sL \
	     --url 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js' \
	     --output './static/vendor/mermaid.min.js' && \
    curl --request GET -sL \
		 --url 'https://cdn.jsdelivr.net/npm/toastify-js' \
		 --output './static/vendor/toastify.min.js' && \
	curl --request GET -sL \
		 --url 'https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css' \
		 --output './static/vendor/toastify.min.css'
zip:
	zip -r -X ~/Downloads/mermaid-perviewer.zip \
	  src \
      static \
	  manifest.json
