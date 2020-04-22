# Emergency Responder
Emergency Responder Bot for Webex Teams using Cards

This bot is intended to support emergency situations where several disperse parties have to collaborate quickly. By initiating the bot with "help" several questions are asked to understand the emergency situation, location, and to create a Webex Teams space with the relevant persons and send SMS messages to them. The bot leverages the Buttons & Cards functionalities in Webex Teams to make it even easier for the user to respond. 

As this bot is for demonstration purposes only, the location data as well as images are static. 

# Running the bot
To run this bot first install the required node packages by running following command in the project folder:
```
node install
```
Type following command to start the bot:
```
WEBEX_BOT_ACCESS_TOKEN=<YOUR WEBEX BOT TOKEN> PUBLIC_URL=<PUBLIC CALLBACK URL> TWILIO_SID=<TWILIO USER ID> TWILIO_TOKEN=<TWILIO ACCESS TOKEN> her=<LANGUAGE> node kapoZH.js
```

Please keep in mind that you also need a Twilio Account and respective access token for the SMS integration as this is handled by Twilio. 
Currently only English (en) and German (de) are supported languages.
