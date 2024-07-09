import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {getPluginServerRoute, getSyncStatus} from '../../../selectors';

import TimeLeftUntilNextFetchSetting from './TimeLeftUntilNextFetchSetting';

const mapStateToProps = (state) => {
    const pluginServerRoute = getPluginServerRoute(state);
    const syncStatus = getSyncStatus(state);

    return {
        pluginServerRoute,
        syncStatus,
    };
};

const mapDispatchToProps = (dispatch) => bindActionCreators({}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(TimeLeftUntilNextFetchSetting);
