// Lines 17 - 111 and anything related are thanks to Katlyn from cutecord's settings.

const { React, getModule } = require('powercord/webpack')
const { SwitchItem } = require('powercord/components/settings')

const TextInputWithTags = require('./TextInputWithTags.jsx');

module.exports = class Settings extends React.PureComponent {
    constructor(props) {
        super(props);
        
        this.state = {
            channels: this.props.getSetting('channels', [])
        }
    }

    mapChannelIds(vals) {
        const { getChannel } = getModule(['getChannel', 'hasChannel'], false)
        const { getGuild } = getModule(['getGuild', 'getGuilds'], false)
        return vals.map(id => {
            const channel = getChannel(id)
            if (channel === undefined) {
                return id
            }
            const guild = getGuild(channel.guild_id)
            return `${guild.name} #${channel.name}`
        })
    }

    /**
     * Generate a function that merges and saves the given object after when it is
     * called with a value.
     * @param {String} key
     */
    generateMergeHandler(key, updateSetting = true) {
        return e => {
            this.state[key] = e.value
            this.setState({ key: this.state[key] })
            if (updateSetting) {
                this.props.updateSetting(key, this.state[key])
            }
        }
    }

    generateTagAddHandler(key) {
        const mergeHandler = this.generateMergeHandler(key)
        return tag => {
            if (!this.state[key].includes(tag)) {
                mergeHandler({ value: [...this.state[key], tag] })
            }
        }
    }

    generateTagRemoveHandler(key) {
        const mergeHandler = this.generateMergeHandler(key)
        return tag => {
            this.state[key].splice(tag, 1)
            mergeHandler({ value: this.state[key] })
        }
    }

    generateChannelTagHandler(key) {
        const tagHandler = this.generateTagAddHandler(key)
        return async tag => {
            const { getChannel } = await getModule(['getChannel', 'hasChannel'])
            const { getAllGuilds } = await getModule(['getChannels', 'getAllGuilds'])
        
            let channel = getChannel(tag)
            if (channel === undefined) {
                const cachedGuilds = getAllGuilds()
                const viewableChannels = []
                for (const id in cachedGuilds) {
                    if (cachedGuilds[id] !== undefined) {
                        viewableChannels.push(...cachedGuilds[id].SELECTABLE.map(c => c.channel))
                    }
                }
        
                const exactMatches = []
                const fuzzyMatches = []
                for (const c of viewableChannels) {
                    if (c.name === tag) {
                        exactMatches.push(c)
                    }
                    if (c.name.includes(tag)) {
                        fuzzyMatches.push(c)
                    }
                }
        
                if (exactMatches.length === 1) {
                    channel = exactMatches[0]
                } else if (fuzzyMatches.length === 1) {
                    channel = fuzzyMatches[0]
                }
            }
        
            if (channel === undefined) {
                powercord.api.notices.sendToast(`naa-channel-not-found-${tag}`, {
                    header: 'Channel not found',
                    timeout: 5000,
                    content: `A match for \`${tag}\` was not found in your client's cache. There may have been too many matches, or none. Consider using an ID.`,
                    type: 'error',
                    buttons: [{
                        text: 'Dismiss',
                        look: 'ghost',
                        size: 'small',
                        onClick: () => powercord.api.notices.closeToast(`naa-channel-not-found-${tag}`)
                    }]
                })
                return
            }
            tagHandler(channel.id)
        }
    } 
        
    render() {
        const { getSetting, toggleSetting, updateSetting } = this.props;
        
        return <>
            <SwitchItem
                value={getSetting('no-channel-reorder', false)}
                onChange={() => {
                    toggleSetting('no-channel-reorder', false)
                }}
                note="When enabled, channels will not reorder when dragged."
            >Lock Channel Positions</SwitchItem>
            <SwitchItem
                value={getSetting('no-category-reorder', false)}
                onChange={() => {
                    toggleSetting('no-category-reorder', false)
                }}
                note="When enabled, categories will not reorder when dragged."
            >Lock Category Positions</SwitchItem>
            
            <TextInputWithTags
                title="Can't talk in these channels"
                tags={this.mapChannelIds(this.state.channels)}
                onAddTag={this.generateChannelTagHandler('channels')}
                onRemoveTag={this.generateTagRemoveHandler('channels')}
            ></TextInputWithTags>
        </>
    }
}
