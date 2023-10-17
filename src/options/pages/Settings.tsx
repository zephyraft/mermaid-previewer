import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Subtitle2,
  Switch
} from "@fluentui/react-components";
import { InfoLabel } from "@fluentui/react-components/unstable"
import React from "react"

import { useStorage } from "@plasmohq/storage/hook"

import {
  defaultDownloadSelectors,
  defaultExcludes,
  defaultMatchSelectors,
  storageKey
} from "~core/options"
import ExcludeConfigTable from "~options/components/ExcludeConfig/ExcludeConfigTable"
import ExcludeConfigToolbar from "~options/components/ExcludeConfig/ExcludeConfigToolbar"
import SelectorConfigTable from "~options/components/SelectorConfig/SelectorConfigTable"
import SelectorConfigToolbar from "~options/components/SelectorConfig/SelectorConfigToolbar"
import type { ExcludeConfig, Experimental, SelectorConfig } from "~types";

export default (): React.JSX.Element => {
  const [customExcludeConfigs, setCustomExcludeConfigs] = useStorage<
    ExcludeConfig[]
  >(storageKey.excludeURLs, [])

  const [customMatchSelectors, setCustomMatchSelectors] = useStorage<
    SelectorConfig[]
  >(storageKey.matchSelectors, [])

  const [customDownloadSelectors, setCustomDownloadSelectors] = useStorage<
    SelectorConfig[]
  >(storageKey.downloadSelectors, [])

  const [experimental, setExperimental] = useStorage<
    Experimental
  >(storageKey.experimental, {
    sandbox: false,
  })

  return (
    <div>
      <div className={"flex"}>
        <Subtitle2 className={"flex-grow leading-10 pl-2"}>
          <InfoLabel
            size="large"
            info="The url exclusion configuration is used to disable extension script execution under specific urls">
            Exclude URL
          </InfoLabel>
        </Subtitle2>
        <ExcludeConfigToolbar
          title={"Add Exclude URL Regex"}
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
        <Subtitle2 className={"flex-grow leading-10 pl-2"}>
          <InfoLabel
            size="large"
            info="Matching selector is used to configure the dom element where mermaid is located under each url, so that the extension can correctly identify and render mermaid">
            Matching Selectors
          </InfoLabel>
        </Subtitle2>
        <SelectorConfigToolbar
          title={"Add Matching Selector"}
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
        <Subtitle2 className={"flex-grow leading-10 pl-2"}>
          <InfoLabel
            size="large"
            info="Download selector is different from matching selector. Download selector is applied to websites that natively support mermaid rendering, so that the extension can recognize the rendered mermaid for download and export">
            Download Selectors
          </InfoLabel>
        </Subtitle2>
        <SelectorConfigToolbar
          title={"Add Download Selector"}
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
                  <InfoLabel
                    info="Use sandbox mode to render mermaid, which has better security and style isolation, but does not support fontawesome.">
                    Sandbox
                  </InfoLabel>
                 }
              />
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
