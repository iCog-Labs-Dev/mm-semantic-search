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

    // UNCOMMENT THIS WHEN TESTING
    // const [lastFetchAt, setLastFetchAt] = useState(new Date('2023-10-04T13:21:00.000Z').getTime());

    const [lastFetchAt, setLastFetchAt] = useState(0);
    const [fetchInterval, setFetchInterval] = useState(0);
    const [isFetchInProgress, setIsFetchInProgress] = useState<boolean>();
    const [isSyncInProgress, setIsSyncInProgress] = useState<boolean>();
    const [countDown, setCountDown] = useState(0);
    const [reRunEvent, setReRunEvent] = useState(false);

    const eventSource = useRef<EventSource>();

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

            setLastFetchAt(jsonRes);
        } else if (fetchIntervalRes?.ok) {
            const jsonRes = await fetchIntervalRes.json();

            setFetchInterval(jsonRes * 1000);
        } else {
            let jsonErr;

            if (lastFetchedAtRes !== null) {
                jsonErr = await lastFetchedAtRes?.json();
            } else if (fetchIntervalRes !== null) {
                jsonErr = await fetchIntervalRes?.json();
            }

            setHasError(true);
            setErrorMessage(jsonErr.message);
        }
    }, [apiURL]);

    useEffect(() => {
        const firstRun = async () => {
            await syncWithServer();
        };

        firstRun();

        // eslint-disable-next-line no-console
        console.log('event source useEffect is running...');

        if (eventSource.current) {
            eventSource.current.close();
        }

        let interval:NodeJS.Timer;

        eventSource.current = new EventSource(`${apiURL}/sync/status`);

        eventSource.current.addEventListener('onStatusChange', (event) => {
            const data = JSON.parse(event.data);

            const isSyncInProgressNew = data.is_sync_in_progress;
            const isFetchInProgressNew = data.is_fetch_in_progress;

            // eslint-disable-next-line no-console
            console.log('Status change: ', data);

            setIsSyncInProgress((previousValue) => {
                return previousValue === isSyncInProgressNew ? previousValue : isSyncInProgressNew;
            });

            setIsFetchInProgress((previousValue) => {
                return previousValue === isFetchInProgressNew ? previousValue : isFetchInProgressNew;
            });
        });

        eventSource.current.onerror = (error) => {
            // console.error('Sync SSE Error:', error);

            eventSource.current?.close();

            interval = setInterval(async () => {
                setReRunEvent((previousValue) => {
                    return !previousValue;
                });
            }, RETRYTIMEINSECONDS);
        };

        return () => clearInterval(interval);
    }, [reRunEvent, eventSource]);

    useEffect(() => {
        // eslint-disable-next-line no-console
        console.log('LastFetchAt: ', lastFetchAt);

        const remainingTime = (lastFetchAt + fetchInterval) - new Date().getTime();

        let firstCountDown = remainingTime;

        if (remainingTime < 1000) {
            firstCountDown = 0;
        }

        setCountDown(firstCountDown);
    }, [lastFetchAt]);

    useEffect(() => {
        const hours = Math.floor((countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

        // eslint-disable-next-line no-console
        console.log(hours, minutes, seconds);

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
                if (isSyncInProgress) {
                    await syncWithServer();
                }
            }

            const remainingTime = (lastFetchAt + fetchInterval) - new Date().getTime();

            if (remainingTime < 0) {
                clearInterval(interval);
            } else {
                setCountDown(remainingTime);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [countDown, lastFetchAt, fetchInterval]);

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
                        {isFetchInProgress ? (
                            <p>{'Fetching in progress ...'}</p>
                        ) : (isSyncInProgress ? (
                            <Fragment>
                                {lastFetchAt <= 0 ? (
                                    <p> {'Starting sync for the first time ...'} </p>
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
                                )}
                            </Fragment>
                        ) : (
                            <p> {'Sync not running'} </p>
                        ))}
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