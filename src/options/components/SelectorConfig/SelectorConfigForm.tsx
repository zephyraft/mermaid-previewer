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
}: Props): React.JSX.Element => {
  const matchInputRef = React.createRef<HTMLInputElement>();
  const selectorInputRef = React.createRef<HTMLInputElement>();

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
        ref={matchInputRef}
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
            CSS selector
            <OpenRegular />
          </Link>
        }>
        CSS selector
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
            aria-label="Clear CSS selector"
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
