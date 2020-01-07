module.exports = function (RED) {

  function LutronStatusNode(status) {
    RED.nodes.createNode(this, status);
    var configNode = RED.nodes.getNode(status.confignode);
    this.devName = status.name;
    this.devId = parseInt(configNode.deviceMap[this.devName]);
    // register a callback on config node so that it can call this
    // node
    // then it will call the this.send(msg), msg = {payload: "hi"}
    configNode.lutronEvent.on('data', (function (node, d) {
      if (node.devId && node.devId !== 0) {
        if (d.cmd === '~' && (d.type === 'DEVICE' || d.type === 'OUTPUT') &&
          parseInt(d.deviceId) === node.devId) {
          var value = parseInt(d.param);
          var action = parseInt(d.action);
          /*
          for dimmer action is always 1
          for pico action.param
            FullOn => a=2, p=4
            up     => a=5, p=4
            down   => a=6  p=4
            off    => a=4, p=4
          for on off switch
            action =1 p=0 or 100
          */
          if (action == '1') {
            // either dimmre of switch
            node.send({
              payload: value
            });
          } else if (value === 4) {
            var m = '';
            if (action === 2)
              m = 'on';
            else if (action === 5)
              m = 'up';
            else if (action === 6)
              m = 'down';
            else if (action === 4)
              m = 'off';
            node.send({
              payload: m
            });
          }
        }
      } else {
        node.send({
          payload: d
        });
      }
    }).bind(null, this));
  }
  RED.nodes.registerType('lutron-status', LutronStatusNode);
}