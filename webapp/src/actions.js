import ActionTypes from './action_types';

export const websocketSlackDataStoreProgress = (message) => (dispatch) => dispatch({
    type: ActionTypes.SLACK_DATA_STORE_PROGRESS,
    data: message.data.progress,
});

export const websocketSlackDataStoreDone = (message) => (dispatch) => dispatch({
    type: ActionTypes.SLACK_DATA_STORE_DONE,
    data: message.data.isDone,
});

export const websocketOnSyncProgress = (message) => (dispatch) => dispatch({
    type: ActionTypes.SYNC_PROGRESS,
    progress: message.data.progress,
});

export const websocketOnSyncDone = (message) => (dispatch) => dispatch({
    type: ActionTypes.SYNC_DONE,
    isDone: message.data.isDone,
});

export const websocketOnSyncStop = (message) => (dispatch) => dispatch({
    type: ActionTypes.SYNC_STOP,
    isStopped: message.data.isStopped,
});

export const websocketOnSyncStatusChange = (message) => (dispatch) => dispatch({
    type: ActionTypes.SYNC_STATUS_CHANGE,
    status: message.data.status,
});
