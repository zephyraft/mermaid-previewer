import {
  Caption1,
  Field,
  InfoLabel,
  Link,
  Select,
  Subtitle2,
} from "@fluentui/react-components";
import React from "react";

import { bindRuleSettings, useSetting } from "../use-setting";

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
  const exclusions = bindRuleSettings(
    defaultExcludes,
    useSetting(storageKey.excludeURLs),
  );
  const previews = bindRuleSettings(
    defaultMatchSelectors,
    useSetting(storageKey.matchSelectors),
  );
  const exports = bindRuleSettings(
    defaultDownloadSelectors,
    useSetting(storageKey.downloadSelectors),
  );
  const [renderer, setRenderer] = useSetting(storageKey.renderer);

  return (
    <div>
      <Field
        className="mb-8 w-full max-w-xl"
        label={<strong className="font-bold">Rendering engine</strong>}
        hint={
          <div className="space-y-1">
            <div>
              Pele is recommended for faster previews and a smaller renderer.{" "}
              <Link
                href="https://pele.run/#why-pele"
                target="_blank"
                rel="noreferrer">
                Official performance comparison
              </Link>
            </div>
            <div>Reload preview pages to apply the change.</div>
          </div>
        }>
        <Select
          className="w-full max-w-80"
          value={renderer}
          onChange={(_, { value }) => {
            if (value === "pele" || value === "mermaid")
              void setRenderer(value);
          }}>
          <option value="pele">Pele (recommended)</option>
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
          setCustomConfigs={exclusions.setCustomConfigs}
          resetRules={exclusions.resetRules}
        />
      </div>
      <div>
        <ExcludeConfigTable {...exclusions} />
      </div>
      <div className={"flex pt-10"}>
        <Subtitle2 className={"grow leading-10 pl-2"}>
          <InfoLabel
            size="large"
            info={
              <>
                <div>
                  Choose which elements contain Mermaid source on matching
                  pages. Turn on Live updates to refresh a diagram as its source
                  changes.
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
          setCustomConfigs={previews.setCustomConfigs}
          resetRules={previews.resetRules}
        />
      </div>
      <div>
        <SelectorConfigTable
          {...previews}
          onLiveChange={previews.setRuleLive}
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
          setCustomConfigs={exports.setCustomConfigs}
          resetRules={exports.resetRules}
        />
      </div>
      <div>
        <SelectorConfigTable {...exports} />
      </div>
      <Caption1 as="p" className="mt-4 pl-2">
        Reload open pages to apply rule changes.
      </Caption1>
    </div>
  );
};
