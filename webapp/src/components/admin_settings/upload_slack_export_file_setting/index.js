import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {getPluginServerRoute, getSlackDataProgress, isSlackDataStoringDone} from '../../../selectors';

import UploadSlackExportFileSetting from './UploadSlackExportFileSetting';

const mapStateToProps = (state) => {
    const pluginServerRoute = getPluginServerRoute(state);
    const slackDataProgress = getSlackDataProgress(state);
    const isSlackDataProgressDone = isSlackDataStoringDone(state);

    return {
        pluginServerRoute,
        slackDataProgress,
        isSlackDataProgressDone,
    };
};

const mapDispatchToProps = (dispatch) => bindActionCreators({}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(UploadSlackExportFileSetting);
