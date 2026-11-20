import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Field,
  InfoLabel,
  Link,
  Select,
  Subtitle2,
  Switch,
} from "@fluentui/react-components";
import React from "react";

import { useSetting } from "../use-setting";

import {
  defaultDownloadSelectors,
  defaultExcludes,
  defaultMatchSelectors,
  storageKey,
} from "~core/options";
import ExcludeConfigTable from "~options/components/ExcludeConfig/ExcludeConfigTable";
import ExcludeConfigToolbar from "~options/components/ExcludeConfig/ExcludeConfigToolbar";
import SelectorConfigTable from "~options/components/SelectorConfig/SelectorConfigTable";
import SelectorConfigToolbar from "~options/components/SelectorConfig/SelectorConfigToolbar";
import { OpenRegular } from "@fluentui/react-icons";

export default () => {
  const [customExcludeConfigs, setCustomExcludeConfigs] = useSetting(
    storageKey.excludeURLs,
  );
  const [customMatchSelectors, setCustomMatchSelectors] = useSetting(
    storageKey.matchSelectors,
  );
  const [customDownloadSelectors, setCustomDownloadSelectors] = useSetting(
    storageKey.downloadSelectors,
  );
  const [renderer, setRenderer] = useSetting(storageKey.renderer);
  const [experimental, setExperimental] = useSetting(storageKey.experimental);

  return (
    <div>
      <Field
        className="mb-8 w-full max-w-80"
        label="Rendering engine"
        hint="Reload the page to see the change. Sandbox mode always uses Mermaid.js.">
        <Select
          value={renderer}
          onChange={(_, { value }) => {
            if (value === "pele" || value === "mermaid")
              void setRenderer(value);
          }}>
          <option value="pele">Pele (default)</option>
          <option value="mermaid">Mermaid.js (official)</option>
        </Select>
      </Field>
      <div className={"flex"}>
        <Subtitle2 className={"grow leading-10 pl-2"}>
          <InfoLabel
            size="large"
            info="Skip previews and exports on pages whose URLs match these rules.">
            URL exclusions
          </InfoLabel>
        </Subtitle2>
        <ExcludeConfigToolbar
          title="Add exclusion"
          setCustomConfigs={setCustomExcludeConfigs}
        />
      </div>
      <div>
        <ExcludeConfigTable
          defaultConfigs={defaultExcludes}
          customConfigs={customExcludeConfigs}
          setCustomConfigs={setCustomExcludeConfigs}
        />
      </div>
      <div className={"flex pt-10"}>
        <Subtitle2 className={"grow leading-10 pl-2"}>
          <InfoLabel
            size="large"
            info={
              <>
                <div>
                  Choose which elements contain Mermaid source on matching
                  pages.
                </div>
                <div>
                  <Link
                    href="https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions#allow_access"
                    target="_blank">
                    Enable access to file URLs
                    <OpenRegular />
                  </Link>
                </div>
              </>
            }>
            Preview rules
          </InfoLabel>
        </Subtitle2>
        <SelectorConfigToolbar
          title="Add preview rule"
          setCustomConfigs={setCustomMatchSelectors}
        />
      </div>
      <div>
        <SelectorConfigTable
          defaultConfigs={defaultMatchSelectors}
          customConfigs={customMatchSelectors}
          setCustomConfigs={setCustomMatchSelectors}
        />
      </div>
      <div className={"flex pt-10"}>
        <Subtitle2 className={"grow leading-10 pl-2"}>
          <InfoLabel
            size="large"
            info="Choose which elements contain diagrams already rendered by the website, so the extension can offer SVG downloads.">
            SVG export rules
          </InfoLabel>
        </Subtitle2>
        <SelectorConfigToolbar
          title="Add export rule"
          setCustomConfigs={setCustomDownloadSelectors}
        />
      </div>
      <div>
        <SelectorConfigTable
          defaultConfigs={defaultDownloadSelectors}
          customConfigs={customDownloadSelectors}
          setCustomConfigs={setCustomDownloadSelectors}
        />
      </div>
      <div className={"mt-8"}>
        <Accordion collapsible>
          <AccordionItem value="1">
            <AccordionHeader>Experimental</AccordionHeader>
            <AccordionPanel>
              <Switch
                checked={experimental.sandbox}
                onChange={async (ev) => {
                  await setExperimental({
                    sandbox: ev.currentTarget.checked,
                  });
                }}
                label={
                  <InfoLabel info="Render diagrams with Mermaid.js in an isolated frame. Font Awesome icons are unavailable in this mode.">
                    Sandbox
                  </InfoLabel>
                }
              />
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};
