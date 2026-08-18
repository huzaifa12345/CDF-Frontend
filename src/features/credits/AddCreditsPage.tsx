import { InboxOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Card, Space, Typography, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useState } from 'react';
import { notify } from '../../shared/ui/notify';
import { fetchReceiveAccount, submitTopUp } from './creditsApi';

function getErrorDetail(err: unknown) {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
    'Request failed'
  );
}

export function AddCreditsPage() {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const accountQuery = useQuery({
    queryKey: ['credit-receive-account'],
    queryFn: fetchReceiveAccount,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const file = fileList[0]?.originFileObj;
      if (!file) {
        throw new Error('Upload a payment screenshot.');
      }
      return submitTopUp(file);
    },
    onSuccess: (result) => {
      notify.success('Request submitted', result.message);
      setFileList([]);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error && !('response' in err) ? err.message : getErrorDetail(err);
      notify.error('Add Credits', message);
    },
  });

  const account = accountQuery.data;

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Add Credits
        </Typography.Title>
        <Typography.Text type="secondary">
          Transfer to the account below, then upload your payment screenshot only.
        </Typography.Text>
      </div>

      <Card size="small" loading={accountQuery.isLoading}>
        <Space direction="vertical" size={4}>
          <Typography.Text type="secondary">Account title</Typography.Text>
          <Typography.Text strong>{account?.accountTitle ?? '—'}</Typography.Text>
          {account?.bankName ? (
            <>
              <Typography.Text type="secondary">Bank</Typography.Text>
              <Typography.Text>{account.bankName}</Typography.Text>
            </>
          ) : null}
          <Typography.Text type="secondary">Account number</Typography.Text>
          <Typography.Paragraph copyable style={{ marginBottom: 0 }}>
            {account?.accountNumber ?? '—'}
          </Typography.Paragraph>
        </Space>
      </Card>

      <Upload.Dragger
        accept="image/jpeg,image/png,image/webp,image/gif"
        maxCount={1}
        beforeUpload={() => false}
        fileList={fileList}
        onChange={({ fileList: next }) => setFileList(next)}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Drop payment screenshot here</p>
        <p className="ant-upload-hint">Images only · max 5 MB · no transaction details needed</p>
      </Upload.Dragger>

      <Button
        type="primary"
        loading={submitMutation.isPending}
        onClick={() => submitMutation.mutate()}
      >
        Submit request
      </Button>
    </Space>
  );
}
