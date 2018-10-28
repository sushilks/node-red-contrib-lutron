module.exports = function(RED) {

    function LutronControlNode(control) {
        RED.nodes.createNode(this, control);
        var configNode = RED.nodes.getNode(control.confignode);
        this.devName = control.name;
        this.devId = configNode.deviceMap[this.devName];
        this.on('input', function(msg) {
            console.log('foo');
            console.log(msg);
            // data is msg.payload
            if (!isNaN(msg.payload)) {
                configNode.sendLutronCommand(this.devId, msg.payload);
            } else {
                console.log('Error could not converted input value to number val=' + msg.paylaod);
            }
        })
    }
    RED.nodes.registerType('lutron-control', LutronControlNode);
}
