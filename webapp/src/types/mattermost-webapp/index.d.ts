import {Reducer} from 'redux';
export interface PluginRegistry {
    registerRightHandSidebarComponent(component: React.ElementType, title: string)

    registerChannelHeaderButtonAction(icon: ElementType, action: () => void, dropdownText: string | React.ElementType, tooltipText: string | React.ElementType)
    registerReducer(reducer: Reducer)

    registerAdminConsoleCustomSetting(key: string, component: React.ElementType, options?: {showTitle: boolean})

    // Add more if needed from https://developers.mattermost.com/extend/plugins/webapp/reference
}
