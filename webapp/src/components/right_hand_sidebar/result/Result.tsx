import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

import './resultStyle.css'

function Result({item} : any) {
    // eslint-disable-next-line no-process-env
    const apiUrl = process.env.MM_SERVICESETTINGS_SITEURL;
    const wrapperRef = useRef<HTMLDivElement>(null);
    const myButtonRef = useRef<HTMLButtonElement>(null);
    const [isBusy, setIsBusy] = useState<boolean>(true);

    useEffect(() => {
        const handleScroll = () => scrollFunction(300);

        if (wrapperRef.current) {
            // When the user scrolls down 50px from the top of the document, show the button
            wrapperRef.current.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (wrapperRef.current) {
                wrapperRef.current.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    function scrollFunction(scrollTopValue: number) {
        if (myButtonRef.current && wrapperRef.current) {
            if (wrapperRef.current.scrollTop > scrollTopValue) {
                myButtonRef.current.style.display = 'flex';
            } else {
                myButtonRef.current.style.display = 'none';
            }
        }
    }

    // When the user clicks on the button, scroll to the top of the document
    function scrollToTop() {
        if (wrapperRef.current) {
            wrapperRef.current.scrollTo({top: 0, behavior: 'smooth'});
        }
    }

    const getAvatarUrl = async (user_id: string) => {
        const api = apiUrl + `/api/v4/users/${user_id}/image`;
        const credentialsValue: 'omit' | 'same-origin' | 'include' = 'include';

        console.log('api: ', api);

        const fetchOptions: RequestInit = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },

            credentials: credentialsValue,
        };

        const response = await fetch(api, fetchOptions);

        const blob = await response.blob();

        return URL.createObjectURL(blob);
    };

    useEffect(() => {
        const updateContext = async () => {
            if (item.context.length > 0) {
                item.context = await Promise.all(item.context.map(async (contextItem: any) => {
                    if (contextItem.source === 'mm') {
                        const imgUrl = await getAvatarUrl(contextItem.user_id);
                        contextItem.user_avatar = imgUrl;
                    }

                    return contextItem;
                }));

                setIsBusy(false);
            }
        };

        updateContext();
    }, []);

    return (
        <div
            ref={wrapperRef}
            className='ss-response-wrapper'
        >
            <div className='ss-response-container'>
                {/* <i className='icon icon-check-circle-outline'/> */}
                <ReactMarkdown className='ss-response-container_text'>{ item.text }</ReactMarkdown>
            </div>
            {item.context.length > 0 && !isBusy ? <div className='ss-response-context-wrapper'>

                <h3 className='ss-response-context-subtitle'> {'Context:'} </h3>
                <div className='ss-response-context-container'>
                    {item.context.map(({time, user_id, user_name, user_avatar, channel_name, message, score, access, channel_link, message_link, source, user_dm_link}: any) => {
                        return (
                            <div
                                className='ss-response-context'
                                style={{borderColor: source === 'sl' ? '#4A154Baa' : '', borderWidth: source === 'sl' ? '2px' : ''}}
                                key={time}
                            >
                                <div className='ss-rc-top'>
                                    <div className='ss-rc-user'>
                                        <div className='ss-rc-user-avatar'>
                                            {source === 'mm' ? <img
                                                src={user_avatar}
                                                alt='avatar'
                                                className='ss-rc-user-avatar_img'
                                                               /> : user_name.slice(0, 1)}
                                        </div>
                                        <div className='ss-rc-user-text'>
                                            <a
                                                className='ss-rc-user-name'
                                                style={{cursor: source === 'mm' ? 'pointer' : 'default'}}
                                                href={source === 'mm' ? user_dm_link : null}
                                                target='_blank'
                                                rel='noreferrer'
                                            > {user_name} </a>
                                            <a
                                                style={{cursor: source === 'mm' ? 'pointer' : 'default'}}
                                                href={source === 'mm' ? channel_link : null}
                                                target='_blank'
                                                rel='noreferrer'
                                            > {`#${channel_name}`} </a>
                                        </div>
                                    </div>
                                    <div
                                        className='ss-rc-external-link'
                                    >
                                        <a
                                            style={{display: source === 'sl' ? 'none' : ''}}
                                            href={source === 'mm' ? message_link : ''}
                                            target='_blank'
                                            rel='noreferrer'
                                        >
                                            <i className='icon icon-open-in-new icon-18'/>
                                        </a>
                                        <div
                                            className='ss-rc-external-link__sl'
                                            style={{display: source === 'mm' ? 'none' : ''}}
                                        >
                                            {'Slack'}
                                        </div>
                                    </div>
                                </div>
                                <ReactMarkdown className='ss-rc-middle'>{ message }</ReactMarkdown>
                                <div className='ss-rc-bottom'>
                                    <div className='ss-rc-relevance'>
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            viewBox='0 0 24 24'
                                            width={16}
                                            height={16}
                                        >
                                            <path d='M18.9 9.2C18.1 10.1 16.6 11 15 11C13.5 11 12.6 10.5 11.8 10.1C11 9.8 10.2 9.3 8.9 9.3C7.7 9.3 6.6 10 6 10.6L5 9.1C5.9 8.2 7.3 7.2 8.9 7.2C10.4 7.2 11.3 7.8 12.1 8.1C12.9 8.4 13.7 9 15 9C16.2 9 17.3 8.2 17.9 7.6L18.9 9.2M19 14.1C18.1 15 16.7 16 15.1 16C13.6 16 12.7 15.5 11.9 15.1C11.1 14.8 10.3 14.2 9 14.2C7.8 14.2 6.7 15 6.1 15.6L5.1 14C6 13.1 7.4 12.1 9 12.1C10.5 12.1 11.4 12.6 12.2 13C13 13.3 13.8 13.8 15.1 13.8C16.3 13.8 17.4 13 18 12.4L19 14.1Z'/>
                                        </svg>
                                        <span>
                                            {`${Math.floor(score * 1000) / 10}%`}
                                        </span>
                                    </div>
                                    <div className='ss-rc-date'>
                                        {new Date(Number(time) * 1000).toUTCString()}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div> : ''}
            <button
                ref={myButtonRef}
                className='ss-response-back-to-top'
                onClick={scrollToTop}
            >
                <i className='icon icon-chevron-up'/>
            </button>
        </div>
    );
}

export default Result;