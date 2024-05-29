import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { patchUser } from 'mattermost-redux/actions/users.js'; // importing the action

import RHSView from './rhs_view'

const mapStateToProps = (state) => {
    const currentUserId = state.entities.users.currentUserId;

    return {
        user: state.entities.users.profiles[currentUserId],
    };
};

const mapDispatchToProps = (dispatch) => bindActionCreators({
    patchUser, // passing the action as a prop
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(RHSView);
