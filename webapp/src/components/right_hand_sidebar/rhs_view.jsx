/* eslint-disable react/jsx-closing-bracket-location */
import PropTypes from 'prop-types'
import React, { Fragment, useEffect, useRef, useState } from 'react'

import Home from './home/Home'
import Loader from './loader/Loader'
import Result from './result/Result'

import './rightHandSidebarStyle.css'

const RHSView = ({user, patchUser}) => {
    // eslint-disable-next-line no-process-env
    const apiURL = 'http://localhost:4501';
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [payload, setPayload] = useState();

    // const updateFirstName = () => {
    //     const patchedUser = {
    //         id: user.id,
    //         first_name: 'Tollana',
    //     };

    //     patchUser(patchedUser); // here we use the action
    // };

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

        const params = new URLSearchParams({
            query: searchQuery,
        });

        const api = `${apiURL}/search?${params.toString()}`;

        fetch(api, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        }).
            then((res) => res.json()).
            then((res) => {
                const responsePayload = {text: res.llm, context: res.context};
                console.log(responsePayload);
                setPayload(responsePayload);
            }).
            catch((err) => {
                setPayload({isError: true, text: err.message});

                // const errorPayload = {
                //     isError: true,
                //     text: 'Something went wrong. Please try again.',
                // };
                // setPayload(errorPayload);
            }).
            finally(() => {
                setLoading(false);
            });
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
