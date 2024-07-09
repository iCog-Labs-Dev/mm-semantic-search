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

const syncProgress = (state = 0.0, action) => {
    switch (action.type) {
    case ActionTypes.SYNC_PROGRESS:
        return action.progress;
    default:
        return state;
    }
};

const syncDone = (state = false, action) => {
    switch (action.type) {
    case ActionTypes.SYNC_DONE:
        return action.isDone;
    default:
        return state;
    }
};

const syncStop = (state = false, action) => {
    switch (action.type) {
    case ActionTypes.SYNC_STOP:
        return action.isStopped;
    default:
        return state;
    }
};

const syncStatus = (state = {is_sync_in_progress: false, is_fetch_in_progress: false}, action) => {
    switch (action.type) {
    case ActionTypes.SYNC_STATUS_CHANGE:
        return action.status;
    default:
        return state;
    }
};

export default combineReducers({
    slackDataStoreProgress,
    slackDataStoreDone,
    syncProgress,
    syncDone,
    syncStop,
    syncStatus,
});

