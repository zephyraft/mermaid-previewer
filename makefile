update-vendor:
	curl --request GET -sL \
	     --url 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js' \
	     --output './vendor/mermaid.min.js' && \
    curl --request GET -sL \
		 --url 'https://cdn.jsdelivr.net/npm/toastify-js' \
		 --output './vendor/toastify.min.js' && \
	curl --request GET -sL \
		 --url 'https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css' \
		 --output './vendor/toastify.min.css'
zip:
	zip -r -X ~/Downloads/mermaid-dev.zip \
	  icon \
	  vendor/mermaid.min.js \
	  vendor/toastify.min.js \
	  vendor/toastify.min.css \
	  background.js \
	  manifest.json \
	  mermaid-render.js
