import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {getPluginServerRoute} from '../../selectors';

import RHSView from './rhs_view';

const mapStateToProps = (state) => {
    const pluginServerRoute = getPluginServerRoute(state);

    return {
        pluginServerRoute,
    };
};

const mapDispatchToProps = (dispatch) => bindActionCreators({}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(RHSView);
