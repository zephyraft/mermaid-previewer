import { GlobeRegular } from "@fluentui/react-icons";
import React from "react";

import type { ExcludeConfig } from "~types";

import ConfigTable from "../ConfigTable";
import type { Column, Row } from "../ConfigTable";
import ExcludeConfigForm from "./ExcludeConfigForm";

const columns: Column[] = [
  {
    key: "regex",
    label: "Regex",
  },
];

const getRow = (
  index: number,
  excludeURL: ExcludeConfig,
  isDefault: boolean,
): Row => {
  return {
    key: index,
    cells: [
      {
        key: "regex",
        value: excludeURL.regex,
        icon: <GlobeRegular />,
        default: isDefault,
      },
    ],
  };
};
const getExcludeURL = (row: Row): ExcludeConfig => {
  return {
    regex: row.cells.find((it) => it.key === "regex")!.value,
  };
};

interface TableProps {
  defaultConfigs: ExcludeConfig[];
  customConfigs: ExcludeConfig[];
  setCustomConfigs: React.Dispatch<React.SetStateAction<ExcludeConfig[]>>;
}

const getIndexOfCustomRegexes = (
  row: Row,
  defaultRegexes: ExcludeConfig[],
): number => {
  return row.key - defaultRegexes.length;
};

export default ({
  defaultConfigs,
  customConfigs,
  setCustomConfigs,
}: TableProps): JSX.Element => {
  const rows: Row[] = React.useMemo(
    () =>
      defaultConfigs
        .map((regex, index) => getRow(index, regex, true))
        .concat(
          customConfigs.map((regex, index) =>
            getRow(index + defaultConfigs.length, regex, false),
          ),
        ),
    [defaultConfigs, customConfigs],
  );

  return (
    <ConfigTable
      columns={columns}
      rows={rows}
      editFormTitle={"Edit Exclude URL Regex"}
      editForm={(row) => (
        <ExcludeConfigForm defaultValue={getExcludeURL(row)} />
      )}
      onEdit={(row, setOpen, ev) => {
        const formData = new FormData(ev.target as HTMLFormElement); // 通过event.target获取表单元素，然后使用FormData获取表单数据
        const regex = formData.get("regex")!.toString();
        setCustomConfigs((regexes) => {
          const index = getIndexOfCustomRegexes(row, defaultConfigs);
          const pre = regexes.slice(0, index);
          const suf = regexes.slice(index + 1);
          setOpen(false);
          return pre.concat({ regex }, suf);
        });
      }}
      onDelete={(row, setOpen) => {
        const index = getIndexOfCustomRegexes(row, defaultConfigs);
        setCustomConfigs((regexes) => regexes.filter((_, i) => i !== index));
        setOpen(false);
      }}
    />
  );
};
