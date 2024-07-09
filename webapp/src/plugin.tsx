import React from 'react';
import {Action, Store} from 'redux';

import {PluginRegistry} from '@/types/mattermost-webapp';

import PluginId from './plugin_id';

import SyncIntervalSetting from './components/admin_settings/sync_interval_setting/SyncIntervalSetting';
import ToggleSyncSetting from './components/admin_settings/toggle_sync_setting/ToggleSyncSetting';
import TimeLeftUntilNextFetchSetting from './components/admin_settings/time_left_until_next_fetch_setting/TimeLeftUntilNextFetchSetting';
import UploadSlackExportFileSetting from './components/admin_settings/upload_slack_export_file_setting';

import RHSView from './components/right_hand_sidebar';

import {
    websocketSlackDataStoreProgress, websocketSlackDataStoreDone,
} from './actions';

import reducers from './reducers';

export default class Plugin {
    public async initialize(
        registry: PluginRegistry,
        store: Store<object, Action<object>>,
    ) {
        registry.registerReducer(reducers);

        const {toggleRHSPlugin} = registry.registerRightHandSidebarComponent(
            () => <RHSView/>,
            'Semantic Search',
        );

        registry.registerChannelHeaderButtonAction(
            <i className='icon fa fa-search'/>,
            (): void => store.dispatch(toggleRHSPlugin),
            'Semantic Search',
            'Semantic Search',
        );

        registry.registerWebSocketEventHandler(
            'custom_' + PluginId + '_on_progress',
            (message: any) => {
                store.dispatch(websocketSlackDataStoreProgress(message));
            },
        );

        registry.registerWebSocketEventHandler(
            'custom_' + PluginId + '_on_done',
            (message: any) => {
                store.dispatch(websocketSlackDataStoreDone(message));
            },
        );

        registry.registerAdminConsoleCustomSetting('syncInterval', SyncIntervalSetting, {showTitle: true});

        registry.registerAdminConsoleCustomSetting('toggleSync', ToggleSyncSetting, {showTitle: true});

        registry.registerAdminConsoleCustomSetting('timeLeftUntilNextFetch', TimeLeftUntilNextFetchSetting, {showTitle: true});

        registry.registerAdminConsoleCustomSetting('uploadSlackExportFile', UploadSlackExportFileSetting, {showTitle: true});
    }
}
