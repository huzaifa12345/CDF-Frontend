import type { ThemeConfig } from 'antd';

export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: '#0f6e6e',
    colorInfo: '#0f6e6e',
    borderRadius: 6,
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
  },
  components: {
    Table: {
      cellPaddingBlockSM: 6,
      cellPaddingInlineSM: 8,
    },
    Layout: {
      headerBg: '#0b3d3d',
      siderBg: '#102a2a',
      bodyBg: '#f4f7f7',
    },
  },
};
