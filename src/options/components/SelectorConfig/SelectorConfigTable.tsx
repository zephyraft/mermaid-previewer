import {
  DocumentTableSearchRegular,
  GlobeRegular,
} from "@fluentui/react-icons";
import React from "react";

import type { SelectorConfig } from "~types";

import ConfigTable, { type Column, type Row } from "../ConfigTable";
import SelectorConfigForm from "./SelectorConfigForm";

const columns: Column[] = [
  {
    key: "match",
    label: "URL pattern",
  },
  {
    key: "selector",
    label: "CSS selector",
  },
];

const getRow = (
  index: number,
  matchSelector: SelectorConfig,
  isDefault: boolean,
): Row => {
  return {
    key: index,
    cells: [
      {
        key: "match",
        value: matchSelector.match ?? matchSelector.regex,
        icon: <GlobeRegular />,
        default: isDefault,
      },
      {
        key: "selector",
        value: matchSelector.selector,
        icon: <DocumentTableSearchRegular />,
        default: isDefault,
      },
    ],
  };
};

interface TableProps {
  defaultConfigs: SelectorConfig[];
  customConfigs: SelectorConfig[];
  setCustomConfigs: React.Dispatch<React.SetStateAction<SelectorConfig[]>>;
}

const getIndexOfCustomSelectors = (
  row: Row,
  defaultSelectors: SelectorConfig[],
): number => {
  return row.key - defaultSelectors.length;
};

export default ({
  defaultConfigs,
  customConfigs,
  setCustomConfigs,
}: TableProps): React.JSX.Element => {
  const rows: Row[] = React.useMemo(
    () =>
      defaultConfigs
        .map((matchSelector, index) => getRow(index, matchSelector, true))
        .concat(
          customConfigs.map((matchSelector, index) =>
            getRow(index + defaultConfigs.length, matchSelector, false),
          ),
        ),
    [defaultConfigs, customConfigs],
  );

  return (
    <ConfigTable
      columns={columns}
      rows={rows}
      editFormTitle="Edit rule"
      editForm={(row) => (
        <SelectorConfigForm
          defaultValue={
            customConfigs[getIndexOfCustomSelectors(row, defaultConfigs)]
          }
        />
      )}
      onEdit={(row, setOpen, ev) => {
        const formData = new FormData(ev.target as HTMLFormElement); // 通过event.target获取表单元素，然后使用FormData获取表单数据
        const match = formData.get("match")!.toString();
        const selector = formData.get("selector")!.toString();
        const index = getIndexOfCustomSelectors(row, defaultConfigs);
        setCustomConfigs((selectors) =>
          selectors.map((config, i) =>
            i === index
              ? config.regex !== undefined
                ? { regex: match, selector }
                : { match, selector }
              : config,
          ),
        );
        setOpen(false);
      }}
      onDelete={(row, setOpen) => {
        const index = getIndexOfCustomSelectors(row, defaultConfigs);
        setCustomConfigs((selectors) =>
          selectors.filter((_, i) => i !== index),
        );
        setOpen(false);
      }}
    />
  );
};
