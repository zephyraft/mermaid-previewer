import React from "react"

import type { SelectorConfig } from "~types"

import ConfigToolbar from "../ConfigToolbar"
import SelectorConfigForm from "./SelectorConfigForm"

interface Props {
  title: string
  setCustomConfigs: React.Dispatch<React.SetStateAction<SelectorConfig[]>>
}

export default ({ title, setCustomConfigs }: Props): JSX.Element => {
  return (
    <ConfigToolbar
      addTitle={title}
      addForm={<SelectorConfigForm />}
      onAdd={(setOpen, ev) => {
        const formData = new FormData(ev.target as HTMLFormElement) // 通过event.target获取表单元素，然后使用FormData获取表单数据
        const regex = formData.get("regex")!.toString()
        const selector = formData.get("selector")!.toString()
        setCustomConfigs((regexes) => regexes.concat({ regex, selector }))
        setOpen(false)
      }}
      onReset={(setOpen) => {
        setCustomConfigs([])
        setOpen(false)
      }}
    />
  )
}
