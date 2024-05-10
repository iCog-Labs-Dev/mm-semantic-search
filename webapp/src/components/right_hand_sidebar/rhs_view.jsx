import PropTypes from 'prop-types'
import React from 'react'

export default class RHSView extends React.PureComponent {
    static propTypes = {
        user: PropTypes.object.isRequired,
        patchUser: PropTypes.func.isRequired, // here we define the action as a prop
    };

    updateFirstName = () => {
        const patchedUser = {
            id: this.props.user.id,
            first_name: 'Eyob',
        };

        this.props.patchUser(patchedUser); // here we use the action
    };

    render() {
        return (
            <div>
                {'First name: ' + this.props.user.first_name}
                <a
                    href='#'
                    onClick={this.updateFirstName}
                >
                    {'Click me to update the first name!'}
                </a>
            </div>
        );
    }
}
