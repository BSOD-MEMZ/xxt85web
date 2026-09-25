# KaTeX (vendored)

本地化的数学排版引擎,供文章页 LaTeX 公式渲染使用。

- 上游:https://github.com/KaTeX/KaTeX
- 版本:0.16.9
- 许可:**MIT**
- 取用文件:`dist/katex.min.js`、`dist/katex.min.css`、`dist/fonts/*.woff2`
  (CSS 中指向 `.woff` / `.ttf` 的回退已被移除,只保留体积最小的 woff2)

为什么放在仓库里而不是引用 CDN:
本站对隐私和可用性要求较严,不依赖任何第三方 CDN —— 所有前端资源必须本地可寻址。

`contrib-auto-render.min.js` 保留在目录中但**未被使用**(它无法正确跳过代码块里的 `$`),
实际渲染逻辑见 `articles/katex-loader.js`。

升级方式:重新下载上述文件覆盖即可,`katex-loader.js` 无需改动。
