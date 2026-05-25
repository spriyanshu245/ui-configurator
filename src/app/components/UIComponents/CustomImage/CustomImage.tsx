import React from "react";
import Image from "next/image";
import styles from "./CustomImage.module.scss";
import { ImageComponent } from "@/app/types/types";
import { componentIcons } from "@/app/data/componentIcons";

interface CustomImageProps {
  component: ImageComponent;
}

const CustomImage: React.FC<CustomImageProps> = ({ component }) => {
  const { src, alt, width } = component.properties ?? {};
  return (
    <div id={component.id} style={{ width: `${width}%` }}>
      {src ? (
        <Image
          className={styles.imageComponent}
          src={src}
          alt={alt || "Default alt text"}
          width={0}
          height={0}
          sizes="100vw"
          style={{ width: "100%", height: "auto" }}
          priority={true}
        />
      ) : (
        <div
          className={styles.imagePlaceholder}
          dangerouslySetInnerHTML={{
            __html: componentIcons.filter((icon) => icon.type === "image")[0]
              .svgCode,
          }}
        ></div>
      )}
    </div>
  );
};

export default CustomImage;
