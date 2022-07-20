const { React } = require('powercord/webpack')
const { SwitchItem } = require('powercord/components/settings')

module.exports = ({ getSetting, toggleSetting }) => <>
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
</>
