"use client";
import React, { useState, useRef, useEffect } from "react";
import styles from "./DragDropFileUpload.module.scss";
import sharedStyles from "./../../../styles/shared.module.scss";
import Image from "next/image";
import { useComponentProperties } from "@/app/hooks/useComponentProperties";

interface DragDropFileUploadProps {
  id: string;
  componentId: string;
  propertyKey: string;
  fileTypes: string[];
  maxSize: number; // in bytes
  buttonClassName?: string;
  handleChange?: (name: string, value: any) => void;
}

const DragDropFileUpload: React.FC<DragDropFileUploadProps> = ({
  id,
  componentId,
  propertyKey,
  fileTypes,
  maxSize,
  buttonClassName,
  handleChange,
}) => {
  const { setProperty: setComponentProperty } =
    useComponentProperties(componentId);

  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewSrc(reader.result as string);
        if (handleChange) {
          handleChange(propertyKey, reader.result as string);
        } else if (componentId) {
          setComponentProperty(propertyKey, reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewSrc(null);
    }
  }, [file]);

  const handleFiles = (files: FileList) => {
    const selectedFile = files[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
      if (!fileTypes.includes(fileExtension || "")) {
        setError(`Invalid file type. Accepted types: ${fileTypes.join(", ")}`);
        setFile(null);
        return;
      }
      if (selectedFile.size > maxSize) {
        setError(
          `File size exceeds the limit of ${maxSize / (1024 * 1024)} MB`,
        );
        setFile(null);
        return;
      }
      setError(null);
      setFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const uploadContainerClassName = `${styles.uploadContainer} ${
    isDragOver ? styles.dragOver : ""
  }`;

  const clearImage = () => {
    setFile(null);
    setPreviewSrc(null);
    if (componentId) {
      setComponentProperty(propertyKey, "");
    }
  };

  return (
    <>
      <div
        role="presentation"
        className={uploadContainerClassName}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={triggerFileInput}
      >
        <input
          id={id}
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept={fileTypes.map((type) => `.${type}`).join(",")}
          style={{ display: "none" }}
        />
        {previewSrc && (
          <div className={styles.previewContainer}>
            <Image
              src={previewSrc}
              alt="Preview"
              width={0}
              height={0}
              sizes="100vw"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        )}
        <div
          className={`${styles.placeholder} ${previewSrc && styles.preview}`}
        >
          {!error ? (
            <div className={styles.placeholderImage}>
              <svg
                width="800px"
                height="800px"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  opacity="0.5"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14V10C2 6.22876 2 4.34315 3.17157 3.17157C4.34315 2 6.23869 2 10.0298 2C10.6358 2 11.1214 2 11.53 2.01666C11.5166 2.09659 11.5095 2.17813 11.5092 2.26057L11.5 5.09497C11.4999 6.19207 11.4998 7.16164 11.6049 7.94316C11.7188 8.79028 11.9803 9.63726 12.6716 10.3285C13.3628 11.0198 14.2098 11.2813 15.0569 11.3952C15.8385 11.5003 16.808 11.5002 17.9051 11.5001L18 11.5001H21.9574C22 12.0344 22 12.6901 22 13.5629V14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22Z"
                  fill="var(--background-6)"
                />
                <path
                  d="M8 14.5C8 15.3284 7.55228 16 7 16C6.44772 16 6 15.3284 6 14.5C6 13.6716 6.44772 13 7 13C7.55228 13 8 13.6716 8 14.5Z"
                  fill="var(--background-6)"
                />
                <path
                  d="M9.4161 16.876C9.07146 16.6463 8.60581 16.7394 8.37604 17.0841C8.14628 17.4287 8.23941 17.8944 8.58405 18.1241C10.6526 19.5032 13.3475 19.5032 15.4161 18.1241C15.7608 17.8944 15.8539 17.4287 15.6241 17.0841C15.3944 16.7394 14.9287 16.6463 14.5841 16.876C13.0193 17.9192 10.9808 17.9192 9.4161 16.876Z"
                  fill="var(--background-6)"
                />
                <path
                  d="M18 14.5C18 15.3284 17.5523 16 17 16C16.4477 16 16 15.3284 16 14.5C16 13.6716 16.4477 13 17 13C17.5523 13 18 13.6716 18 14.5Z"
                  fill="var(--background-6)"
                />
                <path
                  d="M11.5092 2.2601L11.5 5.0945C11.4999 6.1916 11.4998 7.16117 11.6049 7.94269C11.7188 8.78981 11.9803 9.6368 12.6716 10.3281C13.3629 11.0193 14.2098 11.2808 15.057 11.3947C15.8385 11.4998 16.808 11.4997 17.9051 11.4996L21.9574 11.4996C21.9698 11.6552 21.9786 11.821 21.9848 11.9995H22C22 11.732 22 11.5983 21.9901 11.4408C21.9335 10.5463 21.5617 9.52125 21.0315 8.79853C20.9382 8.6713 20.8743 8.59493 20.7467 8.44218C19.9542 7.49359 18.911 6.31193 18 5.49953C17.1892 4.77645 16.0787 3.98536 15.1101 3.3385C14.2781 2.78275 13.862 2.50487 13.2915 2.29834C13.1403 2.24359 12.9408 2.18311 12.7846 2.14466C12.4006 2.05013 12.0268 2.01725 11.5 2.00586L11.5092 2.2601Z"
                  fill="var(--background-6)"
                />
              </svg>
            </div>
          ) : (
            <div className={styles.placeholderImage}>
              <svg
                width="800px"
                height="800px"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.5092 2.2601L11.5 5.0945C11.4999 6.1916 11.4998 7.16117 11.6049 7.94269C11.7188 8.78981 11.9803 9.6368 12.6716 10.3281C13.3629 11.0193 14.2098 11.2808 15.057 11.3947C15.8385 11.4998 16.808 11.4997 17.9051 11.4996L21.9574 11.4996C21.9698 11.6552 21.9786 11.821 21.9848 11.9995H22C22 11.732 22 11.5983 21.9901 11.4408C21.9335 10.5463 21.5617 9.52125 21.0315 8.79853C20.9382 8.6713 20.8743 8.59493 20.7467 8.44218C19.9542 7.49359 18.911 6.31193 18 5.49953C17.1892 4.77645 16.0787 3.98536 15.1101 3.3385C14.2781 2.78275 13.862 2.50487 13.2915 2.29834C13.1403 2.24359 12.9408 2.18311 12.7846 2.14466C12.4006 2.05013 12.0268 2.01725 11.5 2.00586L11.5092 2.2601Z"
                  fill="var(--background-6)"
                />
                <path
                  opacity="0.5"
                  d="M2 13.6624V9.77493C2 6.10979 2 4.27723 3.17157 3.13861C4.34315 2 6.23869 2 10.0298 2C10.6212 2 11.0979 2 11.5003 2.01505L11.5092 2.25928L11.5 5.0079C11.5 5.06835 11.5 5.12842 11.5 5.18806C11.5 6.24676 11.5028 7.18347 11.6049 7.94269C11.7188 8.78981 11.9803 9.6368 12.6716 10.3281C13.3629 11.0193 14.2098 11.2808 15.057 11.3947C15.8385 11.4998 16.808 11.4997 17.9051 11.4996L21.9574 11.4996C21.9698 11.6552 21.9786 11.821 21.9848 11.9995H21.9926C22 12.3574 22 12.7647 22 13.2376V13.6624C22 13.897 22 14.1241 21.9997 14.3439L21.9877 14.3502C21.8628 14.4156 21.7638 14.4675 21.7205 14.4956C20.682 15.1681 19.3292 15.1681 18.2908 14.4956C17.5119 13.9911 16.4973 13.9911 15.7185 14.4956C14.6801 15.1681 13.3272 15.1681 12.2888 14.4956C11.51 13.9911 10.4954 13.9911 9.71653 14.4956C8.67811 15.1681 7.32527 15.1681 6.28684 14.4956C5.50802 13.9911 4.49339 13.9911 3.71457 14.4956C3.57738 14.5844 3.50878 14.6289 3.4595 14.6536C3.07304 14.8477 2.44233 14.6806 2.00034 14.364C2 14.1379 2 13.9041 2 13.6624Z"
                  fill="var(--background-6)"
                />
                <path
                  d="M9.99992 22H14.0001C17.7714 22 19.6571 22 20.8287 21.0667C21.9253 20.1932 21.9955 18.8213 22 16.1858L21.988 16.191C21.8631 16.2446 21.7641 16.2871 21.7208 16.3101C20.6823 16.8614 19.3294 16.8614 18.291 16.3101C17.5121 15.8966 16.4974 15.8966 15.7186 16.3101C14.6801 16.8614 13.3273 16.8614 12.2888 16.3101C11.51 15.8966 10.4953 15.8966 9.71645 16.3101C8.67798 16.8614 7.3251 16.8614 6.28664 16.3101C5.5078 15.8966 4.49314 15.8966 3.71429 16.3101C3.57709 16.3829 3.50849 16.4194 3.45921 16.4396C3.07274 16.5988 2.44201 16.4617 2 16.2022C2.00476 18.827 2.07693 20.195 3.17127 21.0667C4.34289 22 6.22856 22 9.99992 22Z"
                  fill="var(--background-6)"
                />
              </svg>
            </div>
          )}
          <div className={styles.placeholderText}>
            {!previewSrc
              ? "Drop an image here or Click to select"
              : "Change image"}
          </div>
          {error && <p className={styles.error}>{error}</p>}
        </div>
      </div>
      <div className={sharedStyles.mt10}>
        <button
          id="clearImageButton"
          type="button"
          className={`${sharedStyles.button} ${
            sharedStyles.secondaryBorderButton
          } ${buttonClassName ?? ""}`}
          onClick={clearImage}
        >
          Clear Image
        </button>
      </div>
    </>
  );
};

export default DragDropFileUpload;
