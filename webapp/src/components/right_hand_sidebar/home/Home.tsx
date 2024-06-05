import React from 'react'

import './homeStyle.css'

function Home() {
    return (
        <div className='home-container'>
            <h2>{'Searching for past conversations made easy!'}</h2>
            <h4> {'Simply enter a topic, and our plugin will search through previous messages, providing you with the answer and the messages that support it. Start searching smarter today!'}</h4>

            {/* <h1>Need to find specific information in your chat history? </h1>
            <p> Just enter a topic, and our app will search through previous messages to deliver the answer you're looking for. Get ready to save time and find what you need with ease.</p> */}
        </div>
    );
}

export default Home;