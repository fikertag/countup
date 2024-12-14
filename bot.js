const TelegramBot = require("node-telegram-bot-api");
const schedule = require("node-schedule");
require("dotenv").config();

const BOT_TOKEN = process.env.SECRET;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Define a command to accept total hours and start scheduling
bot.onText(/\/schedule (\d+)/, (msg, match) => {
  const chatId = msg.chat.id; // Chat ID to send messages
  const userId = msg.from.id; // User ID of the person who sent the command
  const totalHours = parseInt(match[1], 10); // Extract hours from the command

  bot
    .getChatAdministrators(chatId)
    .then((admins) => {
      const isAdmin = admins.some((admin) => admin.user.id === userId);

      if (!isAdmin) {
        bot.sendMessage(chatId, "You must be an admin to schedule tasks.");
        return;
      }

      if (isNaN(totalHours) || totalHours <= 0) {
        bot.sendMessage(
          chatId,
          "Please provide a valid number of hours greater than 0."
        );
        return;
      }

      bot.sendMessage(chatId, `Scheduling messages for ${totalHours} hours.`);

      // Start scheduling based on the total hours
      scheduleMessages(chatId, totalHours);
    })
    .catch((error) => {
      bot.sendMessage(chatId, "Error checking admin status.");
    });
});

function createProgressBar(progress, total) {
  const totalBlocks = 10; // Number of blocks in the progress bar
  const filledBlocks = Math.floor((progress / total) * totalBlocks);
  const unfilledBlocks = totalBlocks - filledBlocks;

  // Create progress bar with filled and unfilled blocks
  return "▓".repeat(filledBlocks) + "░".repeat(unfilledBlocks);
}

function scheduleMessages(chatId, totalHours) {
  const intervalInMs = (totalHours * 60 * 60 * 1000) / 100; // Calculate interval (1% of total time)
  let progress = 0;

  function sendProgressMessage() {
    progress += 1; // Increment progress
    const progressBar = createProgressBar(progress, 100);
    bot.sendMessage(chatId, `${progressBar}   ${progress}%`);

    if (progress < 100) {
      const nextRun = new Date(Date.now() + intervalInMs); // Calculate next run
      schedule.scheduleJob(nextRun, sendProgressMessage); // Schedule the next message
    } else {
      bot.sendMessage(chatId, "good luck with your final exam!");
    }
  }

  // Schedule the first message
  const firstRun = new Date(Date.now() + intervalInMs);
  schedule.scheduleJob(firstRun, sendProgressMessage);
}

// Command to show usage
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Usage:\n" +
      "/schedule <hours> - Schedule messages based on total hours\n" +
      "/help - Show this help message"
  );
});

module.exports = (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
};
