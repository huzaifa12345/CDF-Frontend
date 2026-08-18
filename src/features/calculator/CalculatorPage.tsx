import { DeleteOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import {
  Button,
  Col,
  DatePicker,
  Descriptions,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { RawMaterial } from '../../shared/api/types';
import { useAuth } from '../auth/AuthContext';
import { AsyncSelect } from '../../shared/ui/AsyncSelect';
import { notify } from '../../shared/ui/notify';
import {
  calculateFormula,
  downloadReportPdf,
  searchCalculatorMaterials,
  searchCalculatorProducts,
  type CalculationResult,
  type CalculationType,
  type QuantityUom,
} from './calculatorApi';

type MaterialRow = {
  key: string;
  rawMaterialId?: string;
  materialName?: string;
  adPercent: number;
  alkaliPercent: number;
  saltPercent: number;
  moisturePercent: number;
  insolublePercent: number;
  quantity?: number | null;
  uom: QuantityUom;
};

function newRow(): MaterialRow {
  return {
    key: crypto.randomUUID(),
    uom: 'Kg',
    quantity: 1,
    adPercent: 0,
    alkaliPercent: 0,
    saltPercent: 0,
    moisturePercent: 0,
    insolublePercent: 0,
  };
}

function formatPct(value?: number | null) {
  if (value == null) return '—';
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function toPercent(value?: number | null) {
  return value == null || Number.isNaN(Number(value)) ? 0 : Number(value);
}

function calculationConfirmMessage(type: CalculationType) {
  switch (type) {
    case 'Ad':
      return 'Do you want to Calculate AD percentage in the above Formula?';
    case 'Alkali':
      return 'Do you want to Calculate Alkali percentage in the above Formula?';
    case 'Salt':
      return 'Do you want to Calculate Salt percentage in the above Formula?';
    case 'Moisture':
      return 'Do you want to Calculate Moisture percentage in the above Formula?';
    case 'Insoluble':
      return 'Do you want to Calculate Insoluble percentage in the above Formula?';
    case 'Complete':
      return 'Do you want to Calculate AD, Alkali, Salt, Moisture and Insoluble percentages in the above Formula?';
  }
}

function calculatingMessage(type: CalculationType) {
  switch (type) {
    case 'Ad':
      return 'Calculating the Requested AD %';
    case 'Alkali':
      return 'Calculating the Requested Alkali %';
    case 'Salt':
      return 'Calculating the Requested Salt %';
    case 'Moisture':
      return 'Calculating the Requested Moisture %';
    case 'Insoluble':
      return 'Calculating the Requested Insoluble %';
    case 'Complete':
      return 'Calculating the AD, Alkali, Salt, Moisture and Insoluble %';
  }
}

const CALC_ACTIONS: {
  type: CalculationType;
  label: string;
  credits: number;
  primary?: boolean;
}[] = [
  { type: 'Ad', label: 'Calculate AD', credits: 100 },
  { type: 'Alkali', label: 'Calculate Alkali', credits: 100 },
  { type: 'Salt', label: 'Calculate Salt', credits: 100 },
  { type: 'Moisture', label: 'Calculate Moisture', credits: 100 },
  { type: 'Insoluble', label: 'Calculate Insoluble', credits: 100 },
  { type: 'Complete', label: 'Complete Report', credits: 400, primary: true },
];

function getApiError(err: unknown) {
  const data = (err as { response?: { data?: { detail?: string; code?: string; propertyName?: string } } })
    ?.response?.data;
  return {
    detail: data?.detail ?? (err instanceof Error ? err.message : 'Request failed'),
    code: data?.code,
    propertyName: data?.propertyName,
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function CalculatorPage() {
  const { refreshUser } = useAuth();
  const [productId, setProductId] = useState<string | undefined>();
  const [rows, setRows] = useState<MaterialRow[]>([newRow()]);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [calculatingType, setCalculatingType] = useState<CalculationType | null>(null);
  const materialsCache = useRef(new Map<string, RawMaterial>());

  const selectedMaterialIds = useMemo(
    () => rows.map((row) => row.rawMaterialId).filter((id): id is string => !!id),
    [rows],
  );

  const fetchProducts = useCallback(async (search: string) => {
    const data = await searchCalculatorProducts(search);
    return data.items.map((item) => ({
      value: item.id,
      label: `${item.name} (${item.category})`,
    }));
  }, []);

  const fetchMaterials = useCallback(async (search: string) => {
    const data = await searchCalculatorMaterials(search);
    data.items.forEach((item) => materialsCache.current.set(item.id, item));
    return data.items.map((item) => ({
      value: item.id,
      label: item.name,
    }));
  }, []);

  const calculateMutation = useMutation({
    mutationFn: async (payload: {
      calculationType: CalculationType;
      productId: string;
      materials: {
        rawMaterialId: string;
        quantity: number;
        uom: QuantityUom;
        adPercent: number;
        alkaliPercent: number;
        saltPercent: number;
        moisturePercent: number;
        insolublePercent: number;
      }[];
    }) => {
      setResult(null);
      setCalculatingType(payload.calculationType);

      const requestPromise = calculateFormula({
        productId: payload.productId,
        calculationType: payload.calculationType,
        materials: payload.materials,
      });

      try {
        const data = await requestPromise;
        await delay(4000);
        return data;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: async (data) => {
      setCalculatingType(null);
      setResult(data);
      notify.success('Calculation complete', `Credits charged: ${data.creditsCharged}`);
      try {
        await refreshUser();
      } catch {
        /* badge refresh is best-effort */
      }
    },
    onError: (err: unknown) => {
      setCalculatingType(null);
      const apiError = getApiError(err);
      if (apiError.code === 'INSUFFICIENT_CREDITS') {
        const label = apiError.propertyName ?? 'this calculation';
        notify.warning('Insufficient credits', `Not enough credits for ${label}.`);
        return;
      }
      notify.error('Calculator', apiError.detail);
    },
  });

  const requestCalculate = (calculationType: CalculationType) => {
    if (!productId) {
      notify.error('Calculator', 'Select a product first.');
      return;
    }

    const materials = rows
      .filter((row) => row.rawMaterialId && row.quantity != null && row.quantity > 0)
      .map((row) => ({
        rawMaterialId: row.rawMaterialId!,
        quantity: Number(row.quantity),
        uom: row.uom,
        adPercent: toPercent(row.adPercent),
        alkaliPercent: toPercent(row.alkaliPercent),
        saltPercent: toPercent(row.saltPercent),
        moisturePercent: toPercent(row.moisturePercent),
        insolublePercent: toPercent(row.insolublePercent),
      }));

    if (materials.length === 0) {
      notify.error('Calculator', 'Add at least one material with quantity.');
      return;
    }

    Modal.confirm({
      title: 'Confirm calculation',
      content: calculationConfirmMessage(calculationType),
      okText: 'Calculate',
      cancelText: 'Cancel',
      centered: true,
      onOk: () => {
        calculateMutation.mutate({
          calculationType,
          productId,
          materials,
        });
      },
    });
  };

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
    onError: (err: unknown) => notify.error('PDF', getApiError(err).detail),
  });

  const materialsEnabled = !!productId;

  const totalKgPreview = useMemo(() => {
    return rows.reduce((sum, row) => {
      if (row.quantity == null || row.quantity <= 0) return sum;
      const qty = Number(row.quantity);
      if (row.uom === 'Kg') return sum + qty;
      if (row.uom === 'G') return sum + qty / 1000;
      if (row.uom === 'Litre') return sum + qty;
      if (row.uom === 'Ml') return sum + qty * 0.001;
      return sum;
    }, 0);
  }, [rows]);

  const handleProductChange = (value: string | number | null | undefined) => {
    setProductId((value as string | undefined) || undefined);
    setRows([newRow()]);
    setResult(null);
  };

  const columns = [
    {
      title: 'Material',
      dataIndex: 'rawMaterialId',
      width: 220,
      render: (_: unknown, row: MaterialRow) => (
        <AsyncSelect
          style={{ width: '100%', minWidth: 160 }}
          placeholder={materialsEnabled ? 'Select material' : 'Select a product first'}
          value={row.rawMaterialId}
          disabled={!materialsEnabled}
          excludeValues={selectedMaterialIds.filter((id) => id !== row.rawMaterialId)}
          fetchOptions={fetchMaterials}
          onChange={(value) => {
            const id = value as string | undefined;
            if (!id) {
              setRows((prev) =>
                prev.map((r) =>
                  r.key === row.key
                    ? {
                        ...r,
                        rawMaterialId: undefined,
                        materialName: undefined,
                        adPercent: 0,
                        alkaliPercent: 0,
                        saltPercent: 0,
                        moisturePercent: 0,
                        insolublePercent: 0,
                      }
                    : r,
                ),
              );
              return;
            }

            const material = materialsCache.current.get(id);
            setRows((prev) =>
              prev.map((r) =>
                r.key === row.key
                  ? {
                      ...r,
                      rawMaterialId: id,
                      materialName: material?.name,
                      adPercent: toPercent(material?.adPercent),
                      alkaliPercent: toPercent(material?.alkaliPercent),
                      saltPercent: toPercent(material?.saltPercent),
                      moisturePercent: toPercent(material?.moisturePercent),
                      insolublePercent: toPercent(material?.insolublePercent),
                    }
                  : r,
              ),
            );
          }}
        />
      ),
    },
    // Hidden for now — property % come from Raw Material master on select / calculate.
    // Uncomment these columns to let users view/edit AD / Alkali / Salt / Moisture / Insoluble on the grid.
    // {
    //   title: 'AD %',
    //   dataIndex: 'adPercent',
    //   width: 100,
    //   render: (_: unknown, row: MaterialRow) => (
    //     <InputNumber
    //       min={0}
    //       style={{ width: '100%' }}
    //       value={toPercent(row.adPercent)}
    //       onChange={(value) =>
    //         setRows((prev) =>
    //           prev.map((r) => (r.key === row.key ? { ...r, adPercent: toPercent(value) } : r)),
    //         )
    //       }
    //     />
    //   ),
    // },
    // {
    //   title: 'Alkali %',
    //   dataIndex: 'alkaliPercent',
    //   width: 100,
    //   render: (_: unknown, row: MaterialRow) => (
    //     <InputNumber
    //       min={0}
    //       style={{ width: '100%' }}
    //       value={toPercent(row.alkaliPercent)}
    //       onChange={(value) =>
    //         setRows((prev) =>
    //           prev.map((r) => (r.key === row.key ? { ...r, alkaliPercent: toPercent(value) } : r)),
    //         )
    //       }
    //     />
    //   ),
    // },
    // {
    //   title: 'Salt %',
    //   dataIndex: 'saltPercent',
    //   width: 100,
    //   render: (_: unknown, row: MaterialRow) => (
    //     <InputNumber
    //       min={0}
    //       style={{ width: '100%' }}
    //       value={toPercent(row.saltPercent)}
    //       onChange={(value) =>
    //         setRows((prev) =>
    //           prev.map((r) => (r.key === row.key ? { ...r, saltPercent: toPercent(value) } : r)),
    //         )
    //       }
    //     />
    //   ),
    // },
    // {
    //   title: 'Moist %',
    //   dataIndex: 'moisturePercent',
    //   width: 100,
    //   render: (_: unknown, row: MaterialRow) => (
    //     <InputNumber
    //       min={0}
    //       style={{ width: '100%' }}
    //       value={toPercent(row.moisturePercent)}
    //       onChange={(value) =>
    //         setRows((prev) =>
    //           prev.map((r) =>
    //             r.key === row.key ? { ...r, moisturePercent: toPercent(value) } : r,
    //           ),
    //         )
    //       }
    //     />
    //   ),
    // },
    // {
    //   title: 'Insol %',
    //   dataIndex: 'insolublePercent',
    //   width: 100,
    //   render: (_: unknown, row: MaterialRow) => (
    //     <InputNumber
    //       min={0}
    //       style={{ width: '100%' }}
    //       value={toPercent(row.insolublePercent)}
    //       onChange={(value) =>
    //         setRows((prev) =>
    //           prev.map((r) =>
    //             r.key === row.key ? { ...r, insolublePercent: toPercent(value) } : r,
    //           ),
    //         )
    //       }
    //     />
    //   ),
    // },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      width: 110,
      render: (_: unknown, row: MaterialRow) => (
        <InputNumber
          min={0}
          style={{ width: '100%' }}
          value={row.quantity ?? undefined}
          disabled={!materialsEnabled}
          onChange={(value) =>
            setRows((prev) =>
              prev.map((r) => (r.key === row.key ? { ...r, quantity: value } : r)),
            )
          }
        />
      ),
    },
    {
      title: 'UOM',
      dataIndex: 'uom',
      width: 110,
      render: (_: unknown, row: MaterialRow) => (
        <Select<QuantityUom>
          style={{ width: '100%' }}
          value={row.uom}
          disabled={!materialsEnabled}
          options={[
            { value: 'Kg', label: 'Kg' },
            { value: 'G', label: 'G' },
            { value: 'Litre', label: 'Litre' },
            { value: 'Ml', label: 'Ml' },
          ]}
          onChange={(value) =>
            setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, uom: value } : r)))
          }
        />
      ),
    },
    {
      title: 'Recipe %',
      key: 'recipe',
      width: 90,
      render: (_: unknown, row: MaterialRow) => {
        if (!materialsEnabled || !row.quantity || row.quantity <= 0 || totalKgPreview <= 0) {
          return '—';
        }
        let kg = Number(row.quantity);
        if (row.uom === 'G') kg = kg / 1000;
        if (row.uom === 'Ml') kg = kg * 0.001;
        return formatPct((kg / totalKgPreview) * 100);
      },
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_: unknown, row: MaterialRow, index: number) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<PlusOutlined />}
            disabled={!materialsEnabled}
            onClick={() =>
              setRows((prev) => {
                const next = [...prev];
                next.splice(index + 1, 0, newRow());
                return next;
              })
            }
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            disabled={!materialsEnabled || rows.length === 1}
            onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
          />
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Formula Calculator
        </Typography.Title>
        <Typography.Text type="secondary">
          Build a recipe, run a property or complete report, then download the PDF.
        </Typography.Text>
      </div>

      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} md={8}>
          <DatePicker value={dayjs()} disabled style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Col>
        <Col xs={24} md={16}>
          <AsyncSelect
            style={{ width: '100%' }}
            placeholder="Select product"
            value={productId}
            fetchOptions={fetchProducts}
            onChange={handleProductChange}
          />
        </Col>
      </Row>

      <Table<MaterialRow>
        size="small"
        rowKey="key"
        pagination={false}
        scroll={{ x: 700 }}
        dataSource={rows}
        columns={columns}
      />

      <Space wrap size={[12, 16]} align="start">
        {CALC_ACTIONS.map((action) => (
          <div key={action.type} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <Button
              type={action.primary ? 'primary' : 'default'}
              disabled={!materialsEnabled || !!calculatingType}
              loading={calculatingType === action.type}
              onClick={() => requestCalculate(action.type)}
            >
              {action.label}
            </Button>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {action.credits} credits
            </Typography.Text>
          </div>
        ))}
      </Space>

      <Modal
        open={!!calculatingType}
        footer={null}
        closable={false}
        maskClosable={false}
        centered
        keyboard={false}
      >
        <div style={{ textAlign: 'center', padding: '24px 8px' }}>
          <Spin size="large" />
          <Typography.Title level={4} style={{ marginTop: 20, marginBottom: 0 }}>
            {calculatingType ? calculatingMessage(calculatingType) : 'Calculating...'}
          </Typography.Title>
          <Typography.Text type="secondary">Please wait a few seconds</Typography.Text>
        </div>
      </Modal>

      {result ? (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography.Title level={4} style={{ margin: 0 }}>
              Result — {result.calculationType}
            </Typography.Title>
            <Button
              icon={<DownloadOutlined />}
              type="primary"
              loading={pdfMutation.isPending}
              onClick={() => pdfMutation.mutate(result.reportId)}
            >
              Download PDF
            </Button>
          </div>

          <Descriptions size="small" bordered column={{ xs: 1, sm: 2, md: 3 }}>
            <Descriptions.Item label="Product">
              {result.productName} ({result.productCategory})
            </Descriptions.Item>
            <Descriptions.Item label="Company">{result.companyName}</Descriptions.Item>
            <Descriptions.Item label="User">{result.userName}</Descriptions.Item>
            <Descriptions.Item label="Total kg">{formatPct(result.totalQuantityKg)}</Descriptions.Item>
            <Descriptions.Item label="AD %">{formatPct(result.finalAdPercent)}</Descriptions.Item>
            <Descriptions.Item label="Alkali %">{formatPct(result.finalAlkaliPercent)}</Descriptions.Item>
            <Descriptions.Item label="Salt %">{formatPct(result.finalSaltPercent)}</Descriptions.Item>
            <Descriptions.Item label="Moisture %">
              {formatPct(result.finalMoisturePercent)}
            </Descriptions.Item>
            <Descriptions.Item label="Insoluble %">
              {formatPct(result.finalInsolublePercent)}
            </Descriptions.Item>
          </Descriptions>

          <Table
            size="small"
            rowKey="rawMaterialId"
            pagination={false}
            scroll={{ x: 900 }}
            dataSource={result.materials}
            columns={[
              { title: 'Material', dataIndex: 'materialName' },
              { title: 'Qty', dataIndex: 'quantity', width: 80 },
              { title: 'UOM', dataIndex: 'uom', width: 80 },
              {
                title: 'Kg',
                dataIndex: 'quantityKg',
                width: 90,
                render: (v: number) => formatPct(v),
              },
              {
                title: 'Recipe %',
                dataIndex: 'recipePercent',
                width: 90,
                render: (v: number) => formatPct(v),
              },
            ]}
          />

        </Space>
      ) : null}
    </Space>
  );
}
