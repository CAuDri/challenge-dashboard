import type { ScreenDefinition } from "@/types/screen";

export const demoScreens: ScreenDefinition[] = [
  {
    id: "fallback",
    name: "Fallback Standbild",
    description: "Standardanzeige, falls nichts anderes aktiv ist.",
    type: "image",
    thumbnailLabel: "Fallback",
  },
  {
    id: "scoreboard",
    name: "Punktetabelle",
    description: "Dynamische Übersicht der Teamwertung.",
    type: "scoreboard",
    thumbnailLabel: "Scores",
  },
  {
    id: "timer",
    name: "Rundentimer",
    description: "Timer mit Team- und Disziplininformationen.",
    type: "timer",
    thumbnailLabel: "Timer",
  },
  {
    id: "presentation",
    name: "PDF Präsentation",
    description: "Slideshow für Begrüßung, Regeln oder Sponsoren.",
    type: "pdf",
    thumbnailLabel: "PDF",
  },
  {
    id: "camera",
    name: "Kamerastream",
    description: "Livebild einer Netzwerk- oder Streckenkamera.",
    type: "camera",
    thumbnailLabel: "Cam",
  },
];
