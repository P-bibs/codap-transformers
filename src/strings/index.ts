import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";

// Set up strings
i18n.use(initReactI18next).init({
  resources: {
    en,
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export const t = i18n.t.bind(i18n);
