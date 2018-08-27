var Service, Characteristic;
var request = require('request');

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory("homebridge-sonoff-th-tasmota-http", "SonoffTHTasmotaHTTP", SonoffTHTasmotaHTTPAccessory);
}

function SonoffTHTasmotaHTTPAccessory(log, config) {
  this.log = log;
  this.config = config;
  this.name = config["name"]
  this.relay = config["relay"] || ""
  this.hostname = config["hostname"] || "sonoff"
  this.password = config["password"] || "";
  
  this.service = new Service.Outlet(this.name);
  
  this.service
  .getCharacteristic(Characteristic.On)
  .on('get', this.getState.bind(this))
  .on('set', this.setState.bind(this));

  this.temperatureService = new Service.TemperatureSensor(this.name);

  this.temperatureService
    .getCharacteristic(Characteristic.CurrentTemperature)
    .on('get', this.getTemperatureState.bind(this));

  this.humidityService = new Service.HumiditySensor(this.name);
  this.humidityService
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .setProps({ minValue: 0, maxValue: 100 })
      .on("get", this.getHumidityState.bind(this));

  this.log("Sonoff Tasmota HTTP Initialized")
}

SonoffTHTasmotaHTTPAccessory.prototype.getState = function(callback) {
  var that = this
  request("http://" + that.hostname + "/cm?user=admin&password=" + that.password + "&cmnd=Power" + that.relay, function(error, response, body) {
    if (error) return callback(error);
    var sonoff_reply = JSON.parse(body); // {"POWER":"ON"}
    that.log("Sonoff HTTP: " + that.hostname + ", Relay " + that.relay + ", Get State: " + JSON.stringify(sonoff_reply));
    switch (sonoff_reply["POWER" + that.relay]) {
      case "ON":
        callback(null, 1);
        break;
      case "OFF":
        callback(null, 0);
        break;
    }
  })
}

SonoffTHTasmotaHTTPAccessory.prototype.setState = function(toggle, callback) {
  var newstate = "%20Off"
  if (toggle) newstate = "%20On"
  var that = this
  request("http://" + that.hostname + "/cm?user=admin&password=" + that.password + "&cmnd=Power" + that.relay + newstate, function(error, response, body) {
    if (error) return callback(error);
    var sonoff_reply = JSON.parse(body); // {"POWER":"ON"}
    that.log("Sonoff HTTP: " + that.hostname + ", Relay " + that.relay + ", Set State: " + JSON.stringify(sonoff_reply));
    switch (sonoff_reply["POWER" + that.relay]) {
      case "ON":
        callback();
        break;
      case "OFF":
        callback();
        break;
    }
  })
}

SonoffTHTasmotaHTTPAccessory.prototype.getTemperatureState = function(callback) {
  var that = this
  request("http://" + that.hostname + "/cm?user=admin&password=" + that.password + "&cmnd=Status%208", function(error, response, body) {
    if (error) return callback(error);
    var sonoff_reply = JSON.parse(body); // {"POWER":"ON"}
    that.log("Sonoff Temperature: " + JSON.stringify(sonoff_reply));
    callback(null, parseFloat(sonoff_reply.StatusSNS.SI7021.Temperature))
  })
}

SonoffTHTasmotaHTTPAccessory.prototype.getHumidityState = function(callback) {
  var that = this
  request("http://" + that.hostname + "/cm?user=admin&password=" + that.password + "&cmnd=Status%208", function(error, response, body) {
    if (error) return callback(error);
    var sonoff_reply = JSON.parse(body); // {"POWER":"ON"}
    that.log("Sonoff Temperature: " + JSON.stringify(sonoff_reply));
    callback(null, parseFloat(sonoff_reply.StatusSNS.SI7021.Humidity))
  })
}


SonoffTHTasmotaHTTPAccessory.prototype.getServices = function() {
  return [this.service, this.temperatureService, this.humidityService];
}
