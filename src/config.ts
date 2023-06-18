import dotenv from "dotenv"
import Joi from "joi"

dotenv.config()

const envVarsSchema = Joi.object({
  TELEGRAM_TOKEN: Joi.string().description("Telegram token"),
  TIMEOUT: Joi.number().default(5).description("Game timeout")
})

const { error, value: envVars } = envVarsSchema.validate(process.env)
if (error) new Error(`Config validation error: ${error.message}`)

export default {
  telegramToken: envVars.TELEGRAM_TOKEN,

  timeout: envVars.TIMEOUT,
  incrementKey: "word_count_incr",

  phrases: {
    START_MESSAGE: "Привет, введи /topic для выбора темы ⚡️",
    FREE_TOPIC: "Тебе повезло, ты можешь придумать тему сам 🤞",
    TOPIC_RESULT: "Твоя тема",
    TOPIC_END: `Когда будешь готов введи /go \nУ тебя будет ${envVars.TIMEOUT} секунд для того, чтобы назвать слова 💈`,
    STOP_MESSAGE: "Конец игры, приходи еще ☘️",
    HELP_MESSAGE: "Если что то не работает то пиши @gazzati"
  },

  topics: [
    "Страны",
    "Столицы",
    "Певицы",
    "Бренды наушников",
    "Марки машин",
    "Вузы Москвы",
    "Российские фильмы",
    "Национальные блюда",
    "Семейство кошачьих",
    "Профессии",
    "Валюты",
    "Банки России",
    "Фрукты и ягоды",
    "Птицы",
    "Виды спорта",
    "Президенты стран",
    null
  ]
}
