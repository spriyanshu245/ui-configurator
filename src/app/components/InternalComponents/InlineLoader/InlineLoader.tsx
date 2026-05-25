import styles from "./inlineLoader.module.scss";

interface InlineLoaderIconProps {
  id?: string;
  stopColor?: string;
}

const InlineLoaderIcon = ({
  id,
  stopColor = "#00a79d",
}: InlineLoaderIconProps) => {
  return (
    <svg
      data-testid={id}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="BlueRadialGradient">
          <stop offset="0%" stopColor={stopColor} stopOpacity="1" />
          <stop offset="100%" stopColor={stopColor} stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <circle
        cx="10"
        cy="10"
        r="8"
        className={styles.spinner}
        strokeWidth="2"
      />
    </svg>
  );
};

export default InlineLoaderIcon;
