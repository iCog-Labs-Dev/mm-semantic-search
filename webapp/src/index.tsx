import React from 'react'
import { Action, Store } from 'redux'

import { GlobalState } from '@mattermost/types/lib/store'

import manifest from '@/manifest'

import { PluginRegistry } from '@/types/mattermost-webapp'

import RHSView from './components/right_hand_sidebar'

export default class Plugin {
    public async initialize(registry: PluginRegistry, store: Store<GlobalState, Action<Record<string, unknown>>>) {
        const {
            id,
            toggleRHSPlugin,
        } = registry.registerRightHandSidebarComponent(() => <RHSView/>, 'Semantic Search');

        registry.registerChannelHeaderButtonAction(
            <i className='icon fa fa-search'/>,
            (): void => store.dispatch(toggleRHSPlugin),
            'Semantic Search',
            'Semantic Search',
        );
    }
}

declare global {
    interface Window {
        registerPlugin(pluginId: string, plugin: Plugin): void
    }
}

window.registerPlugin(manifest.id, new Plugin());
