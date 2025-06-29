const { Client, GatewayIntentBits, Partials } = require("discord.js");
const db = require("quick.db");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const cooldown = new Set();

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild) return;

  const prefix = "!";
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  if (command === "balance") {
    let bal = db.get(`balance_${message.author.id}`) || 0;
    return message.reply(`💰 You have **${bal} coins**.`);
  }

  if (["mine", "fish", "farm"].includes(command)) {
    if (cooldown.has(message.author.id)) {
      return message.reply(`⏳ Please wait 15 seconds before working again.`);
    }

    cooldown.add(message.author.id);
    setTimeout(() => cooldown.delete(message.author.id), 15000);

    let loot;
    if (command === "mine") {
      loot = [
        { name: "silver", chance: 50, value: 500 },
        { name: "gold", chance: 25, value: 1500 },
        { name: "diamond", chance: 12, value: 3000 },
        { name: "ruby", chance: 7, value: 5000 },
        { name: "red_diamond", chance: 3, value: 8000 },
        { name: "black_diamond", chance: 1, value: 15000 }
      ];
    } else if (command === "fish") {
      loot = [
        { name: "small fish", chance: 50, value: 400 },
        { name: "big fish", chance: 25, value: 1000 },
        { name: "rare fish", chance: 12, value: 2500 },
        { name: "legendary fish", chance: 7, value: 5000 },
        { name: "golden fish", chance: 3, value: 9000 },
        { name: "mythical leviathan", chance: 1, value: 20000 }
      ];
    } else if (command === "farm") {
      loot = [
        { name: "wheat bundle", chance: 50, value: 300 },
        { name: "corn basket", chance: 25, value: 800 },
        { name: "pumpkin crate", chance: 12, value: 2000 },
        { name: "rare herb", chance: 7, value: 4000 },
        { name: "golden apple", chance: 3, value: 7000 },
        { name: "enchanted seed", chance: 1, value: 15000 }
      ];
    }

    // Roll random item
    let roll = Math.random() * 100;
    let accumulated = 0;
    let reward;
    for (const item of loot) {
      accumulated += item.chance;
      if (roll <= accumulated) {
        reward = item;
        break;
      }
    }
    if (!reward) reward = loot[0];

    let currentBal = db.get(`balance_${message.author.id}`) || 0;
    db.set(`balance_${message.author.id}`, currentBal + reward.value);

    return message.reply(`🌟 You **${command}ed** and found **${reward.name}** worth **${reward.value} coins**!`);
  }
});

// Login
const token = process.env.TOKEN;
if (!token) {
  console.error("❌ TOKEN is not set. Make sure you added it in Railway Variables.");
  process.exit(1);
}
client.login(token);
