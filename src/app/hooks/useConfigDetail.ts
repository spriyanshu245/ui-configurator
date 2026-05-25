"use client";

import { useEffect, useState } from "react";
import { reconcileConfig } from "./../utils/accessControlUtils";
import { Microsite, BaseComponent } from "@/app/types/types";
import { BaseConfig } from "../types/accessControlConfig";
import { fetchPageDSL } from "../services/microsite.service";
export interface UseConfigDetailParams<T, TDetail> {
  code: string;
  fetchConfig: (code: string) => Promise<TDetail>;
  fetchDSL: (slug: string, version: number) => Promise<any>;
  convertDSL: (dsl: Microsite) => Promise<T>;
  mapFromApi: (data: T) => T;
}

export interface UseConfigDetailReturn<T extends BaseConfig> {
  config: T | null;
  setConfig: React.Dispatch<React.SetStateAction<T | null>>;
  dslData: Microsite | null;
  pageComponentsMap: Map<string, BaseComponent[]>;
  loading: boolean;
  error: string | null;
  newComponentIds: string[];
  removedCount: number;
  setNewComponentIds: React.Dispatch<React.SetStateAction<string[]>>;
  setRemovedCount: React.Dispatch<React.SetStateAction<number>>;
}

export const useConfigDetail = <T extends BaseConfig, TDetail>({
  code,
  fetchConfig,
  fetchDSL,
  convertDSL,
  mapFromApi,
}: UseConfigDetailParams<T, TDetail>): UseConfigDetailReturn<T> => {
  const [config, setConfig] = useState<T & BaseConfig | null>(null);
  const [dslData, setDslData] = useState<Microsite | null>(null);
  const [pageComponentsMap, setPageComponentsMap] = useState(
    new Map<string, BaseComponent[]>()
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newComponentIds, setNewComponentIds] = useState<string[]>([]);
  const [removedCount, setRemovedCount] = useState(0);
    
  useEffect(() => {
      const fetchDslAndComponents = async (
        micrositeSlug: string,
        micrositeVersion: number
      ): Promise<Microsite | null> => {
        const micrositeResponse = await fetchDSL(
          micrositeSlug,
          micrositeVersion
        );
        const dslResponse = micrositeResponse.dslJson ?? micrositeResponse;
        if (!dslResponse?.pages) return null;
  
        const dsl = dslResponse as unknown as Microsite;
        setDslData(dsl);
  
        const componentsMap = new Map<string, BaseComponent[]>();
        const pagePromises = dsl.pages.map(async (page) => {
          try {
            const pageData = await fetchPageDSL(
              page.pageCode ?? "",
              page.pageVersion ?? 1,
            );
            if (pageData?.components) {
              componentsMap.set(page.pageCode ?? "", pageData.components);
            }
          } catch (error) {
            console.error(
              `Failed to fetch components for page ${page.pageCode}:`,
              error
            );
          }
        });
        await Promise.all(pagePromises);
        setPageComponentsMap(componentsMap);
        return dsl;
      };
  
      const applyConfig = async (
        config: T,
        dsl: Microsite | null,
        hasPagesFromApi: boolean
      ) => {
        if (!hasPagesFromApi && dsl) {
          const generatedConfig = await convertDSL(dsl);
            setConfig({
              ...config,
              pages: [...generatedConfig.pages],
              micrositeSlug: config.micrositeSlug,
              version: config.version,
            });
          return;
        }
  
        const mappedConfig = mapFromApi(config);
  
        if (dsl) {
          const freshConfig = await convertDSL(dsl);
          const result = reconcileConfig<T>(mappedConfig, freshConfig);
          setConfig(result.config);
          setNewComponentIds(result.newComponentIds);
          setRemovedCount(result.removedComponentCount + result.removedPageCount);
        } else {
          setConfig(mappedConfig );
        }
      };
  
      const loadData = async () => {
        if (!code) return;
  
        setLoading(true);
        setError(null);
  
        try {
          const configResponse = await fetchConfig(decodeURIComponent(code));
  
          const config: T = Array.isArray(
            configResponse
          )
            ? configResponse[0]
            : configResponse;
  
          if (!config) {
            throw new Error("Configuration not found");
          }
  
          const micrositeSlug = config.micrositeSlug;
          const micrositeVersion = config.version;
          const hasPagesFromApi =
            config.pages && config.pages.length > 0;
  
          let dsl: Microsite | null = null;
  
          if (micrositeSlug) {
            try {
              dsl = await fetchDslAndComponents(micrositeSlug, micrositeVersion);
            } catch (dslError) {
              console.warn("Could not fetch microsite DSL:", dslError);
            }
          }
  
          await applyConfig(config, dsl, hasPagesFromApi);
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to load access configuration";
          setError(message);
        } finally {
          setLoading(false);
        }
      };
  
      loadData();
    }, [code]);

  return {
    config,
    setConfig,
    dslData,
    pageComponentsMap,
    loading,
    error,
    newComponentIds,
    removedCount,
    setNewComponentIds,
    setRemovedCount,
  };
};
