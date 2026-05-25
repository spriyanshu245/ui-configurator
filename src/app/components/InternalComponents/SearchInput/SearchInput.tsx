import styles from "./SearchInput.module.scss";
import InternalIcons from "@/app/utils/InternalIcons";

interface SearchInputProps {
  setIsSearchInput: (newValue: boolean) => void;
  isSearchInput: boolean;
  setQuery: (newValue: string) => void;
  query: string;
}

const SearchInput = ({
  setIsSearchInput,
  isSearchInput,
  setQuery,
  query,
}: SearchInputProps) => {
  return (
    <div className={styles.searchContainer}>
      {!isSearchInput && (
        <button
          className={styles.searchIcon}
          onClick={() => setIsSearchInput(!isSearchInput)}
          aria-label="Open search"
        >
          {InternalIcons("search")}
        </button>
      )}

      {isSearchInput && (
        <div className={styles.inputWrapper}>
          <input
            id="searchInput"
            type="text"
            placeholder="Search pages (name or code)"
            value={query}
            autoFocus={true}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setQuery(e.target.value)
            }
            className={styles.searchInput}
          />
          <button
            className={styles.closeButton}
            onClick={() => {
              setIsSearchInput(!isSearchInput);
              setQuery("");
            }}
            aria-label="Close search"
          >
            {InternalIcons("close")}
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchInput;
