import styles from './Loader.module.scss';
export const Loader = () => {
    return (
        <div className={styles.loader}>
            <svg width="35" height="40" viewBox="0 0 35 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path id="path1" d="M25.7887 0H0V8.87142H25.7887V17.8608H34.647V8.87142V0H25.7887Z" fill="#1A75B7" stroke="#1A75B7" strokeWidth="2">
                    <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
                </path>
                <path id="path2" d="M8.85831 21.2285V12.2261H0V21.2285V30.0868V39.0893H8.85831V30.0868H25.7887V39.0893H34.647V30.0868V21.2285H25.7887H8.85831Z" fill="#16A197" stroke="#16A197" strokeWidth="2">
                    <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
                </path>
            </svg>
        </div>
    )
}

