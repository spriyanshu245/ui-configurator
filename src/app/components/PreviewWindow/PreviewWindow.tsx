"use client";
import { useState } from "react";
import { IRequestData, Microsite, UserTask } from "@/app/types/types";
import { MicrositeRenderer } from "@rahi/web-renderer-lib";
import styles from "./PreviewWindow.module.scss";
import RefreshIcon from "../SVGIcons/Refresh";
import ExitIcon from "../SVGIcons/Exit";
import MobileIcon from "../SVGIcons/Mobile";
import DesktopIcon from "../SVGIcons/Desktop";
import { apiRequest } from "@/app/services/APIService";
import { reloadWindow, closeWindow } from "@/app/utils/utils";

interface PreviewWindowProps {
  microsite: Microsite;
  activePageSlug: string;
  micrositeSlug: string;
  sourceSystem?: string;
}

const PreviewWindow = (props: PreviewWindowProps) => {
  const { microsite, activePageSlug, micrositeSlug, sourceSystem } = props;
  const [viewMode, setViewMode] = useState("desktop");

  const changeViewMode = (view: string) => () => {
    setViewMode(view);
  };

  const getPageDSL = async (pageCode: string) => {
    const pageVersion = Number(
      microsite.pages.find((page) => page.pageCode === pageCode)?.pageVersion ?? 1,
    );
    const requestData: IRequestData = {
      endpoint: `/api/v1/config/pages/${pageCode}?version=${pageVersion}`,
      method: "GET",
    };
    try {
      const response: UserTask = await apiRequest(requestData);

      if (!(response as Record<string, any>)?.error) {
        return response;
      } else {
        console.log(
          "Failed to fetch page DSL",
          (response as Record<string, any>)?.error,
        );
      }
    } catch (error) {
      console.error("Failed to fetch page by code:", pageCode, error);
    }
  };
  return (
    <div className={styles.previewWindow}>
      <div className={styles.previewHeadingContainer}>
        <h3 className={styles.previewHeading}>Preview</h3>
        <div className={styles.previewControls}>
          <button
            className={`${styles.button} ${styles.svgHeight} ${
              viewMode === "mobile" ? styles.active : ""
            }`}
            onClick={changeViewMode("mobile")}
            title="Mobile View"
          >
            <MobileIcon />
          </button>
          <button
            className={`${styles.button} ${styles.svgHeight} ${
              viewMode === "desktop" ? styles.active : ""
            }`}
            onClick={changeViewMode("desktop")}
            title="Desktop View"
          >
            <DesktopIcon />
          </button>

          <button
            className={styles.button}
            onClick={reloadWindow}
            title="Refresh Preview"
          >
            <RefreshIcon />
          </button>
          <button
            className={styles.button}
            onClick={closeWindow}
            title="Close Preview"
          >
            <ExitIcon />
          </button>
        </div>
      </div>
      <div
        className={`${styles.rendererContainer} ${
          viewMode === "mobile"
            ? styles.mobile
            : viewMode === "desktop" && styles.desktop
        }`}
      >
        <MicrositeRenderer
          setActiveMicrosite={() => {}}
          data={microsite}
          pageSlug={activePageSlug}
          micrositeSlug={micrositeSlug}
          isAccessControlled={false}
          sourceSystem={sourceSystem}
          getPageDSL={getPageDSL}
        />
      </div>
    </div>
  );
};

export default PreviewWindow;
