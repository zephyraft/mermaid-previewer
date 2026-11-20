import {
  DialogContent,
  Toolbar,
  ToolbarButton,
} from "@fluentui/react-components";
import {
  AddRegular,
  ArrowResetFilled,
  ArrowResetRegular,
  bundleIcon,
} from "@fluentui/react-icons";
import React from "react";

import SimpleDialog from "./SimpleDialog";

const ResetIcon = bundleIcon(ArrowResetFilled, ArrowResetRegular);

interface Props {
  addTitle: string;
  addForm: React.JSX.Element;
  onAdd: (
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
    ev: React.FormEvent,
  ) => void;
  onReset: (setOpen: React.Dispatch<React.SetStateAction<boolean>>) => void;
}

export default ({
  addTitle,
  addForm,
  onAdd,
  onReset,
}: Props): React.JSX.Element => {
  return (
    <Toolbar className={"gap-x-1"}>
      <SimpleDialog
        trigger={
          <ToolbarButton
            aria-label={addTitle}
            appearance="primary"
            icon={<AddRegular />}
          />
        }
        dialogTitle={addTitle}
        dialogContent={
          <DialogContent className={"flex flex-col gap-y-2.5"}>
            {addForm}
          </DialogContent>
        }
        dialogConfirm="Add"
        onConfirm={onAdd}
      />
      <SimpleDialog
        trigger={
          <ToolbarButton aria-label="Reset to defaults" icon={<ResetIcon />} />
        }
        dialogTitle="Reset to defaults?"
        dialogContent={
          <DialogContent>
            This will re-enable the built-in rules and remove the custom rules
            in this section.
          </DialogContent>
        }
        dialogConfirm="Reset"
        onConfirm={onReset}
      />
    </Toolbar>
  );
};
