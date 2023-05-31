import type { Page } from "@playwright/test"

import {
  BITBUCKET_MERMAID_COUNT,
  BITBUCKET_URL,
  MMD_URL,
  getCopyButtonLocator,
  getFloatButtonContainerLocator,
  getMermaidSVGLocator
} from "./content.utils"
import { expect, test } from "./fixtures"

// noinspection HttpUrlsUsage
const FLOW_CODE = `flowchart LR
    id
    id1[This is the text in the box]
    Start --> Stop
    click id "http://www.github.com" _blank
    id1(Start)-->id2(Stop)
    style id1 fill:#f9f,stroke:#333,stroke-width:4px
    style id2 fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5 5
    A[Hard edge] -->|Link text| B(Round edge)
    B --> C{Decision}
    C -->|One| D[Result one]
    C -->|Two| E[Result two]
`

const GIT_CODE = `---
title: Example Git diagram
---
gitGraph
   commit
   commit
   branch develop
   checkout develop
   commit
   commit
   checkout main
   merge develop
   commit
   commit
`

const MMD_CODE = `flowchart TD
    B["fab:fa-twitter for peace"]
    B-->C[fa:fa-ban forbidden]
    B-->D(fa:fa-spinner)
    B-->E(A fa:fa-camera-retro perhaps?)
`

test("bitbucket复制", async ({ page }) => {
  await page.goto(BITBUCKET_URL)
  await page.waitForLoadState()
  const floatButtonContainerLocator = getFloatButtonContainerLocator(page)
  const copyButtonLocator = getCopyButtonLocator(floatButtonContainerLocator)
  await prepareCopy(page, 0)
  await copyButtonLocator.click()
  await checkClipboard(page, FLOW_CODE)

  await prepareCopy(page, BITBUCKET_MERMAID_COUNT - 1)
  await expect(floatButtonContainerLocator).toBeInViewport()
  await copyButtonLocator.click()
  await checkClipboard(page, GIT_CODE)
})

test("mmd复制", async ({ page }) => {
  await page.goto(MMD_URL)
  await page.waitForLoadState()
  const floatButtonContainerLocator = getFloatButtonContainerLocator(page)
  const copyButtonLocator = getCopyButtonLocator(floatButtonContainerLocator)
  await prepareCopy(page, 0)
  await copyButtonLocator.click()
  await checkClipboard(page, MMD_CODE)
})

async function checkClipboard(page: Page, expectValue: string) {
  const actualValue = await page.evaluate(async () => {
    return navigator.clipboard.readText()
  })
  await expect(actualValue).toEqual(expectValue)
}

async function prepareCopy(page: Page, index: number) {
  const floatButtonContainerLocator = getFloatButtonContainerLocator(page)
  const mermaidSVGLocator = getMermaidSVGLocator(page)

  await mermaidSVGLocator.nth(index).hover()
  await expect(floatButtonContainerLocator).toBeInViewport()
}
