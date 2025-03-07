import {
  Badge,
  Button,
  DialogContent,
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
};

// 列
export type Cell = {
  key: string;
  value: string;
  icon: JSX.Element;
  default: boolean;
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
  editForm: (row: Row) => JSX.Element;
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
  onDelete,
  onEdit,
  onEditCancel,
}: TableProps): JSX.Element => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHeaderCell key={column.key}>{column.label}</TableHeaderCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={index}>
            {row.cells.map((cell, index) => (
              <TableCell key={index}>
                <TableCellLayout media={cell.icon}>
                  <span className={"pr-2"}>{cell.value}</span>
                  {cell.default && isLastCell(row, index) && (
                    <Badge appearance="filled" color="informative">
                      preset
                    </Badge>
                  )}
                </TableCellLayout>
                {isLastCell(row, index) && (
                  <TableCellActions className={"pr-2"}>
                    <SimpleDialog
                      trigger={
                        <Button
                          icon={<EditIcon />}
                          appearance="subtle"
                          disabled={cell.default}
                        />
                      }
                      dialogTitle={editFormTitle}
                      dialogContent={
                        <DialogContent className={"flex flex-col gap-y-2.5"}>
                          {editForm(row)}
                        </DialogContent>
                      }
                      dialogConfirm={"Submit"}
                      onConfirm={(setOpen, ev) => onEdit(row, setOpen, ev)}
                      onClose={onEditCancel}
                    />
                    <SimpleDialog
                      trigger={
                        <Button
                          icon={<DeleteIcon />}
                          appearance="subtle"
                          disabled={cell.default}
                        />
                      }
                      dialogTitle={"Confirm Delete?"}
                      dialogConfirm={"Delete"}
                      onConfirm={(setOpen, ev) => onDelete(row, setOpen, ev)}
                    />
                  </TableCellActions>
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
