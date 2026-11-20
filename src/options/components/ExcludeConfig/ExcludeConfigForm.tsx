import { Button, InfoLabel, Input, Link } from "@fluentui/react-components";
import { GlobeRegular, OpenRegular } from "@fluentui/react-icons";
import React from "react";

import type { ExcludeConfig } from "~types";

import Close from "../../icons/Close";

interface Props {
  defaultValue?: ExcludeConfig;
}

export default ({
  defaultValue = {
    match: "https://example.com/*",
  },
}: Props): React.JSX.Element => {
  const inputRef = React.createRef<HTMLInputElement>();

  const isLegacy = defaultValue.regex !== undefined;
  const pattern = defaultValue.match ?? defaultValue.regex;
  const label = isLegacy ? "URL regular expression" : "URL match pattern";
  const helpLink = isLegacy
    ? "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions"
    : "https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns";

  return (
    <>
      <InfoLabel
        required
        htmlFor={"match-input"}
        info={
          <Link href={helpLink} target="_blank">
            {label}
            <OpenRegular />
          </Link>
        }>
        {label}
      </InfoLabel>
      <Input
        ref={inputRef}
        required
        type="text"
        id={"match-input"}
        name={"match"}
        placeholder={pattern}
        defaultValue={pattern}
        contentBefore={<GlobeRegular />}
        contentAfter={
          <Button
            icon={<Close />}
            aria-label="Clear URL pattern"
            appearance={"transparent"}
            onClick={() => {
              inputRef.current!.value = "";
              inputRef.current?.focus();
            }}
          />
        }
      />
    </>
  );
};
