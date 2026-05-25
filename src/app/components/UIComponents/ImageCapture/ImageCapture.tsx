"use client";

import React from "react";
import { ImageCaptureComponent } from "@/app/types/types";
import styles from "./ImageCapture.module.scss";
import sharedStyles from "../../../styles/shared.module.scss";
import Camera from "../../SVGIcons/Camera";

interface ImageCaptureProps {
  component: ImageCaptureComponent;
}

const ImageCapture: React.FC<ImageCaptureProps> = ({ component }) => {
  return (
    <div
      id={component.id}
      className={`${sharedStyles.formGroup} ${styles.formGroup}`}
      key={component.id}
      data-testid="capture-image"
    >
      {component.properties.label && component.properties.showLabel && (
        <label htmlFor={component.id} className={sharedStyles.formGroupLabel}>
          {component.properties.label}
        </label>
      )}
      <div className={styles.captureImage} data-testid="capture-image-icon">
        <Camera />
      </div>
    </div>
  );
};

export default ImageCapture;
