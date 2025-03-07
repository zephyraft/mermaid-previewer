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
    regex: ".*example\\.com.*",
  },
}: Props): JSX.Element => {
  const inputRef = React.createRef<HTMLInputElement>();

  return (
    <>
      <InfoLabel
        required
        htmlFor={"regex-input"}
        info={
          <Link
            href="https://developer.mozilla.org/en-US/docs/Glossary/Regular_expression"
            target="_blank">
            Regular Expressions
            <OpenRegular />
          </Link>
        }>
        Regex
      </InfoLabel>
      <Input
        ref={inputRef}
        required
        type="text"
        id={"regex-input"}
        name={"regex"}
        placeholder={defaultValue.regex}
        defaultValue={defaultValue.regex}
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
