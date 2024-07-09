import ActionTypes from './action_types';

export const websocketSlackDataStoreProgress = (message) => (dispatch) => dispatch({
    type: ActionTypes.SLACK_DATA_STORE_PROGRESS,
    data: message.data.progress,
});

export const websocketSlackDataStoreDone = (message) => (dispatch) => dispatch({
    type: ActionTypes.SLACK_DATA_STORE_DONE,
    data: message.data.isDone,
});
