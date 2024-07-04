import React, {Fragment, useEffect, useState, useRef} from 'react';

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
    const [isSyncInProgress, setIsSyncInProgress] = useState<boolean>(false);
    const [isFetchInProgress, setIsFetchInProgress] = useState(false);
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [reRunEvent, setReRunEvent] = useState(false);

    const eventSource = useRef<EventSource>();
    const eventSourceStartSync = useRef<EventSource>();

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
                const api = `${apiURL}/sync/is_sync_in_progress`;

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
        if (eventSource.current) {
            eventSource.current.close();
        }

        let interval:NodeJS.Timer;

        eventSource.current = new EventSource(`${apiURL}/sync/status`);

        eventSource.current.addEventListener('onStatusChange', (event) => {
            const data = JSON.parse(event.data);

            const isSyncInProgressNew = data.is_sync_in_progress;
            const isFetchInProgressNew = data.is_fetch_in_progress;

            // eslint-disable-next-line max-nested-callbacks
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
        });

        eventSource.current.onerror = (error) => {
            // console.error('Sync SSE Error:', error);

            eventSource.current?.close();

            interval = setInterval(async () => {
                // eslint-disable-next-line max-nested-callbacks
                setReRunEvent((previousValue) => {
                    return !previousValue;
                });
            }, RETRYTIMEINSECONDS);
        };

        return () => {
            clearInterval(interval);
        };
    }, [reRunEvent, eventSource]);

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
        if (isFetchInProgress) {
            setLoading(true);
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

        setLoading(true);
        if (eventSourceStartSync.current) {
            eventSourceStartSync.current.close();
        }

        eventSourceStartSync.current = new EventSource(`${apiURL}/sync/start`);

        eventSourceStartSync.current.addEventListener('onProgress', (event) => {
            const data = JSON.parse(event.data);
            setLoading(false);

            if (!isFetchInProgress) {
                setIsFetchInProgress(true);
            }

            setProgressPercentage(data / 100);
        });

        eventSourceStartSync.current.addEventListener('onDone', (event) => {
            setLoading(false);

            setIsFetchInProgress(false);
        });

        eventSourceStartSync.current.addEventListener('onStop', (event) => {
            setLoading(false);

            setIsFetchInProgress(false);
            setIsSyncInProgress(false);
        });

        eventSourceStartSync.current.onerror = (error) => {
            // eslint-disable-next-line no-console
            console.error('Start Sync SSE Error:', error);
            setLoading(false);

            setHasError(true);
            setErrorMessage('error while receiving start sync event');

            eventSourceStartSync.current?.close();
        };
    };

    const stopSync = async () => {
        setLoading(true);
        const eventSourceStopSync = new EventSource(`${apiURL}/sync/stop`);

        eventSourceStopSync.addEventListener('onStop', (event) => {
            setLoading(false);

            setIsFetchInProgress(false);
            setIsSyncInProgress(false);

            eventSourceStopSync.close();
        });

        eventSourceStopSync.onerror = (error) => {
            // eslint-disable-next-line no-console
            console.error('Stop Sync SSE Error:', error);
            setLoading(false);

            setHasError(true);
            setErrorMessage('error while receiving stop sync event');

            eventSourceStopSync.close();
        };
    };

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
}

export default ToggleSyncSetting;