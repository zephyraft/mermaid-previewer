import {
  Badge,
  Button,
  DialogContent,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableCellActions,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@fluentui/react-components";
import {
  bundleIcon,
  DeleteFilled,
  DeleteRegular,
  EditFilled,
  EditRegular,
} from "@fluentui/react-icons";
import React from "react";

import SimpleDialog from "./SimpleDialog";

// 行
export type Row = {
  key: number;
  cells: Cell[];
  enabled: boolean;
  isDefault: boolean;
};

// 列
export type Cell = {
  key: string;
  value: string;
  icon: React.JSX.Element;
};

// 表头
export type Column = {
  key: string;
  label: string;
};
const EditIcon = bundleIcon(EditFilled, EditRegular);
const DeleteIcon = bundleIcon(DeleteFilled, DeleteRegular);

interface TableProps {
  columns: Column[];
  rows: Row[];
  editFormTitle: string;
  editForm: (row: Row) => React.JSX.Element;
  onEnabledChange: (index: number, enabled: boolean) => void;
  onDelete: (
    row: Row,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
    ev: React.FormEvent,
  ) => void;
  onEdit: (
    row: Row,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
    ev: React.FormEvent,
  ) => void;
  onEditCancel?: () => void;
}

function isLastCell(row: Row, cellIndex: number) {
  return row.cells.length - 1 === cellIndex;
}

export default ({
  columns,
  rows,
  editFormTitle,
  editForm,
  onEnabledChange,
  onDelete,
  onEdit,
  onEditCancel,
}: TableProps): React.JSX.Element => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHeaderCell key={column.key}>{column.label}</TableHeaderCell>
          ))}
          <TableHeaderCell style={{ width: 96 }}>Enabled</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            {row.cells.map((cell, index) => (
              <TableCell key={index}>
                <TableCellLayout media={cell.icon}>
                  <span className={"pr-2"}>{cell.value}</span>
                  {row.isDefault && isLastCell(row, index) && (
                    <Badge appearance="filled" color="informative">
                      Default
                    </Badge>
                  )}
                </TableCellLayout>
                {isLastCell(row, index) && (
                  <TableCellActions className={"pr-2"}>
                    <SimpleDialog
                      trigger={
                        <Button
                          icon={<EditIcon />}
                          aria-label={editFormTitle}
                          appearance="subtle"
                          disabled={row.isDefault}
                        />
                      }
                      dialogTitle={editFormTitle}
                      dialogContent={
                        <DialogContent className={"flex flex-col gap-y-2.5"}>
                          {editForm(row)}
                        </DialogContent>
                      }
                      dialogConfirm="Save"
                      onConfirm={(setOpen, ev) => onEdit(row, setOpen, ev)}
                      onClose={onEditCancel}
                    />
                    <SimpleDialog
                      trigger={
                        <Button
                          icon={<DeleteIcon />}
                          aria-label="Delete rule"
                          appearance="subtle"
                          disabled={row.isDefault}
                        />
                      }
                      dialogTitle="Delete this rule?"
                      dialogConfirm="Delete"
                      onConfirm={(setOpen, ev) => onDelete(row, setOpen, ev)}
                    />
                  </TableCellActions>
                )}
              </TableCell>
            ))}
            <TableCell>
              <Switch
                aria-label={`Enable ${row.cells.map((cell) => cell.value).join(", ")}`}
                checked={row.enabled}
                onChange={(_, { checked }) => onEnabledChange(row.key, checked)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
