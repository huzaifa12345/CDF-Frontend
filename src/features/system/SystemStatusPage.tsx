import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Descriptions, Space, Spin, Typography } from 'antd';
import { fetchApiInfo, fetchHealth } from '../../shared/api/info';
import { env } from '../../shared/config/env';
import { notify } from '../../shared/ui/notify';

export function SystemStatusPage() {
  const infoQuery = useQuery({
    queryKey: ['api-info'],
    queryFn: fetchApiInfo,
    retry: 1,
  });

  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    retry: 1,
  });

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          System status
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Frontend is configured for <code>{env.apiBaseUrl}</code>. Use this page to confirm the API is reachable.
        </Typography.Paragraph>
      </div>

      {infoQuery.isLoading || healthQuery.isLoading ? <Spin /> : null}

      {infoQuery.isError ? (
        <Alert
          type="warning"
          showIcon
          message="API not reachable"
          description="Start CDF-Backend (dotnet run or docker compose) and ensure VITE_API_BASE_URL is correct."
        />
      ) : null}

      {infoQuery.data ? (
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="Application">{infoQuery.data.application}</Descriptions.Item>
          <Descriptions.Item label="Brand">{infoQuery.data.brand}</Descriptions.Item>
          <Descriptions.Item label="Environment">{infoQuery.data.environment}</Descriptions.Item>
          <Descriptions.Item label="Health">
            {healthQuery.isSuccess ? 'OK' : healthQuery.isError ? 'Unhealthy / unreachable' : '…'}
          </Descriptions.Item>
        </Descriptions>
      ) : null}

      <Button
        type="primary"
        onClick={() => {
          notify.info('Notification check', 'Top-right notifications are configured.');
        }}
      >
        Test notification
      </Button>
    </Space>
  );
}
