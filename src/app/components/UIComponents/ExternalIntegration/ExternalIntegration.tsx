"use client";

import React from "react";
import styles from "./ExternalIntegration.module.scss";
import { BaseComponent } from "@/app/types/types";
import {
  externalIntegrationIcons,
  DefaultExternalIntegrationIcon,
} from "@/app/components/SVGIcons/ExternalIntegrationIcons";

interface ExternalIntegrationProps {
  component: BaseComponent;
}

export default function ExternalIntegration({
  component,
}: Readonly<ExternalIntegrationProps>) {
  const props = component.properties || {};
  const selectedService: string = props.selectedService || "";
  const icon = externalIntegrationIcons[selectedService] || (
    <DefaultExternalIntegrationIcon />
  );

  return (
    <div className={styles.container} data-testid="external-integration">
      {props.showLabel && props.label && (
        <div className={styles.label}>{props.label}</div>
      )}
      <div className={styles.card}>
        <div className={styles.icon}>{icon}</div>
        <div className={styles.details}>
          <div className={styles.title}>
            {selectedService || "Select a Service"}
          </div>
          <div className={styles.meta}>
            {props.apiName ? `API: ${props.apiName}` : "No API configured"}
          </div>
        </div>
      </div>
    </div>
  );
}
