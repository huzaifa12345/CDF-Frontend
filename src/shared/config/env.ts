const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const appName = import.meta.env.VITE_APP_NAME ?? 'CDF Formulation';
const reportBrandName = import.meta.env.VITE_REPORT_BRAND_NAME ?? 'CND';

export const env = {
  apiBaseUrl: apiBaseUrl.replace(/\/$/, ''),
  appName,
  reportBrandName,
};
