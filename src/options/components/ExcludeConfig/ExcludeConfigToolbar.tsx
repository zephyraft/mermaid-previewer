import React from "react"

import type { ExcludeConfig } from "~types"

import ConfigToolbar from "../ConfigToolbar"
import ExcludeConfigForm from "./ExcludeConfigForm"

interface Props {
  title: string
  setCustomConfigs: React.Dispatch<React.SetStateAction<ExcludeConfig[]>>
}

export default ({ title, setCustomConfigs }: Props): JSX.Element => {
  return (
    <ConfigToolbar
      addTitle={title}
      addForm={<ExcludeConfigForm />}
      onAdd={(setOpen, ev) => {
        const formData = new FormData(ev.target as HTMLFormElement) // 通过event.target获取表单元素，然后使用FormData获取表单数据
        const value = formData.get("regex")!.toString()
        setCustomConfigs((regexes) => regexes.concat({ regex: value }))
        setOpen(false)
      }}
      onReset={(setOpen) => {
        setCustomConfigs([])
        setOpen(false)
      }}
    />
  )
}
