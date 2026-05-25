import React, { useEffect, useState } from "react";
import styles from "./UserNotificationV2.module.scss";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import ExclamationIcon from "@/app/components/SVGIcons/Exclamation";
import SuccessIcon from "@/app/components/SVGIcons/Success";

const UserNotificationV2 = () => {
  const { userNotification, setUserNotification } = useHeaderV2();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (userNotification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setUserNotification(null);
      }, userNotification?.time);

      return () => clearTimeout(timer);
    }
  }, [userNotification]);

  if (userNotification && isVisible) {
    return (
      <div
        className={`${styles.userNotification} ${
          userNotification ? styles[userNotification.type] : ""
        }`}
      >
        {userNotification?.type === "error" && <ExclamationIcon />}
        {userNotification?.type === "success" && <SuccessIcon />}
        <span>{userNotification?.text}</span>
      </div>
    );
  }
  return null;
};

export default UserNotificationV2;
