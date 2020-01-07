
var Telnet = require('telnet-client');
var events = require("events");

module.exports = function (RED) {

    function LutronConfigNode(config) {
        RED.nodes.createNode(this, config);
        this.lutronLoc = config.ipaddress;
        var node = this;
        node.connected = false;
        node.telnet = new Telnet();
        node.port = 23;
        this.deviceMap = config.deviceMap;
        node.devices = {};
        node.lutronEvent = new events.EventEmitter();
        var params = {
            host: this.lutronLoc,
            port: this.port,
            shellPrompt: 'GNET>',
            debug: true,
            username: 'lutron',
            password: 'integration',
            timeout: parseInt(config.timeout) || 45000
        };
        this.sendLutronCommand = function (devId, val) {
            var str = '#OUTPUT,' + devId + ',1,' + val;
            this.telnet.getSocket().write(str + '\n');
        };
        this.sendLutronStatus = function (devId) {
            var str = '?OUTPUT,' + devId + ',1';
            this.telnet.getSocket().write(str + '\n');
        };
        this.telnet.on('data', (function (self, pkt) {
            self.lutronRecv(pkt);
        }).bind(null, node));
        this.telnet.on('connect', function () {
            this.connected = true;
            console.log('telnet connect');
        });
        this.telnet.on('close', function () {
            this.connected = false;
            console.log('telnet close');
        });
        this.telnet.on('error', function () {
            console.log('telent error');
        });
        this.telnet.on('failedlogin', function () {
            console.log('telent failed login');
        });
        this.lutronSend = function (msg, fn) {
            this.telent.getSocket().write(msg + '\n', fn);
        }
        this.lutrongUpdate = function (deviceId, fn) {
            this.lutronSend('?OUTPUT,' + deviceId + ',1', fn);
        }
        this.lutronSend = function (deviceId, val, fn) {
            this.lutronSend('#OUTPUT,' + deviceId + ',1,' + val, fn);
        }
        this.lutronRecv = function (data) {
            var st = data.toString().trim();
            var cmd = st[0]
            var cs = st.substring(1).split(',')
            var type = cs[0]
            if (cs.length > 3) {
                var deviceId = parseInt(cs[1])
                var action = parseInt(cs[2])
                var param = parseFloat(cs[3])
                //              console.log('[',cmd,',', type, ',',deviceId,
                //              ',', action,',', param,']')
                this.lutronEvent.emit('data', {
                    cmd: cmd,
                    type: type,
                    deviceId: deviceId,
                    action: action,
                    param: param
                });
                if (cmd == '~') {
                    // event notification
                    if (type == 'OUTPUT' && action == 1) {
                        this.devices[deviceId] = param
                        //this.scheduleLoxoneUpdate(deviceId, action, param)
                    } else if (type == 'DEVICE') {
                        //this.scheduleLoxoneUpdate(deviceId, action, param)
                    }
                }
            }
        }
        this.telnet.connect(params);
    }
    RED.nodes.registerType('lutron-config', LutronConfigNode);
}