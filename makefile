update-vendor:
	curl --request GET -sL \
	     --url 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js'\
	     --output './vendor/mermaid.min.js'
zip:
	zip -r -X ~/Downloads/mermaid-dev.zip \
	  icon \
	  vendor/mermaid.min.js \
	  background.js \
	  manifest.json \
	  mermaid-render.js
