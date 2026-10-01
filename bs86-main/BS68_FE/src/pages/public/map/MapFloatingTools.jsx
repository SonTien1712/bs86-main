import s from './MapPage.module.scss';

function SearchToggleIcon() {
    return (
        <svg aria-hidden='true' height='22' viewBox='0 0 24 24' width='22'>
            <circle cx='6' cy='7' fill='currentColor' r='1.4' />
            <circle cx='6' cy='12' fill='currentColor' r='1.4' />
            <circle cx='6' cy='17' fill='currentColor' r='1.4' />
            <path
                d='M10 7h8M10 12h8M10 17h8'
                fill='none'
                stroke='currentColor'
                strokeLinecap='round'
                strokeWidth='2'
            />
        </svg>
    );
}

function LocateIcon() {
    return (
        <svg aria-hidden='true' height='22' viewBox='0 0 24 24' width='22'>
            <path
                d='M12 3v3M12 18v3M3 12h3M18 12h3'
                fill='none'
                stroke='currentColor'
                strokeLinecap='round'
                strokeWidth='2'
            />
            <circle
                cx='12'
                cy='12'
                fill='none'
                r='5'
                stroke='currentColor'
                strokeWidth='2'
            />
            <circle cx='12' cy='12' fill='currentColor' r='2' />
        </svg>
    );
}

export default function MapFloatingTools({
    panelOpen,
    panelMode,
    userLocation,
    locationLoading,
    onToggleSearchPanel,
    onLocateMe
}) {
    return (
        <div className={s.floatingTools}>
            <button
                className={`${s.roundAction} ${
                    panelOpen && panelMode === 'list' ? s.roundActionActive : ''
                }`}
                onClick={onToggleSearchPanel}
                type='button'
            >
                <SearchToggleIcon />
            </button>

            <button
                className={`${s.roundAction} ${
                    userLocation ? s.roundActionActive : ''
                }`}
                onClick={onLocateMe}
                type='button'
                disabled={locationLoading}
            >
                <LocateIcon />
            </button>
        </div>
    );
}
