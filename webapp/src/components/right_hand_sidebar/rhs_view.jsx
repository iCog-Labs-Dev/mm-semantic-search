/* eslint-disable react/jsx-closing-bracket-location */
import PropTypes from 'prop-types'
import React, { Fragment, useEffect, useRef, useState } from 'react'

import Home from './home/Home'
import Loader from './loader/Loader'
import Result from './result/Result'

import './rightHandSidebarStyle.css'

const RHSView = ({user, patchUser}) => {
    // eslint-disable-next-line no-process-env
    // const apiURL = process.env.MM_PLUGIN_API_URL;
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [payload, setPayload] = useState();

    const updateFirstName = () => {
        const patchedUser = {
            id: user.id,
            first_name: 'Tollana',
        };

        patchUser(patchedUser); // here we use the action
    };

    const handleSearchQuery = async (e) => {
        e.preventDefault();
        const inputValue = inputRef.current?.value;

        if (inputValue) {
            setSearchQuery((prev) => {
                if (prev === inputValue) {
                    return '';
                }

                return inputValue;
            });
        }
    };

    useEffect(() => {
        if (searchQuery === '') {
            // setPayload(undefined);
            return;
        }

        const currentUser = user.id;

        // eslint-disable-next-line no-console
        console.log('User-id: ', currentUser);
        console.log('User: ', user);

        setLoading(true);

        const res = {
            context: [
                {
                    access: 'pub',
                    channel_link: 'http://localhost:8065/snet/channels/Town Square',
                    channel_name: 'Town Square',
                    message: 'Hello in Town Square!',
                    message_link: 'http://localhost:8065/snet/pl/s7hzi9a59if6mx6p8t7r1ieh6o',
                    score: 0.19555227168908074,
                    source: 'mm',
                    time: 1699449033.043,
                    user_dm_link: 'http://localhost:8065/snet/messages/@admin',
                    user_id: 'rckb7usnibysbczn96bfdqmbch',
                    user_name: 'admin',
                },
                {
                    access: 'pub',
                    channel_link: 'http://localhost:8065/snet/channels/Town Square',
                    channel_name: 'Town Square',
                    message: 'hi',
                    message_link: 'http://localhost:8065/snet/pl/ntpzpbhq6bdx7xo8dbi79snaxr',
                    score: 0.13018758828952404,
                    source: 'mm',
                    time: 1704876366.267,
                    user_dm_link: 'http://localhost:8065/snet/messages/@admin',
                    user_id: 'rckb7usnibysbczn96bfdqmbch',
                    user_name: 'admin',
                },
            ],
            llm: '  The answer to your question is:\n\nNo one said "Hi in public channel."\n\nThe chat messages provided do not mention anyone saying "Hi in public channel." The first message is from an administrator saying "Hello in Town Square!" and the second message is from the same administrator saying "hi," but not in a public channel. Therefore, based on the provided chat messages, no one said "Hi in public channel."',
        };

        const responsePayload = {text: res.llm, context: res.context};

        console.log('payload: ', responsePayload);

        setPayload(responsePayload);

        setLoading(false);

        // fetch(`${apiURL}/search/something`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     credentials: 'include',
        //     body: JSON.stringify({
        //         query: searchQuery,
        //         user_id: currentUser,
        //     }),
        // }).
        //     then((res) => res.json()).
        //     then((res) => {
        //         const responsePayload = {text: res.llm, context: res.context};
        //         setPayload(responsePayload);
        //     }).
        //     catch((err) => {
        //         setPayload({isError: true, text: err.message});

        //         // const errorPayload = {
        //         //     isError: true,
        //         //     text: 'Something went wrong. Please try again.',
        //         // };
        //         // setPayload(errorPayload);
        //     }).
        //     finally(() => {
        //         setLoading(false);
        //     });
    }, [searchQuery, user.id]);

    return (
        <div className='ss-root'>
            <form
                className='ss-search-wrapper'
                onSubmit={handleSearchQuery}>
                <div className='ss-search-icon'>
                    <i className='icon icon-magnify icon-18'/>
                </div>
                <input
                    ref={inputRef}
                    className='ss-search-input'
                    placeholder='Search messages'
                />
            </form>
            <button onClick={updateFirstName}> {'click  me'} </button>
            <div className='ss-result-wrapper'>
                {loading ? (
                    <Loader/>
                ) : (
                    <Fragment>
                        {payload ? (
                            <Result item={payload}/>
                        ) : (
                            <Home/>
                        )}
                        {/* <Fragment>
                                {payload.isError ? (
                                    <Error error={payload}/>
                                ) : (
                                    <Result item={payload}/>
                                )}
                            </Fragment> */}
                    </Fragment>
                )}

            </div>
        </div>
    );
};

RHSView.propTypes = {
    user: PropTypes.object.isRequired,
    patchUser: PropTypes.func.isRequired, // here we define the action as a prop
};

export default RHSView;
