/*
blink every 0.5s while WiFi connection
blink every 0.1s while sending payload
solid led while OTA

*/

#include <Ticker.h>
#include <ESP8266WiFi.h>
#include <ESP8266httpUpdate.h>



#define DEBUG(...) Serial.print( __VA_ARGS__ )

#ifndef DEBUG
#define DEBUG(...)
#endif

ADC_MODE(ADC_VCC); //analogread gets VCC voltage
#define OTA  //comment to disable OTA update
String current_version = "0.1";
const int refreshInterval = 30000; //30 sec
const char* ssid     = "myssid";
const char* password = "mypassword";

//String host = "monitoring-dashboard-bogdanbrudiu.c9users.io";
String host = "monitoringdashboard-bogdanbrudiu.rhcloud.com";
String url = "/services/insertEntry";
const int httpPort = 80;


#ifdef OTA
  Ticker OTAUpdateTicker;
  const int OTArefreshInterval = 1000*60*60*24; //once a day 
  String OTAhost = host;
  const int OTAPort = 80;
  String OTAurl = "/fw/OTA.php";

void OTAUpdate(){
  digitalWrite(BUILTIN_LED, HIGH);DEBUG("\r\nLED on\r\n");
   DEBUG("check for OTA update...\r\n");
      t_httpUpdate_return ret = ESPhttpUpdate.update(OTAhost,OTAPort, OTAurl,current_version);
      switch(ret) {
          case HTTP_UPDATE_FAILD:
              DEBUG("[update] Update failed.\r\n");
              break;
          case HTTP_UPDATE_NO_UPDATES:
              DEBUG("[update] Update no Update.\r\n");
              break;
          case HTTP_UPDATE_OK:
              DEBUG("[update] Update ok.\r\n"); // may not called we reboot the ESP
              break;
      }
  digitalWrite(BUILTIN_LED, LOW);DEBUG("LED off\r\n");
}
#endif  

Ticker blinker;
void blink()
{
  int state = digitalRead(BUILTIN_LED);  
  digitalWrite(BUILTIN_LED, !state);   
} 
void WiFiConnect(){
  DEBUG("\r\n");
  DEBUG("\r\n");
  // blink every 0.5s
  blinker.attach(0.5, blink);DEBUG("Blink 0.5\r\n");

  DEBUG("Connecting to ");
  DEBUG(ssid);
  DEBUG("\r\n");
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    DEBUG(".");
  }

  Serial.println("");
  DEBUG("WiFi connected\r\n");  
  DEBUG("IP address: ");
  DEBUG(String(WiFi.localIP()).c_str());
  DEBUG("\r\n");
  blinker.detach();
  digitalWrite(BUILTIN_LED, LOW);DEBUG("LED off\r\n");
}

void setup() {
  Serial.begin(115200);
  pinMode(BUILTIN_LED, OUTPUT);
  digitalWrite(BUILTIN_LED, LOW);
  delay(10);

 

  // We start by connecting to a WiFi network
  WiFiConnect();
  
#ifdef OTA  
  OTAUpdate();
  OTAUpdateTicker.attach(OTArefreshInterval, OTAUpdate);
#endif  
}

void loop() {

  if(WiFi.status() != WL_CONNECTED) {
       DEBUG("WiFi connection lost...\r\n");
       WiFiConnect();
  } 
  else{
 // blink every 0.1s
  blinker.attach(0.1, blink);DEBUG("\r\nBlink 0.01\r\n");
    DEBUG("connecting to ");
    DEBUG(host);
    DEBUG("\r\n");
    
    // Use WiFiClient class to create TCP connections
    WiFiClient client;
  
    if (!client.connect(host.c_str(), httpPort)) {
      DEBUG("connection failed\r\n");
      return;
    }
    
    // We now create a URI for the request
    String payload = "{\"deviceKey\":"+String(ESP.getChipId())+",\"state\":1,\"version\":"+current_version+",\"battery\":"+String(analogRead(A0))+",\"rssi\":"+String(WiFi.RSSI())+"}";
    
    DEBUG("POSTing payload:"+payload+" to URL: ");
    DEBUG(url);
    
    // This will send the request to the server
    client.println(String("POST http://") + host + url +" HTTP/1.1");
    DEBUG(String("POST http://") + host + url +" HTTP/1.1\r\n");
    client.println("Host: " + host);
    DEBUG("Host: " + host+"\r\n");
    client.println("Connection: close");
    DEBUG("Connection: close\r\n");
    //client.println("Cookie: c9.live.user.sso=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6NDE1NDk4LCJuYW1lIjoiYm9nZGFuYnJ1ZGl1IiwiaWF0IjoxNDQ3ODcyODAyLCJleHAiOjE0NDc5NTkyMDJ9.Wd-Y4j5cpg9C_vqW-x4z-Ask0_VglJyCWMttiOp8X-0");
    //DEBUG("Cookie: c9.live.user.sso=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6NDE1NDk4LCJuYW1lIjoiYm9nZGFuYnJ1ZGl1IiwiaWF0IjoxNDQ3ODcyODAyLCJleHAiOjE0NDc5NTkyMDJ9.Wd-Y4j5cpg9C_vqW-x4z-Ask0_VglJyCWMttiOp8X-0\r\n");
    


    client.println("Content-Type: application/json;");
    DEBUG("Content-Type: application/json;\r\n");
    client.print("Content-Length: ");
    DEBUG("Content-Length: ");
    client.println(payload.length());
    DEBUG(payload.length());
    client.println();
    DEBUG("\r\n");
    client.println(payload);
    DEBUG(payload);
    DEBUG("\r\n");
    delay(10);
    DEBUG("Response:\r\n");
    // Read all the lines of the reply from server and print them to Serial
    while(client.available()){
      String line = client.readStringUntil('\r');
       DEBUG(line);
    }
    
    DEBUG("\r\n");
    DEBUG("closing connection\r\n");
    blinker.detach();

    digitalWrite(BUILTIN_LED, HIGH);DEBUG("LED off\r\n");
    delay(refreshInterval);
  }
}

