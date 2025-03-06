import { Button, Input, Link, InfoLabel } from "@fluentui/react-components";
import {
  DocumentTableSearchRegular,
  GlobeRegular,
  OpenRegular,
} from "@fluentui/react-icons";
import React from "react";

import type { SelectorConfig } from "~types";

import Close from "../../icons/Close";

interface Props {
  defaultValue?: SelectorConfig;
}

export default ({
  defaultValue = {
    regex: ".*example\\.com.*",
    selector: "pre > code",
  },
}: Props): JSX.Element => {
  const regexInputRef = React.createRef<HTMLInputElement>();
  const selectorInputRef = React.createRef<HTMLInputElement>();

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
        ref={regexInputRef}
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
              regexInputRef.current!.value = "";
              regexInputRef.current?.focus();
            }}
          />
        }
      />
      <InfoLabel
        required
        htmlFor={"selector-input"}
        info={
          <Link
            href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors"
            target="_blank">
            CSS Selector
            <OpenRegular />
          </Link>
        }>
        Selector
      </InfoLabel>
      <Input
        ref={selectorInputRef}
        required
        type="text"
        id={"selector-input"}
        name={"selector"}
        placeholder={defaultValue.selector}
        defaultValue={defaultValue.selector}
        contentBefore={<DocumentTableSearchRegular />}
        contentAfter={
          <Button
            icon={<Close />}
            appearance={"transparent"}
            onClick={() => {
              selectorInputRef.current!.value = "";
              selectorInputRef.current?.focus();
            }}
          />
        }
      />
    </>
  );
};
