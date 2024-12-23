# Mermaid Previewer

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/zephyraft/mermaid-previewer)](https://github.com/zephyraft/mermaid-previewer/releases)
[![GitHub package.json dependency version (prod)](https://img.shields.io/github/package-json/dependency-version/zephyraft/mermaid-previewer/mermaid)](https://github.com/mermaid-js/mermaid)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/oidjnlhbegipkcklbdfnbkikplpghfdl)](https://chrome.google.com/webstore/detail/mermaid-previewer/oidjnlhbegipkcklbdfnbkikplpghfdl)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/users/oidjnlhbegipkcklbdfnbkikplpghfdl)](https://chrome.google.com/webstore/detail/mermaid-previewer/oidjnlhbegipkcklbdfnbkikplpghfdl)

一款用于预览和导出网页中mermaid图的chrome扩展，完全本地渲染mermaid，不涉及远程api调用。

在符合预设规则的网站中，markdown中设置代码块语言为mermaid即可实现预览或导出：
```mermaid
graph LR
A --> B
```

同时，还提供了自定义规则配置的功能。

## 预设规则

- 排除url
  - `https:\/\/.*chrome\.google\.com.*`
  - `chrome:\/\/.*`
  - `chrome-extension:\/\/.*`
- 匹配选择器
  - `.*bitbucket\.org.*` 下的 `div.codehilite > pre`
    - 支持Bitbucket的预览和导出
  - `file:\/\/.*.mmd` 下的 `body > pre`
    - 支持`.mmd`文件的预览和导出
  - `.*gist\.github\.com.*` 下的 `div.highlight-source-mermaid > pre.notranslate`
    - 支持gist评论的预览和导出
- 下载选择器
  - `https:\/\/viewscreen\.githubusercontent\.com.*` 下的 `div.mermaid-view div.mermaid`
    - 支持GitHub的导出
  - `https:\/\/.*gitlab\.com.*` 下的 `div#app`
    - 支持Gitlab的导出

## 改动日志
- [1.4.4]  更新mermaid版本到10.5.0。新增实验功能sandbox模式。新增gist评论区预设规则。
- [1.4.3]  修复bug。
- [1.4.2]  更新mermaid版本到10.2.3，并适配quadrantChart，C4，mindmap，timeline图表。
- [1.4.1]  修复浮动按钮显示bug，增加复制code按钮。
- [1.4.0]  更新mermaid版本到10.2.0，使用plasmo框架重构代码，调整配置页面，导出功能使用浮动按钮提供。
- [1.3.0]  更新mermaid版本到10.1.0，导出功能改为导出svg，以支持更多样式和font-awesome。
- [1.2.9]  更新mermaid版本到10.0.2，支持font-awesome和gitGraph。
- [1.2.8]  更新mermaid版本到9.1.3，改进toast样式。
- [1.2.7]  更新mermaid版本到8.14.0，支持GitHub mermaid导出。
- [1.2.6]  更新mermaid版本到8.13.8，优化配置页交互与样式。
- [1.2.5]  更新mermaid版本到8.13.5，修复bitbucket预览问题。
- [1.2.4]  新增popup配置页，提供域名排除列表以及dom selector配置。
- [1.2.3]  更新mermaid版本到8.13.3。
- [1.2.2]  更新mermaid版本到8.13.2。
- [1.2.1]  修复Toast。
- [1.2.0]  新增mermaid图片导出。
- [1.1.0]  新增bitbucket支持，更新mermaid版本到8.12.1。
- [1.0.1]  更新mermaid版本到8.12.0。
- [1.0.0]  首次发布，mermaid版本8.11.5。

## TODO

- [x] 支持fontawesome。
- [x] 支持[mmd格式](https://github.com/mermaid-js/mermaid-cli)文件。
- [x] 增加浮动按钮，用于导出。
- [x] 增加浮动按钮，用于复制code。
- [x] 自动化测试。
- [x] 支持gist评论。需要搭配sandbox模式使用。
- [ ] 更多测试用例。

