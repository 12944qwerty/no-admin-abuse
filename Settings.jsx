const { React } = require('powercord/webpack')
const { SwitchItem } = require('powercord/components/settings')

module.exports = ({ getSetting, toggleSetting }) => <>
    <SwitchItem
        value={getSetting('no-channel-reorder', false)}
        onChange={() => {
            toggleSetting('no-channel-reorder', false)
        }}
        note="When enabled, channels will not reorder when dragged."
    >Don't Reorder Channels</SwitchItem>
</>
