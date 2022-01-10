import { initDriver, sleep } from "./selenium-utils";
import { defaultMatchSelectorList } from "../src/utils/storage";
import { HadRenderedSelector } from "../src/content/selectors";
import { By } from "selenium-webdriver";
import { addGithubCookie } from "./cookie/github";
import { addBitbucketCookie } from "./cookie/bitbucket";

import robot from "robotjs";

import fs from "fs";
import os from "os";

let driver;

/**
 * 已被渲染的mermaid selectors
 */
const renderedMermaidSelector = defaultMatchSelectorList.map((selector) => {
  selector += HadRenderedSelector;
  return selector;
}).join(", ");

const bitbucketPreviewRenderedSelector = defaultMatchSelectorList.map((selector) => {
  selector = ".bb-content-container " + selector + HadRenderedSelector;
  return selector;
}).join(", ");

/**
 * 等待mermaid渲染
 */
const waitMermaidRender = async () => {
  const mermaid = await driver.waitElementLocated(By.css(renderedMermaidSelector));
  console.log(await mermaid.getAttribute("data-mermaid-previewer-raw"));
};

const waitBitbucketPreviewRender = async () => {
  await driver.waitElementLocated(By.css(bitbucketPreviewRenderedSelector));
  const mermaids = await driver.findElements(By.css(bitbucketPreviewRenderedSelector));
  for (const mermaid of mermaids) {
    console.log(await mermaid.getAttribute("data-mermaid-previewer-raw"));
  }
  return mermaids;
};

const checkMermaid = async (count, elements) => {
  let mermaids;
  if (elements) {
    mermaids = elements;
  } else {
    mermaids = await driver.findElements(By.css(renderedMermaidSelector));
  }
  expect(mermaids.length).toBe(count);
  for (const mermaid of mermaids) {
    // console.log(await mermaid.getAttribute("data-mermaid-previewer-raw"));
    const svg = await mermaid.findElement(By.tagName("svg"));
    expect(svg).toBeDefined();
  }
};

const clickDownloadMenu = async (element) => {
  await driver.actions()
    .move({origin:element})
    .contextClick()
    .perform();
  await sleep(100);

  // robotjs库 模拟系统点击，此处不能使用selenium，因为webdriver无法sendKeys到native上下文菜单
  robot.keyTap("up");
  robot.keyTap("up");
  robot.keyTap("up");
  robot.keyTap("enter");

  await sleep(100);
}

beforeAll(async () => {
  driver = await initDriver();
});

afterAll(async () => {
  driver.destroy();
});

describe("mermaid-render", () => {
  test("bitbucket-render", async () => {
    await driver.get("https://bitbucket.org/zephyraft/test/src/master/");
    await waitMermaidRender();
    await checkMermaid(1);
  });

  test("github-render", async () => {
    await driver.get("https://github.com/zephyraft/mermaid-previewer/blob/master/assets/example.md");
    await waitMermaidRender();
    await checkMermaid(14);
  });
});

describe("mermaid-edit-preview", () => {
  test("github-edit-preview", async () => {
    await driver.get("https://github.com/zephyraft/mermaid-previewer/blob/master/assets/example.md");
    await addGithubCookie(driver);
    await driver.navigate().refresh();
    // 编辑
    const editButton = await driver.waitElementLocated(By.css("form[action='/zephyraft/mermaid-previewer/edit/master/assets/example.md'] > button"));
    // const form = await driver.findElement(By.css("form[action='/zephyraft/mermaid-previewer/edit/master/assets/example.md']"));
    // console.log(await form.getAttribute("innerHTML"));
    // 点击preview按钮
    await editButton.click();
    console.log("editButton Click");
    // 等待edit加载完成
    const previewButton = await driver.waitElementLocated(By.className("preview"));
    await previewButton.click();
    console.log("previewButton Click");
    await waitMermaidRender();
    await checkMermaid(14);
  });
  test("bitbucket-edit-preview", async () => {
    await driver.get("https://bitbucket.org/zephyraft/test/src/master/README.md");
    await addBitbucketCookie(driver);
    await driver.navigate().refresh();
    // 编辑
    await driver.get("https://bitbucket.org/zephyraft/test/src/master/README.md?mode=edit&at=master");
    // 输入内容
    const codeEditorContainer = await driver.waitElementLocated(By.className("CodeMirror-code"));
    const lines = await codeEditorContainer.findElements(By.className("CodeMirror-line"));
    // for (const line of lines) {
    //   console.log(await line.getAttribute("innerHTML"));
    // }
    const firstLine = lines[0];
    await driver.actions().move({origin:firstLine}).click().sendKeys(" ").perform();
    console.log("input finish");
    // 点击preview按钮
    const previewButton = await driver.waitElementEnableAndVisible(By.className("render-button"));
    await previewButton.click();
    console.log("previewButton Click");
    const mermaids = await waitBitbucketPreviewRender();
    await checkMermaid(1, mermaids);
    // 取消
    const cancelButton = await driver.waitElementLocated(By.className("cancel-link"));
    await cancelButton.click();
    console.log("cancelButton Click");
    const confirmButton = await driver.waitElementEnableAndVisible(By.className("dialog-submit"));
    await confirmButton.click();
    console.log("confirmButton Click");
    await waitMermaidRender();
    await checkMermaid(1);
  });
});

describe("download", () => {
  test("download-failed", async () => {
    await driver.get("https://bitbucket.org/zephyraft/test/src/master/");
    await waitMermaidRender();
    await checkMermaid(1);
    const textElement = await driver.findElement(By.id("markdown-header-readme"));
    await clickDownloadMenu(textElement);

    const toast = await driver.waitElementLocated(By.className("toastify"));
    expect(await toast.getInnerHTML()).toBe('Please use it above the specific mermaid diagram<span class="toast-close">✖</span>');
  });

  const base64 = "iVBORw0KGgoAAAANSUhEUgAAAH8AAAA6CAYAAACZKIbMAAAAAXNSR0IArs4c6QAABYdJREFUeF7tnH9MlHUcxz/PcQOidAjEmgn9Io0VW8ZkLZdjJMrgCsexHZPfP0/jx4UMotSlwzlgJHQiZmKAzhGGy8qs4bLxR5GIa6VzZWIwKJajWQhIwT1Pe5517ILjnuf5fp8995z3ub/Y7vu57+f7ej3v5/k+t4djAF9eS4Dx2pXjwgHle/FBgPJRvhcT8OKlY/JRvhcT8OKlu0z+wdd+fsudbFiWOW2xRlx1Zw+0c7ubYWnTk3uXWoOo/Gc2BO2hBUBS/8v3ExN3btvWe7r8I9WDw6tjAsNJGNDWXL/412/muscfppIftSGItg/Z9Z8cHLpn5L+UtSo8MNRXNgOagonxf+B8268onwYibS2ffJQvkyImXyawBcMx+XT8FKnG5BNgxOQTQHMoweTT8VOkGpNPgBGTTwANk08HTelqTD4BUUw+ATRMPh00pasx+QREMfkE0LSS/P3734De3vNgsbwJiYkpslfirfJTUmJhampynpefnz+EhIRCXFwCpKXlgV6vl8TSbbd6k5N3IC1tM4SFPQL+/vdBY+P7khp2HOTN8teujYHkZJOAY2bmLly58h10d58AgyEViourJLF0m/yzZ7uhvb0Fdu6sherqV6Gt7SNYuTJMUtP2Qd4sf9Oml2Hbtor/8aqpqYJr136Azs4vJHF0m/yysmyIiHgKSkurITv7FYiPN0BmpllS054gPyYm5jGWZSMHBgbOiS1K7oaPP+07k19Xtxtu3PgRjh79UGxK4X23yB8ZGYKCglRoamqDyMgo6Og4DBcufA7t7R8Dw0h/akzLyefl22y2mxzHfanT6Q64OghI5PNhKSoqFyROT0/B5cvfQkPDHigpeR0SEpK1K7+11Qp9fb1w7NhpocmxsVHIydkCDQ3vQVTUc5Ia5wd5gnz7YlwdBCTyHTd8/Bw6nQ6MxgzIyysR/pbyUj35LMtCRkaSsDExmXLme6ysLIKwsEehvHy3lL6FMZ4k39VBQCJ/3br1YDSmCx87NzcHo6PD0NXVDitWBENtbYukHb/q8i9d+gZ27SpzKjgg4H7o6uoBX18/SQeAJ8p3dhCQyHd2zecPgPx8I1RW7oWNG5NEGaoun7+3Hx+/tWinOjs7C1VVZqHx2NjNoo3zA85Yb053flUR8Of0CHAc1yypSKVBDMMsB4Assek4joOs2Na/DQVP+0l9jGupDR8/l8HwgnALWFhoEZta3Q2f/d5++/YKSEoyLmrOfkbYt88q2vhC+ZIKNDpo64stkFz0LNDKHxoaBLPZBGbzDkhJ2Sq6WlWTz9/bHzpUL9yHBgYufuCzp+dTaGysgZMnz0FQUIho82esg9Of9b3dNPzHxTHRweoPCGYYRvSpZpZlv86N64hKzF+zXI58xy95bDabsGk+deo4fwaE5uYTsGwZf+Jx/VJVvsWSA/xXkfX17zrtij8zmEzxkJtbDKmpmWK9e+SGz+Gaf0Sv1x/o7++/TnLNd9zt87v74OAHITr6eUhPL4TQ0IdE2fEDVJUvqSMZgzxxw8dx3Lx0+1LlypeByOVQlK8UyQWfY/+Sx1nSF06J8gkkeELynSUd5RPIXliiZfnR0dFP+Pj4+PDXdLGlYvLFCDl5X8vy5SwH5cuh9d9YlE8AzaEEN3x0/BSpxuQTYMTkE0DD5NNBU7oak09AFJNPAA2TTwdN6WpMPgFRTD4BNEw+HTSlqzH5BEQx+QTQMPl00JSuxuQTEMXkE0DD5NNBU7oak09AFJNPAE3p5K9a/cAOujbIqm//PgP3yi9whoYHBJJRoKu6NXx3kvgXON8p+ymNbnraap+rnv7zq+5maLGu+WApC9L/eY7WI9ZrjgDK15wS9RpC+eqx1txMKF9zStRrCOWrx1pzM6F8zSlRr6F/AaOqOIaA4WCKAAAAAElFTkSuQmCC";

  test("download-success", async () => {
    await driver.get("https://bitbucket.org/zephyraft/test/src/master/");
    await waitMermaidRender();
    await checkMermaid(1);
    const mermaidElement = await driver.findElement(By.css(renderedMermaidSelector));
    await clickDownloadMenu(mermaidElement);

    const toast = await driver.waitElementLocated(By.className("toastify"));
    expect(await toast.getInnerHTML()).toBe('Export Success<span class="toast-close">✖</span>');
    fs.readdirSync(`${os.homedir}/Downloads`).filter(filename => filename.startsWith("mermaid-") && filename.endsWith(".png")).forEach(filename => {
      const file = `${os.homedir}/Downloads/${filename}`;
      const image = fs.readFileSync(file, {encoding: "base64"});
      console.log("data:image/png;base64," + image);
      expect(image).toBe(base64);
      console.log(`删除测试文件: ${file}`);
      fs.unlinkSync(file);
    });
  });
});