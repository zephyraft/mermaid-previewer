import { DocumentTableSearchRegular, GlobeRegular } from "@fluentui/react-icons"
import React from "react"

import type { SelectorConfig } from "~types"

import ConfigTable, { type Column, type Row } from "../ConfigTable"
import SelectorConfigForm from "./SelectorConfigForm"

const columns: Column[] = [
  {
    key: "regex",
    label: "Regex"
  },
  {
    key: "selector",
    label: "Selector"
  }
]

const getRow = (
  index: number,
  matchSelector: SelectorConfig,
  isDefault: boolean
): Row => {
  return {
    key: index,
    cells: [
      {
        key: "regex",
        value: matchSelector.regex,
        icon: <GlobeRegular />,
        default: isDefault
      },
      {
        key: "selector",
        value: matchSelector.selector,
        icon: <DocumentTableSearchRegular />,
        default: isDefault
      }
    ]
  }
}

const getMatchSelector = (row: Row): SelectorConfig => {
  return {
    regex: row.cells.find((it) => it.key === "regex")!.value,
    selector: row.cells.find((it) => it.key === "selector")!.value
  }
}

interface TableProps {
  defaultConfigs: SelectorConfig[]
  customConfigs: SelectorConfig[]
  setCustomConfigs: React.Dispatch<React.SetStateAction<SelectorConfig[]>>
}

const getIndexOfCustomSelectors = (
  row: Row,
  defaultSelectors: SelectorConfig[]
): number => {
  return row.key - defaultSelectors.length
}

export default ({
  defaultConfigs,
  customConfigs,
  setCustomConfigs
}: TableProps): JSX.Element => {
  const rows: Row[] = React.useMemo(
    () =>
      defaultConfigs
        .map((matchSelector, index) => getRow(index, matchSelector, true))
        .concat(
          customConfigs.map((matchSelector, index) =>
            getRow(index + defaultConfigs.length, matchSelector, false)
          )
        ),
    [defaultConfigs, customConfigs]
  )

  return (
    <ConfigTable
      columns={columns}
      rows={rows}
      editFormTitle={"Edit Selector"}
      editForm={(row) => (
        <SelectorConfigForm defaultValue={getMatchSelector(row)} />
      )}
      onEdit={(row, setOpen, ev) => {
        const formData = new FormData(ev.target as HTMLFormElement) // 通过event.target获取表单元素，然后使用FormData获取表单数据
        const regex = formData.get("regex")!.toString()
        const selector = formData.get("selector")!.toString()
        setCustomConfigs((selectors) => {
          const index = getIndexOfCustomSelectors(row, defaultConfigs)
          const pre = selectors.slice(0, index)
          const suf = selectors.slice(index + 1)
          setOpen(false)
          return pre.concat({ regex, selector }, suf)
        })
      }}
      onDelete={(row, setOpen) => {
        const index = getIndexOfCustomSelectors(row, defaultConfigs)
        setCustomConfigs((selectors) => selectors.filter((_, i) => i !== index))
        setOpen(false)
      }}
    />
  )
}
