import { type Mermaid } from "mermaid";
import { queryAndSaveRaw, render } from "./render";
import { watchDomMutation } from "./mutation";

export const preview = async () => {
  console.log("previewRes");
  // @ts-ignore
  const mermaid = window.mermaid as Mermaid;
  console.log("mermaid", mermaid);

  // 禁止自动render .mermaid类的dom，避免类似github下的报错问题
  mermaid.initialize({ startOnLoad: false });

  queryAndSaveRaw(document)
    .then(async (domList) => {
      /**
       * 首次进入页面时，执行render
       */
      await render(mermaid, domList);
      /**
       * 监听动态插入的dom
       */
      await watchDomMutation(mermaid);
    })
    .catch((e) => {
      console.error(e);
    });
};
