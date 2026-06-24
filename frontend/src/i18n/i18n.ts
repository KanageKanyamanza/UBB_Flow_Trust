import i18n, { type InitOptions } from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import fr from './locales/fr/common.json'
import en from './locales/en/common.json'

const options: InitOptions = {
  resources: {
    fr: { common: fr },
    en: { common: en },
  },
  defaultNS: 'common',
  fallbackLng: 'fr',
  supportedLngs: ['fr', 'en'],
  load: 'languageOnly',
  interpolation: {
    escapeValue: false,
  },
  detection: {
    order: ['localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage'],
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init(options)

export default i18n
