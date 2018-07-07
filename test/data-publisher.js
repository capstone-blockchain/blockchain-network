const mqtt = require("mqtt")

const mqttClient = mqtt.connect(`mqtt://localhost`)

mqttClient.on("connect", () => {
  mqttClient.subscribe("RESPONSE_LATEST_BLOCK")
  mqttClient.publish("REQUEST_LATEST_BLOCK", "")
})

mqttClient.on("message", async (topic, message) => {
  switch (topic) {
    case "RESPONSE_LATEST_BLOCK":
      console.log(`RESPONSE_LATEST_BLOCK: ${message.toString()}`)
      break
  }
})
