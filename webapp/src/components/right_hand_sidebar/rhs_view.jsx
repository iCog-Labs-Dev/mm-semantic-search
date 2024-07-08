/* eslint-disable react/jsx-closing-bracket-location */
import PropTypes from 'prop-types';
import React, {Fragment, useEffect, useRef, useState} from 'react';

import Home from './home/Home';
import Loader from './loader/Loader';
import Result from './result/Result';

import './rightHandSidebarStyle.css';

const RHSView = ({pluginServerRoute}) => {
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [payload, setPayload] = useState();

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

        setLoading(true);

        const params = new URLSearchParams({
            query: searchQuery,
        });

        const api = `${pluginServerRoute}/search?${params.toString()}`;

        fetch(api, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },

            // credentials: 'include',
        }).
            then((res) => res.json()).
            then((res) => {
                const responsePayload = {text: res.llm, context: res.context};
                // eslint-disable-next-line no-console
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
    }, [searchQuery]);

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
    pluginServerRoute: PropTypes.string.isRequired,
};

export default RHSView;
