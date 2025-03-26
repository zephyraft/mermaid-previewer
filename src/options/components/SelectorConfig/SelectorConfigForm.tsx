import { Button, InfoLabel, Input, Link } from "@fluentui/react-components";
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
    match: "https://example.com/*",
    selector: "pre > code",
  },
}: Props): JSX.Element => {
  const matchInputRef = React.createRef<HTMLInputElement>();
  const selectorInputRef = React.createRef<HTMLInputElement>();

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
        ref={matchInputRef}
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
              matchInputRef.current!.value = "";
              matchInputRef.current?.focus();
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
