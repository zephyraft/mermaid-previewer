# Mermaid Previewer

一款用于预览markdown中mermaid图的chrome插件, 本地渲染mermaid图, 不涉及远程api调用.
目前支持github和bitbucket, 适配mermaid 8.12.1版本.

markdown中设置代码块语言为mermaid:
```mermaid
graph LR
A --> B
```

## 支持列表

- [x] GitHub
  - [x] readme
  - [x] markdown preview
  - [x] edit preview
  - [x] gist(需要名称匹配*.md)
  - [x] comment
  - [x] issue
  - [x] ...
- [x] Bitbucket
  - [x] readme
  - [x] markdown preview
  - [x] edit preview
  - [x] ...

同时支持以下dom结构的页面:
```html
<pre lang="mermaid">
  <code>
    graph LR
    A --> B
  </code>
</pre>
```
或者
```html
<div class="codehilite">
  <pre>
    graph LR
    A --> B
  </pre>
</div>
```

## 排除列表

以下网站原生支持mermaid或存在dom结构冲突, 所以从本插件排除.
- gitlab.com
- clickhouse.tech

## TODO

- [X] mermaid图片导出.
- [ ] 提供自定义排除列表和规则列表配置能力.
- [ ] ...

## 供应商列表

- https://github.com/mermaid-js/mermaid

## 改动日志
- 1.2.0   mermaid图片导出.
- 1.1.0   新增bitbucket支持, 更新mermaid版本到8.12.1.
- 1.0.1   更新mermaid版本到8.12.0.
- 1.0.0   首次发布, mermaid版本8.11.5.
