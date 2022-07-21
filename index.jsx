const { Plugin } = require('powercord/entities');
const { getModule, React, constants } = require('powercord/webpack');
const injector = require('powercord/injector');
const { findInReactTree, getOwnerInstance } = require('powercord/util');
const { Icon } = require("powercord/components");

const Settings = require('./components/Settings');

const Permissions = Object.assign({}, constants.Permissions);


var doRerenderTextArea;
class TextAreaWrapper extends React.Component { // needs to be in index for rerender to work, I need a better way for this
    constructor (props) {
        super(props);
        this.state = {}
    }

    componentDidMount() {
        doRerenderTextArea = (() => {this.setState({})}).bind(this)
    }

    render() {
        const isLocked = this.props.settings.get(this.props.args[0].channel.id, false)
        const heading = getModule(['heading-md/medium'], false)['heading-md/medium'];
        const { defaultColor } = getModule(['defaultColor'], false);
        const { title, button, buttonContainer, wrapper, image, content } = getModule(['title', 'wrapper', 'text'], false);
        const { sizeSmall, contents, grow, button: button2, lookFilled, colorPrimary } = getModule(['sizeSmall', 'contents'], false);

        const { can: checkPermissions } = getModule(["getChannelPermissions"], false);
        const { getChannel } = getModule(['getChannel', 'hasChannel'], false)
        const channel = getChannel(this.props.args[0].channel.id);

	    if (isLocked && checkPermissions(2048n, channel)) {
            return (
                <div className={wrapper}>
                    <div className={content}>
                        <img alt="" src="/assets/60ea1d16163c13845ccf31e70fd6528b.svg" class={image} />
                        <div className="text-[]">
                            <h3 className={`${defaultColor} ${heading} ${title}`} data-text-variant="heading-md/medium">Unlock this channel to speak in it.</h3>
                        </div>
                    </div>
                    <div class={buttonContainer}>
                        <button type="button" onClick={() => {
                            this.props.settings.set(this.props.args[0].channel.id, !isLocked);
                            this.props.rerender();
                        }} className={`${button} ${button2} ${lookFilled} ${colorPrimary} ${sizeSmall} ${grow}`}>
                            <div className={contents}>Unlock</div>
                        </button>
                    </div>
                </div>
            )
        } else {
            return this.props.textarea
        }
    }
}

module.exports = class NoAdminAbuse extends Plugin {
    async startPlugin() {
        this.injections = []

        const { getCurrentUser } = await getModule(['getCurrentUser']);
        this.currentUser = getCurrentUser();

        powercord.api.settings.registerSettings(this.entityID, {
          category: this.entityID,
          label: 'No Admin Abuse',
          render: Settings
        });
        
        this.blockReorderStuff();
        this.blockTalkingInChannel();
    }

    inject(id, obj, prop, func, pre=false) {
        this.injections.push(id);
        injector.inject(id, obj, prop, func, pre);
    }

    async rerenderChannelLocks() { // This is very hacky
        const { title } = getModule(['title', 'titleWrapper'], false);
        const headerBar = getOwnerInstance(document.querySelector('.' + title));
        headerBar.forceUpdate();

        doRerenderTextArea();
    }

    async blockTalkingInChannel() {
        const ChannelTextAreaContainer = await getModule(m => m.type && m.type.render && m.type.render.displayName === "ChannelTextAreaContainer");
        this.inject('naa-no-talking-heh', ChannelTextAreaContainer.type, 'render', (args, res) => {
            return React.createElement(TextAreaWrapper, {
                textarea: res,
                args: args,
                settings: this.settings,
                rerender: this.rerenderChannelLocks
            });
        })

        const classes = await getModule([ 'iconWrapper', 'clickable' ]);
        const { icon } = await getModule(['icon', 'toolbar']);
        const { can: checkPermissions } = await getModule(["getChannelPermissions"]);
        const { getChannel } = await getModule(['getChannel', 'hasChannel']);

        const HeaderBarContainer = await getModule(m=> m?.default?.displayName === 'HeaderBar');
        this.inject('naa-no-talking-locker', HeaderBarContainer, 'default', (args, res) => {
            const isLocked = this.settings.get(args[0].children[2].key, false);
            const channel = getChannel(args[0].children[2].key);

            if (args[0].children[2].key && checkPermissions(2048n, channel)) {
                res.props.children.props.children[1].props.children.props.children[0].unshift(
                    React.createElement(HeaderBarContainer.Icon, {
                        onClick: () => {
                            this.settings.set(args[0].children[2].key, !isLocked);
                            this.rerenderChannelLocks();
                        },
                        icon: () => isLocked ? React.createElement(Icon, {
                            className: classes.icon,
                            name: 'LockClosed',
                        }) : <>
                            <svg viewBox='0 0 24 24' width='24' height='24' className={icon}>
                                <path fill='currentColor' d='M 15 11 L 14.846 5.985 L 16.463 4.823 C 15.469 3.5 14.756 2 12 2 C 9.242 2 7 4.243 7 7 V 11 C 5.897 11 5 11.896 5 13 V 20 C 5 21.103 5.897 22 7 22 H 17 C 18.103 22 19 21.103 19 20 V 13 C 19 11.896 18.103 11 17 11 Z M 12 18 C 11.172 18 10.5 17.328 10.5 16.5 C 10.5 15.672 11.172 15 12 15 C 12.828 15 13.5 15.672 13.5 16.5 C 13.5 17.328 12.828 18 12 18 Z M 15 11 H 9 V 7 C 9 5.346 10.346 4 12 4 C 13.654 4 14.301 5.253 14.846 5.985 Z'/>
                            </svg>
                        </>,
                        tooltip: `${isLocked ? "Lock" : "Unlock"} The Channel`
                    })
                )
            }

            return res;
        })

        setTimeout(doRerenderTextArea, 1000);
    }

    async blockReorderStuff() {
        const { getGuildId } = await getModule(['getLastSelectedGuildId']);
        const { getGuild } = await getModule(['getGuild']);
        const { can } = await getModule(['getGuildPermissions']);

        const ConnectedTextChannel = await getModule((m) => m.default?.displayName === 'ConnectedTextChannel');
        this.inject('naa-no-reordering-tchannel', ConnectedTextChannel, 'default', (args, res) => {
            if (this.settings.get('no-channel-reorder', false)) {
                res.props.canReorderChannel = false;
            }
            return res;
        });
        const ConnectedVoiceChannel = await getModule((m) => m.default?.displayName === 'ConnectedVoiceChannel');
        this.inject('naa-no-reordering-vchannel', ConnectedVoiceChannel, 'default', (args, res) => {
            if (this.settings.get('no-channel-reorder', false)) {
                res.props.canReorderChannel = false;
            }
            return res;
        });
    
        // const { DecoratedComponent: Category } = await getModule(m =>
        //     m.DecoratedComponent && m.DecoratedComponent.type &&
        //     (m.DecoratedComponent.__powercordOriginal_type || m.DecoratedComponent.type).toString().indexOf('Messages.CATEGORY_A11Y_LABEL') !== -1
        // )
        // console.log(Category)
        // this.inject('no-reordering-category', Category, 'type', ([args]) => {
        //     if (args.sorting || args.sortingParent || args.sortingPosition || args.sortingType) {
        //         console.log(args)
        //         args.channel.permissionOverwrites[currentUser.id] = {
        //             allow: 0n,
        //             deny: 16n,
        //             id: currentUser.id,
        //             type: 1
        //         }
        //     }

        //     return [args];
        // }, true);
        // Category.type.toString = () => Category.type.__powercordOriginal_type.toString()

        const id = 'toggle-channel-reordering';
        const Menu = await getModule(m => m.default?.displayName === 'Menu');
        this.inject('naa-toggleable-settings', Menu, 'default', ([{children}], res) => { // Thanks Marvin/Guild Profile
            if (res.props.children.props.id !== 'guild-header-popout' && res.props.children.props.id !== 'favorites-header-popout') return res;

            const guild = getGuild(getGuildId());
            if (!can(Permissions.MANAGE_CHANNELS, guild) && guild.name !== "Favorites") return res;

            const canReorder = this.settings.get('no-channel-reorder', false);
            const canCatReorder = this.settings.get('no-category-reorder', false);

            if (!findInReactTree(res, (c) => c.props && c.props.id == id)) {
                children.push(
                    React.createElement(
                        Menu.MenuGroup,
                        null,
                        React.createElement(Menu.MenuCheckboxItem, {
                            id: 'toggle-channel-reordering',
                            label: 'Lock Channel Positions',
                            checked: canReorder,
                            action: () => {
                                this.settings.set('no-channel-reorder', !canReorder);
                            },
                            isFocused: false,
                            menuItemProps: {
                                "role": "menuitemcheckbox",
                                "id": "guild-header-popout-toggle-channel-reordering",
                                "tabIndex": -1
                            }
                        }),
                        React.createElement(Menu.MenuCheckboxItem, {
                            id: 'toggle-category-reordering',
                            label: 'Lock Category Positions',
                            checked: canCatReorder,
                            action: () => {
                                this.settings.set('no-category-reorder', !canCatReorder);
                            },
                            isFocused: false,
                            menuItemProps: {
                                "role": "menuitemcheckbox",
                                "id": "guild-header-popout-toggle-category-reordering",
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
        this.injections.forEach(id => injector.uninject(id));
        powercord.api.settings.unregisterSettings(this.entityID);
    }
}