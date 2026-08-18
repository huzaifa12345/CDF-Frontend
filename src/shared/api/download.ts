import { http } from './http';

export async function downloadBlob(path: string, params?: Record<string, unknown>) {
  try {
    const { data, headers } = await http.get<Blob>(path, {
      params,
      responseType: 'blob',
    });

    const disposition = headers['content-disposition'] as string | undefined;
    const match = disposition?.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
    const fileName = match?.[1] ? decodeURIComponent(match[1].replace(/"/g, '')) : 'export.bin';

    const url = URL.createObjectURL(data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    const blob = (error as { response?: { data?: Blob } })?.response?.data;
    if (blob instanceof Blob) {
      const text = await blob.text();
      try {
        const parsed = JSON.parse(text) as { detail?: string };
        throw Object.assign(new Error(parsed.detail ?? 'Export failed'), { response: { data: parsed } });
      } catch (parseError) {
        if (parseError instanceof SyntaxError) {
          throw new Error(text || 'Export failed');
        }
        throw parseError;
      }
    }
    throw error;
  }
}
