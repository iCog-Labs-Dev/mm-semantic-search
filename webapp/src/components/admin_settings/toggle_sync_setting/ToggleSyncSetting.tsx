import React, {Fragment, useEffect, useState} from 'react';

import './toggleSyncSettingStyle.css';

function ToggleSyncSetting() {
    // eslint-disable-next-line no-process-env
    // const apiURL = process.env.MM_PLUGIN_API_URL;
    const apiURL = 'http://localhost:3333';
    const successMessage = 'Sync status changed successfully';
    const RETRYTIMEINSECONDS = 10 * 1000;

    const [loading, setLoading] = useState(false);
    const [wasSuccessful, setWasSuccessful] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
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
                const api = `${apiURL}/sync/is_fetch_in_progress`;

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

                // eslint-disable-next-line no-console
                console.log('is fetch in progress', jsonRes);

                setIsFetchInProgress(jsonRes);
            }
        };

        fetchSettings();
    }, []);

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

    useEffect(() => {
        setWasSuccessful(true);
    }, [isSyncing]);

    useEffect(() => {
        if (isFetchInProgress) {
            try {
                const syncWithServer = async () => {
                    await startSync();
                };
                syncWithServer();
            } catch (err: any) {
                // eslint-disable-next-line no-console
                console.warn('Error', err);
            } finally {
                setLoading(false);
            }
        }
    }, [isFetchInProgress]);

    const startSync = async () => {
        // const postObj = {
        //     mm_api_url: store.getState().entities.general.config.SiteURL + '/api/v4',
        // };

        const eventSourceStartSync = new EventSource(`${apiURL}/sync/start`);

        eventSourceStartSync.addEventListener('onProgress', (event) => {
            const data = JSON.parse(event.data);

            // eslint-disable-next-line no-console
            console.log('Sync progress... ', data);

            if (!isFetchInProgress) {
                setIsFetchInProgress(true);
            }

            setProgressPercentage(data / 100);
        });

        eventSourceStartSync.addEventListener('onDone', (event) => {
            const data = JSON.parse(event.data);

            // eslint-disable-next-line no-console
            console.log('Sync complete... ', data);

            setIsFetchInProgress(false);
        });

        eventSourceStartSync.addEventListener('onStop', (event) => {
            const data = JSON.parse(event.data);

            // eslint-disable-next-line no-console
            console.log('Sync stopped... ', data);

            setIsFetchInProgress(false);
            setIsSyncing(false);
        });

        eventSourceStartSync.onerror = (error) => {
            // eslint-disable-next-line no-console
            console.error('Start Sync SSE Error:', error);

            setHasError(true);
            setErrorMessage('error while receiving start sync event');

            eventSourceStartSync.close();
        };
    };

    const stopSync = async () => {
        const eventSourceStopSync = new EventSource(`${apiURL}/sync/stop`);

        eventSourceStopSync.addEventListener('onStop', (event) => {
            const data = JSON.parse(event.data);

            // eslint-disable-next-line no-console
            console.log('Sync stopped... ', data);

            setIsFetchInProgress(false);
            setIsSyncing(false);

            eventSourceStopSync.close();
        });

        eventSourceStopSync.onerror = (error) => {
            // eslint-disable-next-line no-console
            console.error('Stop Sync SSE Error:', error);

            setHasError(true);
            setErrorMessage('error while receiving stop sync event');

            eventSourceStopSync.close();
        };
    };

    const handleSetIsSyncing = async (checked: boolean) => {
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
            <div className='ss-setting-toggle-sync-container'>
                <div className='ss-setting-toggle-sync'>
                    <label className='switch'>
                        <input
                            type='checkbox'
                            checked={isSyncing || isFetchInProgress}
                            onChange={(e) => handleSetIsSyncing(e.target.checked)}
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
            </div>

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
}

export default ToggleSyncSetting;