/* eslint-disable no-negated-condition */
/* eslint-disable no-nested-ternary */
import React, {Fragment, useCallback, useEffect, useRef, useState} from 'react';

import './timeLeftUntilNextFetchSettingStyle.css';

function TimeLeftUntilNextFetchSetting() {
    //eslint-disable-next-line no-process-env
    // const apiURL = process.env.MM_PLUGIN_API_URL;
    const apiURL = 'http://localhost:3333';
    const RETRYTIMEINSECONDS = 10 * 1000;

    const [loading, setLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    const [lastFetchedAt, setLastFetchedAt] = useState(0);
    const [fetchInterval, setFetchInterval] = useState(0);
    const [isFetchInProgress, setIsFetchInProgress] = useState<boolean>();
    const [isSyncInProgress, setIsSyncInProgress] = useState<boolean>();
    const [countDown, setCountDown] = useState(0);
    const [reRunEvent, setReRunEvent] = useState(false);

    const eventSource = useRef<EventSource>();

    const getServerState = useCallback(async () => {
        const fetchOptions: RequestInit = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },

            // credentials: 'include',
        };

        setLoading(true);

        let isSyncInProgressRes;
        let isFetchInProgressRes;

        try {
            const isSyncInProgressAPI = `${apiURL}/sync/is_sync_in_progress`;
            const isFetchInProgressAPI = `${apiURL}/sync/is_fetch_in_progress`;

            isSyncInProgressRes = await fetch(isSyncInProgressAPI!, fetchOptions);
            isFetchInProgressRes = await fetch(isFetchInProgressAPI!, fetchOptions);
        } catch (err: any) {
            // eslint-disable-next-line no-console
            console.warn('Error', err);

            setHasError(true);
            setErrorMessage(err.message);
        } finally {
            setLoading(false);
        }

        if (isSyncInProgressRes?.ok) {
            const jsonRes = await isSyncInProgressRes.json();

            setIsSyncInProgress(jsonRes);
        } else if (isFetchInProgressRes?.ok) {
            const jsonRes = await isFetchInProgressRes.json();

            setIsFetchInProgress(jsonRes);
        } else {
            let jsonErr;

            if (isSyncInProgressRes !== null) {
                jsonErr = await isSyncInProgressRes?.json();
            } else if (isFetchInProgressRes !== null) {
                jsonErr = await isFetchInProgressRes?.json();
            }

            setHasError(true);
            setErrorMessage(jsonErr.message);
        }
    }, [apiURL]);

    const syncWithServer = useCallback(async () => {
        const fetchOptions: RequestInit = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },

            // credentials: 'include',
        };

        setLoading(true);

        let lastFetchedAtRes;
        let fetchIntervalRes;

        try {
            const lastFetchedAtAPI = `${apiURL}/sync/last_fetched_at`;
            const fetchIntervalAPI = `${apiURL}/sync/fetch_interval`;

            lastFetchedAtRes = await fetch(lastFetchedAtAPI!, fetchOptions);
            fetchIntervalRes = await fetch(fetchIntervalAPI!, fetchOptions);
        } catch (err: any) {
            // eslint-disable-next-line no-console
            console.warn('Error', err);

            setHasError(true);
            setErrorMessage(err.message);
        } finally {
            setLoading(false);
        }

        if (lastFetchedAtRes?.ok) {
            const jsonRes = await lastFetchedAtRes.json();

            setLastFetchedAt(jsonRes);
        } else {
            const jsonErr = await lastFetchedAtRes?.json();

            setHasError(true);
            setErrorMessage(jsonErr.message);
        }

        if (fetchIntervalRes?.ok) {
            const jsonRes = await fetchIntervalRes.json();

            setFetchInterval(jsonRes * 1000);
        } else {
            const jsonErr = await fetchIntervalRes?.json();

            setHasError(true);
            setErrorMessage(jsonErr.message);
        }
    }, [apiURL]);

    useEffect(() => {
        const executeAsyncFunc = async () => {
            await getServerState();
        };

        executeAsyncFunc();
    }, []);

    useEffect(() => {
        const executeAsyncFunc = async () => {
            await syncWithServer();
        };

        if (isSyncInProgress || !isFetchInProgress) {
            executeAsyncFunc();
        }
    }, [isSyncInProgress, isFetchInProgress]);

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
                return previousValue === isSyncInProgressNew ? previousValue : isSyncInProgressNew;
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

        return () => clearInterval(interval);
    }, [reRunEvent, eventSource]);

    useEffect(() => {
        const remainingTime = (lastFetchedAt + fetchInterval) - new Date().getTime();

        let firstCountDown = remainingTime;

        if (remainingTime < 1000) {
            firstCountDown = 0;
        }

        setCountDown(firstCountDown);
    }, [lastFetchedAt, fetchInterval]);

    useEffect(() => {
        const hours = Math.floor((countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

        if (countDown >= 0) {
            setTimeLeft({
                hours,
                minutes,
                seconds,
            });
        }

        const interval = setInterval(async () => {
            if (countDown < 1000) { // since we are counting down every second
                clearInterval(interval);

                // handle edge case where fetch_interval is changed while sync was in progress
                if (isSyncInProgress || !isFetchInProgress) {
                    await syncWithServer();
                }
            }

            const remainingTime = (lastFetchedAt + fetchInterval) - new Date().getTime();

            // if (remainingTime < 0) {
            //     clearInterval(interval);
            // } else {
            //     setCountDown(remainingTime);
            // }

            // if (remainingTime >= 0) {
            setCountDown(remainingTime);

            // }
        }, 1000);

        return () => clearInterval(interval);
    }, [countDown]);

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

    return (
        <Fragment>
            <Fragment>
                {loading ? (
                    <p> {'Loading ...'} </p>
                ) : (
                    <Fragment>
                        {!isSyncInProgress ? (
                            <p> {'Sync not running'} </p>
                        ) : (isFetchInProgress ? (
                            <Fragment>
                                {lastFetchedAt <= 0 ? (
                                    <p> {'Fetching messages for the first time ...'} </p>
                                ) : (
                                    <p>{'Fetching messages in progress ...'}</p>
                                )}
                            </Fragment>
                        ) : (countDown < 1000 ? (
                            <p> {'Fetching time has passed. There may have been change in "fetch interval" value while sync was in progress. (check server for possible issues)'} </p>
                        ) : (
                            <div className='ss-time-left-counter'>
                                <div className='ss-time-left-counter__item'>
                                    <span className='ss-time-left-counter__item__number'>
                                        { timeLeft.hours }
                                    </span>
                                    <span className='ss-time-left-counter__item__label'>
                                        { 'Hours' }
                                    </span>
                                </div>
                                <span className='ss-time-left-counter__divider'>{ ':' }</span>
                                <div className='ss-time-left-counter__item'>
                                    <span className='ss-time-left-counter__item__number'>
                                        { timeLeft.minutes }
                                    </span>
                                    <span className='ss-time-left-counter__item__label'>
                                        { 'Minutes' }
                                    </span>
                                </div>
                                <span className='ss-time-left-counter__divider'>{ ':' }</span>
                                <div className='ss-time-left-counter__item'>
                                    <span className='ss-time-left-counter__item__number'>
                                        { timeLeft.seconds }
                                    </span>
                                    <span className='ss-time-left-counter__item__label'>
                                        { 'Seconds' }
                                    </span>
                                </div>
                            </div>
                        )))}
                    </Fragment>
                )}
            </Fragment>
            <p
                className='ss-left-time-error-message'
                style={{display: hasError ? 'block' : 'none'}}
            >
                {errorMessage}
            </p>
        </Fragment>
    );
}

export default TimeLeftUntilNextFetchSetting;