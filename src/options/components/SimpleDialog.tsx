import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogSurface,
  DialogTitle,
  DialogTrigger
} from "@fluentui/react-components"
import React from "react"

interface SecondConfirmButtonProps {
  trigger: JSX.Element
  onConfirm: (
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
    ev: React.FormEvent
  ) => void
  onClose?: () => void
  dialogTitle: string | JSX.Element
  dialogContent?: string | JSX.Element
  dialogConfirm: string | JSX.Element
  dialogCancel?: string | JSX.Element
}

export default ({
  trigger,
  onConfirm,
  onClose,
  dialogTitle,
  dialogContent,
  dialogConfirm,
  dialogCancel = "Cancel"
}: SecondConfirmButtonProps): JSX.Element => {
  const [open, setOpen] = React.useState(false)

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    onConfirm(setOpen, ev)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(event, data) => {
        setOpen(data.open)
        if (!data.open) {
          onClose?.()
        }
      }}>
      <DialogTrigger disableButtonEnhancement>{trigger}</DialogTrigger>
      <DialogSurface>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <DialogTitle>{dialogTitle}</DialogTitle>
            {dialogContent}
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">{dialogCancel}</Button>
              </DialogTrigger>
              <Button appearance="primary" type="submit">
                {dialogConfirm}
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  )
}
