"use client";
import styles from "./HeaderV2.module.scss";
import UserNotificationV2 from "./UserNotificationV2";
import { useRouter } from "next/navigation";
import CloseIcon from "@/app/components/SVGIcons/Close";
import RahiLogo from "@/app/components/SVGIcons/Rahi";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";

const HeaderV2 = () => {
  const router = useRouter();
  const {
    pageTitle,
    pageSubTitle,
    resourceCode,
    resourceMetadata,
    resourceStatus,
    resourceVersion,
    backRoute,
    showCloseIcon,
  } = useHeaderV2();

  const navigateToHome = () => {
    router.push("/");
  };

  const navigateBack = () => {
    router.push(backRoute);
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button
          className={styles.logo}
          onClick={navigateToHome}
          aria-label="Home"
          title="Home"
        >
          <RahiLogo />
        </button>
        <div className={styles.pageTitleContainer}>
          {pageTitle && <h3 className={styles.title}>{pageTitle}</h3>}
          {pageSubTitle && (
            <div className={styles.subTitle}>{pageSubTitle}</div>
          )}
        </div>
      </div>
      <div className={styles.centerSection}>
        {resourceCode && (
          <>
            <div className={styles.pageHeader}>{resourceCode}</div>
            {resourceVersion && (
              <div className={styles.resourceVersion}>{resourceVersion}</div>
            )}
            {resourceMetadata && (
              <div className={styles.resourceMetadata}>{resourceMetadata}</div>
            )}
            {resourceStatus && (
              <div
                className={`${styles.resourceStatus} ${
                  styles[resourceStatus.toLowerCase()]
                }`}
              >
                {resourceStatus}
              </div>
            )}
          </>
        )}
      </div>
      <div className={styles.rightSection}>
        <UserNotificationV2 />
        {showCloseIcon && (
          <button
            type="button"
            className={styles.closeButton}
            onClick={navigateBack}
            aria-label="Close"
            title="Close"
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </header>
  );
};

export default HeaderV2;
