import { initDownload } from "./download";
import { queryAndSaveRaw, render } from "./render";
import { watchDomMutation } from "./mutation";

// 查询匹配的dom并保存raw code
queryAndSaveRaw(document).then(async (domList) => {
  /**
   * 首次进入页面时，执行render
   */
  await render(domList);
  /**
   * 监听动态插入的dom
   */
  await watchDomMutation();
  //  初始化下载
  await initDownload();
});

