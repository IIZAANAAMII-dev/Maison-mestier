"use client";

import { useSyncExternalStore, type MouseEvent } from "react";
import { contact, getSelection } from "../fabrication/fabrication-data";

const configuredEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
export const email = configuredEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail)
  ? configuredEmail : "discutons@maisonmestier.fr";
export const mailLink = `mailto:${email}?subject=Un%20projet%20avec%20la%20Maison`;
export const menuHash = "#sommaire";
export const panelEntry = "mestierPartitionPanel";

function subscribe(update: () => void) {
  window.addEventListener("mestier:selection", update);
  return () => window.removeEventListener("mestier:selection", update);
}

const serverSelection = (): string[] | null => null;

export function useProjectSelection() {
  return useSyncExternalStore<string[] | null>(subscribe, getSelection, serverSelection);
}

export function regularClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button === 0 && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey;
}

export function openProject() {
  if (location.hash !== "#contact") {
    const state = { ...history.state, [panelEntry]: "contact" };
    if (location.hash === menuHash) {
      // A visitor may have landed directly on the index, without a page underneath it.
      if (history.state?.[panelEntry] !== "menu") delete state[panelEntry];
      history.replaceState(state, "", "#contact");
    }
    else history.pushState(state, "", "#contact");
  }
  contact();
}

export function writeToMaison(event: MouseEvent<HTMLAnchorElement>) {
  if (!regularClick(event)) return;
  event.preventDefault();
  openProject();
}
