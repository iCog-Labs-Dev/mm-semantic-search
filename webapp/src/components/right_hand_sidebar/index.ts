import { connect } from 'react-redux'
import { AnyAction, Dispatch, bindActionCreators } from 'redux'

import { patchUser } from 'mattermost-redux/actions/users.js'; // importing the action

import RHSView from './rhs_view'

const mapStateToProps = (state: { entities: { users: { currentUserId: any; profiles: { [x: string]: any } } } }) => {
    const currentUserId = state.entities.users.currentUserId;

    return {
        user: state.entities.users.profiles[currentUserId],
    };
};

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) => bindActionCreators({
    patchUser, // passing the action as a prop
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(RHSView);
