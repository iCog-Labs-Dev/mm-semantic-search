import PluginId from './plugin_id';

// Namespace your actions to avoid collisions.
export default {
    SLACK_DATA_STORE_PROGRESS: PluginId + '_slack_data_store_progress',
    SLACK_DATA_STORE_DONE: PluginId + '_slack_data_store_done',
    SYNC_PROGRESS: PluginId + '_sync_progress',
    SYNC_DONE: PluginId + '_sync_done',
    SYNC_STOP: PluginId + '_sync_stop',
    SYNC_STATUS_CHANGE: PluginId + '_sync_status_change',
};