import { GlobeRegular } from "@fluentui/react-icons";
import React from "react";

import type { ExcludeConfig } from "~types";

import type { Column, Row } from "../ConfigTable";
import ConfigTable from "../ConfigTable";
import ExcludeConfigForm from "./ExcludeConfigForm";

const columns: Column[] = [
  {
    key: "match",
    label: "URL Pattern",
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
        key: "match",
        value: excludeURL.match ?? excludeURL.regex,
        icon: <GlobeRegular />,
        default: isDefault,
      },
    ],
  };
};
interface TableProps {
  defaultConfigs: ExcludeConfig[];
  customConfigs: ExcludeConfig[];
  setCustomConfigs: React.Dispatch<React.SetStateAction<ExcludeConfig[]>>;
}

const getIndexOfCustomConfigs = (
  row: Row,
  defaultConfigs: ExcludeConfig[],
): number => {
  return row.key - defaultConfigs.length;
};

export default ({
  defaultConfigs,
  customConfigs,
  setCustomConfigs,
}: TableProps): React.JSX.Element => {
  const rows: Row[] = React.useMemo(
    () =>
      defaultConfigs
        .map((c, index) => getRow(index, c, true))
        .concat(
          customConfigs.map((c, index) =>
            getRow(index + defaultConfigs.length, c, false),
          ),
        ),
    [defaultConfigs, customConfigs],
  );

  return (
    <ConfigTable
      columns={columns}
      rows={rows}
      editFormTitle={"Edit Exclude Match Patterns"}
      editForm={(row) => (
        <ExcludeConfigForm
          defaultValue={
            customConfigs[getIndexOfCustomConfigs(row, defaultConfigs)]
          }
        />
      )}
      onEdit={(row, setOpen, ev) => {
        const formData = new FormData(ev.target as HTMLFormElement); // 通过event.target获取表单元素，然后使用FormData获取表单数据
        const match = formData.get("match")!.toString();
        const index = getIndexOfCustomConfigs(row, defaultConfigs);
        setCustomConfigs((configs) =>
          configs.map((config, i) =>
            i === index
              ? config.regex !== undefined
                ? { regex: match }
                : { match }
              : config,
          ),
        );
        setOpen(false);
      }}
      onDelete={(row, setOpen) => {
        const index = getIndexOfCustomConfigs(row, defaultConfigs);
        setCustomConfigs((configs) => configs.filter((_, i) => i !== index));
        setOpen(false);
      }}
    />
  );
};
