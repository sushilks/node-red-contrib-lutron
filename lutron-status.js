module.exports = function(RED) {

    function LutronStatusNode(status) {
        RED.nodes.createNode(this, status);
        var configNode = RED.nodes.getNode(status.confignode);
        this.devName = status.name;
        this.devId = configNode.deviceMap[this.devName];
        // register a callback on config node so that it can call this
        // node
        // then it will call the this.send(msg), msg = {payload: "hi"}
        configNode.lutronEvent.on('data', (function (node, d) {

          if (node.devId ) {
          if (d.cmd === '~' && d.type === 'OUTPUT' &&
                d.deviceId == node.devId) {
                var value = d.param;
                var action = d.action;
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
                if (action == '1')  {
                  // either dimmre of switch
                  node.send({payload: value});
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
                  node.send({payload: m});
                }
              }
            } else {
              node.send({payload: d});
            }
        }).bind(null, this));
    }
    RED.nodes.registerType('lutron-status', LutronStatusNode);
}
/*
// sends and output
 public async setValue(deviceId:number, val:number) {
      await this.send('#OUTPUT,'+ deviceId + ',1,' + val);
    }
// triggers an update response
     public async update(deviceId:number) {
      await this.send('?OUTPUT,'+ deviceId + ',1');
    }

// output parser
 # = SET, ? = Get, ~ = Event
    for OUTPUT action
    1 = level
   private recv(data:string) {
    let st = data.toString().trim();
    console.log('data Received:', st)
    let cmd = st[0]
    let cs = st.substring(1).split(',')
    let type = cs[0]
    if (cs.length >3) {
      let deviceId = parseInt(cs[1])
      let action = parseInt(cs[2])
      let param = parseFloat(cs[3])
      if (0)
      console.log('[',cmd,',', type, ',',deviceId,
      ',', action,',', param,']')
      if (cmd == '~') {
        // event notification
        if (type == 'OUTPUT' && action == 1) {
          this.devices[deviceId] = param
          this.scheduleLoxoneUpdate(deviceId, action, param)
        } else if (type == 'DEVICE') {
          this.scheduleLoxoneUpdate(deviceId, action, param)
        }
      }
    }
  }


*/