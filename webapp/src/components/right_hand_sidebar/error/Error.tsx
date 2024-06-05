import React, { useEffect, useState } from 'react'

import './errorStyle.css'

function Error({error} : any) {
    // eslint-disable-next-line no-process-env
    const apiURL = process.env.MM_SERVICESETTINGS_SITEURL;
    const [isOnline, setIsOnline] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            let response;
            try {
                response = await fetch(`${apiURL}/api/v4/users/me`, {
                    method: 'GET',
                    credentials: 'include',
                });
            } catch (err) {
                // eslint-disable-next-line no-console
                console.warn('Error:', (err as Error).message);
            }

            if (response?.ok) {
                setIsOnline(true);
            } else {
                setIsOnline(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className='ss-error-container'>
            <p> { isOnline ? error.text : 'Server is down' } </p>
        </div>
    );
}

export default Error;