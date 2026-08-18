import { FilePdfOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, DatePicker, Space, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useState } from 'react';
import { AsyncSelect } from '../../shared/ui/AsyncSelect';
import { DataTable } from '../../shared/ui/DataTable';
import { notify } from '../../shared/ui/notify';
import { useAuth } from '../auth/AuthContext';
import {
  downloadReportPdf,
  searchCalculatorProducts,
  searchCalculatorReports,
  type CalculatorReportListItem,
} from '../calculator/calculatorApi';
import { searchUsers } from '../users/usersApi';

const PAGE_SIZE = 25;

function formatNumber(value?: number | null) {
  return (value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function ReportsPage() {
  const { isAdminOrAbove } = useAuth();
  const [productId, setProductId] = useState<string | undefined>();
  const [filterUserId, setFilterUserId] = useState<string | undefined>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [page, setPage] = useState(1);

  const fetchProducts = useCallback(async (search: string) => {
    const data = await searchCalculatorProducts(search);
    return data.items.map((item) => ({
      value: item.id,
      label: `${item.name} (${item.category})`,
    }));
  }, []);

  const fetchUsers = useCallback(async (search: string) => {
    const data = await searchUsers(search, 1, 50);
    return data.items.map((item) => ({
      value: item.id,
      label: `${item.userName} (${item.companyName})`,
    }));
  }, []);

  const query = useQuery({
    queryKey: [
      'calculator-reports',
      productId,
      filterUserId,
      range?.[0]?.toISOString(),
      range?.[1]?.toISOString(),
      page,
    ],
    queryFn: () =>
      searchCalculatorReports({
        productId,
        userId: filterUserId,
        from: range?.[0]?.startOf('day').toISOString(),
        to: range?.[1]?.endOf('day').toISOString(),
        page,
        pageSize: PAGE_SIZE,
      }),
  });

  const pdfMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const blob = await downloadReportPdf(reportId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `cdf-report-${reportId}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    onError: () => notify.error('PDF', 'Unable to download report PDF.'),
  });

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Reports
        </Typography.Title>
        <Typography.Text type="secondary">
          Browse calculation reports with product, user, and date filters (25 per page).
        </Typography.Text>
      </div>

      <Space wrap>
        <AsyncSelect
          style={{ minWidth: 260 }}
          placeholder="Filter by product"
          allowClear
          value={productId}
          fetchOptions={fetchProducts}
          onChange={(value) => {
            setPage(1);
            setProductId((value as string | undefined) || undefined);
          }}
        />
        {isAdminOrAbove ? (
          <AsyncSelect
            style={{ minWidth: 240 }}
            placeholder="Filter by user"
            allowClear
            value={filterUserId}
            fetchOptions={fetchUsers}
            onChange={(value) => {
              setPage(1);
              setFilterUserId((value as string | undefined) || undefined);
            }}
          />
        ) : null}
        <DatePicker.RangePicker
          value={range}
          onChange={(value) => {
            setPage(1);
            setRange(value);
          }}
        />
      </Space>

      <DataTable<CalculatorReportListItem>
        loading={query.isLoading}
        dataSource={query.data?.items ?? []}
        total={query.data?.total ?? 0}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={(next) => setPage(next)}
        scroll={{ x: 900 }}
        rowKey="reportId"
        columns={[
          {
            title: 'Date',
            dataIndex: 'calculatedAt',
            width: 160,
            render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
          },
          {
            title: 'Product',
            dataIndex: 'productName',
            render: (_: string, row) => `${row.productName} (${row.productCategory})`,
          },
          { title: 'Type', dataIndex: 'calculationType', width: 120 },
          { title: 'User', dataIndex: 'userName', width: 120 },
          { title: 'Company', dataIndex: 'companyName', width: 140 },
          {
            title: 'Total kg',
            dataIndex: 'totalQuantityKg',
            width: 100,
            render: (v: number) => formatNumber(v),
          },
          {
            title: 'Credits',
            dataIndex: 'creditsCharged',
            width: 90,
            render: (v: number) => formatNumber(v),
          },
          {
            title: 'PDF',
            key: 'pdf',
            width: 70,
            render: (_, row) => (
              <Button
                type="link"
                icon={<FilePdfOutlined />}
                loading={pdfMutation.isPending && pdfMutation.variables === row.reportId}
                onClick={() => pdfMutation.mutate(row.reportId)}
              />
            ),
          },
        ]}
      />
    </Space>
  );
}
