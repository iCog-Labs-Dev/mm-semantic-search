import PropTypes from 'prop-types';
import React, {Fragment, useEffect, useState, useRef} from 'react';

import './toggleSyncSettingStyle.css';

interface ToggleSyncSettingProps {
    pluginServerRoute: string;
    syncProgress: number;
    isSyncDone: boolean;
    isSyncStopped: boolean;
    syncStatus: object;
}

const ToggleSyncSetting: React.FC<ToggleSyncSettingProps> = ({pluginServerRoute, syncProgress, isSyncDone, isSyncStopped, syncStatus}) => {
    const successMessage = 'Sync status changed';

    const [loading, setLoading] = useState(false);
    const [wasSuccessful, setWasSuccessful] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSyncInProgress, setIsSyncInProgress] = useState<boolean>(false);
    const [isFetchInProgress, setIsFetchInProgress] = useState(false);
    const [progressPercentage, setProgressPercentage] = useState(0);

    useEffect(() => {
        const fetchSettings = async () => {
            const fetchOptions: RequestInit = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },

                // credentials: 'include',
            };

            setLoading(true);

            let response;

            try {
                const api = `${pluginServerRoute}/sync/is_sync_in_progress`;

                response = await fetch(api!, fetchOptions);
            } catch (err: any) {
                // eslint-disable-next-line no-console
                console.warn('Error', err);

                setHasError(true);
                setErrorMessage(err.message);
            } finally {
                setLoading(false);
            }

            if (response?.ok) {
                const jsonRes = await response.json();

                setIsSyncInProgress(jsonRes);
            }
        };

        fetchSettings();
    }, []);

    useEffect(() => {
        const isSyncInProgressNew = syncStatus.is_sync_in_progress;
        const isFetchInProgressNew = syncStatus.is_fetch_in_progress;

        setIsSyncInProgress((previousValue) => {
            if (previousValue === isSyncInProgressNew) {
                return previousValue;
            }

            setWasSuccessful(true);

            return isSyncInProgressNew;
        });

        // eslint-disable-next-line max-nested-callbacks
        setIsFetchInProgress((previousValue) => {
            return previousValue === isFetchInProgressNew ? previousValue : isFetchInProgressNew;
        });
    }, [syncStatus]);

    useEffect(() => {
        if (loading) {
            setHasError(false);
            setErrorMessage('');
        }
    }, [loading]);

    useEffect(() => {
        if (hasError) {
            setLoading(false);

            setTimeout(() => {
                setHasError(false);
                setErrorMessage('');
            }, 5000);
        }
    }, [hasError]);

    useEffect(() => {
        if (wasSuccessful) {
            setLoading(false);

            setTimeout(() => {
                setWasSuccessful(false);
                setErrorMessage('');
            }, 5000);
        }
    }, [wasSuccessful]);

    const startSync = async () => {
        const getOptions: RequestInit = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },

            // credentials: 'include',
        };

        setLoading(true);

        try {
            const api = `${pluginServerRoute}/sync/start`;

            await fetch(api!, getOptions);
        } catch (err: any) {
            // eslint-disable-next-line no-console
            console.warn('Error', err);

            setHasError(true);
            setErrorMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    const stopSync = async () => {
        const getOptions: RequestInit = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },

            // credentials: 'include',
        };

        setLoading(true);

        try {
            const api = `${pluginServerRoute}/sync/start`;

            await fetch(api!, getOptions);
        } catch (err: any) {
            // eslint-disable-next-line no-console
            console.warn('Error', err);

            setHasError(true);
            setErrorMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line no-console
        console.log('Sync progress: ', syncProgress);

        setProgressPercentage(syncProgress / 100);
    }, [syncProgress]);

    const handleSetIsSyncInProgress = async (checked: boolean) => {
        setLoading(true);

        try {
            if (checked) {
                await startSync();
            } else {
                await stopSync();
            }
        } catch (err: any) {
            // eslint-disable-next-line no-console
            console.warn('Error', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Fragment>
            {loading ? (
                <p> {'Loading ...'} </p>
            ) : (<div className='ss-setting-toggle-sync-container'>
                <div className='ss-setting-toggle-sync'>
                    <label className='switch'>
                        <input
                            type='checkbox'
                            checked={isSyncInProgress}
                            onChange={(e) => handleSetIsSyncInProgress(e.target.checked)}
                            disabled={loading}
                        />
                        <span className='slider round'/>
                    </label>
                </div>

                {isFetchInProgress ? <div className='ss-setting-sync-progress-wrapper'>
                    <progress
                        className='ss-setting-sync-progress'
                        value={progressPercentage}
                    />
                    <span className='ss-setting-sync-progress-percentage'>{ ((progressPercentage * 100).toFixed(1)) + '%' }</span>
                </div> : ''}
            </div>)}

            <p
                className='ss-toggle-sync-success-message'
                style={{display: wasSuccessful ? 'block' : 'none'}}
            >
                {successMessage}
            </p>
            <p
                className='ss-toggle-sync-error-message'
                style={{display: hasError ? 'block' : 'none'}}
            >
                {errorMessage}
            </p>
        </Fragment>
    );
};

ToggleSyncSetting.propTypes = {
    pluginServerRoute: PropTypes.string.isRequired,
    syncProgress: PropTypes.number.isRequired,
    isSyncDone: PropTypes.bool.isRequired,
    isSyncStopped: PropTypes.bool.isRequired,
    syncStatus: PropTypes.object.isRequired,
};

export default ToggleSyncSetting;