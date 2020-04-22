//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License
//

/*
 * a Cisco Webex bot that:
 * 
 */

const { Botkit } = require('botkit');
const { WebexAdapter } = require('botbuilder-adapter-webex');
const { BotkitConversation } = require('botkit');

var Store = require('jfs');
const fs = require('fs');
var randomstring = require('randomstring');
var db = new Store("data", { type: 'memory' });
var random_id_1 = randomstring.generate({ length: 5, charset: 'alphabetic' });
var random_id_2 = randomstring.generate({ length: 5, charset: 'alphabetic' });
var random_id_3 = randomstring.generate({ length: 5, charset: 'alphabetic' });

const train_image_url = 'https://i.imgur.com/vs9wGNf.jpg';
const floorplan_url = 'https://i.imgur.com/gI19kcP.png';
const car_accident_image = 'https://i.imgur.com/hA3N768.jpg';
const fire_image = 'https://i.imgur.com/ntD1i5S.jpg';
const robbery_image = 'https://i.imgur.com/68GuUle.jpg';

const rawdata = fs.readFileSync('translations.json');
const translations = JSON.parse(rawdata);

if (!process.env.WEBEX_BOT_ACCESS_TOKEN) {
    console.log("Could not start as this bot requires a Webex bot API token.");
    process.exit(1);
}

if (!process.env.PUBLIC_URL) {
    console.log("Could not start as this bot must expose a public endpoint.");
    process.exit(1);
}

if (!process.env.TWILIO_SID && TWILIO_TOKEN) {
    console.log("Please add Twilio SID and token.");
    process.exit(1);
}

if (!process.env.BOT_LANGUAGE) {
    console.log("Please add a language (en od de).");
    process.exit(1);
}

const translatedConstants = translations[process.env.BOT_LANGUAGE]

var client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

const adapter = new WebexAdapter({
    access_token: process.env.WEBEX_BOT_ACCESS_TOKEN,
    public_address: process.env.PUBLIC_URL,
    secret: process.env.SECRET
});


var controller = new Botkit({
    adapter,
    log: true,
});
// Subscribe to webhooks for cards
controller.ready(async function () {
    await controller.adapter.registerAdaptiveCardWebhookSubscription('/api/messages');
});

async function createAdaptiveCard(bot, title, message, body) {
    return bot.api.messages.create({
        toPersonId: message.user,
        markdown: title,
        attachments: [
            {
                "contentType": "application/vnd.microsoft.card.adaptive",
                "content": {
                    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                    "type": "AdaptiveCard",
                    "version": "1.0",

                    "body": body,
                    "actions": [
                        {
                            "type": "Action.Submit",
                            "title": "Submit"
                        }
                    ]
                }
            }
        ]
    });

}

controller.hears([`^emergency`, `^help`] , 'direct_message,direct_mention', function (bot, message) {
    let body = [
        {
            "type": "TextBlock",
            "text": "What's the emergency?",
            "id": "emergency_type"
        },
        {
            "type": "Container",
            "items": [
                {
                    "type": "Input.ChoiceSet",
                    "placeholder": "Placeholder text",
                    "choices": [
                        {
                            "title": "Fire",
                            "value": "1"
                        },
                        {
                            "title": "Robbery",
                            "value": "2"
                        },
                        {
                            "title": "Traffic Accident",
                            "value": "3"
                        },
                        {
                            "title": "Train Derailment",
                            "value": "4"
                        }
                    ],
                    "style": "expanded",
                    "id": "emergencySelection"
                }
            ],
            "id": "type"
        }
    ];
    createAdaptiveCard(bot, 'Emergency type', message, body);
});


controller.on('attachmentActions', async (bot, message) => {
    if (message.value.emergencySelection) {
        db.save(random_id_3, { type: message.value.emergencySelection }, function (err) {
        });

        let locationBody = [
            {
                "type": "TextBlock",
                "text": "What's the emergency location?",
                "id": "location_text"
            },
            {
                "type": "Container",
                "items": [
                    {
                        "type": "Input.Text",
                        "placeholder": "Location",
                        "id": "emergencyLocation"
                    }
                ],
                "id": "location"
            },
        ];

        await createAdaptiveCard(bot, "Location?", message, locationBody);
    } else if (message.value.emergencyLocation) {
        db.save(random_id_1, { ort: message.value.emergencyLocation }, function (err) {
        });

        let injuredBody = [
            {
                "type": "TextBlock",
                "text": "How many Injured people?",
                "id": "injured_text"
            },
            {
                "type": "Container",
                "items": [
                    {
                        "type": "Input.Text",
                        "placeholder": "Injured People",
                        "value": "0",
                        "id": "injuredCount"
                    }
                ],
                "id": "injured"
            }
        ];
        await createAdaptiveCard(bot, "How many Injured people?", message, injuredBody);
    } else if (message.value.injuredCount) {
        var injured_old =
        {
            amount: message.value.injuredCount
        };

        db.save(random_id_2, injured_old, function (err) {
        });

        let smsBody = [
            {
                "type": "TextBlock",
                "text": "Should an SMS Notification be sent to the operations manager?",
                "id": "sendsms_text"
            },
            {
                "type": "Container",
                "items": [
                    {
                        "type": "Input.ChoiceSet",
                        "placeholder": "Placeholder text",
                        "id": "smsQuestion",
                        "choices": [
                            {
                                "title": "Yes",
                                "value": "yes"
                            },
                            {
                                "title": "No",
                                "value": "no"
                            }
                        ],
                        "style": "expanded"
                    }
                ],
                "id": "injured"
            }
        ];
        await createAdaptiveCard(bot, "Should an SMS Notification be sent to the operations manager?", message, smsBody);
    } else if (message.value.smsQuestion) {
        if (message.value.smsQuestion == 'yes') {
            var standort_new = db.getSync(random_id_1).ort;
            var injured_new = db.getSync(random_id_2).amount;
            var emergency_code = db.getSync(random_id_3).type;

            person = await bot.api.people.get({ personId: message.personId });

            var checkmail = new Promise(function (resolve, reject) {
                var memail = person.emails[0];
                if (memail) {
                    resolve(memail);
                };
            }).catch(error => console.log(error));

            async function sendsms(smsnumber) {
                // Use this convenient shorthand to send an SMS:
                client.messages.create({
                    to: smsnumber,
                    from: '+41798075315',
                    body: `${translatedConstants['code' + emergency_code]}${standort_new}\n${translatedConstants['sms_content_part_2']}${injured_new}\n\n${translatedConstants['sms_content_part_3']}`
                }, function (error, message) {
                    if (error) {
                        console.log(error)
                    }
                }).catch(error => console.log(error));

            }

            checkmail.then(async function (result) {
                if (result == "linorton@cisco.com") {
                    sendsms(+41797255692);
                } else if (result == "dligtenb@cisco.com") {
                    sendsms(+41764151295);
                } else if (result == "nnazemi@cisco.com") {
                    sendsms(+41765881171);
                } else if (result == "pageiser@cisco.com") {
                    sendsms(+41793008953);
                } else if (result == "cvollmei@cisco.com") {
                    sendsms(+41797840314);
                } else if (result == "msiegris@cisco.com") {
                    sendsms(+41794010356);
                } else if (result == "phmuelle@cisco.com") {
                    sendsms(+41787081428);
                } else if (result == "rbellwal@cisco.com") {
                    sendsms(+41796781380);
                } else if (result == "christma@cisco.com") {
                    sendsms(+41794190611);
                } else if (result == "fhorn@cisco.com") {
                    sendsms(+41794777689);
                } else if (result == "ptscharn@cisco.com") {
                    sendsms(+41793443650);
                } else if (result == "hamsanka@cisco.com") {
                    sendsms(+41799423484);
                }
            });
        }
        let webexBody = [
            {
                "type": "TextBlock",
                "text": "Thank you. Should a Webex Teams space be created for further communication?",
                "id": "create_webex_text"
            },
            {
                "type": "Container",
                "items": [
                    {
                        "type": "Input.ChoiceSet",
                        "placeholder": "Creat",
                        "id": "createWebex",
                        "choices": [
                            {
                                "title": "Yes",
                                "value": "yes"
                            },
                            {
                                "title": "No",
                                "value": "no"
                            }
                        ],
                        "style": "expanded"
                    }
                ],
                "id": "webex"
            }
        ];
        await createAdaptiveCard(bot, "Thank you. Should a Webex Teams space be created for further communication?", message, webexBody).catch(error => console.log(error));
    } else if (message.value.createWebex) {
        if (message.value.createWebex == "yes") {
            var standort_new = db.getSync(random_id_1).ort;
            var emergency_code = db.getSync(random_id_3).type;

            bot.api.rooms.create({ title: translatedConstants['code' + emergency_code] + standort_new }).then(async (room) => {
                // Order not relevant, just wait for all of them at once.
                await Promise.all([
                    await bot.api.memberships.create({
                        roomId: room.id,
                        personId: message.personId
                    }),
                    await bot.api.memberships.create({
                        roomId: room.id,
                        personEmail: `feuerwehr@sparkbot.io`
                    }),
                    await bot.api.memberships.create({
                        roomId: room.id,
                        personEmail: `sanitat@sparkbot.io`
                    }),
                    await bot.api.memberships.create({
                        roomId: room.id,
                        personEmail: `esbebe@sparkbot.io`
                    }),
                ]).catch(error => console.log(error));

                // Await for all of them here because order is relevant!
                await bot.api.messages.create({
                    markdown: translatedConstants['code' + emergency_code] + standort_new,
                    roomId: room.id,
                }).catch(error => console.log(error));
                var image_url = train_image_url;

                if (emergency_code == 1) {
                    image_url = fire_image;
                } else if (emergency_code == 2) {
                    image_url = robbery_image;
                } else if (emergency_code == 3) {
                    image_url = car_accident_image;
                } else if (emergency_code == 4) {
                    image_url = train_image_url;
                }
                await bot.api.messages.create({
                    markdown: translatedConstants['code' + emergency_code] + standort_new + "**",
                    roomId: room.id,
                    files: image_url
                }).catch(error => console.log(error));
                await bot.api.messages.create({
                    markdown: translatedConstants['flooplan_message'] + standort_new,
                    roomId: room.id,
                    files: floorplan_url
                }).catch(error => console.log(error));

                return bot.api.messages.create({
                    markdown: translatedConstants['messaged_personnel'],
                    roomId: room.id,
                }).catch(error => console.log(error));
            })
            await bot.reply(message, { markdown: translatedConstants['thank_you_message'] }).catch(error => console.log(error));
        } else {
            await bot.reply(message, { markdown: translatedConstants['short_thank_you'] }).catch(error => console.log(error));
        }
    }
})
