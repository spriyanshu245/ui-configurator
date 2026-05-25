import { FileUploadComponent } from "@/app/types/types";
import React from "react";
import styles from "./FileUpload.module.scss";
import sharedStyles from "../../../styles/shared.module.scss";
import FileUploadIcon from "../../SVGIcons/FileUploadIcon";

interface FileUploadProps {
  component: FileUploadComponent;
}

function FileUpload({ component }: Readonly<FileUploadProps>) {
  return (
    <div
      id={component.id}
      className={`${sharedStyles.formGroup} ${styles.formGroup}`}
      key={component.id}
      data-testid="file-upload"
    >
      {component.properties.label && component.properties.showLabel && (
        <label htmlFor={component.id} className={sharedStyles.formGroupLabel}>
          {component.properties.label}
        </label>
      )}
      <div className={styles.fileUpload}>
       <FileUploadIcon />
      </div>
    </div>
  );
}

export default FileUpload;
