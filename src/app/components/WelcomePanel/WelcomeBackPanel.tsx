import React from "react";
import Background from "@/app/components/SVGIcons/Background";
import styles from "./WelcomeBackPanel.module.scss";
import RahiLogo from "@/app/components/SVGIcons/RahiLogo";
interface WelcomeBackPanelProps {
  className?: string;
}
const WelcomeBackPanel = ({ className }: WelcomeBackPanelProps) => {
  return (
    <div className={`${styles.welcomeBackPanel} ${className}`}>
      <Background className={styles.background} type={"welcomeBackPanel"} />
      <RahiLogo className={styles.logoBackground} />
      <h1 className={`${styles.welcomeMessage} ${styles.fadeIn}`}>
        Welcome back!
      </h1>
      <p className={`${styles.welcomeDescription} ${styles.fadeIn}`}>
        Simplify your workflow and streamline loan processing with just a few
        clicks!
      </p>
      <div className={styles.copyright}>
        &copy; {new Date().getFullYear()} Rahi Platform Technologies. All Rights
        Reserved.
      </div>
    </div>
  );
};

export default WelcomeBackPanel;
