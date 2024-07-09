import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {getPluginServerRoute, getSyncProgress, isSyncProgressDone, isSyncProgressStopped, getSyncStatus} from '../../../selectors';

import ToggleSyncSetting from './ToggleSyncSetting';

const mapStateToProps = (state) => {
    const pluginServerRoute = getPluginServerRoute(state);
    const syncProgress = getSyncProgress(state);
    const isSyncDone = isSyncProgressDone(state);
    const isSyncStopped = isSyncProgressStopped(state);
    const syncStatus = getSyncStatus(state);

    return {
        pluginServerRoute,
        syncProgress,
        isSyncDone,
        isSyncStopped,
        syncStatus,
    };
};

const mapDispatchToProps = (dispatch) => bindActionCreators({}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(ToggleSyncSetting);
