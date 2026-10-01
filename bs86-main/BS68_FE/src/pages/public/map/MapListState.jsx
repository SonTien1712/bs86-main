import s from './MapPage.module.scss';

export default function MapListState({ title, description, actionLabel, onAction }) {
    return (
        <div className={s.stateCard}>
            <div className={s.stateIcon}>◦</div>
            <div className={s.stateTitle}>{title}</div>
            <div className={s.stateDescription}>{description}</div>
            {actionLabel ? (
                <button className={s.stateAction} onClick={onAction} type='button'>
                    {actionLabel}
                </button>
            ) : null}
        </div>
    );
}
