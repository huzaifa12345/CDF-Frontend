import { Select, type SelectProps } from 'antd';
import { useMemo, useState } from 'react';

export type AsyncSelectOption = {
  label: string;
  value: string | number;
};

type FetchOptions = (search: string) => Promise<AsyncSelectOption[]>;

type AsyncSelectProps = Omit<SelectProps, 'options' | 'onSearch' | 'filterOption' | 'showSearch'> & {
  fetchOptions: FetchOptions;
  debounceMs?: number;
  excludeValues?: Array<string | number>;
};

export function AsyncSelect({
  fetchOptions,
  debounceMs = 300,
  excludeValues = [],
  value,
  ...rest
}: AsyncSelectProps) {
  const [options, setOptions] = useState<AsyncSelectOption[]>([]);
  const [fetching, setFetching] = useState(false);

  const onSearch = useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    return (search: string) => {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(async () => {
        setFetching(true);
        try {
          const next = await fetchOptions(search);
          setOptions(next.slice(0, 50));
        } finally {
          setFetching(false);
        }
      }, debounceMs);
    };
  }, [debounceMs, fetchOptions]);

  const visibleOptions = useMemo(() => {
    const excluded = new Set(excludeValues.map(String));
    const current = value == null ? null : String(value);
    return options.filter((option) => {
      const optionValue = String(option.value);
      if (current && optionValue === current) {
        return true;
      }
      return !excluded.has(optionValue);
    });
  }, [excludeValues, options, value]);

  return (
    <Select
      showSearch
      allowClear
      filterOption={false}
      onSearch={onSearch}
      onDropdownVisibleChange={(open) => {
        if (open) {
          onSearch('');
        }
      }}
      notFoundContent={fetching ? 'Loading...' : undefined}
      options={visibleOptions}
      value={value}
      {...rest}
    />
  );
}
