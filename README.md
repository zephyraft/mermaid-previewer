# Mermaid Previewer

A chrome extension for previewing and exporting mermaid in github/bitbucket.

Set the code block language to mermaid in markdown:
```mermaid
graph LR
A --> B
```

Right-click on the rendered mermaid image and select "Export png" to export the png image.

## Support list

- [x] GitHub
  - [x] readme
  - [x] markdown preview
  - [x] edit preview
  - [x] gist(need to match *.md)
  - [x] comment
  - [x] issue
  - [x] ...
- [x] Bitbucket
  - [x] readme
  - [x] markdown preview
  - [x] edit preview
  - [x] ...
- [x] mermaid picture export.
- [x] Provide custom exclusion list and rule list configuration capabilities.


At the same time, the following pages with dom structure are supported:
```html
<pre lang="mermaid">
  <code>
    graph LR
    A --> B
  </code>
</pre>
```
or
```html
<div class="codehilite">
  <pre>
    graph LR
    A --> B
  </pre>
</div>
```


## Config

You can customize the configuration to support and exclude more websites. The default configuration of the extension is as follows:

Exclude Domain:
```
chrome.google.com
gitlab.com
```
Match Selectors:
```
pre[lang='mermaid'] > code
div.codehilite > pre
```

## Changelog
- [1.2.6]  Update mermaid version to 8.13.8, optimize configuration page interaction and style.
- [1.2.5]  Update mermaid version to 8.13.5, fix preview issue of Bitbucket.
- [1.2.4]  Added popup options page, providing domain exclusion and dom selector configuration.
- [1.2.3]  Update mermaid version to 8.13.3.
- [1.2.2]  Update mermaid version to 8.13.2.
- [1.2.1]  Fix Toast.
- [1.2.0]  Mermaid picture export.
- [1.1.0]  Added bitbucket support, updated mermaid version to 8.12.1.
- [1.0.1]  Update mermaid version to 8.12.0.
- [1.0.0]  First released, mermaid version 8.11.5.

## TODO

- [x] autotest suit
- [ ] ...

## Vendor List

- https://github.com/mermaid-js/mermaid
- https://github.com/apvarun/toastify-js
- Thanks to [JetBrains](https://www.jetbrains.com/?from=ferry) open source license authorization
  <p>
   <a href="https://www.jetbrains.com/?from=ferry">
     <img height="100" src="https://www.jetbrains.com/company/brand/img/logo6.svg" alt="">
   </a>
  </p>
- https://github.com/tailwindlabs/tailwindcss
