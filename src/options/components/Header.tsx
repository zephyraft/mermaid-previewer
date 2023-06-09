import {
  Body1,
  Button,
  Link,
  Title3,
  Tooltip
} from "@fluentui/react-components"
import React from "react"

import * as packageJson from "../../../package.json"
import Github from "../icons/Github"

const version = packageJson.version
export default (): JSX.Element => {
  const [githubIconRef, setGithubIconRef] =
    React.useState<HTMLSpanElement | null>(null)

  return (
    <div className="flex items-center h-16 px-6 border-b border-gray-30">
      <div className="flex-grow flex items-center gap-x-2">
        <Title3>
          <Link
            href="https://chrome.google.com/webstore/detail/mermaid-previewer/oidjnlhbegipkcklbdfnbkikplpghfdl"
            target="_blank"
            appearance="subtle"
            className="font-semibold hover:no-underline">
            Mermaid Previewer
          </Link>
        </Title3>
        <Body1 className="-mb-3.5">
          <Tooltip content="Changelog" relationship="label" withArrow>
            <Link
              href="https://www.github.com/zephyraft/mermaid-previewer/releases"
              target="_blank"
              appearance="subtle"
              className="hover:no-underline">
              v{version}
            </Link>
          </Tooltip>
        </Body1>
      </div>
      <Tooltip
        content="GitHub"
        relationship="label"
        withArrow
        positioning={{ target: githubIconRef }}>
        <Button
          icon={{
            ref: setGithubIconRef,
            children: <Github />
          }}
          as="a"
          href="https://www.github.com/zephyraft/mermaid-previewer"
          target="_blank"
          appearance="transparent"
          size="large"
        />
      </Tooltip>
    </div>
  )
}
