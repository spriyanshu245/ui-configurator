import styles from "./SpinningLoader.module.scss";

const SpinningLoader = ({ id }: { id?: string }) => {
  return (
    <svg
      data-testid={id}
      fill="hsl(228, 97%, 42%)"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.spinnerSvg}
    >
      <defs>
        <linearGradient id="RadialGradient8932">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
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

export default SpinningLoader;
