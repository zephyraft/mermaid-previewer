import {
  DialogContent,
  Toolbar,
  ToolbarButton
} from "@fluentui/react-components"
import {
  AddRegular,
  ArrowResetFilled,
  ArrowResetRegular,
  bundleIcon
} from "@fluentui/react-icons"
import React from "react"

import SimpleDialog from "./SimpleDialog"

const ResetIcon = bundleIcon(ArrowResetFilled, ArrowResetRegular)

interface Props {
  addTitle: string
  addForm: JSX.Element
  onAdd: (
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
    ev: React.FormEvent
  ) => void
  onReset: (setOpen: React.Dispatch<React.SetStateAction<boolean>>) => void
}

export default ({ addTitle, addForm, onAdd, onReset }: Props): JSX.Element => {
  return (
    <Toolbar className={"gap-x-1"}>
      <SimpleDialog
        trigger={<ToolbarButton appearance={"primary"} icon={<AddRegular />} />}
        dialogTitle={addTitle}
        dialogContent={
          <DialogContent className={"flex flex-col gap-y-2.5"}>
            {addForm}
          </DialogContent>
        }
        dialogConfirm={"Submit"}
        onConfirm={onAdd}
      />
      <SimpleDialog
        trigger={<ToolbarButton icon={<ResetIcon />} />}
        dialogTitle={"Confirm Reset To Preset?"}
        dialogConfirm={"Reset"}
        onConfirm={onReset}
      />
    </Toolbar>
  )
}
