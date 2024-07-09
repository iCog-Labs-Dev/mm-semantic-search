import {getConfig} from 'mattermost-redux/selectors/entities/general';

import PluginId from './plugin_id';

const getPluginState = (state) => state['plugins-' + PluginId] || {};

export const getPluginServerRoute = (state) => {
    const config = getConfig(state);

    let basePath = '/';
    if (config && config.SiteURL) {
        basePath = new URL(config.SiteURL).pathname;

        if (basePath && basePath[basePath.length - 1] === '/') {
            basePath = basePath.substr(0, basePath.length - 1);
        }
    }

    return basePath + '/plugins/' + PluginId;
};

export const getSlackDataProgress = (state) => getPluginState(state).slackDataStoreProgress;
export const isSlackDataStoringDone = (state) => getPluginState(state).slackDataStoreDone;