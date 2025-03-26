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
}: Props): JSX.Element => {
  const inputRef = React.createRef<HTMLInputElement>();

  return (
    <>
      <InfoLabel
        required
        htmlFor={"match-input"}
        info={
          <Link
            href="https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns"
            target="_blank">
            Match Patterns
            <OpenRegular />
          </Link>
        }>
        Match Patterns
      </InfoLabel>
      <Input
        ref={inputRef}
        required
        type="text"
        id={"match-input"}
        name={"match"}
        placeholder={defaultValue.match}
        defaultValue={defaultValue.match}
        contentBefore={<GlobeRegular />}
        contentAfter={
          <Button
            icon={<Close />}
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
