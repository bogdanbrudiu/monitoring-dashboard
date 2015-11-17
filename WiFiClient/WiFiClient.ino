//#define OTA

#include <ESP8266WiFi.h>
#ifdef OTA
  #include <ESP8266httpUpdate.h>
#endif
String current_version = "v0.1";

const char* ssid     = "UPC476387";
const char* password = "YCHMOITV";

String host = "monitoring-dashboard-bogdanbrudiu.c9users.io";
String url = "/services/insertEntry";
const int httpPort = 80;


const int refreshInterval = 30000; //5 sec

#ifdef OTA
  const int OTArefreshInterval = 1000*60*60*24; //once a day 
  String OTAhost = "monitoring-dashboard-bogdanbrudiu.c9users.io";
  const int OTAPort = 80;
  String OTAurl = "/fw/OTA.php";
#endif



void setup() {
  Serial.begin(115200);
  delay(10);

  // We start by connecting to a WiFi network
  WiFiConnect();
 
}

void WiFiConnect(){
  Serial.println();
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");  
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

int passes=0;
void loop() {
  passes++;
  if(WiFi.status() != WL_CONNECTED) {
       Serial.print("WiFi connection lost... ");
       WiFiConnect();
  } 
  else{
#ifdef OTA
    if(passes>OTArefreshInterval/refreshInterval){
      passes=0;
      
      Serial.print("check for OTA update... ");
      t_httpUpdate_return ret = ESPhttpUpdate.update(OTAhost,OTAPort, OTAurl,current_version);
      switch(ret) {
          case HTTP_UPDATE_FAILD:
             Serial.println("[update] Update failed.");
              break;
          case HTTP_UPDATE_NO_UPDATES:
              Serial.println("[update] Update no Update.");
              break;
          case HTTP_UPDATE_OK:
              Serial.println("[update] Update ok."); // may not called we reboot the ESP
              break;
      }
    }
#endif
    
    Serial.print("connecting to ");
    Serial.println(host);
    
    // Use WiFiClient class to create TCP connections
    WiFiClient client;
  
    if (!client.connect(host.c_str(), httpPort)) {
      Serial.println("connection failed");
      return;
    }
    
    // We now create a URI for the request
    String payload = "{'deviceKey':"+String(ESP.getChipId())+",'state':1,'version':"+current_version+"}";
    
    Serial.print("POSTing payload:"+payload+" to URL: ");
    Serial.println(url);
    
    // This will send the request to the server
    client.println(String("POST http://") + host + url +" HTTP/1.1");
    Serial.println(String("POST http://") + host + url +" HTTP/1.1");
    client.println("Host: " + host);
    Serial.println("Host: " + host);
    client.println("Connection: close");
    Serial.println("Connection: close");
    client.println("Cookie: c9.live.user.sso=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6NDE1NDk4LCJuYW1lIjoiYm9nZGFuYnJ1ZGl1IiwiaWF0IjoxNDQ3Njk3MzQ1LCJleHAiOjE0NDc3ODM3NDV9.fkN8ri2uZryKbnJyzjDAaZcmWLDhdxqAkQ4dfUFb9IU");
    Serial.println("Cookie: c9.live.user.sso=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6NDE1NDk4LCJuYW1lIjoiYm9nZGFuYnJ1ZGl1IiwiaWF0IjoxNDQ3Njk3MzQ1LCJleHAiOjE0NDc3ODM3NDV9.fkN8ri2uZryKbnJyzjDAaZcmWLDhdxqAkQ4dfUFb9IU");
    


    client.println("Content-Type: application/json;");
    Serial.println("Content-Type: application/json;");
    client.print("Content-Length: ");
    Serial.print("Content-Length: ");
    client.println(payload.length());
    Serial.println(payload.length());
    client.println();
    Serial.println();
    client.println(payload);
    Serial.println(payload);
    delay(10);
    
    // Read all the lines of the reply from server and print them to Serial
    while(client.available()){
      String line = client.readStringUntil('\r');
      Serial.print(line);
    }
    
    Serial.println();
    Serial.println("closing connection");
    delay(refreshInterval);
  }
}

