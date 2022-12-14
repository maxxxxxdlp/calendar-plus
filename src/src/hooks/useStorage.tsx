import React from 'react';

import { VersionsContext } from '../components/Contexts/VersionsContext';
import type { WidgetDefinition } from '../components/Dashboard';
import type { RawEventsStore } from '../components/EventsStore';
import type { Goal } from '../components/Goals/Widget';
import type { UserPreferences } from '../components/Preferences/helpers';
import type { VirtualCalendar } from '../components/Widgets/VirtualCalendars';
import { f } from '../utils/functools';
import type { GetSet, RA, RR } from '../utils/types';
import { setDevelopmentGlobal } from '../utils/types';
import { useAsyncState } from './useAsyncState';
import { Synonym } from '../components/Widgets/Synonyms';

export type StorageDefinitions = {
  readonly layout: RA<WidgetDefinition>;
  readonly goals: RA<Goal>;
  readonly events: RawEventsStore;
  readonly preferences: UserPreferences;
  readonly ghostEvents: RA<string>;
  readonly virtualCalendars: RA<VirtualCalendar>;
  readonly overSizeStorage: RA<string>;
  readonly storageVersions: Partial<RR<keyof StorageDefinitions, string>>;
  readonly customViewSize: number;
  readonly synonyms: RA<Synonym>;
};

/**
 * A wrapper for extensions Storage API (with checks for value size being over
 * quota). If value size is over qouta, it automatically switches to using
 * local storage.
 */
export function useSafeStorage<NAME extends keyof StorageDefinitions>(
  name: NAME,
  defaultValue: StorageDefinitions[NAME],
  type: 'local' | 'sync' = 'sync',
  version?: string
): GetSet<StorageDefinitions[NAME] | undefined> {
  const [isOverSize, setIsOverSize] = useOverSize(name);
  const resolvedType = isOverSize ? 'local' : type;

  /**
   * If storage is switched from local to sync, remove the value from local.
   * Don't do the same for sync so as to leave the previous value available
   * for other devices.
   */
  const previousType = React.useRef(type);
  React.useEffect(() => {
    if (type === 'sync' && previousType.current === 'local')
      chrome.storage.sync.remove(name).catch(console.error);
    previousType.current = type;
  }, [name, type]);

  const [value, rawUpdateValue] = useStorage(
    name,
    defaultValue,
    resolvedType,
    version
  );
  const updateValue = React.useCallback(
    (value: StorageDefinitions[NAME] | undefined) => {
      const isNewlyOverSize = type === 'sync' && isOverSizeLimit(name, value);
      let updatedType: 'local' | 'sync' =
        resolvedType === 'local' || isNewlyOverSize ? 'local' : 'sync';
      if (resolvedType === 'sync' && isNewlyOverSize) {
        setIsOverSize(true);
        updatedType = 'local';
      } else if (
        resolvedType === 'local' &&
        type === 'sync' &&
        !isNewlyOverSize
      ) {
        setIsOverSize(false);
        updatedType = 'sync';
      }
      rawUpdateValue(value, updatedType);
    },
    [resolvedType, type, rawUpdateValue]
  );
  return React.useMemo(() => [value, updateValue], [value, updateValue]);
}

function isOverSizeLimit(name: string, value: unknown): boolean {
  if (value === undefined) return false;
  const size = JSON.stringify({ [name]: value }).length;
  return size > chrome.storage.sync.QUOTA_BYTES_PER_ITEM;
}

/**
 * A wrapper for extensions Storage API (without checking for quota size)
 * with checks for cache version. If cache is found to be outdated, it is removed
 */
export function useStorage<NAME extends keyof StorageDefinitions>(
  name: NAME,
  defaultValue: StorageDefinitions[NAME],
  type: 'local' | 'sync' = 'sync',
  version?: string
): readonly [
  StorageDefinitions[NAME] | undefined,
  (
    newValue: StorageDefinitions[NAME] | undefined,
    typeOverride?: 'local' | 'sync'
  ) => void
] {
  const [value, setValue] = useSimpleStorage(name, defaultValue, type);

  // Reset to default if cache is outdated
  const [cacheVersions, setCacheVersions] = React.useContext(VersionsContext);
  React.useLayoutEffect(() => {
    if (cacheVersions === undefined || cacheVersions[name] === version) return;
    console.log('Cache version mismatch detected', { name, cacheVersions });
    if (cacheVersions[name] === undefined) setValue(defaultValue);
    setCacheVersions({ ...cacheVersions, [name]: version });
  }, [name, cacheVersions, version, setCacheVersions, defaultValue, setValue]);

  return [value, setValue];
}

/**
 * A wrapper for extensions Storage API (without checking for quota size
 * or cache version)
 */
export function useSimpleStorage<NAME extends keyof StorageDefinitions>(
  name: NAME,
  defaultValue: StorageDefinitions[NAME],
  type: 'local' | 'sync' = 'sync'
): readonly [
  StorageDefinitions[NAME] | undefined,
  (
    newValue: StorageDefinitions[NAME] | undefined,
    typeOverride?: 'local' | 'sync'
  ) => void
] {
  const [value, setValue] = useAsyncState<StorageDefinitions[NAME]>(
    React.useCallback(
      async () =>
        chrome.storage[type].get(name).then((storage) => {
          const value = storage[name];
          setDevelopmentGlobal(`_${name}`, value);
          return (
            (value as StorageDefinitions[NAME] | undefined) ?? defaultValue
          );
        }),
      [name, type]
    ),
    false
  );

  const updateValue = React.useCallback(
    (
      value: StorageDefinitions[NAME] | undefined,
      typeOverride: 'local' | 'sync' = type
    ) => {
      chrome.storage[typeOverride]
        .set({
          [name]: value,
        })
        .catch(console.error);
      setValue(value);
      setDevelopmentGlobal(`_${name}`, value);
    },
    [setValue, name, type]
  );

  return [value, updateValue];
}

/**
 * Stores and indicator of whether the storage is over size or no
 */
function useOverSize(name: string): GetSet<boolean> {
  const [overSize = [], setOverSize] = useSimpleStorage(
    'overSizeStorage',
    [],
    'local'
  );
  return [
    overSize.includes(name),
    React.useCallback(
      (isOverSize: boolean) => {
        const newArray = f.unique(
          isOverSize ? [...overSize, name] : overSize.filter((n) => n !== name)
        );
        if (newArray.length !== overSize.length) setOverSize(newArray);
      },
      [name, setOverSize, overSize]
    ),
  ];
}
