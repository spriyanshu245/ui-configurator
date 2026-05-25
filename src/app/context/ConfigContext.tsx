"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from "react";

interface Config {
  NEXT_PUBLIC_BASE_URL?: string;
}

interface ConfigContextProps {
  config: Config | null;
  isLoading: boolean;
  error: string | null;
}

const ConfigContext = createContext<ConfigContextProps>({
  config: null,
  isLoading: true,
  error: null,
});

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<Config | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/config");
        if (!res.ok) {
          throw new Error(`Failed to fetch config: ${res.statusText}`);
        }
        const data: Config = await res.json();

        setConfig(data);
      } catch (error: any) {
        console.error("Failed to fetch config:", error);
        setError(error.message || "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const contextValue = useMemo(
    () => ({ config, isLoading, error }),
    [config, isLoading, error]
  );

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
};
