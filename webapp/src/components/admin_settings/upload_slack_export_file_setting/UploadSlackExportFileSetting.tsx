import React, {Fragment, useEffect, useState} from 'react';

import './uploadSlackExportFileSetting.css';

function UploadSlackExportFileSetting() {
    type Channel = {
        created: number;
        id: string;
        name: string;
        purpose: string;
        checked?: boolean;
        startDate?: string;
        endDate?: string;
        progress?: number;
    };

    type ChannelSpec = {
        store_all: boolean;
        store_none: boolean;
        start_date: string;
        end_date: string;
    };

    // eslint-disable-next-line no-process-env
    // const apiURL = process.env.MM_PLUGIN_API_URL;
    const apiURL = 'http://localhost:4500';
    const [loading, setLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [allChecked, setAllChecked] = useState(false);
    const [unfilteredChannels, setUnfilteredChannels] = useState<Channel[]>([]);
    const [isUploaded, setIsUploaded] = useState(false);
    const [showProgress, setShowProgress] = useState(false);

    const noneChecked = unfilteredChannels.every((channel) => !channel.checked);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();

        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        const label	 = e.target.nextElementSibling;

        if (label) {
            const labelVal = label?.innerHTML;

            const fileName = e.target.value.split('\\').pop();

            if (fileName) {
                const fileNameElmt = label.querySelector('span');
                if (fileNameElmt) {
                    fileNameElmt.innerHTML = fileName;
                }
            } else {
                label.innerHTML = labelVal;
            }
        }

        const file = e.target.files[0];

        const formData = new FormData();

        formData.append('file', file);

        const fetchOptions: RequestInit = {
            method: 'POST',

            // DO NOT set the Content-Type header. The browser will set it for you, including the boundary parameter.

            // headers: {
            //     'Content-Type': 'multipart/form-data',
            // },

            // credentials: 'include',
            body: formData,
        };

        setLoading(true);

        let response;

        try {
            const api = `${apiURL}/slack/upload_zip`;

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
            const resJson = await response.json();

            // eslint-disable-next-line no-console
            console.log('resJson', resJson);

            const unfilteredChnls = resJson.map((channel: any) => {
                if (!Object.prototype.hasOwnProperty.call(channel, 'checked')) {
                    channel.checked = false;
                }

                if (!Object.prototype.hasOwnProperty.call(channel, 'startDate')) {
                    channel.startDate = '';
                }

                if (!Object.prototype.hasOwnProperty.call(channel, 'endDate')) {
                    channel.endDate = '';
                }

                if (!Object.prototype.hasOwnProperty.call(channel, 'progress')) {
                    channel.progress = null;
                }

                return channel;
            });

            setUnfilteredChannels(unfilteredChnls);
        } else {
            const jsonErr = await response?.json();

            setHasError(true);
            setErrorMessage(jsonErr.message);
        }
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isUploaded) {
            timer = setTimeout(() => {
                setIsUploaded(false);
            }, 3000);
        }

        return () => timer && clearTimeout(timer);
    }, [isUploaded]);

    // handle all checked when unfilteredChannels changes
    useEffect(() => {
        if (unfilteredChannels.length === 0) {
            return;
        }

        const allChannelsChecked = unfilteredChannels.every((channel) => channel.checked);

        setAllChecked(allChannelsChecked);
    }, [unfilteredChannels]);

    const handleAllChannelCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;

        setUnfilteredChannels((currentUnfilteredChannels) => {
            const newUnfilteredChannels = currentUnfilteredChannels.map((channel) => {
                channel.checked = checked;
                return channel;
            });

            return newUnfilteredChannels;
        });

        setAllChecked(checked);
    };

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

    const handleChannelCheck = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
        const checked = e.target.checked;

        setUnfilteredChannels((currentUnfilteredChannels) => {
            const newUnfilteredChannels = currentUnfilteredChannels.map((channel) => {
                if (channel.id === id) {
                    channel.checked = checked;
                }
                return channel;
            });

            return newUnfilteredChannels;
        });
    };

    const prependZeroForSingleDigitNumbers = (num: number): string => {
        return num.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false});
    };

    const formatDate = (id: string, dateTime: number): string => {
        const date = new Date(dateTime);

        const year = prependZeroForSingleDigitNumbers(date.getFullYear());
        const month = prependZeroForSingleDigitNumbers(date.getMonth() + 1);
        const day = prependZeroForSingleDigitNumbers(date.getDate());

        const formattedDate = `${year}-${month}-${day}`;

        return formattedDate;
    };

    const calcEndDateMin = (id: string): string => {
        const {startDate, created} = unfilteredChannels.filter((channel) => channel.id === id)[0];

        if (!startDate) {
            return formatDate(id, created * 1000);
        }

        const startDateArr = startDate.split('-');

        const year = prependZeroForSingleDigitNumbers(
            parseInt(startDateArr[0], 10),
        );
        const month = prependZeroForSingleDigitNumbers(
            parseInt(startDateArr[1], 10),
        );
        const day = prependZeroForSingleDigitNumbers(
            parseInt(startDateArr[2], 10) + 1,
        );

        const endDateMin = `${year}-${month}-${day}`;

        return endDateMin;
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
        e.preventDefault();

        setUnfilteredChannels((currentUnfilteredChannels) => {
            const newUnfilteredChannels = currentUnfilteredChannels.map((channel) => {
                if (channel.id === id) {
                    channel.startDate = e.target.value;
                }
                return channel;
            });

            return newUnfilteredChannels;
        });
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
        e.preventDefault();

        setUnfilteredChannels((currentUnfilteredChannels) => {
            const newUnfilteredChannels = currentUnfilteredChannels.map((channel) => {
                if (channel.id === id) {
                    channel.endDate = e.target.value;
                }
                return channel;
            });

            return newUnfilteredChannels;
        });
    };

    const saveSlackData = async () => {
        const checkedChannels = unfilteredChannels.filter((channel) => channel.checked);

        const unCheckedChannels = unfilteredChannels.filter((channel) => !channel.checked);

        const checkedChannelsWithDateRange = checkedChannels.filter((channel) => channel.startDate && channel.endDate);

        const checkedChannelsWithStartDate = checkedChannels.filter((channel) => channel.startDate && !channel.endDate);

        const checkedChannelsWithEndDate = checkedChannels.filter((channel) => !channel.startDate && channel.endDate);

        const checkedChannelsWithNoDateRange = checkedChannels.filter((channel) => !channel.startDate && !channel.endDate);

        const postObj: {[key: string ]: ChannelSpec} = {};

        for (const channel of checkedChannelsWithDateRange) {
            postObj[channel.id] = {
                store_all: false,
                store_none: false,
                start_date: channel.startDate ? (new Date(channel.startDate).getTime() / 1000).toString() : '',
                end_date: channel.endDate ? (new Date(channel.endDate).getTime() / 1000).toString() : '',
            };
        }

        for (const channel of checkedChannelsWithStartDate) {
            postObj[channel.id] = {
                store_all: false,
                store_none: false,
                start_date: channel.startDate ? (new Date(channel.startDate).getTime() / 1000).toString() : '',
                end_date: (Date.now() / 1000).toString(),
            };
        }

        for (const channel of checkedChannelsWithEndDate) {
            postObj[channel.id] = {
                store_all: false,
                store_none: false,
                start_date: channel.created.toString(),
                end_date: channel.endDate ? (new Date(channel.endDate).getTime() / 1000).toString() : '',
            };
        }

        for (const channel of checkedChannelsWithNoDateRange) {
            postObj[channel.id] = {
                store_all: true,
                store_none: false,
                start_date: channel.created.toString(),
                end_date: (Date.now() / 1000).toString(),
            };
        }

        for (const channel of unCheckedChannels) {
            postObj[channel.id] = {
                store_all: false,
                store_none: true,
                start_date: '',
                end_date: '',
            };
        }

        // eslint-disable-next-line no-console
        console.log('postObj', postObj);

        const postOptions: RequestInit = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },

            // credentials: 'include',
            body: JSON.stringify(postObj),
        };

        setLoading(true);

        let response;

        try {
            const api = `${apiURL}/slack/store_data`;

            response = await fetch(api!, postOptions);
        } catch (err: any) {
            // eslint-disable-next-line no-console
            console.warn('Error', err);

            setHasError(true);
            setErrorMessage(err.message);
        } finally {
            setLoading(false);
        }

        if (response?.ok) {
            setShowProgress(true);
            const api = `${apiURL}/slack/store_data`;
            const eventSource = new EventSource(api);

            eventSource.addEventListener('onProgress', (event) => {
                const data = JSON.parse(event.data);
                // eslint-disable-next-line no-console
                console.log('Storing slack data... ', data);

                const channelInProgressId = Object.keys(data)[0];

                const currentProgress = data[channelInProgressId];

                const channelInProgress = unfilteredChannels.filter((channel) => {
                    return channel.id === channelInProgressId;
                });

                if (channelInProgress.length > 0) {
                    channelInProgress[0].progress = currentProgress;
                }

                const remainingChannels = unfilteredChannels.filter((channel) => {
                    return channel.id !== channelInProgressId;
                });

                setUnfilteredChannels([...channelInProgress, ...remainingChannels]);

                // eslint-disable-next-line no-console
                // console.log('Current channel: ', channelInProgress);
            });

            eventSource.addEventListener('onDone', (event) => {
                const data = JSON.parse(event.data);
                // eslint-disable-next-line no-console
                console.log('Finished storing slack data: ', data);

                setUnfilteredChannels([]);
                setIsUploaded(true);
                setShowProgress(false);

                eventSource.close();
            });

            eventSource.onerror = (error) => {
                // eslint-disable-next-line no-console
                console.error('Storing slack SSE error:', error);

                setUnfilteredChannels([]);
                setIsUploaded(true);
                setShowProgress(false);

                eventSource.close();
            };
        } else {
            const jsonErr = await response?.json();

            setHasError(true);
            setErrorMessage(jsonErr.message);
        }
    };

    return (
        <Fragment>
            <div className='upload-slack-export-container'>
                <div className='upload-slack-export-action'>
                    <div className='upload-slack-export-action_file'>
                        <input
                            type='file'
                            name='file'
                            id='file'
                            accept='.zip' // make sure to add other file types if any
                            className='upload-slack-export-file-setting__upload'
                            onChange={handleUpload}
                        />
                        <label
                            htmlFor='file'
                            className='upload-slack-export-file-setting__label'
                        >
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                viewBox='0 0 24 24'
                            >
                                <path d='M14,2L20,8V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2H14M18,20V9H13V4H6V20H18M12,12L16,16H13.5V19H10.5V16H8L12,12Z'/>
                            </svg>
                            <span> {'Choose a file...'} </span>
                        </label>
                    </div>
                    <div>
                        {unfilteredChannels.length > 0 && (
                            <button
                                className='upload-slack-export-action__button'
                                onClick={saveSlackData}
                                disabled={noneChecked}
                            >
                                {loading ? 'Saving...' : 'Save'}
                            </button>
                        )}
                    </div>
                </div>
                {unfilteredChannels.length > 0 ? (
                    <div className='upload-slack-export-channel-table-container'>
                        <table className='upload-slack-export-channel-table'>
                            <thead className='upload-slack-export-channel-table_head'>
                                <tr>
                                    <th>
                                        <input
                                            type='checkbox'
                                            checked={allChecked}
                                            onChange={handleAllChannelCheck}
                                        />
                                    </th>
                                    <th>
                                        <span>{'Channel Name'}</span>
                                    </th>
                                    <th>
                                        <span>{'Date Range'}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='upload-slack-export-channel-table_body'>
                                {unfilteredChannels.map((channel) => (
                                    <tr key={channel.id}>
                                        <td>
                                            <input
                                                type='checkbox'
                                                checked={channel.checked}
                                                onChange={(e) => handleChannelCheck(e, channel.id)}
                                            />
                                        </td>
                                        <td>{channel.name}</td>
                                        <td className='upload-slack-export-date'>
                                            <input
                                                type='date'
                                                className='upload-slack-export-date-input'

                                                min={formatDate(channel.id, channel.created * 1000)}

                                                // min='2023-10-01'
                                                max={formatDate(channel.id, Date.now())}
                                                onChange={(e) => handleStartDateChange(e, channel.id)}
                                            />
                                            <span>{'to'}</span>
                                            <input
                                                type='date'
                                                className='upload-slack-export-date-input'
                                                min={calcEndDateMin(channel.id)}
                                                max={formatDate(channel.id, Date.now())}
                                                onChange={(e) => handleEndDateChange(e, channel.id)}
                                            />
                                        </td>
                                        { showProgress && (
                                            <td>
                                                {channel.checked &&
                                                <progress
                                                    className='upload-slack-export-progress'
                                                    value={channel.progress}
                                                >
                                                    { channel.progress + '%' }
                                                </progress>}
                                            </td>)
                                        }
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className='upload-slack-export-feedback'>
                        {isUploaded ? (
                            <p style={{color: 'var(--online-indicator)'}}>{ 'Upload Successful' }</p>
                        ) : (
                            <p>{ 'Select slack export file ...' }</p>
                        )}
                    </div>
                )}
            </div>
            <p
                className='ss-slack-export-error-message'
                style={{display: hasError ? 'block' : 'none'}}
            >
                {errorMessage}
            </p>
        </Fragment>
    );
}

export default UploadSlackExportFileSetting;