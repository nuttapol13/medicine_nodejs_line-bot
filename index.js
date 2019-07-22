var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()
var mqtt = require('mqtt');
var state = false;
var state_get_data = false;
var msg = "";
var text;
var sender;
var replyToken;
// Your Channel access token (long-lived)
const CH_ACCESS_TOKEN = 'iaRSV1WACQllpFSBhTsphdMNGeayLbn25aYlo8KSNE/X7n8ePa9lFE7y4vCq3tUN0B5gS7JQnNQ3xbEFXgg7RQaOJh9LBJ8UmDDA1Z/QSXwaeVyWCjgsYxJ/E38kSQ/0PnWTSjxal8xFz/87fr1jmQdB04t89/1O/w1cDnyilFU=';
// MQTT Host
var mqtt_host = 'mqtt://postman.cloudmqtt.com';
// MQTT Topic
var mqtt_topic = '/medicine/status/request';
var mqtt_topic_reply = '/medicine/status/reply';
// MQTT Config
var options = {
  port: 10968,  							//Port (normal)
  host: 'mqtt://postman.cloudmqtt.com',	//Host MQTT
  clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
  username: 'esp8266',					//User is create in menu Users and ACL
  password: '1234',						//Password is config in menu Users and ACL
  keepalive: 60,
  reconnectPeriod: 1000,
  protocolId: 'MQIsdp',
  protocolVersion: 3,
  clean: true,
  encoding: 'utf8'
};
app.use(bodyParser.json())
app.set('port', (process.env.PORT || 4000))
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

app.post('/webhook', (req, res) => {						//part form URL www.xxx.com/webhook
  text = req.body.events[0].message.text.toLowerCase() 	//Text เป็นข้อความที่พิมพ์เข้ามาจาก Line
  sender = req.body.events[0].source.userId				//UserId ของคนที่ส่งข้อความเข้ามา
  replyToken = req.body.events[0].replyToken			//replyToken เป็น token ที่ใช้เพื่อส่งข้อความกลับไปหา User
  console.log(text, sender, replyToken)
  console.log(typeof sender, typeof text)
  console.log("text: " + text);
  console.log("sender: " + sender);
  console.log("replyToken: " + replyToken);

  // console.log(req.body.events[0])
  if (text === 'ช่วยเหลือ' || text === 'การใช้งาน') {
    inFo(sender, text)
  }
  else if (text === '1' || text === 'ช่องที่ 1' || text === 'BOX-1') {
    CheckBox("BOX-1");
  }
  else if (text === '2' || text === 'ช่องที่ 2' || text === 'BOX-2') {
    CheckBox("BOX-2");
  }
  else if (text === '3' || text === 'ช่องที่ 3' || text === 'BOX-3') {
    CheckBox("BOX-3");
  }
  else if (text === '4' || text === 'ช่องที่ 4' || text === 'BOX-4') {
    CheckBox("BOX-4");
  }
  else {
    // Other
    sendText(sender, text);
  }
  res.sendStatus(200)
})

setInterval(Check_Status_Send_Notify, 50);
function Check_Status_Send_Notify() {
  //if(state_get_data == true){
  //  console.log("goto get data");
  //  get_data();
  //}
  if(state == true){
    console.log("goto Send data to Line");
    send_line(sender, text);
  }
}

function sendText (sender, text) {
  let data = {
    to: sender,
    messages: [
      {
        type: 'text',
        text: 'กรุณาพิมพ์ : info | on | off | เปิด | ปิด เท่านั้น'
      }
    ]
  }
  request({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer '+CH_ACCESS_TOKEN+''
    },
    url: 'https://api.line.me/v2/bot/message/push',
    method: 'POST',
    body: data,
    json: true
  }, function (err, res, body) {
    if (err) console.log('error')
    if (res) console.log('success')
    if (body) console.log(body)
  })
}

function inFo (sender, text) {
  let data = {
    to: sender,
    messages: [
      {
        type: 'text',
        text: 'uid: '+sender
      }
    ]
  }
  request({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer '+CH_ACCESS_TOKEN+''
    },
    url: 'https://api.line.me/v2/bot/message/push',
    method: 'POST',
    body: data,
    json: true
  }, function (err, res, body) {
    if (err) console.log('error')
    if (res) console.log('success')
    if (body) console.log(body)
  })
}

function CheckBox (data) {
  var client = mqtt.connect(mqtt_host, options);
  client.on('connect', function() { // When connected
    console.log('MQTT connected');
    // subscribe to a topic
    client.subscribe(mqtt_topic, function() {
      // when a message arrives, do something with it
      client.on('message', function(topic, message, packet) {
        console.log("Received '" + message + data + topic + "'");
      });
    });
    // publish a message to a topic
    client.publish(mqtt_topic, data , function() {
      console.log("Message is published");
      client.end(); // Close the connection when published
      get_data();
    });
  });
}

function ledOff (sender, text) {
  var client = mqtt.connect(mqtt_host, options);
  client.on('connect', function() { // When connected
    console.log('MQTT connected');
    // subscribe to a topic
    client.subscribe(mqtt_topic, function() {
      // when a message arrives, do something with it
      client.on('message', function(topic, message, packet) {
        console.log("Received '" + message + "' on '" + topic + "'");
      });
    });

    // publish a message to a topic
    client.publish(mqtt_topic, 'off', function() {
      console.log("Message is published");
      client.end(); // Close the connection when published
    });

  });
  let data = {
    to: sender,
    messages: [
      {
        type: 'text',
        text: 'LED OFF'
      }
    ]
  }
  request({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer '+CH_ACCESS_TOKEN+''
    },
    url: 'https://api.line.me/v2/bot/message/push',
    method: 'POST',
    body: data,
    json: true
  }, function (err, res, body) {
    if (err) console.log('error')
    if (res) console.log('success')
    if (body) console.log(body)
  })
}

//------------------------- TEST MESSAGE REPLY --------------------------//
function get_data () {
  var client = mqtt.connect(mqtt_host, options);
  client.on('connect', function() { // When connected
    console.log('MQTT connected GET DATA');
    // subscribe to a topic
    client.subscribe(mqtt_topic_reply, function() {
      console.log('MQTT subscribe GET DATA');
      // when a message arrives, do something with it
      client.on('message', function(topic, message, packet) {
        console.log("Received '" + message + topic + "'" + " GET DATA");
        msg = message.toString();
        console.log(msg);
        //state = true;
        client.end(); // Close the connection when published
        send_line(sender, text);
      });
    });
  });
}
//-------------------------------------------------------------------------//
function send_line(sender, text){
  let data = {
    to: sender,
    messages: [
      {
        type: 'text',
        text: msg
      }
    ]
  }
  request({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer '+CH_ACCESS_TOKEN+''
    },
    url: 'https://api.line.me/v2/bot/message/push',
    method: 'POST',
    body: data,
    json: true
  }, function (err, res, body) {
    if (err) console.log('error')
    if (res) console.log('success')
    if (body) console.log(body)
  })
  state = false;
}
//-------------------------------------------------------------------------//
app.listen(app.get('port'), function () {
  console.log('run at port', app.get('port'))
})
