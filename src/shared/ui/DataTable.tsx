import { Table, type TableProps } from 'antd';

const DEFAULT_PAGE_SIZE = 50;

type DataTableProps<T extends object> = TableProps<T> & {
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
};

export function DataTable<T extends object>({
  total,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  onPageChange,
  pagination,
  ...rest
}: DataTableProps<T>) {
  return (
    <Table<T>
      size="small"
      rowKey={(record) => {
        const maybeId = (record as { id?: string | number }).id;
        return maybeId ?? JSON.stringify(record);
      }}
      pagination={
        pagination === false
          ? false
          : {
              current: page,
              pageSize,
              total: total ?? 0,
              showSizeChanger: false,
              onChange: onPageChange,
              ...pagination,
            }
      }
      {...rest}
    />
  );
}
