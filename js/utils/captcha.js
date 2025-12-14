// /js/utils/captcha.js

const CAPTCHA_OPTIONS = [
  { id: 'math', prompt: 'What is 4 + 7?', answer: '11' },
  { id: 'color', prompt: "Type the word 'blue'", answer: 'blue' },
  { id: 'pattern', prompt: 'Enter 291', answer: '291' }
]

export function generateCaptcha() {
  const index = Math.floor(Math.random() * CAPTCHA_OPTIONS.length)
  return CAPTCHA_OPTIONS[index]
}

export function validateCaptcha(input, captchaData) {
  if (!captchaData) {
    throw new Error('CAPTCHA challenge is missing')
  }
  if (String(input).trim().toLowerCase() !== String(captchaData.answer).toLowerCase()) {
    throw new Error('CAPTCHA answer is incorrect')
  }
  return true
}
