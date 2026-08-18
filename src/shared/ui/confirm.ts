import { Modal } from 'antd';

export function confirmApprove(onOk: () => void | Promise<void>) {
  Modal.confirm({
    title: 'Approve request',
    content: 'Are you sure you want to Approve?',
    okText: 'Approve',
    cancelText: 'Cancel',
    onOk,
  });
}

export function confirmReject(onOk: () => void | Promise<void>) {
  Modal.confirm({
    title: 'Reject request',
    content: 'Are you sure you want to Reject?',
    okText: 'Reject',
    okButtonProps: { danger: true },
    cancelText: 'Cancel',
    onOk,
  });
}
