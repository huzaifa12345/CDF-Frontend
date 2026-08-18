import { FilePdfOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Card, Col, Row, Space, Statistic, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import { useAuth } from '../auth/AuthContext';
import { env } from '../../shared/config/env';
import { notify } from '../../shared/ui/notify';
import {
  downloadReportPdf,
  fetchCalculatorDashboard,
  type CalculatorReportListItem,
} from '../calculator/calculatorApi';

function formatNumber(value?: number | null) {
  return (value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function DashboardPage() {
  const { user } = useAuth();

  const dashboardQuery = useQuery({
    queryKey: ['calculator-dashboard'],
    queryFn: fetchCalculatorDashboard,
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

  const recent = dashboardQuery.data?.recentReports ?? [];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 4 }}>
          Welcome, {user?.userName}
        </Typography.Title>
        <Typography.Text type="secondary">
          {env.appName} — {user?.role} ({user?.companyName}). Credits:{' '}
          {user?.creditBalance?.toLocaleString() ?? 0}
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Successful calculates (this month)"
              value={dashboardQuery.data?.successfulCalculatesThisMonth ?? 0}
              loading={dashboardQuery.isLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Credits spent (this month)"
              value={dashboardQuery.data?.creditsSpentThisMonth ?? 0}
              loading={dashboardQuery.isLoading}
              precision={0}
            />
          </Card>
        </Col>
      </Row>

      <div>
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          Recent reports
        </Typography.Title>
        <Typography.Text type="secondary">Last 10 successful calculations</Typography.Text>
      </div>

      <Table<CalculatorReportListItem>
        size="small"
        rowKey="reportId"
        loading={dashboardQuery.isLoading}
        pagination={false}
        dataSource={recent}
        scroll={{ x: 800 }}
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
