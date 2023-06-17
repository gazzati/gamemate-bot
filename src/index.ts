import "./aliases"

import TelegramBot, { User, Chat, Message } from "node-telegram-bot-api"

import config from "@root/config"

enum TelegramCommand {
  Start = "/start",
  Topic = "/topic",
  Go = "/go",
  Stop = "/stop",
  Help = "/help"
}

interface Data {
  [chatId: number]: {
    messageId: number
    wordsCount: number
    timer: number
  }
}

class Telegram {
  private bot: TelegramBot
  private data: Data

  constructor() {
    this.bot = new TelegramBot(config.telegramToken, { polling: true })
    this.data = {}
  }

  public process() {
    this.bot.on("message", msg => {
      const { from, chat, text } = msg
      if (!from || !text) return

      if (Object.values(TelegramCommand).includes(text as TelegramCommand)) return this.command(from, chat, text)
      // this.message(from, chat, text)
    })

    this.bot.on("callback_query", query => {
      if (query.data === config.incrementKey && query.message) return this.incrementWords(query.message)
    })
  }

  private command(from: User, chat: Chat, action: string) {
    switch (action) {
      case TelegramCommand.Start:
        return this.start(chat)
      case TelegramCommand.Topic:
        return this.topic(chat)
      case TelegramCommand.Go:
        return this.go(chat)
      case TelegramCommand.Stop:
        return this.stop(chat)
      case TelegramCommand.Help:
        return this.help(chat)
    }
  }

  private start(chat: Chat) {
    this.bot.sendMessage(chat.id, config.phrases.START_MESSAGE)
  }

  private async topic(chat: Chat) {
    const topicText = this.getTopicText()
    await this.bot.sendMessage(chat.id, `${topicText} \n${config.phrases.TOPIC_END}`)
  }

  private async go(chat: Chat) {
    if (this.data[chat.id]?.timer) return

    let sec = config.timeout

    const messageText = this.getTimerMessage(sec, 0)
    const message = await this.bot.sendMessage(chat.id, messageText, {
      reply_markup: this.replyMarkup,
      parse_mode: "Markdown"
    })

    this.data[chat.id] = { messageId: message.message_id, wordsCount: 0, timer: sec }

    const timer = setInterval(() => {
      if(!this.data[chat.id]) return clearInterval(timer)

      if (sec < 1) {
        this.sendEndRoundMessage(chat.id, this.data[chat.id].wordsCount)
        return clearInterval(timer)
      }
      sec -= 1

      this.data[chat.id] = { ...this.data[chat.id], timer: sec }
      this.sendTimerMessage(chat.id)
    }, 1000)
  }

  private stop(chat: Chat) {
    delete this.data[chat.id]
    this.bot.sendMessage(chat.id, config.phrases.STOP_MESSAGE)
  }

  private help(chat: Chat) {
    this.bot.sendMessage(chat.id, config.phrases.HELP_MESSAGE)
  }

  private incrementWords(message: Message) {
    const chatData = this.data[message.chat.id]
    if (!chatData) return

    this.data[message.chat.id] = { ...chatData, wordsCount: chatData.wordsCount + 1 }

    this.sendTimerMessage(message.chat.id)
  }

  private sendTimerMessage(chatId: number) {
    const chatData = this.data[chatId]
    const message = this.getTimerMessage(chatData.timer, chatData.wordsCount)

    this.bot.editMessageText(message, {
      chat_id: chatId,
      message_id: chatData.messageId,
      reply_markup: this.replyMarkup,
      parse_mode: "Markdown"
    })
  }

  private sendEndRoundMessage(chatId: number, wordsCount) {
    const message = this.getEndMessageText(wordsCount)
    this.bot.sendMessage(chatId, `Конец раунда! 🙌 \n\n${message}`, {
        parse_mode: "Markdown"
    })
  }

  private getEndMessageText(wordsCount) {
    switch(wordsCount) {
        case 0:
        return "Ты назвал *0* слов 😿"
        case 1:
        return "Ты назвал *1* слово 🙀"
        case 2:
        case 3:
        case 4:
        return `Ты назвал *${wordsCount}* слова 😼`
        default:
        return `Ты назвал *${wordsCount}* слов 😸`
    }
  }

  private getTimerMessage(timer: number, wordsCount: number): string {
    const timerText = `Осталось секунд: *${timer}* ⏳`
    const wordsText = `Слов - *${wordsCount}* ✅`

    return `${timerText} \n\n${wordsText}`
  }

  private getRandomTopic(): string | null {
    return config.topics[Math.floor(Math.random() * config.topics.length)]
  }

  private getTopicText(): string {
    const randomTopic = this.getRandomTopic()
    if (!randomTopic) return config.phrases.FREE_TOPIC

    return `${config.phrases.TOPIC_RESULT} - ${randomTopic}`
  }

  private get replyMarkup() {
    return {
      inline_keyboard: [
        [
          {
            text: "Добавить слово",
            callback_data: config.incrementKey
          }
        ]
      ]
    }
  }
}

export default Telegram

new Telegram().process()
