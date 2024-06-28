import React from 'react';
import {Action, Store} from 'redux';

import {PluginRegistry} from '@/types/mattermost-webapp';

import RHSView from './components/right_hand_sidebar';

// import reducers from './reducers'

export default class Plugin {
    public async initialize(
        registry: PluginRegistry,
        store: Store<object, Action<object>>,
    ) {
    // registry.registerReducer(reducers);

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
    }
}
