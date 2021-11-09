
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
        node.deviceMap = config.deviceMap;
        node.devices = {};
        node.lutronEvent = new events.EventEmitter();
        node.statusEvent = new events.EventEmitter();
        node.includeAction = config.includeAction;
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

        const updateStatus = (connected, msg) => {
            node.statusEvent.emit('update', {
                fill: connected ? 'green' : 'red',
                shape: 'dot',
                text: msg
            });
        };

        // Telnet handlers
        this.telnet.on('data', (function (self, pkt) {
            self.lutronRecv(pkt);
        }).bind(null, node));
        this.telnet.on('connect', function () {
            node.connected = true;
            node.log('telnet connect');
            updateStatus(true, 'connected');
        });
        this.telnet.on('close', function () {
            node.connected = false;
            node.log('telnet close');
            updateStatus(false, 'closed');
        });
        this.telnet.on('error', function () {
            node.warn('telnet error');
            updateStatus(false, 'telnet error');
        });
        this.telnet.on('failedlogin', function () {
            node.warn('telnet failed login');
            updateStatus(false, 'login failed');
        });
        this.telnet.on('timeout', function () {
            node.log('telnet timeout');
        });
        this.telnet.on('end', function () {
            node.warn('telnet remote ended connection');
            updateStatus(false, 'ended');
        });

        // Lutron handlers
        this.lutronSend = function (msg, fn) {
            this.telnet.getSocket().write(msg + '\n', fn);
        }
        this.lutronUpdate = function (deviceId, fn) {
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
                //              this.log('[',cmd,',', type, ',',deviceId,
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

        // Cleanup on close
        node.on('close', function(done) {
            node.log('Node shutting down');
            node.telnet.end()
                .then(() => done())
                .catch(() => this.telnet.destroy().then(() => done()));
        });

        this.telnet.connect(params);
    }
    RED.nodes.registerType('lutron-config', LutronConfigNode);
}