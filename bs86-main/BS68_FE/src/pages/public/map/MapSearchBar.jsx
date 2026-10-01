import s from './MapPage.module.scss';
import { DEFAULT_SEARCH_PLACEHOLDER } from './mapPage.utils';

export default function MapSearchBar({ query, onChange, onClear }) {
    return (
        <div className={s.searchBar}>
            <span className={s.searchGlyph}>⌕</span>
            <input
                className={s.searchInput}
                value={query}
                onChange={(event) => onChange(event.target.value)}
                placeholder={DEFAULT_SEARCH_PLACEHOLDER}
            />
            {query ? (
                <button className={s.searchClearButton} onClick={onClear} type='button'>
                    ✕
                </button>
            ) : null}
        </div>
    );
}
