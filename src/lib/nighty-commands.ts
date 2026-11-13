export interface CatalogCommand { cmd: string; raw: string; cat: string; desc: string; options: string[]; usage: string }

export const ALL_COMMANDS: CatalogCommand[] = [
  {
    "cmd": "contextmenu",
    "raw": "contextmenu",
    "cat": "utilities",
    "desc": "Context Menu",
    "options": [
      "mode",
      "feature"
    ],
    "usage": ";contextmenu <mode> <feature>"
  },
  {
    "cmd": "help",
    "raw": "help",
    "cat": "utilities",
    "desc": "Help",
    "options": [
      "category"
    ],
    "usage": ";help <category>"
  },
  {
    "cmd": "admin kick",
    "raw": "/admin kick",
    "cat": "admin",
    "desc": "Kick member from the server",
    "options": [
      "member",
      "reason"
    ],
    "usage": ";admin kick <member> <reason>"
  },
  {
    "cmd": "admin ban",
    "raw": "/admin ban",
    "cat": "admin",
    "desc": "Ban member from the server",
    "options": [
      "member",
      "reason"
    ],
    "usage": ";admin ban <member> <reason>"
  },
  {
    "cmd": "admin softban",
    "raw": "/admin softban",
    "cat": "admin",
    "desc": "Ban & unban member in order to delete all their messages",
    "options": [
      "member",
      "reason"
    ],
    "usage": ";admin softban <member> <reason>"
  },
  {
    "cmd": "admin hackban",
    "raw": "/admin hackban",
    "cat": "admin",
    "desc": "Ban a user that is not in the server (using their id)",
    "options": [
      "user_id",
      "reason"
    ],
    "usage": ";admin hackban <user_id> <reason>"
  },
  {
    "cmd": "admin unban",
    "raw": "/admin unban",
    "cat": "admin",
    "desc": "Unban member from the server",
    "options": [
      "user",
      "reason"
    ],
    "usage": ";admin unban <user> <reason>"
  },
  {
    "cmd": "admin bans",
    "raw": "/admin bans",
    "cat": "admin",
    "desc": "Show banned users from the server",
    "options": [],
    "usage": ";admin bans"
  },
  {
    "cmd": "admin timeout",
    "raw": "/admin timeout",
    "cat": "admin",
    "desc": "Timeout member",
    "options": [
      "member",
      "minutes",
      "reason"
    ],
    "usage": ";admin timeout <member> <minutes> <reason>"
  },
  {
    "cmd": "admin removetimeout",
    "raw": "/admin removetimeout",
    "cat": "admin",
    "desc": "Remove timeout from member",
    "options": [
      "member",
      "reason"
    ],
    "usage": ";admin removetimeout <member> <reason>"
  },
  {
    "cmd": "admin purge",
    "raw": "/admin purge",
    "cat": "admin",
    "desc": "Delete chat messages",
    "options": [
      "amount",
      "user",
      "keyword",
      "until"
    ],
    "usage": ";admin purge <amount> <user> <keyword> <until>"
  },
  {
    "cmd": "admin slowmode",
    "raw": "/admin slowmode",
    "cat": "admin",
    "desc": "Set slowmode",
    "options": [
      "seconds"
    ],
    "usage": ";admin slowmode <seconds>"
  },
  {
    "cmd": "admin nuke",
    "raw": "/admin nuke",
    "cat": "admin",
    "desc": "Clone & delete channel in order to clean the chat",
    "options": [],
    "usage": ";admin nuke"
  },
  {
    "cmd": "admin addallroles",
    "raw": "/admin addallroles",
    "cat": "admin",
    "desc": "Add all roles to member",
    "options": [
      "member"
    ],
    "usage": ";admin addallroles <member>"
  },
  {
    "cmd": "admin removeallroles",
    "raw": "/admin removeallroles",
    "cat": "admin",
    "desc": "Remove all roles from member",
    "options": [
      "member"
    ],
    "usage": ";admin removeallroles <member>"
  },
  {
    "cmd": "admin createchannel",
    "raw": "/admin createchannel",
    "cat": "admin",
    "desc": "Create a new channel",
    "options": [
      "channel_type",
      "name",
      "reason"
    ],
    "usage": ";admin createchannel <channel_type> <name> <reason>"
  },
  {
    "cmd": "animated 100",
    "raw": "/animated 100",
    "cat": "text",
    "desc": "Count from 0 to 100",
    "options": [],
    "usage": ";animated 100"
  },
  {
    "cmd": "animated abc",
    "raw": "/animated abc",
    "cat": "text",
    "desc": "The alphabet in a message",
    "options": [],
    "usage": ";animated abc"
  },
  {
    "cmd": "animated bomb",
    "raw": "/animated bomb",
    "cat": "text",
    "desc": "Animated bomb message",
    "options": [],
    "usage": ";animated bomb"
  },
  {
    "cmd": "animated fuckyou",
    "raw": "/animated fuckyou",
    "cat": "text",
    "desc": "Animated fuck you message",
    "options": [],
    "usage": ";animated fuckyou"
  },
  {
    "cmd": "animated readrules",
    "raw": "/animated readrules",
    "cat": "text",
    "desc": "Read the fucking rules!",
    "options": [
      "user"
    ],
    "usage": ";animated readrules <user>"
  },
  {
    "cmd": "animated virus",
    "raw": "/animated virus",
    "cat": "text",
    "desc": "Injecting virus ...",
    "options": [
      "virus_type"
    ],
    "usage": ";animated virus <virus_type>"
  },
  {
    "cmd": "animated warning",
    "raw": "/animated warning",
    "cat": "text",
    "desc": "Warning, System overload",
    "options": [],
    "usage": ";animated warning"
  },
  {
    "cmd": "fun random",
    "raw": "/fun random",
    "cat": "fun",
    "desc": "Random commands",
    "options": [],
    "usage": ";fun random"
  },
  {
    "cmd": "fun 8ball",
    "raw": "/fun 8ball",
    "cat": "fun",
    "desc": "Get an answer to your question",
    "options": [
      "question"
    ],
    "usage": ";fun 8ball <question>"
  },
  {
    "cmd": "fun deathdate",
    "raw": "/fun deathdate",
    "cat": "fun",
    "desc": "Predicted death date",
    "options": [
      "user"
    ],
    "usage": ";fun deathdate <user>"
  },
  {
    "cmd": "fun dick",
    "raw": "/fun dick",
    "cat": "fun",
    "desc": "Dick size measurement",
    "options": [
      "user"
    ],
    "usage": ";fun dick <user>"
  },
  {
    "cmd": "fun gay",
    "raw": "/fun gay",
    "cat": "fun",
    "desc": "How gay",
    "options": [
      "user"
    ],
    "usage": ";fun gay <user>"
  },
  {
    "cmd": "fun insult",
    "raw": "/fun insult",
    "cat": "fun",
    "desc": "Insult a user",
    "options": [
      "user"
    ],
    "usage": ";fun insult <user>"
  },
  {
    "cmd": "fun iq",
    "raw": "/fun iq",
    "cat": "fun",
    "desc": "IQ test",
    "options": [
      "user"
    ],
    "usage": ";fun iq <user>"
  },
  {
    "cmd": "fun triggertyping",
    "raw": "/fun triggertyping",
    "cat": "fun",
    "desc": "Show your self typing in the chat",
    "options": [
      "delay_seconds",
      "channel_id"
    ],
    "usage": ";fun triggertyping <delay_seconds> <channel_id>"
  },
  {
    "cmd": "fun emojireact",
    "raw": "/fun emojireact",
    "cat": "fun",
    "desc": "React on the latest message with emojis",
    "options": [
      "text",
      "channel_id"
    ],
    "usage": ";fun emojireact <text> <channel_id>"
  },
  {
    "cmd": "fun mreact",
    "raw": "/fun mreact",
    "cat": "fun",
    "desc": "React on messages in the channel",
    "options": [
      "emoji",
      "amount"
    ],
    "usage": ";fun mreact <emoji> <amount>"
  },
  {
    "cmd": "fun spamreact",
    "raw": "/fun spamreact",
    "cat": "fun",
    "desc": "Spam reactions on last message",
    "options": [
      "emojis"
    ],
    "usage": ";fun spamreact <emojis>"
  },
  {
    "cmd": "fun tts",
    "raw": "/fun tts",
    "cat": "fun",
    "desc": "Text to speech message",
    "options": [
      "text"
    ],
    "usage": ";fun tts <text>"
  },
  {
    "cmd": "fun cycle",
    "raw": "/fun cycle",
    "cat": "fun",
    "desc": "Cycle channel, role, or nick name",
    "options": [
      "cycle_type",
      "text",
      "channel",
      "role",
      "member"
    ],
    "usage": ";fun cycle <cycle_type> <text> <channel> <role> <member>"
  },
  {
    "cmd": "fun feed",
    "raw": "/fun feed",
    "cat": "fun",
    "desc": "Feed user",
    "options": [
      "user"
    ],
    "usage": ";fun feed <user>"
  },
  {
    "cmd": "fun hug",
    "raw": "/fun hug",
    "cat": "fun",
    "desc": "Hug user",
    "options": [
      "user"
    ],
    "usage": ";fun hug <user>"
  },
  {
    "cmd": "fun kiss",
    "raw": "/fun kiss",
    "cat": "fun",
    "desc": "Kiss user",
    "options": [
      "user"
    ],
    "usage": ";fun kiss <user>"
  },
  {
    "cmd": "fun pat",
    "raw": "/fun pat",
    "cat": "fun",
    "desc": "Pat user",
    "options": [
      "user"
    ],
    "usage": ";fun pat <user>"
  },
  {
    "cmd": "fun slap",
    "raw": "/fun slap",
    "cat": "fun",
    "desc": "Slap user",
    "options": [
      "user"
    ],
    "usage": ";fun slap <user>"
  },
  {
    "cmd": "fun wink",
    "raw": "/fun wink",
    "cat": "fun",
    "desc": "Wink user",
    "options": [
      "user"
    ],
    "usage": ";fun wink <user>"
  },
  {
    "cmd": "fun respect",
    "raw": "/fun respect",
    "cat": "fun",
    "desc": "Respect user",
    "options": [
      "user"
    ],
    "usage": ";fun respect <user>"
  },
  {
    "cmd": "random number",
    "raw": "/random number",
    "cat": "fun",
    "desc": "Choose a random number",
    "options": [
      "min",
      "max"
    ],
    "usage": ";random number <min> <max>"
  },
  {
    "cmd": "random advice",
    "raw": "/random advice",
    "cat": "fun",
    "desc": "Get advice",
    "options": [],
    "usage": ";random advice"
  },
  {
    "cmd": "random animalfact",
    "raw": "/random animalfact",
    "cat": "fun",
    "desc": "Get a random animal fact",
    "options": [
      "animal"
    ],
    "usage": ";random animalfact <animal>"
  },
  {
    "cmd": "random coinflip",
    "raw": "/random coinflip",
    "cat": "fun",
    "desc": "Flip a coin",
    "options": [],
    "usage": ";random coinflip"
  },
  {
    "cmd": "random joke",
    "raw": "/random joke",
    "cat": "fun",
    "desc": "Random joke",
    "options": [],
    "usage": ";random joke"
  },
  {
    "cmd": "random question",
    "raw": "/random question",
    "cat": "fun",
    "desc": "Get a random question",
    "options": [],
    "usage": ";random question"
  },
  {
    "cmd": "random kanye",
    "raw": "/random kanye",
    "cat": "fun",
    "desc": "Kanye quote",
    "options": [],
    "usage": ";random kanye"
  },
  {
    "cmd": "random dice",
    "raw": "/random dice",
    "cat": "fun",
    "desc": "Roll a dice",
    "options": [],
    "usage": ";random dice"
  },
  {
    "cmd": "random rps",
    "raw": "/random rps",
    "cat": "fun",
    "desc": "Rock, paper & scissors",
    "options": [],
    "usage": ";random rps"
  },
  {
    "cmd": "image animal",
    "raw": "/image animal",
    "cat": "utilities",
    "desc": "Animal images",
    "options": [
      "animal"
    ],
    "usage": ";image animal <animal>"
  },
  {
    "cmd": "image meme",
    "raw": "/image meme",
    "cat": "utilities",
    "desc": "Generate memes",
    "options": [
      "meme",
      "text",
      "text_2"
    ],
    "usage": ";image meme <meme> <text> <text_2>"
  },
  {
    "cmd": "image overlay",
    "raw": "/image overlay",
    "cat": "utilities",
    "desc": "Put an overlay on user avatars",
    "options": [
      "overlay",
      "user",
      "user_2"
    ],
    "usage": ";image overlay <overlay> <user> <user_2>"
  },
  {
    "cmd": "image search",
    "raw": "/image search",
    "cat": "utilities",
    "desc": "Search image",
    "options": [
      "query"
    ],
    "usage": ";image search <query>"
  },
  {
    "cmd": "image user",
    "raw": "/image user",
    "cat": "utilities",
    "desc": "Get user asset",
    "options": [
      "asset",
      "user"
    ],
    "usage": ";image user <asset> <user>"
  },
  {
    "cmd": "image server",
    "raw": "/image server",
    "cat": "utilities",
    "desc": "Get server asset",
    "options": [
      "asset",
      "server_id"
    ],
    "usage": ";image server <asset> <server_id>"
  },
  {
    "cmd": "image phcomment",
    "raw": "/image phcomment",
    "cat": "utilities",
    "desc": "Pornhub comment",
    "options": [
      "user",
      "comment"
    ],
    "usage": ";image phcomment <user> <comment>"
  },
  {
    "cmd": "image pikachu",
    "raw": "/image pikachu",
    "cat": "utilities",
    "desc": "Pikachu",
    "options": [],
    "usage": ";image pikachu"
  },
  {
    "cmd": "image pornhub",
    "raw": "/image pornhub",
    "cat": "utilities",
    "desc": "Fake Pornhub logo",
    "options": [
      "text",
      "text_2"
    ],
    "usage": ";image pornhub <text> <text_2>"
  },
  {
    "cmd": "image nsfw",
    "raw": "/image nsfw",
    "cat": "utilities",
    "desc": "NSFW commands",
    "options": [],
    "usage": ";image nsfw"
  },
  {
    "cmd": "misc createcommand",
    "raw": "/misc createcommand",
    "cat": "settings",
    "desc": "Create (basic) custom command",
    "options": [
      "name",
      "reply"
    ],
    "usage": ";misc createcommand <name> <reply>"
  },
  {
    "cmd": "misc credits",
    "raw": "/misc credits",
    "cat": "settings",
    "desc": "Credits",
    "options": [],
    "usage": ";misc credits"
  },
  {
    "cmd": "misc dmlogger",
    "raw": "/misc dmlogger",
    "cat": "settings",
    "desc": "Toggle DM logger",
    "options": [
      "toggle"
    ],
    "usage": ";misc dmlogger <toggle>"
  },
  {
    "cmd": "misc muteallservers",
    "raw": "/misc muteallservers",
    "cat": "settings",
    "desc": "Mute all servers",
    "options": [],
    "usage": ";misc muteallservers"
  },
  {
    "cmd": "misc private",
    "raw": "/misc private",
    "cat": "settings",
    "desc": "Make command outputs visible only to you.",
    "options": [
      "toggle"
    ],
    "usage": ";misc private <toggle>"
  },
  {
    "cmd": "misc forward",
    "raw": "/misc forward",
    "cat": "settings",
    "desc": "Forward outputs from the app.",
    "options": [
      "toggle"
    ],
    "usage": ";misc forward <toggle>"
  },
  {
    "cmd": "misc folder",
    "raw": "/misc folder",
    "cat": "settings",
    "desc": "Open Nighty folder",
    "options": [],
    "usage": ";misc folder"
  },
  {
    "cmd": "misc nitrosniper",
    "raw": "/misc nitrosniper",
    "cat": "settings",
    "desc": "Toggle nitro sniper",
    "options": [
      "toggle"
    ],
    "usage": ";misc nitrosniper <toggle>"
  },
  {
    "cmd": "misc gjoiner",
    "raw": "/misc gjoiner",
    "cat": "settings",
    "desc": "Giveaway joiner",
    "options": [
      "toggle",
      "delay"
    ],
    "usage": ";misc gjoiner <toggle> <delay>"
  },
  {
    "cmd": "misc keywordnotifier",
    "raw": "/misc keywordnotifier",
    "cat": "settings",
    "desc": "Keyword notifier",
    "options": [
      "mode",
      "keyword"
    ],
    "usage": ";misc keywordnotifier <mode> <keyword>"
  },
  {
    "cmd": "misc whatsmykey",
    "raw": "/misc whatsmykey",
    "cat": "settings",
    "desc": "Check your license key",
    "options": [],
    "usage": ";misc whatsmykey"
  },
  {
    "cmd": "misc reloadscripts",
    "raw": "/misc reloadscripts",
    "cat": "settings",
    "desc": "Reload all scripts",
    "options": [],
    "usage": ";misc reloadscripts"
  },
  {
    "cmd": "misc togglescript",
    "raw": "/misc togglescript",
    "cat": "settings",
    "desc": "Enable or disable a script",
    "options": [
      "toggle",
      "script"
    ],
    "usage": ";misc togglescript <toggle> <script>"
  },
  {
    "cmd": "misc deletescript",
    "raw": "/misc deletescript",
    "cat": "settings",
    "desc": "Delete a script",
    "options": [
      "script"
    ],
    "usage": ";misc deletescript <script>"
  },
  {
    "cmd": "misc customcommands",
    "raw": "/misc customcommands",
    "cat": "settings",
    "desc": "Custom commands",
    "options": [],
    "usage": ";misc customcommands"
  },
  {
    "cmd": "misc restart",
    "raw": "/misc restart",
    "cat": "settings",
    "desc": "Restart Nighty",
    "options": [],
    "usage": ";misc restart"
  },
  {
    "cmd": "misc shutdown",
    "raw": "/misc shutdown",
    "cat": "settings",
    "desc": "Exit Nighty",
    "options": [],
    "usage": ";misc shutdown"
  },
  {
    "cmd": "misc riskmode",
    "raw": "/misc riskmode",
    "cat": "settings",
    "desc": "Toggle risk mode",
    "options": [
      "toggle"
    ],
    "usage": ";misc riskmode <toggle>"
  },
  {
    "cmd": "misc stop",
    "raw": "/misc stop",
    "cat": "settings",
    "desc": "Abort running commands",
    "options": [],
    "usage": ";misc stop"
  },
  {
    "cmd": "misc forceprivate",
    "raw": "/misc forceprivate",
    "cat": "settings",
    "desc": "Force a command to be executed privately.",
    "options": [
      "mode",
      "command"
    ],
    "usage": ";misc forceprivate <mode> <command>"
  },
  {
    "cmd": "misc uptime",
    "raw": "/misc uptime",
    "cat": "settings",
    "desc": "Selfbot uptime",
    "options": [],
    "usage": ";misc uptime"
  },
  {
    "cmd": "misc history",
    "raw": "/misc history",
    "cat": "settings",
    "desc": "Command history",
    "options": [
      "clear"
    ],
    "usage": ";misc history <clear>"
  },
  {
    "cmd": "misc commandsort",
    "raw": "/misc commandsort",
    "cat": "settings",
    "desc": "Command sorting",
    "options": [
      "sorting"
    ],
    "usage": ";misc commandsort <sorting>"
  },
  {
    "cmd": "recovery dailybackup",
    "raw": "/recovery dailybackup",
    "cat": "settings",
    "desc": "Create a backup every 24 hours.",
    "options": [
      "toggle"
    ],
    "usage": ";recovery dailybackup <toggle>"
  },
  {
    "cmd": "recovery backup",
    "raw": "/recovery backup",
    "cat": "settings",
    "desc": "Create backup",
    "options": [
      "backup_type"
    ],
    "usage": ";recovery backup <backup_type>"
  },
  {
    "cmd": "recovery restore",
    "raw": "/recovery restore",
    "cat": "settings",
    "desc": "Restore from backup",
    "options": [
      "restore_type",
      "account"
    ],
    "usage": ";recovery restore <restore_type> <account>"
  },
  {
    "cmd": "userprofile toggle",
    "raw": "/userprofile toggle",
    "cat": "settings",
    "desc": "Toggle User Profile",
    "options": [
      "toggle"
    ],
    "usage": ";userprofile toggle <toggle>"
  },
  {
    "cmd": "userprofile active",
    "raw": "/userprofile active",
    "cat": "settings",
    "desc": "Set active user profile",
    "options": [
      "profile"
    ],
    "usage": ";userprofile active <profile>"
  },
  {
    "cmd": "settings notifications",
    "raw": "/settings notifications",
    "cat": "settings",
    "desc": "Event notifications",
    "options": [
      "event_type",
      "toggle"
    ],
    "usage": ";settings notifications <event_type> <toggle>"
  },
  {
    "cmd": "settings dmnotifications",
    "raw": "/settings dmnotifications",
    "cat": "settings",
    "desc": "DM notifications",
    "options": [
      "event_type",
      "toggle"
    ],
    "usage": ";settings dmnotifications <event_type> <toggle>"
  },
  {
    "cmd": "settings toastnotifications",
    "raw": "/settings toastnotifications",
    "cat": "settings",
    "desc": "Windows notifications",
    "options": [
      "event_type",
      "toggle"
    ],
    "usage": ";settings toastnotifications <event_type> <toggle>"
  },
  {
    "cmd": "settings toastsettings",
    "raw": "/settings toastsettings",
    "cat": "settings",
    "desc": "Toast notification settings",
    "options": [
      "side",
      "duration_ms",
      "image_url"
    ],
    "usage": ";settings toastsettings <side> <duration_ms> <image_url>"
  },
  {
    "cmd": "settings soundnotifications",
    "raw": "/settings soundnotifications",
    "cat": "settings",
    "desc": "Sound notifications",
    "options": [
      "event_type",
      "toggle"
    ],
    "usage": ";settings soundnotifications <event_type> <toggle>"
  },
  {
    "cmd": "settings webhooknotifications",
    "raw": "/settings webhooknotifications",
    "cat": "settings",
    "desc": "Webhook notifications",
    "options": [
      "event_type",
      "url"
    ],
    "usage": ";settings webhooknotifications <event_type> <url>"
  },
  {
    "cmd": "settings sessionspoof",
    "raw": "/settings sessionspoof",
    "cat": "settings",
    "desc": "Spoof Nighty session",
    "options": [
      "session"
    ],
    "usage": ";settings sessionspoof <session>"
  },
  {
    "cmd": "settings theme",
    "raw": "/settings theme",
    "cat": "settings",
    "desc": "Theme management",
    "options": [
      "theme_name",
      "title",
      "footer",
      "image",
      "author_icon",
      "footer_icon",
      "large_image",
      "color"
    ],
    "usage": ";settings theme <theme_name> <title> <footer> <image> <author_icon> <footer_icon> <large_image> <color>"
  },
  {
    "cmd": "settings themes",
    "raw": "/settings themes",
    "cat": "settings",
    "desc": "Manage themes",
    "options": [
      "method",
      "theme_name"
    ],
    "usage": ";settings themes <method> <theme_name>"
  },
  {
    "cmd": "settings webhookpings",
    "raw": "/settings webhookpings",
    "cat": "settings",
    "desc": "Toggle webhook pings",
    "options": [
      "toggle"
    ],
    "usage": ";settings webhookpings <toggle>"
  },
  {
    "cmd": "settings webhookprofile",
    "raw": "/settings webhookprofile",
    "cat": "settings",
    "desc": "Edit webhook profile",
    "options": [
      "method",
      "value"
    ],
    "usage": ";settings webhookprofile <method> <value>"
  },
  {
    "cmd": "settings webhooksetup",
    "raw": "/settings webhooksetup",
    "cat": "settings",
    "desc": "Setup webhook notifications server",
    "options": [
      "server"
    ],
    "usage": ";settings webhooksetup <server>"
  },
  {
    "cmd": "settings prefix",
    "raw": "/settings prefix",
    "cat": "settings",
    "desc": "Change prefix for message commands",
    "options": [
      "new_prefix"
    ],
    "usage": ";settings prefix <new_prefix>"
  },
  {
    "cmd": "settings deletetimer",
    "raw": "/settings deletetimer",
    "cat": "settings",
    "desc": "Auto delete command outputs",
    "options": [
      "seconds"
    ],
    "usage": ";settings deletetimer <seconds>"
  },
  {
    "cmd": "settings appedit",
    "raw": "/settings appedit",
    "cat": "settings",
    "desc": "Edit app profile",
    "options": [
      "name",
      "avatar",
      "banner"
    ],
    "usage": ";settings appedit <name> <avatar> <banner>"
  },
  {
    "cmd": "text 1337",
    "raw": "/text 1337",
    "cat": "text",
    "desc": "1337 style message",
    "options": [
      "text"
    ],
    "usage": ";text 1337 <text>"
  },
  {
    "cmd": "text ascii",
    "raw": "/text ascii",
    "cat": "text",
    "desc": "Text to ASCII art",
    "options": [
      "text"
    ],
    "usage": ";text ascii <text>"
  },
  {
    "cmd": "text zalgo",
    "raw": "/text zalgo",
    "cat": "text",
    "desc": "Zalgo text",
    "options": [
      "text"
    ],
    "usage": ";text zalgo <text>"
  },
  {
    "cmd": "text italic",
    "raw": "/text italic",
    "cat": "text",
    "desc": "Italic text",
    "options": [
      "text"
    ],
    "usage": ";text italic <text>"
  },
  {
    "cmd": "text upsidedown",
    "raw": "/text upsidedown",
    "cat": "text",
    "desc": "Text upside down",
    "options": [
      "text"
    ],
    "usage": ";text upsidedown <text>"
  },
  {
    "cmd": "text morse",
    "raw": "/text morse",
    "cat": "text",
    "desc": "Text to morse code",
    "options": [
      "text"
    ],
    "usage": ";text morse <text>"
  },
  {
    "cmd": "text owo",
    "raw": "/text owo",
    "cat": "text",
    "desc": "Owoify text",
    "options": [
      "text"
    ],
    "usage": ";text owo <text>"
  },
  {
    "cmd": "text smart",
    "raw": "/text smart",
    "cat": "text",
    "desc": "SmArT TaLkEr",
    "options": [
      "text"
    ],
    "usage": ";text smart <text>"
  },
  {
    "cmd": "text regional",
    "raw": "/text regional",
    "cat": "text",
    "desc": "Text in emojis",
    "options": [
      "text"
    ],
    "usage": ";text regional <text>"
  },
  {
    "cmd": "text space",
    "raw": "/text space",
    "cat": "text",
    "desc": "Spaced message",
    "options": [
      "text"
    ],
    "usage": ";text space <text>"
  },
  {
    "cmd": "text vape",
    "raw": "/text vape",
    "cat": "text",
    "desc": "Vapored message",
    "options": [
      "text"
    ],
    "usage": ";text vape <text>"
  },
  {
    "cmd": "text spoiler",
    "raw": "/text spoiler",
    "cat": "text",
    "desc": "Spoil every character",
    "options": [
      "text"
    ],
    "usage": ";text spoiler <text>"
  },
  {
    "cmd": "text reverse",
    "raw": "/text reverse",
    "cat": "text",
    "desc": "Reverse text",
    "options": [
      "text"
    ],
    "usage": ";text reverse <text>"
  },
  {
    "cmd": "text hyperlink",
    "raw": "/text hyperlink",
    "cat": "text",
    "desc": "Add link to text",
    "options": [
      "text",
      "url"
    ],
    "usage": ";text hyperlink <text> <url>"
  },
  {
    "cmd": "text semoji",
    "raw": "/text semoji",
    "cat": "text",
    "desc": "Emoji between each word",
    "options": [
      "emoji",
      "text"
    ],
    "usage": ";text semoji <emoji> <text>"
  },
  {
    "cmd": "text codeblock",
    "raw": "/text codeblock",
    "cat": "text",
    "desc": "Text in codeblock",
    "options": [
      "code",
      "text"
    ],
    "usage": ";text codeblock <code> <text>"
  },
  {
    "cmd": "text hiddenping",
    "raw": "/text hiddenping",
    "cat": "text",
    "desc": "Hide ping in message",
    "options": [
      "user",
      "text"
    ],
    "usage": ";text hiddenping <user> <text>"
  },
  {
    "cmd": "text hiddenlink",
    "raw": "/text hiddenlink",
    "cat": "text",
    "desc": "Hide link in message",
    "options": [
      "url",
      "text"
    ],
    "usage": ";text hiddenlink <url> <text>"
  },
  {
    "cmd": "text convert",
    "raw": "/text convert",
    "cat": "text",
    "desc": "Convert text to binary, hex, base64, ..",
    "options": [
      "conversion",
      "value"
    ],
    "usage": ";text convert <conversion> <value>"
  },
  {
    "cmd": "tools info",
    "raw": "/tools info",
    "cat": "tools",
    "desc": "Information commands",
    "options": [],
    "usage": ";tools info"
  },
  {
    "cmd": "tools generate",
    "raw": "/tools generate",
    "cat": "tools",
    "desc": "Generate commands",
    "options": [],
    "usage": ";tools generate"
  },
  {
    "cmd": "tools lookup",
    "raw": "/tools lookup",
    "cat": "tools",
    "desc": "Lookup commands",
    "options": [],
    "usage": ";tools lookup"
  },
  {
    "cmd": "tools dump",
    "raw": "/tools dump",
    "cat": "tools",
    "desc": "Dump commands",
    "options": [],
    "usage": ";tools dump"
  },
  {
    "cmd": "tools nickscan",
    "raw": "/tools nickscan",
    "cat": "tools",
    "desc": "Show servers you have a nickname in",
    "options": [],
    "usage": ";tools nickscan"
  },
  {
    "cmd": "tools revavatar",
    "raw": "/tools revavatar",
    "cat": "tools",
    "desc": "Reverse user avatar",
    "options": [
      "user"
    ],
    "usage": ";tools revavatar <user>"
  },
  {
    "cmd": "tools tinyurl",
    "raw": "/tools tinyurl",
    "cat": "tools",
    "desc": "URL shortener",
    "options": [
      "url"
    ],
    "usage": ";tools tinyurl <url>"
  },
  {
    "cmd": "tools snipe",
    "raw": "/tools snipe",
    "cat": "tools",
    "desc": "Retrieve deleted messages",
    "options": [
      "amount",
      "channel",
      "channel_id"
    ],
    "usage": ";tools snipe <amount> <channel> <channel_id>"
  },
  {
    "cmd": "tools transfer",
    "raw": "/tools transfer",
    "cat": "tools",
    "desc": "Transfer emojis/stickers from one server to another",
    "options": [
      "type",
      "transfer_from",
      "transfer_to"
    ],
    "usage": ";tools transfer <type> <transfer_from> <transfer_to>"
  },
  {
    "cmd": "tools ping",
    "raw": "/tools ping",
    "cat": "tools",
    "desc": "Discord latency",
    "options": [],
    "usage": ";tools ping"
  },
  {
    "cmd": "tools friendinvite",
    "raw": "/tools friendinvite",
    "cat": "tools",
    "desc": "Generate a friend invite",
    "options": [],
    "usage": ";tools friendinvite"
  },
  {
    "cmd": "info user",
    "raw": "/info user",
    "cat": "tools",
    "desc": "User information",
    "options": [
      "user",
      "user_id"
    ],
    "usage": ";info user <user> <user_id>"
  },
  {
    "cmd": "info member",
    "raw": "/info member",
    "cat": "tools",
    "desc": "Server member information",
    "options": [
      "member"
    ],
    "usage": ";info member <member>"
  },
  {
    "cmd": "info server",
    "raw": "/info server",
    "cat": "tools",
    "desc": "Server information",
    "options": [
      "server"
    ],
    "usage": ";info server <server>"
  },
  {
    "cmd": "info token",
    "raw": "/info token",
    "cat": "tools",
    "desc": "Token information",
    "options": [
      "token"
    ],
    "usage": ";info token <token>"
  },
  {
    "cmd": "info role",
    "raw": "/info role",
    "cat": "tools",
    "desc": "Server role information",
    "options": [
      "role"
    ],
    "usage": ";info role <role>"
  },
  {
    "cmd": "info channel",
    "raw": "/info channel",
    "cat": "tools",
    "desc": "Server channel information",
    "options": [
      "channel",
      "channel_id"
    ],
    "usage": ";info channel <channel> <channel_id>"
  },
  {
    "cmd": "info webhook",
    "raw": "/info webhook",
    "cat": "tools",
    "desc": "Webhook information",
    "options": [
      "webhook_url"
    ],
    "usage": ";info webhook <webhook_url>"
  },
  {
    "cmd": "info sticker",
    "raw": "/info sticker",
    "cat": "tools",
    "desc": "Sticker information",
    "options": [
      "sticker_name"
    ],
    "usage": ";info sticker <sticker_name>"
  },
  {
    "cmd": "info emoji",
    "raw": "/info emoji",
    "cat": "tools",
    "desc": "Emoji information",
    "options": [
      "emoji_name",
      "server_id"
    ],
    "usage": ";info emoji <emoji_name> <server_id>"
  },
  {
    "cmd": "info invite",
    "raw": "/info invite",
    "cat": "tools",
    "desc": "Invite information",
    "options": [
      "invite"
    ],
    "usage": ";info invite <invite>"
  },
  {
    "cmd": "generate nitro",
    "raw": "/generate nitro",
    "cat": "utilities",
    "desc": "Generate fake nitro",
    "options": [
      "amount"
    ],
    "usage": ";generate nitro <amount>"
  },
  {
    "cmd": "generate token",
    "raw": "/generate token",
    "cat": "utilities",
    "desc": "Generate fake discord token",
    "options": [],
    "usage": ";generate token"
  },
  {
    "cmd": "generate password",
    "raw": "/generate password",
    "cat": "utilities",
    "desc": "Generate password",
    "options": [
      "length"
    ],
    "usage": ";generate password <length>"
  },
  {
    "cmd": "generate user",
    "raw": "/generate user",
    "cat": "utilities",
    "desc": "Generate fake user",
    "options": [],
    "usage": ";generate user"
  },
  {
    "cmd": "lookup weather",
    "raw": "/lookup weather",
    "cat": "tools",
    "desc": "Current weather",
    "options": [
      "city"
    ],
    "usage": ";lookup weather <city>"
  },
  {
    "cmd": "lookup crypto",
    "raw": "/lookup crypto",
    "cat": "tools",
    "desc": "Crypto price",
    "options": [
      "currency_code"
    ],
    "usage": ";lookup crypto <currency_code>"
  },
  {
    "cmd": "lookup ip",
    "raw": "/lookup ip",
    "cat": "tools",
    "desc": "IP address lookup",
    "options": [
      "address"
    ],
    "usage": ";lookup ip <address>"
  },
  {
    "cmd": "lookup urban",
    "raw": "/lookup urban",
    "cat": "tools",
    "desc": "Urban dictionary",
    "options": [
      "term"
    ],
    "usage": ";lookup urban <term>"
  },
  {
    "cmd": "lookup google",
    "raw": "/lookup google",
    "cat": "tools",
    "desc": "Google search",
    "options": [
      "search"
    ],
    "usage": ";lookup google <search>"
  },
  {
    "cmd": "lookup youtube",
    "raw": "/lookup youtube",
    "cat": "tools",
    "desc": "YouTube search",
    "options": [
      "search"
    ],
    "usage": ";lookup youtube <search>"
  },
  {
    "cmd": "lookup song",
    "raw": "/lookup song",
    "cat": "tools",
    "desc": "Song lookup",
    "options": [
      "search"
    ],
    "usage": ";lookup song <search>"
  },
  {
    "cmd": "lookup mcserver",
    "raw": "/lookup mcserver",
    "cat": "tools",
    "desc": "Minecraft server lookup",
    "options": [
      "address"
    ],
    "usage": ";lookup mcserver <address>"
  },
  {
    "cmd": "lookup server",
    "raw": "/lookup server",
    "cat": "tools",
    "desc": "Lookup server roles or channels",
    "options": [
      "lookup_type",
      "server"
    ],
    "usage": ";lookup server <lookup_type> <server>"
  },
  {
    "cmd": "dump attachments",
    "raw": "/dump attachments",
    "cat": "tools",
    "desc": "Dump attachments from message",
    "options": [
      "channel_id",
      "message_id"
    ],
    "usage": ";dump attachments <channel_id> <message_id>"
  },
  {
    "cmd": "dump chat",
    "raw": "/dump chat",
    "cat": "tools",
    "desc": "Dump chat to a .txt file",
    "options": [
      "amount",
      "channel",
      "channel_id"
    ],
    "usage": ";dump chat <amount> <channel> <channel_id>"
  },
  {
    "cmd": "dump emojis",
    "raw": "/dump emojis",
    "cat": "tools",
    "desc": "Dump emojis from server",
    "options": [
      "server"
    ],
    "usage": ";dump emojis <server>"
  },
  {
    "cmd": "dump stickers",
    "raw": "/dump stickers",
    "cat": "tools",
    "desc": "Dump stickers from server",
    "options": [
      "server"
    ],
    "usage": ";dump stickers <server>"
  },
  {
    "cmd": "troll force",
    "raw": "/troll force",
    "cat": "fun",
    "desc": "Force member nickname, kick, or disconnect",
    "options": [
      "force_type",
      "member",
      "nick"
    ],
    "usage": ";troll force <force_type> <member> <nick>"
  },
  {
    "cmd": "troll mimic",
    "raw": "/troll mimic",
    "cat": "fun",
    "desc": "Copy user messages in real time",
    "options": [
      "mimic_type",
      "user"
    ],
    "usage": ";troll mimic <mimic_type> <user>"
  },
  {
    "cmd": "troll noleave",
    "raw": "/troll noleave",
    "cat": "fun",
    "desc": "Force user to stay in group (requires friendship)",
    "options": [
      "user"
    ],
    "usage": ";troll noleave <user>"
  },
  {
    "cmd": "troll spy",
    "raw": "/troll spy",
    "cat": "fun",
    "desc": "Spy user",
    "options": [
      "user"
    ],
    "usage": ";troll spy <user>"
  },
  {
    "cmd": "troll empty",
    "raw": "/troll empty",
    "cat": "fun",
    "desc": "Send empty message",
    "options": [],
    "usage": ";troll empty"
  },
  {
    "cmd": "troll fakenitro",
    "raw": "/troll fakenitro",
    "cat": "fun",
    "desc": "Fake nitro troll (requires embed links permission)",
    "options": [],
    "usage": ";troll fakenitro"
  },
  {
    "cmd": "troll purgehack",
    "raw": "/troll purgehack",
    "cat": "fun",
    "desc": "Flood chat with invisible message",
    "options": [],
    "usage": ";troll purgehack"
  },
  {
    "cmd": "troll voicemove",
    "raw": "/troll voicemove",
    "cat": "fun",
    "desc": "Move around voice channels in the server",
    "options": [
      "amount"
    ],
    "usage": ";troll voicemove <amount>"
  },
  {
    "cmd": "troll resend",
    "raw": "/troll resend",
    "cat": "fun",
    "desc": "Send every message the user deletes or edits",
    "options": [
      "send_type",
      "user"
    ],
    "usage": ";troll resend <send_type> <user>"
  },
  {
    "cmd": "troll reactuser",
    "raw": "/troll reactuser",
    "cat": "fun",
    "desc": "React to every message the user sends",
    "options": [
      "user",
      "emoji"
    ],
    "usage": ";troll reactuser <user> <emoji>"
  },
  {
    "cmd": "troll deleteannoy",
    "raw": "/troll deleteannoy",
    "cat": "fun",
    "desc": "Delete every message the user sends",
    "options": [
      "user"
    ],
    "usage": ";troll deleteannoy <user>"
  },
  {
    "cmd": "troll unreact",
    "raw": "/troll unreact",
    "cat": "fun",
    "desc": "Delete every reaction the user makes",
    "options": [
      "user"
    ],
    "usage": ";troll unreact <user>"
  },
  {
    "cmd": "troll ghostping",
    "raw": "/troll ghostping",
    "cat": "fun",
    "desc": "Ghostping user",
    "options": [
      "user"
    ],
    "usage": ";troll ghostping <user>"
  },
  {
    "cmd": "utils clean",
    "raw": "/utils clean",
    "cat": "utilities",
    "desc": "Delete your messages",
    "options": [
      "amount",
      "channel",
      "channel_id",
      "until",
      "keyword"
    ],
    "usage": ";utils clean <amount> <channel> <channel_id> <until> <keyword>"
  },
  {
    "cmd": "utils schedule",
    "raw": "/utils schedule",
    "cat": "utilities",
    "desc": "Schedule message",
    "options": [
      "time",
      "message"
    ],
    "usage": ";utils schedule <time> <message>"
  },
  {
    "cmd": "utils insights",
    "raw": "/utils insights",
    "cat": "utilities",
    "desc": "Analyze visit frequency and take action.",
    "options": [],
    "usage": ";utils insights"
  },
  {
    "cmd": "utils favorites",
    "raw": "/utils favorites",
    "cat": "utilities",
    "desc": "Manage your Discord Favorites",
    "options": [
      "type",
      "method",
      "target"
    ],
    "usage": ";utils favorites <type> <method> <target>"
  },
  {
    "cmd": "utils sync",
    "raw": "/utils sync",
    "cat": "utilities",
    "desc": "Sync with user",
    "options": [
      "what",
      "user"
    ],
    "usage": ";utils sync <what> <user>"
  },
  {
    "cmd": "utils hypesquad",
    "raw": "/utils hypesquad",
    "cat": "utilities",
    "desc": "Change hypesquad house",
    "options": [
      "house"
    ],
    "usage": ";utils hypesquad <house>"
  },
  {
    "cmd": "utils cloneserver",
    "raw": "/utils cloneserver",
    "cat": "utilities",
    "desc": "Create a clone of the server",
    "options": [
      "clone_from",
      "clone_to"
    ],
    "usage": ";utils cloneserver <clone_from> <clone_to>"
  },
  {
    "cmd": "utils deletewebhook",
    "raw": "/utils deletewebhook",
    "cat": "utilities",
    "desc": "Delete webhook",
    "options": [
      "url"
    ],
    "usage": ";utils deletewebhook <url>"
  },
  {
    "cmd": "utils leaveallgroups",
    "raw": "/utils leaveallgroups",
    "cat": "utilities",
    "desc": "Leave all your group chats",
    "options": [],
    "usage": ";utils leaveallgroups"
  },
  {
    "cmd": "utils firstmessage",
    "raw": "/utils firstmessage",
    "cat": "utilities",
    "desc": "Get first message from channel",
    "options": [
      "channel",
      "channel_id"
    ],
    "usage": ";utils firstmessage <channel> <channel_id>"
  },
  {
    "cmd": "utils translate",
    "raw": "/utils translate",
    "cat": "utilities",
    "desc": "Google Translate",
    "options": [
      "text",
      "source",
      "to",
      "mode"
    ],
    "usage": ";utils translate <text> <source> <to> <mode>"
  },
  {
    "cmd": "utils autotranslate",
    "raw": "/utils autotranslate",
    "cat": "utilities",
    "desc": "Auto translate your messages",
    "options": [
      "toggle",
      "source",
      "to"
    ],
    "usage": ";utils autotranslate <toggle> <source> <to>"
  },
  {
    "cmd": "utils autoslash",
    "raw": "/utils autoslash",
    "cat": "utilities",
    "desc": "Automatically execute slash commands",
    "options": [
      "app_id",
      "command_name",
      "options",
      "seconds"
    ],
    "usage": ";utils autoslash <app_id> <command_name> <options> <seconds>"
  },
  {
    "cmd": "insights servers",
    "raw": "/insights servers",
    "cat": "tools",
    "desc": "Most/least visited servers.",
    "options": [
      "type",
      "action"
    ],
    "usage": ";insights servers <type> <action>"
  },
  {
    "cmd": "insights dms",
    "raw": "/insights dms",
    "cat": "tools",
    "desc": "Most/least visited DMs.",
    "options": [
      "type",
      "action"
    ],
    "usage": ";insights dms <type> <action>"
  },
  {
    "cmd": "nsfw ass",
    "raw": "/nsfw ass",
    "cat": "fun",
    "desc": "Ass image (+18)",
    "options": [],
    "usage": ";nsfw ass"
  },
  {
    "cmd": "nsfw boobs",
    "raw": "/nsfw boobs",
    "cat": "fun",
    "desc": "Boobs image (+18)",
    "options": [],
    "usage": ";nsfw boobs"
  },
  {
    "cmd": "nsfw pussy",
    "raw": "/nsfw pussy",
    "cat": "fun",
    "desc": "Pussy image (+18)",
    "options": [],
    "usage": ";nsfw pussy"
  },
  {
    "cmd": "nsfw hentai",
    "raw": "/nsfw hentai",
    "cat": "fun",
    "desc": "Hentai image (+18)",
    "options": [],
    "usage": ";nsfw hentai"
  },
  {
    "cmd": "nsfw pgif",
    "raw": "/nsfw pgif",
    "cat": "fun",
    "desc": "Porn gif",
    "options": [],
    "usage": ";nsfw pgif"
  },
  {
    "cmd": "spotify select",
    "raw": "/spotify select",
    "cat": "tools",
    "desc": "Select Spotify account",
    "options": [
      "account"
    ],
    "usage": ";spotify select <account>"
  },
  {
    "cmd": "spotify currentsong",
    "raw": "/spotify currentsong",
    "cat": "tools",
    "desc": "Show current playing song",
    "options": [
      "url_only"
    ],
    "usage": ";spotify currentsong <url_only>"
  },
  {
    "cmd": "spotify search",
    "raw": "/spotify search",
    "cat": "tools",
    "desc": "Search for a song (or play it)",
    "options": [
      "song_name"
    ],
    "usage": ";spotify search <song_name>"
  },
  {
    "cmd": "spotify playback",
    "raw": "/spotify playback",
    "cat": "tools",
    "desc": "Manage playback state",
    "options": [
      "state"
    ],
    "usage": ";spotify playback <state>"
  },
  {
    "cmd": "spotify playbackrepeat",
    "raw": "/spotify playbackrepeat",
    "cat": "tools",
    "desc": "Manage playback repeat state",
    "options": [
      "state"
    ],
    "usage": ";spotify playbackrepeat <state>"
  },
  {
    "cmd": "spotify playbackshuffle",
    "raw": "/spotify playbackshuffle",
    "cat": "tools",
    "desc": "Manage playback shuffle state",
    "options": [
      "state"
    ],
    "usage": ";spotify playbackshuffle <state>"
  },
  {
    "cmd": "abuse kickeverywhere",
    "raw": "/abuse kickeverywhere",
    "cat": "admin",
    "desc": "Kick user from every server you can",
    "options": [
      "user"
    ],
    "usage": ";abuse kickeverywhere <user>"
  },
  {
    "cmd": "abuse baneverywhere",
    "raw": "/abuse baneverywhere",
    "cat": "admin",
    "desc": "Ban user from every server you can",
    "options": [
      "user"
    ],
    "usage": ";abuse baneverywhere <user>"
  },
  {
    "cmd": "abuse timeouteverywhere",
    "raw": "/abuse timeouteverywhere",
    "cat": "admin",
    "desc": "Timeout user on every server you can",
    "options": [
      "user",
      "duration"
    ],
    "usage": ";abuse timeouteverywhere <user> <duration>"
  },
  {
    "cmd": "abuse spam",
    "raw": "/abuse spam",
    "cat": "admin",
    "desc": "Spam messages",
    "options": [
      "message",
      "amount",
      "delay"
    ],
    "usage": ";abuse spam <message> <amount> <delay>"
  },
  {
    "cmd": "abuse transferbans",
    "raw": "/abuse transferbans",
    "cat": "admin",
    "desc": "Transfer bans from a server.",
    "options": [
      "server"
    ],
    "usage": ";abuse transferbans <server>"
  },
  {
    "cmd": "ai settings",
    "raw": "/ai settings",
    "cat": "tools",
    "desc": "AI Settings",
    "options": [
      "base_url",
      "model",
      "api_key"
    ],
    "usage": ";ai settings <base_url> <model> <api_key>"
  },
  {
    "cmd": "ai ask",
    "raw": "/ai ask",
    "cat": "tools",
    "desc": "Ask AI",
    "options": [
      "question",
      "edit_mode",
      "m_id",
      "btn",
      "system"
    ],
    "usage": ";ai ask <question> <edit_mode> <m_id> <btn> <system>"
  },
  {
    "cmd": "ai dm",
    "raw": "/ai dm",
    "cat": "tools",
    "desc": "DM options",
    "options": [
      "mode",
      "user",
      "everyone",
      "ask_first",
      "system"
    ],
    "usage": ";ai dm <mode> <user> <everyone> <ask_first> <system>"
  }
];
