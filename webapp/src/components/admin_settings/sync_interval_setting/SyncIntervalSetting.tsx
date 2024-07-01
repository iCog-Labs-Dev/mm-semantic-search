import React, {Fragment, useCallback, useEffect, useState} from 'react';

import './syncintervalSettingStyle.css';

function SyncIntervalSetting() {
    // eslint-disable-next-line no-process-env
    // const apiURL = process.env.MM_PLUGIN_API_URL;
    const apiURL = 'http://localhost:3333';
    const successMessage = 'Sync interval updated successfully';

    const [loading, setLoading] = useState(false);
    const [wasSuccessful, setWasSuccessful] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [syncInterval, setSyncInterval] = useState({
        hour: 0,
        minute: 0,
    });

    const syncWithServer = useCallback(async () => {
        const fetchOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },

            // credentials: 'include',
        };

        setLoading(true);

        let response;

        try {
            const api = `${apiURL}/sync/fetch_interval`;

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

            const fetchedInterval = {
                hour: Math.floor(jsonRes / (60 * 60)),
                minute: Math.floor((jsonRes % (60 * 60)) / (60)),
            };

            // eslint-disable-next-line no-console
            console.log('jsonRes', fetchedInterval);

            setSyncInterval(fetchedInterval);
        } else {
            const jsonErr = await response?.json();

            setHasError(true);
            setErrorMessage(jsonErr.message);
        }
    }, [apiURL]);

    useEffect(() => {
        const firstRun = async () => {
            await syncWithServer();
        };

        firstRun();
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

    const handleSyncIntervalHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();

        if (e.target?.value === '') {
            return;
        }

        const hourInterval = parseInt(e.target.value, 10);

        if (hourInterval > 23 || hourInterval < 0) {
            // eslint-disable-next-line no-console
            console.warn('invalid hour interval');
            return;
        }

        setSyncInterval({...syncInterval, hour: hourInterval});
    };

    const handleSyncIntervalMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();

        if (e.target.value === '') {
            return;
        }

        const minuteInterval = parseInt(e.target.value, 10);

        if (minuteInterval > 59 || minuteInterval < 0) {
            // eslint-disable-next-line no-console
            console.warn('invalid minute interval');
            return;
        }

        setSyncInterval({...syncInterval, minute: minuteInterval});
    };

    const handleSyncIntervalSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (syncInterval.hour === 0 && syncInterval.minute === 0) {
            return;
        }

        const interval = ((syncInterval.hour * 60) + syncInterval.minute) * 60;

        const param: {[key: string]: string | number} = {
            fetch_interval: interval,
        };

        const queryString = new URLSearchParams(param as Record<string, string>).toString();

        const postOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },

            // credentials: 'include',
        };

        setLoading(true);

        let response;

        try {
            const urlWithParams = `${apiURL}/sync/fetch_interval?${queryString}`;

            // eslint-disable-next-line no-console
            console.log('url with params', urlWithParams);

            response = await fetch(urlWithParams, postOptions);
        } catch (err: any) {
            // eslint-disable-next-line no-console
            console.warn('Error', err);

            setHasError(true);
            setErrorMessage(err.message);
        } finally {
            setLoading(false);
        }

        if (response?.ok) {
            setWasSuccessful(true);
        } else {
            const jsonErr = await response?.json();

            setHasError(true);
            setErrorMessage(jsonErr.message);
        }
    };

    return (
        <Fragment>
            <div className='ss-setting-sync-interval'>
                {/* TODO: wrap the input fields in a form element */}
                <div className='ss-setting-sync-interval__item'>
                    <input
                        className='ss-setting-sync-interval-input'
                        type='number'
                        min={0}
                        max={23}
                        value={syncInterval.hour}
                        onChange={handleSyncIntervalHourChange}
                    />
                    <span className='ss-setting-sync-interval-label'>{ 'hours' }</span>
                </div>
                <span className='ss-setting-sync-interval-divider'>{ ':' }</span>
                <div className='ss-setting-sync-interval__item'>
                    <input
                        className='ss-setting-sync-interval-input'
                        type='number'
                        min={0}
                        max={59}
                        value={syncInterval.minute}
                        onChange={handleSyncIntervalMinuteChange}
                    />
                    <span className='ss-setting-sync-interval-label'>{ 'minutes' }</span>
                </div>
                <button
                    onClick={handleSyncIntervalSubmit}
                    className='btn btn-primary'
                    disabled={loading || (syncInterval.hour === 0 && syncInterval.minute === 0)}
                > {'Save'} </button>
            </div>
            <p
                className='ss-sync-interval-success-message'
                style={{display: wasSuccessful ? 'block' : 'none'}}
            >
                {successMessage}
            </p>
            <p
                className='ss-sync-interval-error-message'
                style={{display: hasError ? 'block' : 'none'}}
            >
                {errorMessage}
            </p>
        </Fragment>
    );
}

export default SyncIntervalSetting;