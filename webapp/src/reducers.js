import {combineReducers} from 'redux';

import ActionTypes from './action_types';

const slackDataStoreProgress = (state = {}, action) => {
    switch (action.type) {
    case ActionTypes.SLACK_DATA_STORE_PROGRESS:
        return action.data;
    default:
        return state;
    }
};

const slackDataStoreDone = (state = false, action) => {
    switch (action.type) {
    case ActionTypes.SLACK_DATA_STORE_DONE:
        return action.data;
    default:
        return state;
    }
};

export default combineReducers({
    slackDataStoreProgress,
    slackDataStoreDone,
});

