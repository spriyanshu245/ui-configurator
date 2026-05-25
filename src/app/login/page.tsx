"use client";
import WelcomeBackPanel from "@/app/components/WelcomePanel/WelcomeBackPanel";
import styles from "./loginPage.module.scss";
import LoginForm from "@/app/components/LoginForm/LoginForm";

const LoginPage = () => {
  return (
    <div className={styles.loginPageContainer}>
      <WelcomeBackPanel
        className={`${styles.column} ${styles.leftPanel}`}
      ></WelcomeBackPanel>
      <div className={`${styles.rightPanel} ${styles.column}`}>
        <div className={styles.formContainer}>
          <LoginForm></LoginForm>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
