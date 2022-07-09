const { Plugin } = require('powercord/entities');
const { getModule, React } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');
const { findInReactTree, getOwnerInstance } = require('powercord/util');

const Settings = require('./Settings')

module.exports = class NoAdminAbuse extends Plugin {
    async startPlugin() {
        powercord.api.settings.registerSettings(this.entityID, {
          category: this.entityID,
          label: 'No Admin Abuse',
          render: Settings
        });
    
        
        const ConnectedTextChannel = await getModule((m) => m.default?.displayName === 'ConnectedTextChannel');
        inject('no-reordering-channel', ConnectedTextChannel, 'default', (args, res) => {
            if (this.settings.get('no-channel-reorder', false)) {
                res.props.canReorderChannel = false;
            }
            return res;
        })

        const id = 'toggle-channel-reordering';
        const Menu = await getModule(m => m.default?.displayName === 'Menu');
        inject('toggleable-settings', Menu, 'default', ([{children}], res) => { // Thanks Marvin/Guild Profile
            if (res.props.children.props.id !== 'guild-header-popout') return res;

            console.log(res);

            const canReorder = this.settings.get('no-channel-reorder', false);

            if (!findInReactTree(res, (c) => c.props && c.props.id == id)) {
                children.push(
                    React.createElement(
                        Menu.MenuGroup,
                        null,
                        React.createElement(Menu.MenuCheckboxItem, {
                            id: 'toggle-channel-reordering',
                            label: 'Can Reorder Channels',
                            checked: !canReorder,
                            action: () => {
                                this.settings.set('no-channel-reorder', !canReorder);
                            },
                            isFocused: false,
                            menuItemProps: {
                                "role": "menuitemcheckbox",
                                "id": "guild-header-popout-toggle-channel-reordering",
                                "tabIndex": -1
                            }
                        })
                    )
                );
            }
            return res;
        })
    }

    pluginWillUnload() {
        uninject('no-reordering-channel');
        uninject('toggleable-settings');
        powercord.api.settings.unregisterSettings(this.entityID);
    }
}